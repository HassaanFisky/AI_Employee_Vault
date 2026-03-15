// web-form/src/components/SupportWidget.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

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

// ─── Helper: format timestamp ─────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 0" }}>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              display: "inline-block",
              animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>ARIA is typing…</span>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            background: "var(--surface-3)",
            padding: "4px 12px",
            borderRadius: "20px",
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "4px",
        animation: "fadeInUp 0.25s ease forwards",
      }}
    >
      {!isUser && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
            paddingLeft: "4px",
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            AI
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
            ARIA
          </span>
        </div>
      )}
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: isUser
            ? "var(--radius-md) var(--radius-sm) var(--radius-sm) var(--radius-md)"
            : "var(--radius-sm) var(--radius-md) var(--radius-md) var(--radius-sm)",
          background: isUser
            ? "linear-gradient(135deg, var(--user-bubble), #7c3aed)"
            : "var(--agent-bubble)",
          border: isUser ? "none" : "1px solid var(--border)",
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          lineHeight: "1.55",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.content}
      </div>
      <span
        style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          marginTop: "4px",
          paddingLeft: isUser ? "0" : "4px",
          paddingRight: isUser ? "4px" : "0",
        }}
      >
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

// ─── SupportWidget ────────────────────────────────────────────────────────────

export function SupportWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<WidgetStatus>("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState<string>(() => uuidv4());
  const [isOpen, setIsOpen] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Connect WebSocket
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(`${WS_URL}/support/ws/${sessionId}`);

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          content: string;
        };

        if (data.type === "connected") {
          setMessages([
            {
              id: uuidv4(),
              role: "agent",
              content: data.content,
              timestamp: new Date(),
            },
          ]);
        }

        if (data.type === "agent_response") {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              role: "agent",
              content: data.content,
              timestamp: new Date(),
            },
          ]);
        }

        if (data.type === "error") {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              role: "system",
              content: "⚠️ Something went wrong. Please try again.",
              timestamp: new Date(),
            },
          ]);
        }
      } catch (_) {
        // Ignore non-JSON messages (ping/pong)
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("idle");
      // Attempt reconnect after 3 seconds
      setTimeout(connectWs, 3000);
    };

    wsRef.current = ws;
  }, [sessionId]);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // Send message
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || status === "error") return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    inputRef.current?.focus();

    try {
      const response = await fetch(`${API_URL}/support/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "system",
          content: "⚠️ Failed to send message. Please check your connection.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [inputText, sessionId, status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Status indicator
  const statusColor =
    status === "connected"
      ? "var(--success)"
      : status === "error"
      ? "var(--error)"
      : "var(--warning)";
  const statusLabel =
    status === "connected"
      ? "Online"
      : status === "connecting"
      ? "Connecting…"
      : status === "error"
      ? "Disconnected"
      : "Reconnecting…";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#6366f1,#a78bfa)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(99,102,241,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          transition: "transform 0.2s ease",
          zIndex: 9999,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(1.1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
        aria-label="Open support chat"
      >
        💬
      </button>
    );
  }

  return (
    <>
      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes widgetIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 4px; }
        .messages-scroll::-webkit-scrollbar { width: 4px; }
        .messages-scroll::-webkit-scrollbar-track { background: transparent; }
        .messages-scroll::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 4px; }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "min(420px, calc(100vw - 48px))",
          height: "min(640px, calc(100vh - 48px))",
          background: "var(--surface-2)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), var(--shadow-glow)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "widgetIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
          zIndex: 9999,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 18px",
            background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(167,139,250,0.08))",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#a78bfa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
              }}
            >
              🤖
            </div>
            <span
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: statusColor,
                border: "2px solid var(--surface-2)",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              ARIA — Support AI
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1px" }}>
              {statusLabel} · 24/7 Support
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "1.2rem",
              padding: "4px",
              borderRadius: "6px",
              transition: "color 0.2s",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* ── Messages ── */}
        <div
          className="messages-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              outline: "none",
              maxHeight: "100px",
              transition: "border-color var(--transition)",
              lineHeight: "1.4",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || status === "error"}
            style={{
              width: "42px",
              height: "42px",
              border: "none",
              borderRadius: "var(--radius-md)",
              background:
                !inputText.trim() || status === "error"
                  ? "var(--surface-3)"
                  : "linear-gradient(135deg,#6366f1,#7c3aed)",
              color: !inputText.trim() || status === "error" ? "var(--text-muted)" : "#fff",
              cursor: !inputText.trim() || status === "error" ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "1.1rem",
              transition: "all var(--transition)",
              boxShadow:
                inputText.trim() && status !== "error"
                  ? "0 4px 12px rgba(99,102,241,0.4)"
                  : "none",
            }}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "6px 16px 10px",
            textAlign: "center",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            background: "var(--surface)",
          }}
        >
          Powered by ARIA · AI-assisted · Responses may not be 100% accurate
        </div>
      </div>
    </>
  );
}
