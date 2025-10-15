(function () {
  const createBtn = document.getElementById('createBtn');
  const amountInput = document.getElementById('amount');
  const qrisArea = document.getElementById('qrisArea');
  let currentOrder = null;
  let pollTimer = null;

  function showMessage(html) { qrisArea.innerHTML = html; }

  function startPolling(orderId) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?order_id=${encodeURIComponent(orderId)}`);
        const j = await res.json();
        if (j && j.order_id) {
          updateStatusUI(j);
          if (['settlement','capture','success','paid'].includes(j.transaction_status)) clearInterval(pollTimer);
          if (['expire','failure'].includes(j.transaction_status)) clearInterval(pollTimer);
        }
      } catch (e) {
        console.warn('Polling error', e);
      }
    }, 4000);
  }

  function updateStatusUI(info) {
    const status = (info.transaction_status || 'pending').toLowerCase();
    const statusText = {
      pending: ['Menunggu Pembayaran', 'status-pending'],
      capture: ['Pembayaran Tercapture', 'status-paid'],
      settlement: ['Pembayaran Sukses', 'status-paid'],
      success: ['Pembayaran Sukses', 'status-paid'],
      paid: ['Pembayaran Sukses', 'status-paid'],
      expire: ['Transaksi Kadaluarsa', 'status-expired'],
      failure: ['Pembayaran Gagal', 'status-expired']
    }[status] || ['Status: ' + status, 'status-pending'];

    const infoHtml = `
      <div>
        <div class="small">Order ID: <strong>${info.order_id}</strong></div>
        <div class="small">Amount: <strong>Rp ${Number(info.gross_amount || 0).toLocaleString('id')}</strong></div>
        <div class="status-pill ${statusText[1]}">${statusText[0]}</div>
      </div>
    `;
    const currentQr = document.getElementById('qrImgWrap')?.innerHTML || '';
    qrisArea.innerHTML = currentQr + infoHtml;
  }

  createBtn.addEventListener('click', async () => {
    const amount = parseInt(amountInput.value, 10);
    if (!amount || amount < 1000) {
      showMessage('<div class="small" style="color:yellow">Masukkan nominal minimal Rp1.000</div>');
      return;
    }
    showMessage('<div class="small">Membuat transaksi... mohon tunggu.</div>');

    try {
      const res = await fetch(`/api/create_qris?amount=${encodeURIComponent(amount)}`);
      const j = await res.json();

      if (j && j.order_id && j.qr_string) {
        currentOrder = j.order_id;
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(j.qr_string);
        const qrHtml = `<div id="qrImgWrap"><img src="${qrUrl}" alt="QRIS Code" /></div>`;
        qrisArea.innerHTML = qrHtml + '<div class="small">Buka e-wallet dan scan QR</div>';
        updateStatusUI({ order_id: j.order_id, gross_amount: amount, transaction_status: j.transaction_status || 'pending' });
        startPolling(j.order_id);
      } else {
        showMessage('<div class="small" style="color:salmon">Gagal membuat QRIS: ' + (j.status_message || j.error || 'unknown') + '</div>');
      }
    } catch (err) {
      console.error(err);
      showMessage('<div class="small" style="color:salmon">Terjadi kesalahan koneksi ke API.</div>');
    }
  });

  // resume polling jika ada ?order_id di URL
  (function resumeFromURL() {
    const params = new URLSearchParams(location.search);
    const order = params.get('order_id');
    if (order) {
      startPolling(order);
      showMessage('<div class="small">Memeriksa status order: <strong>' + order + '</strong></div>');
    }
  })();
})();