"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Clock 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import { 
  Card, 
  Badge, 
  Button, 
  Avatar 
} from "@/components";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  content?: string;
  timestamp: string;
}

// ─── Constants & Mock Data ────────────────────────────────────────────────────

const CHART_DATA = [
  { time: "00:00", throughput: 2, resolved: 1 },
  { time: "04:00", throughput: 4, resolved: 3 },
  { time: "08:00", throughput: 18, resolved: 14 },
  { time: "10:00", throughput: 31, resolved: 25 },
  { time: "12:00", throughput: 24, resolved: 20 },
  { time: "14:00", throughput: 38, resolved: 29 },
  { time: "16:00", throughput: 27, resolved: 22 },
  { time: "18:00", throughput: 15, resolved: 13 },
  { time: "20:00", throughput: 9, resolved: 8 },
  { time: "23:00", throughput: 5, resolved: 4 },
];

const AGENT_LOGS = [
  { tool: "[TOOL]", content: "create_ticket(channel:whatsapp) → TKT-a3f8", timestamp: "just now" },
  { tool: "[TOOL]", content: "search_kb(\"password reset\") → 3 results", timestamp: "2s ago" },
  { tool: "[SEND]", content: "reply(channel:email) → delivered 1.2s", timestamp: "4s ago" },
  { tool: "[TOOL]", content: "get_history(cust:e7b2) → 12 interactions", timestamp: "6s ago" },
  { tool: "[ESCALATE]", content: "to_human(reason:pricing) → queued", timestamp: "8s ago" },
  { tool: "[SEND]", content: "reply(channel:whatsapp) → delivered 0.8s", timestamp: "10s ago" },
];

const LIVE_FEED: ActivityEvent[] = [
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

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = service.icon;
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-bg-2/30 border border-white/5 hover:border-accent-primary/20 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner relative z-10",
        service.status === "online" ? "bg-success/10 text-success border border-success/20" : 
        service.status === "degraded" ? "bg-warning/10 text-warning border border-warning/20" : 
        "bg-error/10 text-error border border-error/20"
      )}>
        <Icon size={18} className={cn(service.status === "online" ? "group-hover:animate-pulse" : "")} />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-body-reg font-black text-text-primary truncate uppercase tracking-tight">
          {service.name}
        </p>
        {service.latency && (
          <p className="text-[10px] text-text-quaternary font-mono font-bold tracking-widest">{service.latency}</p>
        )}
      </div>
      <div className={cn(
        "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] relative z-10",
        service.status === "online" ? "bg-success shadow-success/40" : 
        service.status === "degraded" ? "bg-warning shadow-warning/40" : 
        "bg-error shadow-error/40"
      )} />
    </div>
  );
}

function ActivityTypeIcon({ type }: { type: ActivityEvent["type"] }) {
  const classes = "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-inner border border-white/5";
  if (type === "new_ticket")
    return (
      <span className={cn(classes, "bg-blue-500/10")}>
        <Ticket size={14} className="text-blue-400" />
      </span>
    );
  if (type === "escalation")
    return (
      <span className={cn(classes, "bg-warning/10")}>
        <AlertTriangle size={14} className="text-warning" />
      </span>
    );
  if (type === "resolution")
    return (
      <span className={cn(classes, "bg-success/10")}>
        <CheckCircle size={14} className="text-success" />
      </span>
    );
  return (
    <span className={cn(classes, "bg-accent-primary/10")}>
      <MessageSquare size={14} className="text-accent-primary" />
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("—");
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [visibleThoughts, setVisibleThoughts] = useState<ThoughtEntry[]>([]);
  const [channelMetrics, setChannelMetrics] = useState<Record<string, { total_conversations: number }> | null>(null);

  const services: ServiceStatus[] = [
    { name: "Groq AI Node", status: apiOnline ? "online" : apiOnline === false ? "offline" : "degraded", latency: "94ms telemetry", icon: Cpu },
    { name: "Neon PostgreSQL", status: apiOnline ? "online" : "degraded", latency: "12ms telemetry", icon: Database },
    { name: "Confluent Kafka", status: "online", latency: "8ms telemetry", icon: Server },
    { name: "Twilio WhatsApp", status: "online", latency: "210ms telemetry", icon: Phone },
    { name: "Gmail Matrix", status: apiOnline ? "online" : "degraded", latency: "130ms telemetry", icon: Mail },
  ];

  const metrics: MetricCard[] = [
    { label: "Active Nodes", value: 12, change: 8, icon: Ticket, accentColor: "text-blue-400" },
    { label: "AI Latency", value: "8m 24s", change: -12, icon: Clock, accentColor: "text-purple-400" },
    { label: "Resolved Nodes", value: 47, change: 23, icon: CheckCircle, accentColor: "text-accent-primary" },
    { label: "Throughput", value: channelMetrics ? Object.values(channelMetrics).reduce((s, c) => s + c.total_conversations, 0) : 6, change: 15, icon: Activity, accentColor: "text-warning" },
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
    } catch { /* fallback to defaults */ }
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

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleThoughts((prev) => {
        const next = AGENT_LOGS[thoughtIdx % AGENT_LOGS.length];
        const updated = [...prev, next].slice(-6); 
        setThoughtIdx((i) => i + 1);
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [thoughtIdx]);

  return (
    <div className="p-10 md:p-14 max-w-[1500px] mx-auto space-y-12 relative animate-fade-in">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-3">
          <h1 className="text-h1 tracking-tighter bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent uppercase">
            Command Center
          </h1>
          <p className="text-body-reg text-text-tertiary tracking-wide font-black uppercase flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            AI Operations · Lightning Fast
          </p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] text-text-quaternary font-black uppercase tracking-[0.2em]">
            Telemetry: <span className="text-text-tertiary">{lastUpdated}</span>
          </span>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => { fetchHealth(); fetchChannelMetrics(); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-white/5 bg-white/5 hover:bg-white/[0.08] text-body-sm font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw size={14} className="text-text-quaternary" />
            Sync
          </Button>
          <div
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-xl text-body-sm font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border",
              apiOnline === null ? "bg-warning/10 text-warning border-warning/20" : 
              apiOnline ? "bg-success/10 text-success border-success/20 shadow-success/10" : 
              "bg-error/10 text-error border-error/20"
            )}
          >
            {apiOnline === null ? (
              <span className="flex items-center gap-2 animate-pulse">Scanning Vitals...</span>
            ) : apiOnline ? (
              <><CheckCircle size={14} /> Vitals Online</>
            ) : (
              <><XCircle size={14} /> Link Severed</>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          const positive = m.change > 0;
          return (
            <Card
              key={m.label}
              className="group animate-slide-up bg-bg-2 border-white/5 hover:border-white/10 transition-all p-10 rounded-2xl relative overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none rounded-bl-full" />
              <div className="flex items-start justify-between mb-10 relative z-10">
                <span className="text-[11px] font-black text-text-quaternary uppercase tracking-[0.2em]">
                  {m.label}
                </span>
                <div className={cn("p-3 rounded-xl bg-white/[0.03] border border-white/5 group-hover:bg-accent-primary group-hover:text-bg-1 transition-all duration-slow shadow-lg", m.accentColor)}>
                  <Icon size={20} />
                </div>
              </div>
              <h2 className="text-h1 text-text-primary tabular-nums tracking-tighter relative z-10 font-extrabold">
                {m.value}
              </h2>
              <div className={cn(
                "flex items-center gap-2 mt-5 text-body-sm font-black uppercase tracking-widest relative z-10",
                positive ? "text-success" : "text-error"
              )}>
                {positive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                <span>{Math.abs(m.change)}% Growth</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Throughput Matrix */}
        <Card className="lg:col-span-2 p-10 relative overflow-hidden bg-bg-2 border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h2 className="text-h2 uppercase text-text-primary font-black tracking-tighter">Throughput Matrix</h2>
              <p className="text-body-sm text-text-quaternary mt-1 font-bold uppercase tracking-widest leading-none">Global interaction telemetry · 24h</p>
            </div>
            <div className="flex items-center gap-8 text-body-sm font-black uppercase tracking-widest">
              <span className="flex items-center gap-3">
                <span className="w-2 h-2 bg-accent-primary rounded-full shadow-glow" />
                <span className="text-text-secondary">Created</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="w-2 h-2 bg-accent-secondary rounded-full shadow-glow" />
                <span className="text-text-secondary">Resolved</span>
              </span>
            </div>
          </div>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 700 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "16px",
                    color: "#F1F5F9",
                    fontSize: "12px",
                    fontWeight: "bold",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  }}
                />
                <Area type="monotone" dataKey="throughput" stroke="#10B981" strokeWidth={3} fill="url(#gThroughput)" animationDuration={2000} />
                <Area type="monotone" dataKey="resolved" stroke="#6366F1" strokeWidth={3} fill="url(#gResolved)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* System Vitals Panel */}
        <Card className="p-10 flex flex-col bg-bg-2 border-white/5">
          <div className="mb-10">
            <h2 className="text-h2 uppercase text-text-primary font-black tracking-tighter">Infrastructure Nodes</h2>
            <p className="text-body-sm text-text-quaternary mt-1 font-bold uppercase tracking-widest leading-none">Internal systems health</p>
          </div>
          <div className="space-y-4">
            {services.map((s) => (
              <ServiceCard key={s.name} service={s} />
            ))}
          </div>
        </Card>
      </div>

      {/* Intelligence Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Event Stream */}
        <Card className="p-10 flex flex-col bg-bg-2 border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h2 className="text-h2 uppercase text-text-primary font-black tracking-tighter">Intelligence Feed</h2>
              <p className="text-body-sm text-text-quaternary font-bold uppercase tracking-widest leading-none">Real-time operation events</p>
            </div>
            <Badge variant="success" className="px-5 py-2 font-black tracking-[0.2em] shadow-glow-primary">ACTIVE STREAM</Badge>
          </div>
          <div className="space-y-6 max-h-[380px] overflow-y-auto pr-4 scrollbar-premium">
            {LIVE_FEED.map((event, i) => (
              <div
                key={event.id}
                className="flex items-start gap-5 transition-all duration-base hover:translate-x-2 cursor-pointer group/item py-2"
              >
                <ActivityTypeIcon type={event.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-reg text-text-secondary font-bold leading-tight group-hover/item:text-text-primary transition-colors">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-2 text-[10px] text-text-quaternary font-black uppercase tracking-widest">
                      {event.channel === 'email' ? <Mail size={12} /> : event.channel === 'whatsapp' ? <Phone size={12} /> : <Globe size={12} />}
                      {event.channel}
                    </span>
                    <span className="text-text-quaternary/30">|</span>
                    <span className="text-[10px] text-text-quaternary font-mono font-bold tracking-tighter">
                      {event.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Neural Network Output (Agent Stream) */}
        <div className="rounded-3xl bg-[#0B1120] border border-white/10 shadow-3xl p-10 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent opacity-50" />
          <div className="flex items-center gap-5 mb-10">
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-error/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
              <span className="w-3 h-3 rounded-full bg-warning/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
              <span className="w-3 h-3 rounded-full bg-success/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            </div>
            <h2 className="text-h2 uppercase text-text-primary font-black tracking-tighter flex items-center gap-3">
              <Zap size={16} className="text-accent-primary animate-pulse" />
              Agent Core Matrix
            </h2>
            <div className="ml-auto px-4 py-1.5 bg-accent-primary/5 border border-accent-primary/20 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-[9px] text-accent-primary font-black uppercase tracking-[0.2em]">Executing</span>
            </div>
          </div>
          <div className="flex-1 font-mono text-body-mono leading-relaxed space-y-3 bg-bg-1/40 rounded-2xl p-8 border border-white/5 min-h-[300px] shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-1/20 pointer-events-none" />
            {visibleThoughts.map((t, i) => {
              const opacity = i === visibleThoughts.length - 1 ? "opacity-100" : 
                             i === visibleThoughts.length - 2 ? "opacity-80" :
                             i === visibleThoughts.length - 3 ? "opacity-60" :
                             i === visibleThoughts.length - 4 ? "opacity-40" : "opacity-20";
              return (
                <div key={i} className={cn("transition-all duration-slow animate-slide-up flex gap-3", opacity)}>
                  <span className="text-accent-primary font-black whitespace-nowrap">{t.tool}</span>
                  <span className="text-text-secondary font-bold">{t.content}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-accent-primary animate-pulse font-black text-lg">█</span>
            </div>
          </div>
          <p className="text-[10px] text-text-quaternary mt-6 text-center tracking-widest font-black uppercase opacity-60">
            Llama-3.3-70b-versatile-core · Interaction Loop ACTIVE
          </p>
        </div>
      </div>

      {/* Channel Distribution */}
      <Card className="p-10 bg-bg-2 border-white/5 relative overflow-hidden">
        <h2 className="text-h2 uppercase text-text-primary font-black tracking-tighter mb-10">Channel Distribution Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            { channel: "Email Matrix", icon: Mail, color: "text-blue-400", border: "border-l-accent-secondary", conversations: channelMetrics?.email?.total_conversations ?? 28, avgTime: "11m 40s" },
            { channel: "WhatsApp Grid", icon: Phone, color: "text-success", border: "border-l-success", conversations: channelMetrics?.whatsapp?.total_conversations ?? 19, avgTime: "6m 12s" },
            { channel: "Web Interface", icon: Globe, color: "text-accent-secondary", border: "border-l-[#6366F1]", conversations: channelMetrics?.web?.total_conversations ?? 34, avgTime: "3m 55s" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.channel} className={cn("group rounded-2xl border border-white/5 border-l-4 p-8 bg-bg-1/50 transition-all duration-base hover:bg-bg-4 hover:-translate-y-2 hover:shadow-2xl", c.border)}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5 transition-transform duration-slow group-hover:rotate-12">
                    <Icon size={22} className={c.color} />
                  </div>
                  <p className="text-body-reg font-black text-text-primary tracking-tight uppercase">{c.channel}</p>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/5 pt-6">
                  <div>
                    <p className="text-[10px] text-text-quaternary font-black uppercase tracking-[0.2em] mb-1">Sessions</p>
                    <p className="text-h2 text-text-primary tabular-nums font-extrabold">{c.conversations}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-quaternary font-black uppercase tracking-[0.2em] mb-1">Avg Resolution</p>
                    <p className="text-body-reg text-text-secondary font-black">{c.avgTime}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
