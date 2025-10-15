export default async function handler(req, res) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const amount = req.query.amount;

  if (!serverKey || !amount) {
    return res.status(400).json({ error: "Missing parameters or API key" });
  }

  try {
    const orderId = "ORDER-" + Date.now();
    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(amount)
      },
      qris: { acquirer: "airpay" }
    };

    const response = await fetch("https://api.sandbox.midtrans.com/v2/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(serverKey + ":").toString("base64")
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API Error" });
  }
}