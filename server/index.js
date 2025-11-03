import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
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

    // Detect if user wants a downloadable file
    const wantsFile =
      userPrompt.toLowerCase().includes("excel") ||
      userPrompt.toLowerCase().includes("word") ||
      userPrompt.toLowerCase().includes("pdf");

    const fileFormat = userPrompt.toLowerCase().includes("excel")
      ? "xlsx"
      : userPrompt.toLowerCase().includes("word")
      ? "docx"
      : userPrompt.toLowerCase().includes("pdf")
      ? "pdf"
      : null;

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

    🎯 Communication Style:
    - Fast, precise, professional tone.
    - Use short structured or bullet-style responses.
    - Avoid long paragraphs.
    - End every response with: “Stay consistent and train smart 💪.”

    💪 Functional Capabilities:
    1️⃣ BMI & Calorie Calculation
    2️⃣ Personalized 7-day Indian diet based on BMI & Calories
    3️⃣ Food Nutrient Info
    4️⃣ Workout Guidance
    5️⃣ Gym Info Queries
    6️⃣ JSON Mode when requested
    8️⃣ When you create a 7-day diet plan, always start with the heading:
   "### Your Personalized 7-Day Diet Plan"
   so the app can enable the download button.

    `;

    // 💬 Combine system prompt + user input
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const text = result.response.text();

    if (!text?.trim()) {
      console.warn("⚠️ Empty response from Gemini");
      return res.status(500).json({ error: "Empty response from Gemini model" });
    }

    // ✅ If no file requested → return text as usual
    if (!wantsFile) {
      console.log("✅ Gemini responded successfully");
      return res.json({ text });
    }

    // 🧾 If file requested → create downloadable file
    console.log(`📁 Generating diet plan file (${fileFormat})...`);

    // Ask Gemini for a structured plan in JSON format
    const filePrompt = `
    You are PRIME FIT COACH — a professional diet planner.
    Create a detailed 7-day Indian diet chart in JSON format:
    {
      "Day 1": [
        {"Meal": "Breakfast", "Items": "Oats with milk & banana 🥣", "Calories": 350},
        {"Meal": "Lunch", "Items": "Brown rice + dal + chicken 🍛", "Calories": 700},
        {"Meal": "Snack", "Items": "Sprouts chaat 🥗", "Calories": 150},
        {"Meal": "Dinner", "Items": "Chapati + paneer bhurji 🍜", "Calories": 500}
      ],
      "Day 2": [...]
    }
    Base the plan on the user's BMI and calorie needs. Respond with only valid JSON — no markdown.
    When providing a 7-day meal or fitness plan, include the heading "### Your 7-Day Diet Plan" at the top.

    `;
    const planRes = await model.generateContent([filePrompt, userPrompt]);
    const planText = planRes.response.text();

    let plan;
    try {
      plan = JSON.parse(planText);
    } catch {
      console.error("⚠️ Could not parse diet plan JSON.");
      return res.json({
        text: `${text}\n\n⚠️ Unable to generate downloadable plan. Try again.`,
      });
    }

    // Generate file
    const fileId = Date.now();
    const filePath = `/tmp/diet_${fileId}.${fileFormat}`;

    if (fileFormat === "xlsx") {
      const XLSX = await import("xlsx");
      const allDays = [];
      Object.entries(plan).forEach(([day, meals]) => {
        meals.forEach((m) =>
          allDays.push({
            Day: day,
            Meal: m.Meal,
            Items: m.Items,
            Calories: m.Calories,
          })
        );
      });
      const ws = XLSX.utils.json_to_sheet(allDays);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Diet Plan");
      XLSX.writeFile(wb, filePath);
    } else if (fileFormat === "docx") {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const fs = await import("fs");
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
      fs.writeFileSync(filePath, buffer);
    } else if (fileFormat === "pdf") {
      const { jsPDF } = await import("jspdf");
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

    console.log("✅ File generated successfully");
    res.download(filePath);
  } catch (err) {
    console.error("❌ Gemini request failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});
import { writeFileSync } from "fs";
import XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";
import { v4 as uuidv4 } from "uuid";

app.post("/api/dietplan-file", async (req, res) => {
  try {
    const { prompt, format } = req.body; // format = 'xlsx' | 'docx' | 'pdf'
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const systemPrompt = `
    You are PRIME FIT COACH — a professional diet planner.
    Create a detailed 7-day Indian diet chart in JSON format:
    {
      "Day 1": [
        {"Meal": "Breakfast", "Items": "Oats with milk & banana 🥣", "Calories": 350},
        {"Meal": "Lunch", "Items": "Brown rice + dal + chicken 🍛", "Calories": 700},
        {"Meal": "Snack", "Items": "Sprouts chaat 🥗", "Calories": 150},
        {"Meal": "Dinner", "Items": "Chapati + paneer bhurji 🍜", "Calories": 500}
      ],
      "Day 2": [...]
    }
    Base the plan on the user's BMI and calorie needs. Respond with only valid JSON — no markdown.
    `;

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
