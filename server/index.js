import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing VITE_GEMINI_API_KEY in .env");
  process.exit(1);
}

console.log("🔑 Gemini API key loaded successfully");

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

// 🧠 Define the Gym & Diet Coach system prompt
const systemPrompt = `
You are a Gym & Nutrition AI Assistant named **PRIME FIT COACH**.
Your responsibilities:
1. Ask the user for age, gender, height (cm), and weight (kg).
2. Calculate BMI and classify it (Underweight, Normal, Overweight, Obese).
3. Create a personalized 7-day Indian diet chart (3 meals + 2 snacks/day).
4. Include foods rich in protein, fiber, vitamins, and low sugar/fat.
5. If asked about a food, give its detailed nutrition breakdown.
6. Speak like a motivating gym coach using emojis and short structured advice.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body?.prompt;
    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }

    console.log("🧠 Prompt received:", userMessage);

    // ✅ Use startChat() for structured role messages
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    if (!text.trim()) {
      console.warn("⚠️ Empty Gemini response received");
      return res
        .status(500)
        .json({ error: "Empty response from Gemini model" });
    }

    console.log("✅ Gemini responded successfully");
    res.json({ text });
  } catch (err) {
    console.error("❌ Gemini request failed:", err.message);
    res.status(500).json({ error: err.message || "Gemini request failed" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ PRIME FIT COACH running on http://localhost:${PORT}`)
);
