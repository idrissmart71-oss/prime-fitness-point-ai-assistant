import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

// ✅ Allow frontend on Vercel + local dev
const allowedOrigins = [
  "http://localhost:5173",
  "https://prime-fitness-point-ai-assistant.vercel.app/" // 🔁 replace this with your actual Vercel app URL
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing VITE_GEMINI_API_KEY in environment");
  process.exit(1);
}

console.log("🔑 Gemini API key loaded successfully");

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

// 🧠 Gym & Diet AI System Prompt
const systemPrompt = `
You are a Gym & Nutrition AI Assistant named PRIME FIT COACH.
Responsibilities:
1. Ask user for age, gender, height (cm), and weight (kg).
2. Calculate BMI and classify it (Underweight, Normal, Overweight, Obese).
3. Create a personalized 7-day Indian diet chart (3 meals + 2 snacks/day).
4. Include foods rich in protein, fiber, vitamins, low sugar/fat.
5. If asked about a food, give detailed nutrition info.
6. Speak like a motivating gym coach with emojis 💪 and short structured advice.
`;

app.get("/", (req, res) => {
  res.send("✅ PRIME FIT COACH backend is running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const userPrompt = req.body?.prompt;
    if (!userPrompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    console.log("🧠 Prompt received:", userPrompt);

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
    });

    const result = await chat.sendMessage(userPrompt);
    const text = result.response.text();

    if (!text?.trim()) {
      console.warn("⚠️ Empty response from Gemini");
      return res.status(500).json({ error: "Empty response from Gemini model" });
    }

    console.log("✅ Gemini responded successfully");
    res.json({ text });
  } catch (err) {
    console.error("❌ Gemini request failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ PRIME FIT COACH running on Render | Port: ${PORT}`)
);
