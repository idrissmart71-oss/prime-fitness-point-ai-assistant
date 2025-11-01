export default async function handler(req, res) {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });
  
    try {
      const { message, history } = req.body || {};
      if (!message) return res.status(400).json({ error: "Missing message" });
  
      const KEY = process.env.GEMINI_API_KEY;
      if (!KEY) return res.status(500).json({ error: "GEMINI_API_KEY missing on server" });
  
      const contents = (Array.isArray(history) ? history.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      })) : []).concat([{ role: "user", parts: [{ text: message }] }]);
  
      const body = {
        model: "gemini-1.5-flash",
        contents,
        temperature: 0.7,
        maxOutputTokens: 512,
      };
  
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": KEY,
          },
          body: JSON.stringify(body),
        }
      );
  
      const json = await r.json();
      console.log("🔍 Google API raw response:", JSON.stringify(json).slice(0, 500));
  
      const text =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ||
        json?.output_text ||
        "";
  
      if (!text) {
        console.error("❌ Google API did not return text:", json);
        return res.status(500).json({ error: "No text from model", raw: json });
      }
  
      res.status(200).json({ text });
    } catch (err) {
      console.error("🔥 Server error in /api/gemini:", err);
      res.status(500).json({ error: String(err) });
    }
  }
  