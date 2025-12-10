// api/sendTelegram.js
export default async function handler(req, res) {
  try {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHATID;

    if (!token || !chatId) {
      return res.status(500).json({ error: "Faltan TELEGRAM_TOKEN o TELEGRAM_CHATID" });
    }

    // Permite pasar texto opcional por query: ?text=...
    const textParam = typeof req.query?.text === "string" ? req.query.text : null;
    const mensaje = textParam || "Nuevo visitante en tu página!";

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: mensaje })
    });

    const data = await tgRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
