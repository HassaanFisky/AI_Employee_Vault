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
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge";

const navItems = [
  { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { label: "Interaction Queue", href: "/tickets", icon: Ticket },
  { label: "Live Support", href: "/", icon: MessageCircle },
  { label: "Intelligence KB", href: "/knowledge", icon: BookOpen },
];

const WhooshLogo = ({ className }: { className?: string }) => (
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

interface SidebarProps {
  className?: string;
}

/**
 * Premium Sidebar component for WHOOSH AI Operations
 */
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-[280px] shrink-0 h-screen fixed left-0 top-0 bg-bg-1 border-r border-white/5 flex flex-col z-40 transition-all duration-base shadow-4xl backdrop-blur-3xl overflow-hidden",
        className
      )}
    >
      {/* Decorative background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-accent-primary/5 blur-[100px] pointer-events-none -z-10 rounded-full" />

      {/* Brand Section */}
      <div className="flex items-center gap-4 px-8 py-10 group cursor-pointer border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-12 h-12 rounded-xl flex items-center justify-center relative shadow-2xl transition-transform duration-slow group-hover:rotate-12 group-hover:scale-110">
           <div className="absolute inset-0 bg-accent-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
           <WhooshLogo className="w-8 h-8 text-accent-primary drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
        </div>
        <div className="relative z-10">
          <p className="text-h2 font-black text-text-primary tracking-tighter leading-none uppercase group-hover:text-accent-primary transition-colors">
            WHOOSH
          </p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-[0.25em] mt-2 font-black opacity-80">
            AI Operations
          </p>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-10 space-y-2 overflow-y-auto scrollbar-premium">
        <p className="text-[10px] uppercase font-black text-text-quaternary px-5 mb-6 tracking-[0.3em] opacity-50">
          Infrastructure nodes
        </p>
        
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-base group relative overflow-hidden",
                isActive
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-lg shadow-accent-primary/5"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-all duration-base",
                isActive ? "bg-accent-primary/20 text-accent-primary" : "bg-white/5 text-text-tertiary group-hover:text-text-primary group-hover:bg-white/10"
              )}>
                <item.icon
                  size={18}
                  className={cn("transition-transform duration-base", isActive ? "scale-110" : "group-hover:scale-110")}
                />
              </div>
              <span className="text-body-reg font-bold uppercase tracking-widest text-[11px] flex-1">
                {item.label}
              </span>
              {item.label === "Interaction Queue" && (
                <Badge variant="error" className="px-2 py-0.5 text-[10px] h-5 min-w-[30px] shadow-glow-error">
                  12
                </Badge>
              )}
              {isActive && <ChevronRight size={14} className="text-accent-primary opacity-50" />}
            </Link>
          );
        })}

        <div className="pt-10 px-5">
           <div className="rounded-2xl bg-bg-2 border border-white/5 p-6 space-y-4 relative overflow-hidden shadow-inner group/status">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover/status:opacity-100 transition-opacity" />
              <div className="flex justify-between items-center relative z-10">
                <span className="text-[9px] uppercase font-black text-text-quaternary tracking-widest">Global Status</span>
                <span className="text-[10px] font-black text-accent-primary tabular-nums">98.4%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-1 rounded-full overflow-hidden border border-white/5 relative z-10">
                <div className="w-[98.4%] h-full bg-accent-primary shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-shimmer" />
              </div>
              <div className="flex items-center gap-2 relative z-10">
                 <ShieldCheck size={12} className="text-accent-primary" />
                 <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">Shield Active</p>
              </div>
           </div>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-6 border-t border-white/5 bg-bg-1/50">
        <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-bg-2/50 border border-white/5 shadow-xl group/node">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            <div>
              <p className="text-[11px] text-text-primary font-black uppercase tracking-tighter">
                NODE_ONLINE
              </p>
              <p className="text-[9px] text-text-quaternary font-bold opacity-60">US-EAST-1</p>
            </div>
          </div>
          <Activity size={14} className="text-text-quaternary opacity-30 group-hover/node:text-accent-primary group-hover/node:opacity-100 transition-all" />
        </div>
        <p className="text-[9px] text-text-quaternary text-center mt-6 tracking-[0.3em] uppercase opacity-40 font-black flex items-center justify-center gap-2">
           <Zap size={10} className="fill-current" /> Lightning Fast · v2.0.0
        </p>
      </div>
    </aside>
  );
};
