"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Globe, 
  RefreshCw, 
  Ticket, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  User,
  ChevronDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Badge, 
  Button, 
  Input, 
  Table, 
  type Column 
} from "@/components";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "Low" | "Medium" | "High";
type Status = "Open" | "In Progress" | "Resolved" | "Closed";
type Channel = "email" | "whatsapp" | "web";

interface TicketRow {
  id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  channel: Channel;
  priority: Priority;
  status: Status;
  created_at: string;
  message?: string;
  responses?: { sender: string; content: string; timestamp: string }[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: TicketRow[] = [
  {
    id: "TKT-2041",
    customer_email: "john@acme.com",
    customer_name: "John Carter",
    subject: "Billing refund not processed after 7 days",
    channel: "email",
    priority: "High",
    status: "Open",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    message: "Hi, I requested a refund 7 days ago and I still haven't received it. My order #ACM-9922. Please help ASAP.",
    responses: [
      {
        sender: "AI Agent",
        content: "Hello John, I've looked into your refund for order #ACM-9922. It was processed on our end 5 days ago. Bank processing delays can take 5-10 business days. I'll escalate this to our billing team for immediate review.",
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2040",
    customer_email: "dev@startup.io",
    customer_name: "Dev Team",
    subject: "API returning 503 on POST /orders endpoint",
    channel: "web",
    priority: "High",
    status: "In Progress",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    message: "Our integration is getting 503 errors on the POST /orders endpoint since 4pm. We are losing orders. Urgent.",
    responses: [
      {
        sender: "AI Agent",
        content: "Thank you for reporting this. I've identified an elevated error rate on the orders endpoint starting at 16:02 UTC. Our engineering team has been notified and is actively working on a fix. ETA: 30 minutes.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2039",
    customer_email: "+923001234567",
    customer_name: "Ahmed Khan",
    subject: "Account locked after password reset attempt",
    channel: "whatsapp",
    priority: "Medium",
    status: "Resolved",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    message: "My account is locked. I tried to reset my password but now I cannot login. Help please.",
    responses: [
      {
        sender: "AI Agent",
        content: "Hi Ahmed! I've unlocked your account and sent a fresh password reset link to your registered email. Please check your inbox (and spam folder). The link expires in 30 minutes.",
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2038",
    customer_email: "sarah@fintech.com",
    customer_name: "Sarah Williams",
    subject: "Feature request: Bulk export to CSV",
    channel: "email",
    priority: "Low",
    status: "Closed",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    message: "Can you add a feature to export all transaction data to CSV? We need this for our accounting team.",
    responses: [
      {
        sender: "AI Agent",
        content: "Great idea, Sarah! I've logged this as a feature request (FR-441) and forwarded it to our product team. You'll be notified when it's added to the roadmap. In the meantime, our API supports bulk data retrieval — would that work?",
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExpandedTicket({ ticket }: { ticket: TicketRow }) {
  return (
    <div className="bg-bg-1/40 px-10 py-8 space-y-6 animate-fade-in backdrop-blur-sm border-b border-white/5">
      {/* Customer message */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-bg-4 flex items-center justify-center text-text-tertiary">
            <User size={14} />
          </div>
          <span className="text-body-reg font-bold text-text-primary">{ticket.customer_name}</span>
          <span className="text-[10px] text-text-quaternary font-mono uppercase tracking-tight">
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="ml-11 bg-bg-2 border border-white/5 rounded-2xl p-5 shadow-sm">
          <p className="text-body-reg text-text-secondary leading-relaxed">
            {ticket.message ?? "No message content."}
          </p>
        </div>
      </div>

      {/* Responses */}
      {ticket.responses?.map((r, i) => (
        <div key={i} className="max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-black text-accent-primary uppercase">Agent</span>
            </div>
            <span className="text-body-reg font-bold text-accent-primary">{r.sender}</span>
            <span className="text-[10px] text-text-quaternary font-mono uppercase tracking-tight">
              {formatDistanceToNow(new Date(r.timestamp), { addSuffix: true })}
            </span>
          </div>
          <div className="ml-11 bg-bg-2 border-l-2 border-accent-primary/40 rounded-r-2xl pl-5 pr-5 py-5 shadow-sm">
            <p className="text-body-reg text-text-secondary leading-relaxed">{r.content}</p>
          </div>
        </div>
      ))}

      {(!ticket.responses || ticket.responses.length === 0) && (
        <div className="ml-11 flex items-center gap-3 py-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
          <p className="text-body-sm text-text-quaternary font-bold uppercase tracking-widest">
            Agent stream active...
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Link
          href={`/tickets/${ticket.id}`}
          className="flex items-center gap-2 text-body-reg font-bold text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          View Full Session <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>(MOCK_TICKETS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | Channel>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tickets`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? MOCK_TICKETS);
      }
    } catch {
      /* API offline — use mock data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filtered = tickets
    .filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.customer_email.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);
      const matchesChannel = channelFilter === "all" || t.channel === channelFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchesSearch && matchesChannel && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = a[sortConfig.key as keyof TicketRow] ?? "";
      const bVal = b[sortConfig.key as keyof TicketRow] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

  const columns: Column<TicketRow>[] = [
    { 
      header: "Session ID", 
      accessor: (t) => <span className="font-mono text-accent-primary font-bold">{t.id}</span>,
      sortable: true,
      className: "w-[120px]"
    },
    { 
      header: "Customer", 
      accessor: (t) => (
        <div className="min-w-0">
          <p className="text-body-reg font-bold text-text-primary truncate">{t.customer_name}</p>
          <p className="text-[10px] text-text-quaternary font-medium truncate mt-0.5 uppercase tracking-wider">{t.customer_email}</p>
        </div>
      ),
      sortable: true 
    },
    { 
      header: "Subject", 
      accessor: (t) => <p className="text-body-reg text-text-secondary truncate font-medium max-w-[300px]">{t.subject}</p>,
      sortable: true
    },
    { 
      header: "Channel", 
      accessor: (t) => {
        const Icon = t.channel === 'email' ? Mail : t.channel === 'whatsapp' ? Phone : Globe;
        return (
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            t.channel === 'email' ? "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20" :
            t.channel === 'whatsapp' ? "bg-success/10 text-success border-success/20" :
            "bg-blue-400/10 text-blue-400 border-blue-400/20"
          )}>
            <Icon size={10} />
            {t.channel}
          </div>
        );
      },
      sortable: true
    },
    { 
      header: "Priority", 
      accessor: (t) => (
        <Badge variant={t.priority === 'High' ? 'error' : t.priority === 'Medium' ? 'warning' : 'success'} className="font-black uppercase tracking-[0.1em] text-[9px] min-w-[70px]">
          {t.priority}
        </Badge>
      ),
      sortable: true
    },
    { 
      header: "Status", 
      accessor: (t) => (
        <Badge variant={t.status === 'Resolved' ? 'success' : t.status === 'Open' ? 'error' : t.status === 'In Progress' ? 'warning' : 'neutral'} className="font-black uppercase tracking-[0.1em] text-[9px] min-w-[90px]">
          {t.status}
        </Badge>
      ),
      sortable: true
    },
    { 
      header: "Age", 
      accessor: (t) => (
        <span className="text-body-sm text-text-quaternary font-mono uppercase font-bold tracking-tight flex items-center gap-2 whitespace-nowrap">
          <Clock size={12} className="text-accent-primary/50" />
          {formatDistanceToNow(new Date(t.created_at), { addSuffix: false })}
        </span>
      ),
      sortable: true,
      className: "text-right"
    },
    {
      header: "",
      accessor: (t) => (
        <div className={cn("p-1.5 rounded-lg transition-all", expandedId === t.id ? "bg-accent-primary/10 text-accent-primary rotate-180" : "text-text-quaternary group-hover:text-text-primary")}>
          <ChevronDown size={16} />
        </div>
      ),
      className: "w-[40px] text-right"
    }
  ];

  const openCount = tickets.filter((t) => t.status === "Open").length;

  return (
    <div className="p-10 md:p-14 max-w-[1500px] mx-auto space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-3">
          <h1 className="text-h1 tracking-tighter bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent uppercase">
            Queue Intelligence
          </h1>
          <p className="text-body-reg text-text-tertiary tracking-wide font-medium flex items-center gap-3">
            <span className="px-3 py-1 bg-bg-2 border border-white/5 rounded-full text-body-sm font-bold text-text-secondary">{tickets.length} interactions</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span className="text-error font-black uppercase tracking-widest text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
              {openCount} active escalation{openCount !== 1 ? 's' : ''}
            </span>
          </p>
        </div>
        <Button
          variant="neutral"
          onClick={fetchTickets}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-accent-primary/40 text-body-sm font-black uppercase tracking-widest transition-all"
        >
          <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
          {loading ? "Syncing..." : "Sync Vitals"}
        </Button>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search session telemetry, customer profiles, or subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-white/5 bg-bg-2/50 backdrop-blur-md px-6 py-3 text-body-reg h-[54px]"
            icon={<Search size={18} className="text-text-quaternary" />}
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Channel selector */}
          <div className="flex bg-bg-2/80 backdrop-blur-md border border-white/5 rounded-xl p-1.5 shadow-xl">
            {(["all", "email", "whatsapp", "web"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={cn(
                  "px-5 py-2 rounded-lg text-body-sm font-black uppercase tracking-widest transition-all",
                  channelFilter === c
                    ? "bg-accent-primary text-bg-1 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "text-text-tertiary hover:text-text-primary hover:bg-white/5"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="h-10 w-px bg-white/5 hidden sm:block" />

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-5 py-3 bg-bg-2/80 backdrop-blur-md border border-white/5 rounded-xl text-body-sm font-black text-text-secondary uppercase tracking-widest focus:outline-none focus:border-accent-primary/50 transition-all appearance-none cursor-pointer hover:bg-bg-4 h-[54px] min-w-[160px]"
          >
            <option value="all">ALL STATUS</option>
            <option value="Open">OPEN</option>
            <option value="In Progress">ACTIVE</option>
            <option value="Resolved">RESOLVED</option>
            <option value="Closed">CLOSED</option>
          </select>

          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="px-5 py-3 bg-bg-2/80 backdrop-blur-md border border-white/5 rounded-xl text-body-sm font-black text-text-secondary uppercase tracking-widest focus:outline-none focus:border-accent-primary/50 transition-all appearance-none cursor-pointer hover:bg-bg-4 h-[54px] min-w-[160px]"
          >
            <option value="all">ALL PRIORITY</option>
            <option value="High">HIGH</option>
            <option value="Medium">MEDIUM</option>
            <option value="Low">LOW</option>
          </select>

          <div className="flex items-center gap-3 text-body-sm font-black text-text-quaternary uppercase tracking-widest ml-auto bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
            <Filter size={14} className="text-accent-primary" />
            <span>{filtered.length} indexed</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table 
        columns={columns} 
        data={filtered} 
        sortConfig={sortConfig} 
        onSort={handleSort}
        onRowClick={(t) => setExpandedId(expandedId === t.id ? null : t.id)}
        renderExpandedRow={(t) => <ExpandedTicket ticket={t} />}
        expandedRowId={expandedId}
        emptyMessage="No telemetry data matching current filters."
      />

      {/* Footer / Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
        <div className="text-body-sm text-text-tertiary font-bold uppercase tracking-widest flex items-center gap-3">
          <span>Showing index 1 - {filtered.length}</span>
          <span className="w-1 h-1 bg-white/10 rounded-full" />
          <span className="text-text-quaternary">{tickets.length} total nodes recorded</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="neutral" size="sm" disabled className="px-6 rounded-xl border-white/5 text-body-sm font-black uppercase tracking-widest opacity-30">Previous</Button>
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary text-body-sm font-black shadow-inner">1</div>
          <Button variant="neutral" size="sm" disabled className="px-6 rounded-xl border-white/5 text-body-sm font-black uppercase tracking-widest opacity-30">Next</Button>
        </div>
      </div>

      {/* System Status Alert */}
      {!loading && (
        <div className="flex items-center gap-4 text-[10px] text-text-quaternary border border-white/5 rounded-2xl px-6 py-4 bg-bg-2/30 backdrop-blur-sm w-fit animate-fade-in group">
          <AlertTriangle size={14} className="text-warning group-hover:animate-pulse" />
          <p className="font-bold uppercase tracking-[0.2em] leading-none">
            Synthetic session data active · API Endpoint: <code className="font-mono text-accent-primary opacity-80">{API_URL}</code> · Mode: Demo
          </p>
        </div>
      )}
    </div>
  );
}
