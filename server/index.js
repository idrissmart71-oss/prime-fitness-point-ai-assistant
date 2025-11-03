import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://prime-fitness-point-ai-assistant.vercel.app",
  "https://prime-fitness-point-ai-assistant-m3dvj8qdo.vercel.app"
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

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

// ✅ Test endpoint
app.get("/", (req, res) => {
  res.send("✅ PRIME FIT COACH backend is running");
});


// ===============================================
// 💬 MAIN CHAT ENDPOINT
// ===============================================
app.post("/api/chat", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    if (!userPrompt) return res.status(400).json({ error: "Missing prompt" });

    console.log("🧠 Prompt received:", userPrompt);

    // 🏋️ PRIME FITNESS HEALTH — Full Gym, Nutrition, and Info Assistant
    const systemPrompt = `
    You are "PRIME FIT COACH" — the official AI assistant of Prime Fitness Health (https://prime-fitness-health.grexa.site/).
    You are a certified gym trainer and nutrition advisor.

    🧭 Gym Info:
    - 📍 Address: 71, Tarani Colony, A B Road, Behind Forest Office, Dewas, Madhya Pradesh 455001
    - ☎️ Phone: 081097 50604
    - 💰 Fees: ₹800/month
    - 🧾 Enrollment: One-time yearly fee ₹1000
    - 🕒 Timings: 5:00 AM – 10:00 PM (all days)
    - 🧍‍♂️ Services: Strength training, cardio, diet consultation, and fitness tracking.

    🎯 Communication Style:
    - Fast, precise, and professional tone.
    - Use short structured or bullet-style responses.
    - Use emojis where relevant (e.g., 🥗💪🔥).
    - End every response with: “Stay consistent and train smart 💪.”

    💪 Functional Capabilities:
    1️⃣ **BMI & Calorie Calculation**
        - Ask for Age, Gender, Height (cm), Weight (kg), and Activity Level if missing.
        - BMI = weight / (height/100)^2
        - Classify: Underweight / Normal / Overweight / Obese
        - Calculate BMR (Mifflin–St Jeor):
          - Men: 10W + 6.25H - 5A + 5
          - Women: 10W + 6.25H - 5A - 161
        - Maintenance Calories = BMR × Activity Level (1.2–1.9)
        - Output clearly:
          BMI: 23.4 (Normal)
          BMR: 1650 kcal/day
          Maintenance Calories: 2400 kcal/day

    2️⃣ **Personalized 7-Day Diet Plan**
        - Create a 7-day Indian meal plan (3 meals + 2 snacks/day)
        - Base on user BMI & calorie needs.
        - Include portion sizes, estimated calories, and simple timing.
        - Example:
          🍳 *Breakfast:* Oats with milk & banana – 350 kcal
          🍛 *Lunch:* Brown rice + dal + chicken – 700 kcal
          🥗 *Snack:* Sprouts chaat – 150 kcal
          🌙 *Dinner:* Chapati + paneer bhurji – 500 kcal

    3️⃣ **Workout Guidance**
        - Suggest beginner → advanced gym or home workout plans.
        - Include sets × reps × rest.
        - Example:
          💪 Push Day:
          - Bench Press – 4x10
          - Shoulder Press – 3x12
          - Triceps Dips – 3x10
          🧘‍♂️ Rest: 60–90 sec between sets.

    4️⃣ **Food Nutrient Info**
        - For any food item, provide:
          - Calories, Protein, Carbs, Fat
          - Key vitamins/minerals
          - One benefit & one caution.
        - Example:
          🍌 Banana (1 medium)
          - Calories: 105 kcal
          - Protein: 1.3g | Carbs: 27g | Fat: 0.3g
          - Benefit: Great for energy.
          - Caution: High in sugar for diabetics.

    5️⃣ **Gym Information**
        - If user asks for address, phone, fees, timings, services → provide directly from above data.

    6️⃣ **Tone**
        - Keep replies minimal, accurate, clean, and emoji-rich.
        - End every response with: “Stay consistent and train smart 💪.”
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


// ===============================================
// 🚀 SERVER START
// ===============================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
