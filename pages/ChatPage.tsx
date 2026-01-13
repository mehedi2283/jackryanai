import React, { useState, useRef, useEffect } from 'react';
import { Send, Lock, ShieldAlert, Bot, User as UserIcon, RefreshCcw, MoreVertical } from 'lucide-react';
import Button from '../components/Button';
import { generateSecureResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Identity verified. Secure channel established. How may I assist you with classified matters today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateSecureResponse(input);
      
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error: Connection to secure core interrupted.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: 'History purged. New secure session started.',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-100 p-4 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="bg-indigo-50 p-2.5 rounded-full">
               <Bot className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sentinel Core</h2>
            <div className="flex items-center">
               <Lock className="h-3 w-3 text-emerald-500 mr-1" />
               <p className="text-xs text-gray-500 font-medium">
                 End-to-End Encrypted
               </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="ghost" onClick={clearChat} className="p-2 text-gray-400 hover:text-gray-600">
             <RefreshCcw className="h-5 w-5" />
           </Button>
           <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
             <MoreVertical className="h-5 w-5" />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm mb-1 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-gray-200'}`}>
                {msg.role === 'user' ? <UserIcon className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-indigo-600" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex max-w-[80%] flex-row items-end gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm mb-1">
                <Bot className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
             <div className="relative flex-1 group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter classified command or query..."
                  className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none transition-all duration-200"
                />
                 <div className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-indigo-400 transition-colors">
                    <ShieldAlert className="h-5 w-5" />
                 </div>
             </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="px-4 h-[50px] rounded-xl aspect-square flex items-center justify-center !p-0"
            >
              <Send className="h-5 w-5 ml-0.5" />
            </Button>
          </form>
          <div className="mt-3 flex justify-center">
             <p className="flex items-center text-[10px] text-gray-400 font-medium tracking-wider uppercase">
               <Lock className="h-3 w-3 mr-1.5" />
               Authorized Personnel Only • Level 5 Clearance
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;