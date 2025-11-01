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
  
      // 🏋️ Enhanced system prompt for gym assistant
      const systemPrompt = `
      You are PRIME FIT COACH — a certified Gym & Nutrition AI Trainer 💪.
      Your tasks:
      1️⃣ Ask for age, gender, height (cm), and weight (kg) if not provided.
      2️⃣ Calculate BMI and classify it as Underweight, Normal, Overweight, or Obese.
      3️⃣ Based on BMI and activity level, create a 7-day *Indian-style* diet plan:
         - Include 3 meals + 2 snacks/day.
         - Emphasize high-protein, fiber-rich, low-sugar, low-fat foods.
         - Give portion sizes and time suggestions (e.g., breakfast 8 AM).
         - Include veg and non-veg options if user’s preference known.
      4️⃣ If user asks about a specific food, give:
         - Calories, Protein, Carbs, Fats, Vitamins.
         - Health benefits and cautions.
      5️⃣ Tone: Motivating, coach-like, friendly with emojis and short tips.
      6️⃣ End responses with a motivational line like “Stay consistent 💪!”.
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
