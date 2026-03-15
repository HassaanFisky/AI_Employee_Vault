"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge";
import {
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Ticket,
  AlertTriangle,
  ExternalLink,
  Clock,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    message:
      "Hi, I requested a refund 7 days ago and I still haven't received it. My order #ACM-9922. Please help ASAP.",
    responses: [
      {
        sender: "AI Agent",
        content:
          "Hello John, I've looked into your refund for order #ACM-9922. It was processed on our end 5 days ago. Bank processing delays can take 5-10 business days. I'll escalate this to our billing team for immediate review.",
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
    message:
      "Our integration is getting 503 errors on the POST /orders endpoint since 4pm. We are losing orders. Urgent.",
    responses: [
      {
        sender: "AI Agent",
        content:
          "Thank you for reporting this. I've identified an elevated error rate on the orders endpoint starting at 16:02 UTC. Our engineering team has been notified and is actively working on a fix. ETA: 30 minutes.",
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
    message:
      "My account is locked. I tried to reset my password but now I cannot login. Help please.",
    responses: [
      {
        sender: "AI Agent",
        content:
          "Hi Ahmed! I've unlocked your account and sent a fresh password reset link to your registered email. Please check your inbox (and spam folder). The link expires in 30 minutes.",
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
    message:
      "Can you add a feature to export all transaction data to CSV? We need this for our accounting team.",
    responses: [
      {
        sender: "AI Agent",
        content:
          "Great idea, Sarah! I've logged this as a feature request (FR-441) and forwarded it to our product team. You'll be notified when it's added to the roadmap. In the meantime, our API supports bulk data retrieval — would that work?",
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2037",
    customer_email: "marketing@corp.com",
    customer_name: "Marketing Dept",
    subject: "Invoice discrepancy — overcharged by $240",
    channel: "email",
    priority: "High",
    status: "Open",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    message:
      "Our invoice #INV-7821 shows a charge of $1,740 but our contract says $1,500. Please review and issue a corrected invoice.",
    responses: [],
  },
  {
    id: "TKT-2036",
    customer_email: "+441234567890",
    customer_name: "Emma Thompson",
    subject: "Cannot update shipping address",
    channel: "whatsapp",
    priority: "Medium",
    status: "In Progress",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    message:
      "I ordered something 30 minutes ago but entered the wrong address. Can you change it before it ships?",
    responses: [
      {
        sender: "AI Agent",
        content:
          "Hi Emma! I've put your order on hold and flagged it for address correction. Please reply with the correct shipping address and I'll update it right away.",
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Channel }) {
  const map: Record<Channel, { icon: React.ElementType; label: string; className: string }> = {
    email: { icon: Mail, label: "Email", className: "bg-blue-400/10 text-blue-400 border border-blue-400/20" },
    whatsapp: { icon: Phone, label: "WhatsApp", className: "bg-green-400/10 text-green-400 border border-green-400/20" },
    web: { icon: Globe, label: "Web", className: "bg-purple-400/10 text-purple-400 border border-purple-400/20" },
  };
  const { icon: Icon, label, className } = map[channel];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold", className)}>
      <Icon size={10} />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, "error" | "warning" | "success"> = {
    High: "error",
    Medium: "warning",
    Low: "success",
  };
  return <Badge variant={map[priority]}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, "error" | "warning" | "success" | "neutral"> = {
    Open: "error",
    "In Progress": "warning",
    Resolved: "success",
    Closed: "neutral",
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

function ExpandedTicket({ ticket }: { ticket: TicketRow }) {
  return (
    <div className="border-t border-bg-3 bg-bg-1/60 px-6 py-5 space-y-4 animate-fade-in">
      {/* Customer message */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-bg-3 flex items-center justify-center">
            <User size={12} className="text-text-tertiary" />
          </div>
          <span className="text-body-sm font-semibold text-text-primary">{ticket.customer_name}</span>
          <span className="text-[10px] text-text-tertiary font-mono">
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="ml-8 bg-bg-2 border border-bg-3 rounded-lg p-3">
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {ticket.message ?? "No message content."}
          </p>
        </div>
      </div>

      {/* Responses */}
      {ticket.responses?.map((r, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <span className="text-[9px] font-bold text-accent-primary">AI</span>
            </div>
            <span className="text-body-sm font-semibold text-accent-primary">{r.sender}</span>
            <span className="text-[10px] text-text-tertiary font-mono">
              {formatDistanceToNow(new Date(r.timestamp), { addSuffix: true })}
            </span>
          </div>
          <div className="ml-8 bg-bg-2 border-l-2 border-accent-primary/50 rounded-r-lg pl-3 pr-3 py-3">
            <p className="text-body-sm text-text-secondary leading-relaxed">{r.content}</p>
          </div>
        </div>
      ))}

      {(!ticket.responses || ticket.responses.length === 0) && (
        <p className="text-body-sm text-text-tertiary italic ml-8">
          No responses yet — AI agent is processing...
        </p>
      )}

      <div className="flex justify-end">
        <Link
          href={`/tickets/${ticket.id}`}
          className="flex items-center gap-1.5 text-body-sm text-accent-primary hover:underline"
        >
          View full ticket <ExternalLink size={12} />
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
  const [sortKey, setSortKey] = useState<keyof TicketRow>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  const handleSort = (key: keyof TicketRow) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
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
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ col }: { col: keyof TicketRow }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="inline ml-1" />
    ) : (
      <ChevronDown size={12} className="inline ml-1" />
    );
  }

  const openCount = tickets.filter((t) => t.status === "Open").length;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-text-primary">Support Tickets</h1>
          <p className="text-body-reg text-text-secondary mt-1">
            {tickets.length} total · {" "}
            <span className="text-red-400 font-semibold">{openCount} open</span>
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-2 border border-bg-3 hover:border-accent-primary/40 text-body-sm text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by ID, customer, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-bg-2 border border-bg-3 rounded-lg text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/60 transition-colors"
          />
        </div>

        {/* Channel filter */}
        <div className="flex items-center gap-1 bg-bg-2 border border-bg-3 rounded-lg p-1">
          {(["all", "email", "whatsapp", "web"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChannelFilter(c)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all",
                channelFilter === c
                  ? "bg-accent-primary text-white shadow-sm"
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              {c === "all" ? "All Channels" : c === "whatsapp" ? "WhatsApp" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 bg-bg-2 border border-bg-3 rounded-lg text-body-sm text-text-primary focus:outline-none focus:border-accent-primary/60 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
          className="px-3 py-2 bg-bg-2 border border-bg-3 rounded-lg text-body-sm text-text-primary focus:outline-none focus:border-accent-primary/60 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <div className="flex items-center gap-1 text-body-sm text-text-tertiary ml-auto">
          <Filter size={14} />
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-bg-2 border border-bg-3 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1.5fr_2fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-bg-3 bg-bg-1/50">
          {[
            { label: "Ticket ID", key: "id" as keyof TicketRow },
            { label: "Customer", key: "customer_name" as keyof TicketRow },
            { label: "Subject", key: "subject" as keyof TicketRow },
            { label: "Channel", key: "channel" as keyof TicketRow },
            { label: "Priority", key: "priority" as keyof TicketRow },
            { label: "Status", key: "status" as keyof TicketRow },
            { label: "Created", key: "created_at" as keyof TicketRow },
          ].map((col) => (
            <button
              key={col.key}
              onClick={() => handleSort(col.key)}
              className="text-left text-[11px] uppercase tracking-widest text-text-tertiary font-bold hover:text-text-primary transition-colors"
            >
              {col.label}
              <SortIcon col={col.key} />
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Ticket size={40} className="text-text-tertiary opacity-40" />
            <p className="text-body-reg text-text-tertiary">No tickets match your filters</p>
            <button
              onClick={() => { setSearch(""); setChannelFilter("all"); setStatusFilter("all"); setPriorityFilter("all"); }}
              className="text-body-sm text-accent-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Rows */}
        {filtered.map((ticket) => {
          const isExpanded = expandedId === ticket.id;
          return (
            <div key={ticket.id} className="border-b border-bg-3 last:border-0">
              <button
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                className="w-full text-left grid grid-cols-[1fr_1.5fr_2fr_auto_auto_auto_auto] gap-4 px-6 py-4 hover:bg-bg-3/50 transition-colors items-center group"
              >
                <span className="font-mono text-body-sm text-accent-primary font-bold">{ticket.id}</span>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-text-primary truncate">{ticket.customer_name}</p>
                  <p className="text-[11px] text-text-tertiary truncate">{ticket.customer_email}</p>
                </div>
                <p className="text-body-sm text-text-secondary truncate">{ticket.subject}</p>
                <ChannelBadge channel={ticket.channel} />
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-tertiary font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
                  ) : (
                    <ChevronDown size={14} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
                  )}
                </div>
              </button>
              {isExpanded && <ExpandedTicket ticket={ticket} />}
            </div>
          );
        })}
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between text-body-sm text-text-tertiary">
        <span>Showing {filtered.length} of {tickets.length} tickets</span>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-bg-2 border border-bg-3 text-text-tertiary disabled:opacity-40 cursor-default"
          >
            Previous
          </button>
          <span className="px-3 py-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-body-sm font-bold">
            1
          </span>
          <button
            disabled
            className="px-4 py-2 rounded-lg bg-bg-2 border border-bg-3 text-text-tertiary disabled:opacity-40 cursor-default"
          >
            Next
          </button>
        </div>
      </div>

      {/* API offline notice */}
      {!loading && (
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary border border-bg-3 rounded-lg px-4 py-2 bg-bg-2 w-fit">
          <AlertTriangle size={12} className="text-warning" />
          Showing demo data. Connect backend at{" "}
          <code className="font-mono text-accent-primary">{API_URL}</code> for live tickets.
        </div>
      )}
    </div>
  );
}
