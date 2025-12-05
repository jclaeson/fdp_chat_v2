import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, RefreshCw, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm the FedEx Developer Assistant. I can help you with API integration, tracking endpoints, or shipping label generation. What are you building today?",
    timestamp: new Date()
  }
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "To create a shipment using the FedEx Ship API, you'll need to make a POST request to `/ship/v1/shipments`. \n\nHere is a basic JSON payload structure:\n```json\n{\n  \"requestedShipment\": {\n    \"shipper\": { ... },\n    \"recipients\": [ ... ],\n    \"pickupType\": \"USE_SCHEDULED_PICKUP\"\n  }\n}\n```\n\nMake sure you have your OAuth token ready in the Authorization header.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - Hidden on mobile for now */}
      <div className="hidden md:flex w-64 flex-col border-r border-white/5 bg-card/50 p-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-primary to-accent" />
          <span className="font-bold">FDP Chat</span>
        </div>
        
        <Button variant="outline" className="justify-start gap-2 mb-6 border-white/10 bg-white/5 hover:bg-white/10">
          <RefreshCw className="h-4 w-4" /> New Chat
        </Button>

        <div className="space-y-2">
          <h4 className="px-2 text-xs font-medium text-muted-foreground mb-2">Recent Queries</h4>
          {["Tracking API Errors", "Rate Quote Auth", "Label Format ZPL"].map((topic, i) => (
            <Button key={i} variant="ghost" className="w-full justify-start text-sm font-normal h-8 px-2 text-muted-foreground hover:text-foreground">
              {topic}
            </Button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-background">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6">
           <div className="flex items-center gap-2">
             <span className="font-medium">FedEx Documentation Assistant</span>
             <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px]">BETA</span>
           </div>
           <Button variant="ghost" size="icon" className="text-muted-foreground">
             <MoreHorizontal className="h-5 w-5" />
           </Button>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl ${msg.role === 'assistant' ? 'bg-white/5 border border-white/5' : 'bg-primary text-white'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 ml-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isTyping && (
               <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                   <Bot className="w-5 h-5" />
                 </div>
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                   <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                 </div>
               </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5">
          <div className="relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about FedEx APIs..." 
              className="h-14 pl-4 pr-12 bg-white/5 border-white/10 focus-visible:ring-primary text-base rounded-xl"
            />
            <Button 
              onClick={handleSend}
              size="icon" 
              className="absolute right-2 top-2 h-10 w-10 bg-primary hover:bg-primary/90 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-center">
            <p className="text-[10px] text-muted-foreground">AI can make mistakes. Check important info.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
