import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// 👇 Your exact deployed Vercel URL goes here:
const allowedOrigins = [
  "http://localhost:5173",
  "https://prime-fitness-point-ai-assistant.vercel.app",
  "https://prime-fitness-point-ai-assistant-m3dvj8qdo.vercel.app" // ✅ make sure it's EXACT
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("🚫 Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  })
);

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

app.get("/", (req, res) => {
  res.send("✅ PRIME FIT COACH backend is running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    if (!userPrompt) return res.status(400).json({ error: "Missing prompt" });

    console.log("🧠 Prompt received:", userPrompt);

    // 🏋️ PRIME FITNESS HEALTH — Optimized AI Trainer Prompt
    const systemPrompt = `
    You are PRIME FIT COACH — the official AI assistant of Prime Fitness Health (https://prime-fitness-health.grexa.site/).
    You are a certified virtual gym trainer and nutrition expert 🧠💪.

    🎯 Your goals:
    - Respond FAST with short, clean, and professional messages.
    - Avoid long paragraphs — use bullet points or short sections.
    - Focus only on relevant and factual details.
    - Maintain a calm, motivating tone (no unnecessary emojis or slang).

    🧩 Core features you must support:
    1️⃣ **BMI & Calorie Calculation**
        - Ask for: Age, Gender, Height (cm), Weight (kg), and Activity Level.
        - Calculate BMI = weight / (height/100)^2.
        - Classify BMI: Underweight, Normal, Overweight, or Obese.
        - Estimate daily calorie needs using Mifflin–St Jeor equation.
        - Display BMI and calorie result in clean format like:
          BMI: 23.5 (Normal)
          Calories needed: 2400 kcal/day

    2️⃣ **Diet & Nutrition Guidance**
        - Suggest a 7-day *Indian-style* meal plan (3 meals + 2 snacks/day).
        - Focus on balanced, protein-rich foods with portion control.
        - Include veg/non-veg options when preference known.

    3️⃣ **Workout & Fitness Support**
        - Suggest strength, cardio, and flexibility routines based on user goals.
        - Offer recovery, hydration, and rest-day tips.

    4️⃣ **Food Queries**
        - Provide nutritional breakdown (Calories, Protein, Carbs, Fats, Vitamins).
        - Give benefits and cautions in short bullet points.

    5️⃣ **Tone & Style**
        - Concise, clear, and gym-professional.
        - End with a short motivational line:
          “Stay consistent and train smart 💪.”

    Remember: You are representing PRIME FITNESS HEALTH. Keep answers clean, accurate, and motivating.
    `;

    // 💬 Combine system prompt + user input
    const result = await model.generateContent([systemPrompt, userPrompt]);
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

  

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
