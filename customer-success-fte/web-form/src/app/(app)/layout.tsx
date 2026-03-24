"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, Topbar } from "@/components";

/**
 * Main Application Layout for authenticated/app experience
 * Integrates Sidebar, Topbar, and standard page spacing
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /**
   * Determine the page title based on the pathname
   */
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Command Center";
    if (pathname === "/tickets") return "Interaction Queue";
    if (pathname.startsWith("/tickets/")) return "Ticket Intelligence";
    if (pathname === "/knowledge") return "Intelligence KB";
    if (pathname === "/settings") return "System Config";
    return "Operations Matrix";
  };

  return (
    <div className="flex min-h-screen bg-bg-1 selection:bg-accent-primary/20 selection:text-accent-primary font-sans">
      {/* Premium Sidebar Navigation */}
      <Sidebar className="hidden lg:flex" />

      {/* Main Content Hub */}
      <div className="flex-1 lg:ml-[280px] min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Decorative ambient lighting behind main content */}
        <div className="absolute top-0 right-0 w-[50%] h-[30%] bg-accent-primary/5 blur-[120px] pointer-events-none -z-10 rounded-full" />
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-accent-secondary/5 blur-[120px] pointer-events-none -z-10 rounded-full" />

        {/* Global Topbar Header */}
        <Topbar title={getPageTitle()} />

        {/* Dynamic Page Content */}
        <main className="flex-1 relative z-10 p-0 md:p-2 lg:p-4">
          <div className="h-full rounded-3xl bg-white/[0.01] border border-white/5 shadow-2xl backdrop-blur-sm overflow-hidden min-h-[calc(100vh-140px)]">
             {children}
          </div>
        </main>

        {/* Enhanced App Footer Metadata */}
        <footer className="h-14 border-t border-white/5 bg-bg-1/40 backdrop-blur-2xl flex items-center justify-between px-10 text-[10px] text-text-quaternary font-black uppercase tracking-[0.2em] relative z-20">
          <div className="flex items-center gap-6">
            <p className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-success opacity-40 shadow-glow-primary animate-pulse" />
               Latency: <span className="text-text-tertiary">38ms Cluster Node</span>
            </p>
            <span className="w-px h-3 bg-white/5" />
            <p>Region: <span className="text-text-tertiary">US-EAST-1</span></p>
          </div>
          <p className="hover:text-accent-primary cursor-pointer transition-colors opacity-60">© WHOOSH OPERATIONS · 4026.88.2</p>
          <div className="flex items-center gap-6">
            <p>Security Level: <span className="text-accent-primary shadow-glow-primary">Encrypted</span></p>
          </div>
        </footer>
      </div>
    </div>
  );
}
