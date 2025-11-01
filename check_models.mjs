import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ No API key found in .env");
  process.exit(1);
}

const endpoint =
  "https://generativelanguage.googleapis.com/v1beta/models?key=" + API_KEY;

async function listModels() {
  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (!data.models) {
      console.log("⚠️ No models found. Full response:");
      console.log(data);
      return;
    }

    console.log("✅ Available models for this key:\n");
    data.models.forEach((m) => console.log("-", m.name));
  } catch (err) {
    console.error("❌ Error fetching models:", err.message);
  }
}

listModels();
