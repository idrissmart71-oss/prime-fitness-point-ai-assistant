// api/gemini.js - uses fetch and the REST endpoint
export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
    try {
      const { message, history } = req.body || {};
      if (!message) return res.status(400).json({ error: "Missing message" });
  
      // Server env var name must be GEMINI_API_KEY (no VITE_)
      const KEY = process.env.VITE_GEMINI_API_KEY;
      if (!KEY) return res.status(500).json({ error: "VITE_GEMINI_API_KEY missing on server" });
  
      // Build contents array from history + current message
      const contents = (Array.isArray(history) ? history.map(h => ({
        role: h.role === "user" ? "user" : "assistant",
        parts: [{ text: h.content }],
      })) : []).concat([{ role: "user", parts: [{ text: message }] }]);
  
      const body = {
        model: "gemini-1.5-flash",
        temperature: 0.2,
        maxOutputTokens: 512,
        // the API wants "inputs" structure under some versions; for v1beta generateContent endpoint:
        contents
      };
  
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": KEY
        },
        body: JSON.stringify(body),
      });
  
      const json = await r.json();
  
      // Log for debugging (will appear in Vercel logs)
      console.log("GEN JSON:", JSON && JSON.stringify(json).slice(0,1000));
  
      const text =
        json?.response?.text?.() || // if SDK-like wrapper (unlikely)
        (json?.candidates && json.candidates[0]?.content?.parts?.[0]?.text) ||
        (json?.outputs && json.outputs[0]?.content?.text) ||
        "";
  
      if (!text) {
        // attach the raw json for easier debugging
        return res.status(500).json({ error: "No text from model", raw: json });
      }
  
      return res.status(200).json({ text });
    } catch (err) {
      console.error("api/gemini error:", err);
      return res.status(500).json({ error: String(err) });
    }
  }
  