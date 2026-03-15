"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Ticket,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Cpu,
  Database,
  Server,
  Zap,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  latency?: string;
  icon: React.ElementType;
}

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  accentColor: string;
}

interface ActivityEvent {
  id: string;
  type: "new_ticket" | "escalation" | "resolution" | "response";
  message: string;
  channel: "email" | "whatsapp" | "web";
  timestamp: string;
}

interface ThoughtEntry {
  tool: string;
  args: string;
  result: string;
  timestamp: string;
}

// ─── Static mock data ────────────────────────────────────────────────────────

const CHART_DATA = [
  { time: "00:00", tickets: 2, resolved: 1 },
  { time: "04:00", tickets: 4, resolved: 3 },
  { time: "08:00", tickets: 18, resolved: 14 },
  { time: "10:00", tickets: 31, resolved: 25 },
  { time: "12:00", tickets: 24, resolved: 20 },
  { time: "14:00", tickets: 38, resolved: 29 },
  { time: "16:00", tickets: 27, resolved: 22 },
  { time: "18:00", tickets: 15, resolved: 13 },
  { time: "20:00", tickets: 9, resolved: 8 },
  { time: "23:00", tickets: 5, resolved: 4 },
];

const THOUGHT_FEED: ThoughtEntry[] = [
  { tool: "search_kb", args: '{ query: "billing refund policy" }', result: "3 articles found", timestamp: "17:08:44" },
  { tool: "create_ticket", args: '{ priority: "High", channel: "email" }', result: "TKT-2041 created", timestamp: "17:08:45" },
  { tool: "get_history", args: '{ customer_id: "c_9182" }', result: "4 past interactions", timestamp: "17:08:46" },
  { tool: "send_response", args: '{ channel: "email", ticket: "TKT-2041" }', result: "Sent successfully", timestamp: "17:08:47" },
  { tool: "search_kb", args: '{ query: "account 2FA reset" }', result: "2 articles found", timestamp: "17:09:02" },
  { tool: "escalate", args: '{ reason: "legal dispute", tier: 2 }', result: "Routed to Tier-2", timestamp: "17:09:12" },
];

const ACTIVITY_FEED: ActivityEvent[] = [
  { id: "1", type: "new_ticket", message: "New ticket from john@acme.com — Billing issue", channel: "email", timestamp: "17:08:47" },
  { id: "2", type: "resolution", message: "TKT-2038 resolved — Password reset (Web)", channel: "web", timestamp: "17:07:15" },
  { id: "3", type: "escalation", message: "TKT-2037 escalated — Legal dispute (Email)", channel: "email", timestamp: "17:06:44" },
  { id: "4", type: "response", message: "AI reply sent to +923001234567 — WhatsApp", channel: "whatsapp", timestamp: "17:06:01" },
  { id: "5", type: "new_ticket", message: "New ticket from dev@startup.io — API error 503", channel: "web", timestamp: "17:05:33" },
  { id: "6", type: "resolution", message: "TKT-2035 resolved — Onboarding question", channel: "whatsapp", timestamp: "17:04:20" },
  { id: "7", type: "new_ticket", message: "New ticket from marketing@corp.com — Feature request", channel: "email", timestamp: "17:03:50" },
  { id: "8", type: "response", message: "AI reply sent to sarah@fintech.com (Technical)", channel: "email", timestamp: "17:02:18" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ServiceStatus["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex w-2.5 h-2.5 rounded-full shrink-0",
        status === "online" && "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)] animate-pulse",
        status === "degraded" && "bg-yellow-400 shadow-[0_0_6px_rgba(251,191,36,0.7)] animate-pulse",
        status === "offline" && "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.7)]"
      )}
    />
  );
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = service.icon;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-2 border border-bg-3 hover:border-accent-primary/30 transition-colors">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          service.status === "online"
            ? "bg-green-400/10"
            : service.status === "degraded"
            ? "bg-yellow-400/10"
            : "bg-red-400/10"
        )}
      >
        <Icon
          size={16}
          className={cn(
            service.status === "online"
              ? "text-green-400"
              : service.status === "degraded"
              ? "text-yellow-400"
              : "text-red-400"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-text-primary truncate">
          {service.name}
        </p>
        {service.latency && (
          <p className="text-[10px] text-text-tertiary">{service.latency}</p>
        )}
      </div>
      <StatusDot status={service.status} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-bg-2 border border-bg-3 p-5 animate-pulse">
      <div className="h-3 w-24 bg-bg-3 rounded mb-4" />
      <div className="h-8 w-16 bg-bg-3 rounded mb-2" />
      <div className="h-3 w-12 bg-bg-3 rounded" />
    </div>
  );
}

function ServiceUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-bg-2 border border-bg-3 text-center gap-4">
      <AlertTriangle size={32} className="text-warning" />
      <div>
        <p className="text-body-reg font-semibold text-text-primary">
          Service Unavailable
        </p>
        <p className="text-body-sm text-text-secondary mt-1">
          Cannot reach the backend API. Showing cached data.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-3 hover:bg-bg-4 text-body-sm text-text-primary transition-colors"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

function ActivityTypeIcon({ type }: { type: ActivityEvent["type"] }) {
  const classes = "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5";
  if (type === "new_ticket")
    return (
      <span className={cn(classes, "bg-blue-500/20")}>
        <Ticket size={12} className="text-blue-400" />
      </span>
    );
  if (type === "escalation")
    return (
      <span className={cn(classes, "bg-yellow-500/20")}>
        <AlertTriangle size={12} className="text-yellow-400" />
      </span>
    );
  if (type === "resolution")
    return (
      <span className={cn(classes, "bg-green-500/20")}>
        <CheckCircle size={12} className="text-green-400" />
      </span>
    );
  return (
    <span className={cn(classes, "bg-accent-primary/20")}>
      <MessageSquare size={12} className="text-accent-primary" />
    </span>
  );
}

function ChannelIcon({ channel }: { channel: ActivityEvent["channel"] }) {
  if (channel === "email") return <Mail size={10} className="text-text-tertiary" />;
  if (channel === "whatsapp") return <Phone size={10} className="text-text-tertiary" />;
  return <Globe size={10} className="text-text-tertiary" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("—");
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [visibleThoughts, setVisibleThoughts] = useState<ThoughtEntry[]>([]);
  const [channelMetrics, setChannelMetrics] = useState<Record<string, { total_conversations: number }> | null>(null);

  const services: ServiceStatus[] = [
    { name: "Groq AI Engine", status: apiOnline ? "online" : apiOnline === false ? "offline" : "degraded", latency: "94ms avg", icon: Cpu },
    { name: "Neon PostgreSQL", status: apiOnline ? "online" : "degraded", latency: "12ms avg", icon: Database },
    { name: "Confluent Kafka", status: "online", latency: "8ms avg", icon: Server },
    { name: "Twilio WhatsApp", status: "online", latency: "210ms avg", icon: Phone },
    { name: "Gmail API", status: apiOnline ? "online" : "degraded", latency: "130ms avg", icon: Mail },
  ];

  const metrics: MetricCard[] = [
    {
      label: "Open Tickets",
      value: 12,
      change: 8,
      icon: Ticket,
      accentColor: "text-blue-400",
    },
    {
      label: "Avg Response Time",
      value: "8m 24s",
      change: -12,
      icon: Clock,
      accentColor: "text-purple-400",
    },
    {
      label: "Resolved Today",
      value: 47,
      change: 23,
      icon: CheckCircle,
      accentColor: "text-accent-primary",
    },
    {
      label: "Active Sessions",
      value: channelMetrics
        ? Object.values(channelMetrics).reduce((s, c) => s + c.total_conversations, 0)
        : 6,
      change: 15,
      icon: Activity,
      accentColor: "text-warning",
    },
  ];

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        setApiOnline(true);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  }, []);

  const fetchChannelMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/metrics/channels`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) setChannelMetrics(await res.json());
    } catch {
      /* silent — use defaults */
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchChannelMetrics();
    const interval = setInterval(() => {
      fetchHealth();
      fetchChannelMetrics();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchChannelMetrics]);

  // Animate AI thought terminal
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleThoughts((prev) => {
        const next = THOUGHT_FEED[thoughtIdx % THOUGHT_FEED.length];
        const updated = [next, ...prev].slice(0, 6);
        setThoughtIdx((i) => i + 1);
        return updated;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [thoughtIdx]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-text-primary">Mission Control</h1>
          <p className="text-body-reg text-text-secondary mt-1">
            Real-time AI customer success operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-text-tertiary">
            Last synced: <span className="text-text-secondary">{lastUpdated}</span>
          </span>
          <button
            onClick={() => { fetchHealth(); fetchChannelMetrics(); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-2 border border-bg-3 hover:border-accent-primary/40 text-body-sm text-text-secondary hover:text-text-primary transition-all"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-semibold",
              apiOnline === null
                ? "bg-warning/10 text-warning border border-warning/20"
                : apiOnline
                ? "bg-green-400/10 text-green-400 border border-green-400/20"
                : "bg-red-400/10 text-red-400 border border-red-400/20"
            )}
          >
            {apiOnline === null ? (
              <><AlertTriangle size={14} /> Checking...</>
            ) : apiOnline ? (
              <><CheckCircle size={14} /> All Systems Online</>
            ) : (
              <><XCircle size={14} /> API Unreachable</>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {apiOnline === null
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : metrics.map((m) => {
              const Icon = m.icon;
              const positive = m.change > 0;
              return (
                <div
                  key={m.label}
                  className="rounded-xl bg-bg-2 border border-bg-3 hover:border-accent-primary/30 p-5 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-body-sm text-text-tertiary font-medium">
                      {m.label}
                    </span>
                    <div className={cn("p-2 rounded-lg bg-bg-3 group-hover:scale-110 transition-transform", m.accentColor)}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-h2 font-bold text-text-primary">{m.value}</p>
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-2 text-body-sm font-medium",
                      positive ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(m.change)}% vs yesterday
                  </div>
                </div>
              );
            })}
      </div>

      {/* Main Grid — Chart + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume Chart */}
        <div className="lg:col-span-2 rounded-xl bg-bg-2 border border-bg-3 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-body-lg font-bold text-text-primary">Ticket Volume</h2>
              <p className="text-body-sm text-text-tertiary">Today's ticket flow by hour</p>
            </div>
            <div className="flex items-center gap-4 text-body-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-accent-primary inline-block rounded" />
                <span className="text-text-tertiary">Created</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />
                <span className="text-text-tertiary">Resolved</span>
              </span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="tickets" stroke="#10B981" strokeWidth={2} fill="url(#gTickets)" />
                <Area type="monotone" dataKey="resolved" stroke="#60A5FA" strokeWidth={2} fill="url(#gResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Panel */}
        <div className="rounded-xl bg-bg-2 border border-bg-3 p-6">
          <h2 className="text-body-lg font-bold text-text-primary mb-1">System Health</h2>
          <p className="text-body-sm text-text-tertiary mb-5">Live service status</p>
          {apiOnline === null ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[52px] rounded-xl bg-bg-3 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <ServiceCard key={s.name} service={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid — Activity Feed + AI Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="rounded-xl bg-bg-2 border border-bg-3 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-body-lg font-bold text-text-primary">Activity Feed</h2>
            <span className="flex items-center gap-1.5 text-[11px] text-accent-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 scrollbar-premium">
            {ACTIVITY_FEED.map((event, i) => (
              <div
                key={event.id}
                className="flex items-start gap-3 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <ActivityTypeIcon type={event.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-text-primary leading-snug truncate">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ChannelIcon channel={event.channel} />
                    <span className="text-[10px] text-text-tertiary capitalize">
                      {event.channel}
                    </span>
                    <span className="text-[10px] text-text-tertiary">·</span>
                    <span className="text-[10px] text-text-tertiary font-mono">
                      {event.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Thought Terminal */}
        <div className="rounded-xl bg-bg-2 border border-bg-3 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-1.5 items-center">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <h2 className="text-body-reg font-bold text-text-primary flex items-center gap-2">
              <Zap size={14} className="text-accent-primary" />
              AI Thought Terminal
            </h2>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-accent-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              PROCESSING
            </span>
          </div>
          <div className="flex-1 font-mono text-[12px] leading-6 space-y-1.5 bg-bg-1 rounded-lg p-4 max-h-[300px] overflow-y-auto scrollbar-premium">
            {visibleThoughts.length === 0 && (
              <p className="text-text-tertiary animate-pulse">Initializing agent...</p>
            )}
            {visibleThoughts.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "transition-all duration-500",
                  i === 0 ? "opacity-100" : "opacity-60"
                )}
              >
                <span className="text-text-tertiary">[{t.timestamp}] </span>
                <span className="text-accent-primary font-bold">{t.tool}</span>
                <span className="text-text-tertiary"> ← </span>
                <span className="text-blue-300">{t.args}</span>
                <br />
                <span className="text-text-tertiary pl-6">↳ </span>
                <span className="text-green-400">{t.result}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-accent-primary">▸</span>
              <span className="w-2 h-4 bg-accent-primary/70 animate-pulse inline-block rounded-sm" />
            </div>
          </div>
          <p className="text-[10px] text-text-tertiary mt-3 text-center">
            Groq · llama-3.3-70b-versatile · Real-time tool loop
          </p>
        </div>
      </div>

      {/* Channel Metrics */}
      <div className="rounded-xl bg-bg-2 border border-bg-3 p-6">
        <h2 className="text-body-lg font-bold text-text-primary mb-5">Channel Performance (24h)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { channel: "Email (Gmail)", icon: Mail, color: "text-blue-400", bg: "bg-blue-400/10", conversations: channelMetrics?.email?.total_conversations ?? 28, avgTime: "11m 40s" },
            { channel: "WhatsApp (Twilio)", icon: Phone, color: "text-green-400", bg: "bg-green-400/10", conversations: channelMetrics?.whatsapp?.total_conversations ?? 19, avgTime: "6m 12s" },
            { channel: "Web Support", icon: Globe, color: "text-purple-400", bg: "bg-purple-400/10", conversations: channelMetrics?.web?.total_conversations ?? 34, avgTime: "3m 55s" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.channel} className={cn("rounded-xl border border-bg-3 p-5 bg-bg-1 flex items-start gap-4")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
                  <Icon size={20} className={c.color} />
                </div>
                <div>
                  <p className="text-body-sm text-text-tertiary">{c.channel}</p>
                  <p className="text-h3 font-bold text-text-primary">{c.conversations}</p>
                  <p className="text-[11px] text-text-tertiary mt-0.5">Avg: {c.avgTime}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
