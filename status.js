export default async function handler(req, res) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const { order_id } = req.query;

  if (!serverKey || !order_id) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const response = await fetch(`https://api.sandbox.midtrans.com/v2/${order_id}/status`, {
      headers: {
        "Authorization": "Basic " + Buffer.from(serverKey + ":").toString("base64")
      }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Status check failed" });
  }
}