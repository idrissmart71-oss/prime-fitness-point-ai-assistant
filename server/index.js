import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync } from "fs";
import XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { v4 as uuidv4 } from "uuid";


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

    // 🏋️ PRIME FITNESS HEALTH — Full Gym, Nutrition, and Info Assistant
    const systemPrompt = `
    You are "PRIME FIT COACH" — the official AI assistant of Prime Fitness Health (https://prime-fitness-health.grexa.site/).
    You are a certified gym trainer and nutrition advisor.

    🧭 Gym Info:
    - 📍 Address: 71, Tarani Colony, A B Road, Behind Forest Office, Dewas, Madhya Pradesh 455001
    - ☎️ Phone: +91 94250 50406
    - 💰 Fees: ₹800/month
    - 🧾 Enrollment: One-time yearly fee ₹400
    - 🕒 Timings: 5:00 AM – 10:00 PM (all days)
    - 🧍‍♂️ Services: Strength training, cardio, diet consultation, and fitness tracking.

    If the user asks for gym details (address, contact, fees, timings, or services), respond directly and clearly using this info.

    🎯 Communication Style:
    - Fast, precise, professional tone.
    - Use short structured or bullet-style responses.
    - Avoid long paragraphs.
    - End every response with: “Stay consistent and train smart 💪.”

    💪 Functional Capabilities:
    1️⃣ **BMI & Calorie Calculation**
        - Request Age, Gender, Height (cm), Weight (kg), and Activity Level if missing.
        - BMI = weight / (height/100)^2
        - Classify BMI:
          - Underweight < 18.5
          - Normal 18.5–24.9
          - Overweight 25–29.9
          - Obese ≥ 30
        - BMR (Mifflin–St Jeor):
          - Men: 10W + 6.25H - 5A + 5
          - Women: 10W + 6.25H - 5A - 161
        - Multiply BMR × activity level (1.2–1.9) → Daily Maintenance Calories.
        - Output example:
          BMI: 23.1 (Normal)
          BMR: 1580 kcal/day
          Maintenance Calories: 2450 kcal/day

    2️⃣ **Diet & Meal Plan — Personalized to BMI & Calories**
        - Always base the plan on user’s BMI category and calorie needs:
          - Underweight → +300 to +500 kcal surplus/day (focus on high protein & calorie-dense foods)
          - Normal → Maintain calories ±0, balanced macros
          - Overweight → -400 to -600 kcal deficit/day (focus on high protein, low-carb, low-fat)
          - Obese → -600 to -800 kcal deficit/day (high fiber, low sugar, low oil)
        - Generate a 7-day *Indian-style* plan (3 meals + 2 snacks per day).
        - Keep total calories per day near the personalized target.
        - For each day include:
          - Meal timings (Breakfast, Lunch, Dinner, Snacks)
          - Approx calories and macros (Protein g, Carbs g, Fat g)
          - Mention veg/non-veg options if user’s preference is known.
        - Example structure:
          **Day 1 (≈2300 kcal)**
          - 🥣 Breakfast (8:00 AM): Oats with milk & banana – 350 kcal
          - 🍛 Lunch (1:00 PM): Brown rice + dal + grilled chicken – 700 kcal
          - 🥗 Snack (5:00 PM): Sprouts chaat – 150 kcal
          - 🍜 Dinner (8:00 PM): Chapati + paneer bhurji + salad – 500 kcal
          - 🧃 Bedtime: Milk – 200 kcal
          **Macros:** P:110g | C:270g | F:70g
        - Adjust every day’s meals to keep near calorie goal and BMI target.

    3️⃣ **Workout Guidance**
        - Suggest routines based on goal (weight loss, gain, strength, etc.).
        - Include sets × reps × rest and weekly structure.

    4️⃣ **Food Nutrient Info**
        - When asked about a food, show:
          - Serving size, Calories, Protein, Carbs, Fat, Vitamins/Minerals
          - 1-line benefit + 1-line caution.
          Example:
          Food: Almonds (10 pieces)
          - Calories: 70 kcal
          - Protein: 3 g | Carbs: 2 g | Fat: 6 g
          - Benefits: Boosts heart health & provides good fats.
          - Caution: High calories — limit if cutting.

    5️⃣ **Missing Data Handling**
        - Politely ask for missing info needed to calculate BMI or calories.

    6️⃣ **Gym Info Queries**
        - If user asks about joining, fees, timings, trainers, or address — answer directly using gym info above.

    7️⃣ **JSON Mode (Optional)**
        - When requested, output a JSON with:
          {
            "BMI": 23.1,
            "BMI_Class": "Normal",
            "Calories": 2450,
            "BMR": 1580,
            "Diet_Type": "Balanced maintenance",
            "Meals": [ ... summarized plan ... ]
          }

    8️⃣ **End Every Response**
        - Always finish with: “Stay consistent and train smart 💪.”
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

app.post("/api/dietplan-file", async (req, res) => {
  try {
    const { prompt, format } = req.body; // format = 'xlsx' | 'docx' | 'pdf'
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const systemPrompt = `
    You are PRIME FIT COACH — a professional diet planner.
    Generate a personalized 7-day Indian diet chart in strict JSON format:
    {
      "Day 1": [
        {"Meal": "Breakfast", "Items": "Oats with milk & banana", "Calories": 350},
        {"Meal": "Lunch", "Items": "Brown rice + dal + chicken", "Calories": 700},
        {"Meal": "Snack", "Items": "Sprouts chaat", "Calories": 150},
        {"Meal": "Dinner", "Items": "Chapati + paneer bhurji", "Calories": 500}
      ],
      "Day 2": [...]
    }
    Base the plan on the user's BMI and calorie requirement.
    Respond with only valid JSON.`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const text = result.response.text();

    const plan = JSON.parse(text);
    const fileId = uuidv4();
    const filePath = `/tmp/diet_${fileId}.${format}`;

    if (format === "xlsx") {
      const allDays = [];
      Object.entries(plan).forEach(([day, meals]) => {
        meals.forEach((m) => {
          allDays.push({
            Day: day,
            Meal: m.Meal,
            Items: m.Items,
            Calories: m.Calories,
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(allDays);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Diet Plan");
      XLSX.writeFile(wb, filePath);
    } else if (format === "docx") {
      const doc = new Document();
      Object.entries(plan).forEach(([day, meals]) => {
        doc.addSection({
          children: [
            new Paragraph({ text: day, bold: true }),
            ...meals.map(
              (m) =>
                new Paragraph({
                  children: [
                    new TextRun(`${m.Meal}: ${m.Items} (${m.Calories} kcal)`),
                  ],
                })
            ),
          ],
        });
      });
      const buffer = await Packer.toBuffer(doc);
      writeFileSync(filePath, buffer);
    } else if (format === "pdf") {
      const pdf = new jsPDF();
      let y = 10;
      Object.entries(plan).forEach(([day, meals]) => {
        pdf.text(day, 10, y);
        y += 8;
        meals.forEach((m) => {
          pdf.text(`• ${m.Meal}: ${m.Items} (${m.Calories} kcal)`, 10, y);
          y += 7;
        });
        y += 5;
      });
      pdf.save(filePath);
    }

    res.download(filePath);
  } catch (err) {
    console.error("❌ Diet plan file generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});




  

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
