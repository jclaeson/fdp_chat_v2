import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, RefreshCw, ThumbsUp, ThumbsDown, MoreHorizontal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { chatAPI } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  modelUsed?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isEmbed = searchParams.get('embed') === 'true';

  const chatMutation = useMutation({
    mutationFn: chatAPI.sendMessage,
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          sources: data.sources,
          modelUsed: data.modelUsed,
        }
      ]);
    },
    onError: (error) => {
      toast.error("Failed to send message. Please try again.");
      console.error('Chat error:', error);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const messageText = input;
    setInput("");

    chatMutation.mutate({
      message: messageText,
      conversationId: conversationId || undefined,
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`flex h-screen bg-background text-foreground ${isEmbed ? 'overflow-hidden' : ''}`}>
      {/* Sidebar - Hidden on mobile AND in embed mode */}
      {!isEmbed && (
        <div className="hidden md:flex w-64 flex-col border-r border-white/5 bg-card/50 p-4">
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-primary to-accent" />
            <span className="font-bold">FDP Chat</span>
          </div>
          
          <Button 
            variant="outline" 
            className="justify-start gap-2 mb-6 border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => {
              setMessages([]);
              setConversationId(null);
            }}
          >
            <RefreshCw className="h-4 w-4" /> New Chat
          </Button>

          <div className="space-y-2">
            <h4 className="px-2 text-xs font-medium text-muted-foreground mb-2">AI Powered</h4>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>RAG for FedEx APIs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <span>GPT-4 for general help</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full bg-background">
        {/* Header - Simplified in Embed Mode */}
        {!isEmbed && (
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6">
             <div className="flex items-center gap-2">
               <span className="font-medium">FedEx Documentation Assistant</span>
               <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                 <Sparkles className="w-3 h-3 mr-1" />
                 HYBRID AI
               </Badge>
             </div>
             <Button variant="ghost" size="icon" className="text-muted-foreground">
               <MoreHorizontal className="h-5 w-5" />
             </Button>
          </header>
        )}

        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to FedEx Assistant</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Ask me anything about FedEx APIs, shipping integration, or general development questions.
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 md:p-4 rounded-2xl ${msg.role === 'assistant' ? 'bg-white/5 border border-white/5' : 'bg-primary text-white'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex flex-col gap-2 mt-2 ml-1">
                      {msg.modelUsed && (
                        <Badge variant="outline" className="text-[9px] w-fit">
                          {msg.modelUsed === 'ollama-rag' ? '🔍 RAG + Ollama' : 
                           msg.modelUsed === 'openai' ? '✨ GPT-4' : '💡 Hybrid'}
                        </Badge>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="font-medium">Sources:</div>
                          {msg.sources.slice(0, 3).map((source, i) => (
                            <a 
                              key={i} 
                              href={source} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block truncate hover:text-primary transition-colors max-w-md"
                            >
                              {source}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {chatMutation.isPending && (
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
          <div className="relative max-w-4xl mx-auto">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about FedEx APIs..." 
              className="h-12 md:h-14 pl-4 pr-12 bg-white/5 border-white/10 focus-visible:ring-primary text-sm md:text-base rounded-xl"
              disabled={chatMutation.isPending}
            />
            <Button 
              onClick={handleSend}
              size="icon" 
              disabled={chatMutation.isPending || !input.trim()}
              className="absolute right-2 top-1.5 md:top-2 h-9 w-9 md:h-10 md:w-10 bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!isEmbed && (
            <div className="mt-2 text-center">
              <p className="text-[10px] text-muted-foreground">
                Powered by Ollama RAG + OpenAI GPT-4. AI can make mistakes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
