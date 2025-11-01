import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chatHistory = history.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const result = await model.generateContent({
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] },
      ],
    });

    const responseText = result.response.text();
    return new Response(JSON.stringify({ text: responseText }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Gemini API Route Error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
