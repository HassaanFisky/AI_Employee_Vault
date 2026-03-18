"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  BookOpen,
  CreditCard,
  Wrench,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Star,
  Clock,
  FileText,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "account" | "billing" | "technical" | "general";

interface KBArticle {
  id: string;
  title: string;
  summary: string;
  category: Category;
  views: number;
  helpful: number;
  updated_at: string;
  read_time: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ARTICLES: KBArticle[] = [
  {
    id: "KB-001",
    title: "How to reset your account password",
    summary:
      "Step-by-step guide to securely reset your password using email verification or SMS OTP. Covers 2FA recovery scenarios.",
    category: "account",
    views: 4821,
    helpful: 97,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "2 min",
  },
  {
    id: "KB-002",
    title: "Understanding your monthly invoice",
    summary:
      "Detailed breakdown of all invoice line items, billing cycles, proration rules, and how to download PDF receipts.",
    category: "billing",
    views: 3214,
    helpful: 94,
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "4 min",
  },
  {
    id: "KB-003",
    title: "API rate limits and best practices",
    summary:
      "All API endpoints are rate-limited. This article explains the limits per plan, headers to watch, and retry strategies.",
    category: "technical",
    views: 2887,
    helpful: 91,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "6 min",
  },
  {
    id: "KB-004",
    title: "Requesting a refund — eligibility and timeline",
    summary:
      "Refund policy overview, eligibility criteria for different plan types, and typical processing timelines (3-10 business days).",
    category: "billing",
    views: 5193,
    helpful: 88,
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "3 min",
  },
  {
    id: "KB-005",
    title: "Setting up two-factor authentication (2FA)",
    summary:
      "Enable TOTP-based 2FA using Google Authenticator, Authy, or hardware keys. Includes recovery code generation guide.",
    category: "account",
    views: 1924,
    helpful: 99,
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "5 min",
  },
  {
    id: "KB-006",
    title: "Integrating webhooks for real-time events",
    summary:
      "How to configure webhook endpoints, verify HMAC signatures, handle retries, and test locally with our sandbox environment.",
    category: "technical",
    views: 1456,
    helpful: 96,
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "8 min",
  },
  {
    id: "KB-007",
    title: "Getting started — first 30 minutes",
    summary:
      "Quick-start guide covering account setup, first API call, dashboard overview, and inviting team members.",
    category: "general",
    views: 7820,
    helpful: 98,
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "10 min",
  },
  {
    id: "KB-008",
    title: "Upgrading or downgrading your plan",
    summary:
      "How plan changes work mid-cycle, proration calculations, feature availability changes, and how to avoid service interruptions.",
    category: "billing",
    views: 2341,
    helpful: 92,
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "3 min",
  },
  {
    id: "KB-009",
    title: "Troubleshooting 503 Service Unavailable errors",
    summary:
      "Root causes of 503 errors on our platform: rate limiting, server overload, maintenance windows. Includes status page link.",
    category: "technical",
    views: 3102,
    helpful: 82,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "4 min",
  },
  {
    id: "KB-010",
    title: "Contacting support — all channels explained",
    summary:
      "When to use Email vs WhatsApp vs Web Chat. Response SLAs by plan tier, escalation paths, and emergency contact procedures.",
    category: "general",
    views: 4509,
    helpful: 90,
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "2 min",
  },
  {
    id: "KB-011",
    title: "Managing team members and permissions",
    summary:
      "Invite users, assign roles (Admin, Editor, Viewer), revoke access, and use SSO for enterprise single sign-on.",
    category: "account",
    views: 1680,
    helpful: 95,
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "5 min",
  },
  {
    id: "KB-012",
    title: "Bulk export and data portability",
    summary:
      "How to export your data as CSV, JSON, or via API. Includes GDPR data portability request procedures.",
    category: "technical",
    views: 987,
    helpful: 89,
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    read_time: "6 min",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  account: { label: "Account", icon: HelpCircle, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  billing: { label: "Billing", icon: CreditCard, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  technical: { label: "Technical", icon: Wrench, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  general: { label: "General", icon: BookOpen, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
};

function CategoryPill({
  category,
  active,
  count,
  onClick,
}: {
  category: Category | "all";
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  if (category === "all") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-5 py-2.5 rounded-xl text-body-sm font-bold uppercase tracking-widest transition-all",
          active
            ? "bg-accent-primary text-bg-1 shadow-lg shadow-accent-primary/20"
            : "bg-bg-2 border border-white/5 text-text-quaternary hover:border-accent-primary/50 hover:text-text-secondary"
        )}
      >
        <FileText size={14} />
        All Articles
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold ml-1", active ? "bg-bg-1/20 text-bg-1" : "bg-white/5 text-text-tertiary")}>
          {count}
        </span>
      </button>
    );
  }

  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-5 py-2.5 rounded-xl text-body-sm font-bold uppercase tracking-widest transition-all",
        active
          ? cn(cfg.bg, cfg.color, "border", cfg.border, "shadow-lg shadow-current/5")
          : "bg-bg-2 border border-white/5 text-text-quaternary hover:border-accent-primary/50 hover:text-text-secondary"
      )}
    >
      <Icon size={14} />
      {cfg.label}
      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold ml-1", active ? "bg-current/20" : "bg-white/5 text-text-tertiary")}>
        {count}
      </span>
    </button>
  );
}

function ArticleCard({ article }: { article: KBArticle }) {
  const cfg = CATEGORY_CONFIG[article.category];
  const Icon = cfg.icon;
  return (
    <div className="group rounded-2xl bg-bg-2 border border-white/5 hover:border-white/10 p-6 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-accent-primary/5 flex flex-col gap-4 relative overflow-hidden animate-slide-up">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-bl-full" />
      
      {/* Category + Read time */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
            cfg.bg,
            cfg.color,
            cfg.border
          )}
        >
          <Icon size={10} /> {cfg.label}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-text-quaternary font-bold uppercase tracking-tighter">
          <Clock size={10} className="text-accent-primary/50" />
          {article.read_time}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-h3 text-text-primary group-hover:text-accent-primary transition-colors leading-tight font-bold">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-body-reg text-text-secondary leading-relaxed line-clamp-2 font-medium">
        {article.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-4 text-[10px] text-text-quaternary font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Star size={10} className="text-warning fill-warning" />
            {article.helpful}%
          </span>
          <span>{article.views.toLocaleString()} VIEWS</span>
        </div>
        <span className="flex items-center gap-2 text-accent-primary text-body-reg font-black uppercase tracking-widest group-hover:gap-3 transition-all">
          Read <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KBArticle[]>(MOCK_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/knowledge`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? MOCK_ARTICLES);
      }
    } catch {
      /* API offline — use mock data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filtered = articles.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q);
    const matchesCategory = activeCategory === "all" || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const counts: Record<Category | "all", number> = {
    all: articles.length,
    account: articles.filter((a) => a.category === "account").length,
    billing: articles.filter((a) => a.category === "billing").length,
    technical: articles.filter((a) => a.category === "technical").length,
    general: articles.filter((a) => a.category === "general").length,
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-h1 tracking-tighter bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
            Knowledge
          </h1>
          <p className="text-body-reg text-text-tertiary mt-2 tracking-wide font-medium">
            {articles.length} verified documents · AI Semantic Search Enabled
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchArticles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-accent-primary/40 hover:bg-white/[0.08] text-body-sm font-semibold text-text-secondary hover:text-text-primary transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : "text-text-quaternary"} />
            {loading ? "Syncing..." : "Refresh Index"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl group">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-quaternary group-focus-within:text-accent-primary transition-colors" />
        <input
          type="text"
          placeholder="Describe what you need to find..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-16 py-4 bg-bg-2 border border-white/5 rounded-2xl text-body-reg text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-accent-primary/50 focus:bg-white/[0.02] transition-all shadow-xl shadow-black/20"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-text-quaternary hover:text-text-primary font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-4">
        <CategoryPill
          category="all"
          active={activeCategory === "all"}
          count={counts.all}
          onClick={() => setActiveCategory("all")}
        />
        {(["account", "billing", "technical", "general"] as Category[]).map((cat) => (
          <CategoryPill
            key={cat}
            category={cat}
            active={activeCategory === cat}
            count={counts[cat]}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/[0.02] border border-white/5 h-[240px] animate-shimmer"
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
          <div className="w-16 h-16 rounded-full bg-bg-4 flex items-center justify-center">
            <BookOpen size={32} className="text-text-quaternary" />
          </div>
          <div className="text-center group">
            <p className="text-body-reg font-bold text-text-tertiary uppercase tracking-[0.2em]">Index Mismatch</p>
            <p className="text-body-sm text-text-quaternary mt-2">Zero articles match your current semantic filter.</p>
          </div>
          <button
            onClick={() => { setSearch(""); setActiveCategory("all"); }}
            className="text-body-reg font-black text-accent-primary hover:text-accent-primary/80 uppercase tracking-widest pt-2 transition-all"
          >
            Reset Intelligence
          </button>
        </div>
      )}

      {/* Stats footer (Internal View) */}
      <h2 className="text-h2 uppercase text-text-quaternary font-bold tracking-[0.2em] pt-10 border-t border-white/5">System Clusters</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {(["account", "billing", "technical", "general"] as Category[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const Icon = cfg.icon;
          return (
            <div key={cat} className={cn("rounded-2xl p-6 border flex items-center gap-5 transition-all hover:scale-[1.02]", cfg.bg, cfg.border)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10">
                <Icon size={24} className={cfg.color} />
              </div>
              <div>
                <p className="text-h3 font-black text-text-primary tabular-nums tracking-tighter">{counts[cat]}</p>
                <p className="text-body-sm font-bold text-text-quaternary uppercase tracking-widest mt-0.5">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
