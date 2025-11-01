import React, { useState, useEffect, useRef, FormEvent } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  LeafIcon as BotIcon,
  UserIcon,
  SendIcon,
  DownloadIcon,
} from "./components/icons";
import type { Message } from "./types";

// Markdown renderer helper
const markdownToHtml = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\s*-\s(.*?)(?=\n\s*-|$)/g, "<li>$1</li>")
    .replace(/(\<li\>.*?\<\/li\>)/gs, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/gs, "")
    .replace(/### (.*)/g, '<h3 style="font-size:1.25rem;font-weight:600;">$1</h3>')
    .replace(/## (.*)/g, '<h2 style="font-size:1.5rem;font-weight:700;">$1</h2>')
    .replace(/\n/g, "<br />");
};

// Markdown component
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div
    className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
    dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
  />
);

const App: React.FC = () => {
  const [model, setModel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Gemini model
  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");
  
        const ai = new GoogleGenerativeAI(apiKey);
        const modelInstance = ai.getGenerativeModel({
          model: "gemini-1.5-flash", // ✅ supported model
        });
  
        setModel(modelInstance);
        setMessages([
          {
            role: "model",
            content:
              "🏋️‍♂️ Welcome to Prime Fitness Point! I’m PRIME Bot, your personal AI fitness assistant. What’s your name?",
          },
        ]);
      } catch (err) {
        console.error("Initialization error:", err);
        setMessages([
          {
            role: "model",
            content:
              "Sorry, I'm having trouble connecting. Please check your internet connection or API key and refresh the page.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
  
    initChat();
  }, []);
  

  // Handle user message submission
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !model) return;
  
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
  
    try {
      console.log("Sending prompt:", currentInput);
    
      const result = await model.generateContent(currentInput);
    
      // Extract text safely
      const text =
        result?.response?.text?.() ||
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response received from Gemini API.";
    
      setMessages((prev) => [...prev, { role: "model", content: text }]);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content:
            "⚠️ I encountered an issue generating a response. Please check your API key and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
    

  // Download plan
  const handleDownloadPlan = (content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Prime_Fitness_Plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-md z-10">
        <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BotIcon className="h-8 w-8 text-primary-500" />
            <h1 className="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">
              Prime Fitness Point
            </h1>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "model" && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white">
                  <BotIcon className="h-5 w-5" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm md:text-base shadow-md ${
                  msg.role === "user"
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                }`}
              >
                <MarkdownRenderer content={msg.content} />
                {msg.role === "model" && (
                  <button
                    className="mt-2 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    onClick={() => handleDownloadPlan(msg.content)}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download Plan
                  </button>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center text-white">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center items-center gap-2 text-slate-500">
              <div className="h-3 w-3 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="h-3 w-3 bg-slate-400 rounded-full animate-bounce delay-100"></div>
              <div className="h-3 w-3 bg-slate-400 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <form
          onSubmit={handleSendMessage}
          className="max-w-3xl mx-auto flex gap-3 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button
            type="submit"
            className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            disabled={!input.trim()}
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </footer>

      {/* Hidden element for printing */}
      <div id="print-mount" className="hidden"></div>
    </div>
  );
};

export default App;
