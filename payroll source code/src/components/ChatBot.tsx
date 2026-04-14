import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '👋 Hello! I am PayrollBot. I can help you with this. How can I assist you with your payroll today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const reply = await chatWithAI(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: reply || 'Sorry, I encountered an error.' }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Error: Could not connect to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 right-6 w-[400px] h-[600px] z-50 flex flex-col bg-[#0f172a]/95 border-2 border-[#fd79a8] rounded-2xl shadow-[0_0_30px_rgba(253,121,168,0.3)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#fd79a8]/30 flex items-center justify-between bg-[#fd79a8]/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#fd79a8] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[#fd79a8] font-bold">AI Payroll Assistant</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-3 py-1 bg-[#ff4757]/20 hover:bg-[#ff4757]/40 text-[#ff4757] text-xs font-bold rounded-full border border-[#ff4757]/50 transition-all"
              >
                EXIT
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#ff4757]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#fd79a8]/30"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-[#3b82f6] text-white rounded-tr-none'
                      : 'bg-[#fd79a8]/10 border border-[#fd79a8]/30 text-white rounded-tl-none'
                  }`}
                >
                  <div className="text-sm leading-relaxed markdown-content">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#fd79a8]/10 border border-[#fd79a8]/30 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#fd79a8] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#fd79a8] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#fd79a8] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#fd79a8]/30 bg-[#fd79a8]/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me about payroll..."
                className="flex-1 bg-white/5 border-2 border-[#fd79a8]/50 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#fd79a8] transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-[#fd79a8] flex items-center justify-center text-white hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
