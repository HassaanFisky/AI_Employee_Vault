"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  MessageCircle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Live Chat", href: "/", icon: MessageCircle },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
];

const AriaLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 2L2 22H6.5L12 11L17.5 22H22L12 2Z" fill="currentColor" />
    <path d="M12 10L6.5 21H10.5L12 17L13.5 21H17.5L12 10Z" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 h-screen fixed left-0 top-0 bg-bg-2 border-r border-bg-3 flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.1)]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 group cursor-pointer transition-colors hover:bg-white/[0.02]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center relative animate-float">
          <AriaLogo className="w-8 h-8 text-accent-primary group-hover:animate-pulse-glow transition-all duration-300 drop-shadow-md" />
        </div>
        <div>
          <p className="text-body-reg font-bold text-text-primary tracking-tight leading-none group-hover:text-accent-primary transition-colors">
            ARIA
          </p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-widest mt-0.5">
            Command Center
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] uppercase font-bold text-text-tertiary px-3 mb-3 tracking-[0.15em]">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-body-reg transition-all duration-150 group",
                isActive
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-3"
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  "transition-transform group-hover:scale-110",
                  isActive ? "text-accent-primary" : "text-text-tertiary"
                )}
              />
              {item.label}
              {item.label === "Tickets" && (
                <span className="ml-auto text-[10px] bg-error/20 text-error px-1.5 py-0.5 rounded-full font-bold">
                  12
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer status */}
      <div className="px-4 py-4 border-t border-bg-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-1">
          <Activity size={12} className="text-accent-primary animate-pulse" />
          <span className="text-[11px] text-text-tertiary">
            System{" "}
            <span className="text-accent-primary font-semibold">Online</span>
          </span>
        </div>
        <p className="text-[10px] text-text-tertiary text-center mt-2 opacity-50">
          TechCorp FTE · v2.0.0
        </p>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-1">
      <AppSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
