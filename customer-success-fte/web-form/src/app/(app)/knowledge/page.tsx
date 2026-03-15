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
          "flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-semibold transition-all",
          active
            ? "bg-accent-primary text-white shadow-sm"
            : "bg-bg-2 border border-bg-3 text-text-secondary hover:border-accent-primary/40 hover:text-text-primary"
        )}
      >
        <FileText size={14} />
        All Articles
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", active ? "bg-white/20" : "bg-bg-3")}>
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
        "flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-semibold transition-all",
        active
          ? cn(cfg.bg, cfg.color, "border", cfg.border)
          : "bg-bg-2 border border-bg-3 text-text-secondary hover:border-accent-primary/40 hover:text-text-primary"
      )}
    >
      <Icon size={14} />
      {cfg.label}
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", active ? cfg.bg : "bg-bg-3")}>
        {count}
      </span>
    </button>
  );
}

function ArticleCard({ article }: { article: KBArticle }) {
  const cfg = CATEGORY_CONFIG[article.category];
  const Icon = cfg.icon;
  return (
    <div className="group rounded-xl bg-bg-2 border border-bg-3 hover:border-accent-primary/30 p-5 transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col gap-3">
      {/* Category + Read time */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
            cfg.bg,
            cfg.color,
            cfg.border
          )}
        >
          <Icon size={10} /> {cfg.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
          <Clock size={10} />
          {article.read_time} read
        </span>
      </div>

      {/* Title */}
      <h3 className="text-body-reg font-bold text-text-primary group-hover:text-accent-primary transition-colors leading-snug">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-body-sm text-text-secondary leading-relaxed line-clamp-2">
        {article.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-bg-3 mt-auto">
        <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400" />
            {article.helpful}% helpful
          </span>
          <span>{article.views.toLocaleString()} views</span>
        </div>
        <span className="flex items-center gap-1 text-accent-primary text-body-sm font-semibold group-hover:gap-2 transition-all">
          Read <ExternalLink size={12} />
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
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-text-primary">Knowledge Base</h1>
          <p className="text-body-reg text-text-secondary mt-1">
            {articles.length} articles · AI-powered semantic search
          </p>
        </div>
        <button
          onClick={fetchArticles}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-2 border border-bg-3 hover:border-accent-primary/40 text-body-sm text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Sync Articles"}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search articles by title, keyword, or topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-bg-2 border border-bg-3 rounded-xl text-body-reg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/60 transition-colors shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors text-[11px]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
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

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-text-tertiary">
          {filtered.length === 0
            ? "No articles found"
            : `${filtered.length} article${filtered.length !== 1 ? "s" : ""} found`}
          {search && <span className="text-text-secondary"> for &ldquo;{search}&rdquo;</span>}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
          <AlertTriangle size={11} className="text-warning" />
          Demo data — connect backend for live KB sync
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-bg-2 border border-bg-3 p-5 h-[200px] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BookOpen size={48} className="text-text-tertiary opacity-30" />
          <p className="text-body-reg text-text-tertiary">No articles match your search</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("all"); }}
            className="text-body-sm text-accent-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Stats footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-bg-3">
        {(["account", "billing", "technical", "general"] as Category[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const Icon = cfg.icon;
          return (
            <div key={cat} className={cn("rounded-xl p-4 border flex items-center gap-3", cfg.bg, cfg.border)}>
              <Icon size={20} className={cfg.color} />
              <div>
                <p className="text-h3 font-bold text-text-primary">{counts[cat]}</p>
                <p className="text-[11px] text-text-tertiary">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
