import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { LeafIcon as BotIcon, UserIcon, SendIcon, DownloadIcon } from './components/icons';
import type { Message } from './types';

// Helper function to convert simple markdown to HTML for printing
const markdownToHtml = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\s*-\s(.*?)(?=\n\s*-|$)/g, '<li>$1</li>')
      .replace(/(\<li\>.*?\<\/li\>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/gs, '')
      .replace(/### (.*)/g, '<h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1rem;">$1</h3>')
      .replace(/## (.*)/g, '<h2 style="font-size: 1.5rem; font-weight: 700; margin-top: 1.25rem;">$1</h2>')
      .replace(/\n/g, '<br />');
};


// Simple Markdown Renderer using dangerouslySetInnerHTML for simplicity
// This is acceptable here as the content is from a trusted API (Gemini).
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div
      className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
};

const App: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const chatSession = ai.chats.create({
          model: 'gemini-2.5-pro',
          config: {
            systemInstruction: `You are a friendly and professional AI fitness assistant for 'Prime Fitness Point'. Your name is 'PRIME Bot'. Your goal is to help users achieve their fitness goals.

**Your Capabilities:**
1.  **Onboarding:** You must first greet the user, introduce yourself, and then collect their name, weight (kg), height (cm), age, gender, and activity level (sedentary, lightly active, moderately active, very active).
2.  **BMI & Diet Plan:** Once you have all the user's details, you must calculate their BMI and generate a personalized, detailed **7-day** Indian diet chart.
3.  **Nutritional Q&A:** Users can ask you for the nutritional content (calories, protein, fat, carbs, fibre) of any food item. You should provide this information per 100g.
4.  **Diet Tracking:** Users can tell you what they've eaten. Acknowledge their meal conversationally.

**Diet Plan Rules:**
-   The plan **must** be for a full 7 days.
-   The plan **must** start with a Markdown header '## Your Personalized 7-Day Diet Plan'.
-   Below the header, create a '### Plan Details' section that summarizes the user's info: Name, BMI, BMI Category, and Estimated Daily Calorie Goal.
-   For **each and every food item** suggested in the 7-day plan, you **must** add a cautionary note on a new line. This note should start with '*Caution:*' and explain potential health issues associated with that food, or which group of people should be careful with it (e.g., '*Caution: High in sodium, individuals with high blood pressure should consume in moderation.*'). This is a critical safety requirement.
-   Always include this disclaimer at the very end of the diet plan: '**Disclaimer:** Please consult with a doctor or registered dietitian before making significant changes to your diet. This plan is a suggestion and not medical advice.'

**Conversation Flow:**
-   **Start:** Your first message must be: "Welcome to Prime Fitness Point! I'm PRIME Bot, your personal AI fitness assistant. To create a customized plan for you, let's start with your name. What should I call you?". Do not ask for any other information in the first message.
-   **After Plan Generation:** Let the user know they can ask you any questions about nutrition or their plan.

**Important General Rules:**
-   Always be encouraging and professional.
-   Use Markdown extensively for formatting lists, bold text, and headers to make your responses easy to read.
-   Use the metric system (kg, cm).
-   Base your food suggestions on common Indian cuisine.`,
          },
        });
        setChat(chatSession);

        const response = await chatSession.sendMessage({ message: "Start the conversation." });
        setMessages([{ role: 'model', content: response.text }]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([{ role: 'model', content: "Sorry, I'm having trouble connecting. Please check your connection or API key and refresh the page." }]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, []);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: currentInput });
      let botMessageContent = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        botMessageContent += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = botMessageContent;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', content: "I encountered an error. Could you please rephrase your message?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPlan = (content: string) => {
    const printWindow = document.getElementById('print-mount');
    if (printWindow) {
      printWindow.innerHTML = markdownToHtml(content);
      window.print();
      printWindow.innerHTML = '';
    }
  };
  
  return (
    <div className={`flex flex-col h-screen font-sans bg-slate-100 dark:bg-slate-900`}>
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
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white"><BotIcon className="w-5 h-5"/></div>}
              <div className={`relative group max-w-lg p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                <MarkdownRenderer content={msg.content} />
                {msg.role === 'model' && msg.content.includes('Your Personalized 7-Day Diet Plan') && (
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
               {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white"><UserIcon className="w-5 h-5"/></div>}
            </div>
          ))}
           {isLoading && messages.length > 0 && (
            <div className="flex items-start gap-4 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white"><BotIcon className="w-5 h-5"/></div>
              <div className="max-w-lg p-4 rounded-2xl bg-white dark:bg-slate-700 rounded-bl-none shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                }
            }}
            placeholder="Type your message here..."
            rows={1}
            className="flex-1 block w-full px-4 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm rounded-lg resize-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;