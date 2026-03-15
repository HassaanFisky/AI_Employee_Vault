"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Badge } from "@/components/atoms/Badge";
import { 
  Bot, Send, X, Minimize2, Maximize2, 
  MessageCircle, AlertCircle, CheckCircle2 
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "agent" | "system";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

type WidgetStatus = "idle" | "connecting" | "connected" | "error" | "escalated";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

// ─── Components ───────────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="flex items-center gap-sm p-sm animate-fade-in">
    <div className="flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
    <span className="text-body-sm text-text-tertiary">ARIA is thinking...</span>
  </div>
);

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="text-center py-sm animate-fade-in">
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary bg-bg-3 px-md py-1 rounded-full border border-bg-4">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col mb-md animate-slide-up",
      isUser ? "items-end" : "items-start"
    )}>
      {!isUser && (
        <div className="flex items-center gap-sm mb-xs pl-1">
          <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center shadow-glow">
            <Bot size={12} className="text-white" />
          </div>
          <span className="text-body-sm font-semibold text-text-secondary">ARIA</span>
        </div>
      )}
      <div className={cn(
        "max-w-[85%] px-md py-sm rounded-sm text-body-reg leading-relaxed break-words",
        isUser 
          ? "bg-accent-primary text-white shadow-lg rounded-tr-none" 
          : "bg-bg-3 text-text-primary border border-bg-4 rounded-tl-none"
      )}>
        {message.content}
      </div>
      <span className="text-[10px] text-text-tertiary mt-1 px-1">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export function SupportWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<WidgetStatus>("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState<string>(() => uuidv4());
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  // WebSocket Connection
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(`${WS_URL}/support/ws/${sessionId}`);

    ws.onopen = () => setStatus("connected");
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") {
          setMessages([{
            id: uuidv4(),
            role: "agent",
            content: data.content,
            timestamp: new Date(),
          }]);
        }
        if (data.type === "agent_response") {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: "agent",
            content: data.content,
            timestamp: new Date(),
          }]);
        }
      } catch (e) { /* silent fail */ }
    };

    ws.onerror = () => setStatus("error");
    ws.onclose = () => {
      setStatus("idle");
      setTimeout(connectWs, 3000);
    };
    wsRef.current = ws;
  }, [sessionId]);

  useEffect(() => {
    connectWs();
    return () => wsRef.current?.close();
  }, [connectWs]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || status === "error") return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      await fetch(`${API_URL}/support/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: "system",
        content: "Lost connection. Retrying...",
        timestamp: new Date(),
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-xl right-xl w-14 h-14 rounded-full bg-accent-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
        aria-label="Open AI Support"
      >
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-slow rounded-full" />
        <MessageCircle size={24} className="relative z-10" />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-xl right-xl w-full max-w-[400px] border border-bg-3 bg-bg-2 shadow-2xl rounded-sm z-50 flex flex-col transition-all duration-base",
      isMinimized ? "h-[64px]" : "h-[min(650px,calc(100vh-100px))]",
      "animate-bounce-in"
    )}>
      {/* Header */}
      <div className="p-md flex items-center justify-between border-b border-bg-3 bg-white/[0.02]">
        <div className="flex items-center gap-md">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-glow">
              <Bot size={20} className="text-white" />
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-2",
              status === 'connected' ? "bg-success" : status === 'connecting' ? "bg-warning" : "bg-error"
            )} />
          </div>
          <div>
            <h4 className="text-body-reg font-bold text-text-primary">ARIA</h4>
            <div className="flex items-center gap-xs">
              <span className="text-[10px] text-text-tertiary">AI Response Mode</span>
              {status === 'connected' && <Badge variant="success" className="h-3 py-0 px-1 text-[8px]">ACTIVE</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-sm text-text-tertiary hover:text-text-primary hover:bg-bg-3 rounded-sm transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-sm text-text-tertiary hover:text-error hover:bg-error/10 rounded-sm transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-md space-y-md scrollbar-premium bg-bg-1/30">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-md bg-bg-2 border-t border-bg-3">
            <div className="flex gap-sm items-end relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ARIA a question..."
                className="flex-1 bg-bg-3 border border-bg-4 rounded-sm px-md py-sm text-body-reg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary outline-none transition-colors resize-none scrollbar-premium h-[42px] max-h-[120px]"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <Button 
                size="sm" 
                className="h-[42px] w-[42px] p-0 flex-shrink-0"
                disabled={!inputText.trim() || status === 'error'}
                onClick={sendMessage}
              >
                <Send size={18} />
              </Button>
            </div>
            <div className="mt-sm flex items-center justify-between text-[10px] text-text-tertiary">
              <p>⌘+Enter to send</p>
              <p className="flex items-center gap-xs">
                {status === 'connected' ? <CheckCircle2 size={10} className="text-success" /> : <AlertCircle size={10} className="text-error" />}
                System Status: {status}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

