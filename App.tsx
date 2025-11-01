import React, { useState, useEffect, useRef, FormEvent } from "react";
import {
  LeafIcon as BotIcon,
  UserIcon,
  SendIcon,
  DownloadIcon,
} from "./components/icons";
import type { Message } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Convert Markdown → HTML
const markdownToHtml = (text: string) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\s*-\s(.*?)(?=\n\s*-|$)/g, "<li>$1</li>")
    .replace(/(\<li\>.*?\<\/li\>)/gs, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/gs, "")
    .replace(/### (.*)/g, '<h3 style="font-size:1.25rem;font-weight:600;margin-top:1rem;">$1</h3>')
    .replace(/## (.*)/g, '<h2 style="font-size:1.5rem;font-weight:700;margin-top:1.25rem;">$1</h2>')
    .replace(/\n/g, "<br />");

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔧 Initialize Gemini with auto model detection
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        if (!API_KEY) throw new Error("Missing Gemini API Key");
        const genAI = new GoogleGenerativeAI(API_KEY);
    
        // ✅ Use gemini-1.5-flash (works for all AI Studio keys)
        const selectedModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        setModel(selectedModel);
    
        const welcome =
          "👋 Welcome to **Prime Fitness Point!** I'm PRIME Bot, your personal AI fitness assistant. Let's begin — what's your name?";
        setMessages([{ role: "model", content: welcome }]);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setMessages([
          {
            role: "model",
            content:
              "⚠️ Unable to initialize Gemini. Please verify your API key in `.env` and restart the app.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // 💬 Handle chat messages
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
  
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg, { role: "model", content: "" }]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
  
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentInput }),
        }
      );
  
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const reply = data.text;
  
      // 🪄 Typing animation
      let display = "";
      for (const ch of reply) {
        display += ch;
        setMessages((prev) => {
          const m = [...prev];
          m[m.length - 1].content = display;
          return m;
        });
        await new Promise((r) => setTimeout(r, 15));
      }
    } catch (err: any) {
      console.error("Frontend error:", err);
      setMessages((prev) => {
        const m = [...prev];
        m[m.length - 1].content =
          "⚠️ Gemini failed to respond. Please check backend console.";
        return m;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  
  

  const handleDownloadPlan = (content: string) => {
    const printMount = document.getElementById("print-mount");
    if (printMount) {
      printMount.innerHTML = markdownToHtml(content);
      window.print();
      printMount.innerHTML = "";
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-md">
        <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BotIcon className="h-8 w-8 text-primary-500" />
            <h1 className="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">
              Prime Fitness Point
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "model" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  <BotIcon className="w-5 h-5" />
                </div>
              )}
              <div
                className={`relative group max-w-lg p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white rounded-br-none"
                    : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.role === "model" && !msg.content && isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce" />
                  </div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {msg.role === "model" &&
                  msg.content.includes("Your Personalized 7-Day Diet Plan") && (
                    <button
                      onClick={() => handleDownloadPlan(msg.content)}
                      className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Download Diet Plan"
                    >
                      <DownloadIcon className="w-3 h-3" />
                      Download Plan
                    </button>
                  )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700">
        <form
          onSubmit={handleSendMessage}
          className="max-w-3xl mx-auto flex items-center gap-4"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type your message here..."
            rows={1}
            className="flex-1 block w-full px-4 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm rounded-lg resize-none"
            disabled={isLoading || !model}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !model}
            className="p-2 rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </form>
      </footer>

      <div id="print-mount" className="hidden" />
    </div>
  );
};

export default App;
