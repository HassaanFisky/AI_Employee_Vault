"use client";

import React from 'react';
import { Avatar, Button, Input } from '@/components';
import { Bell, Search, Command, Zap, Layers, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title: string;
  user?: { name: string; avatar: string; email: string };
}

/**
 * Premium Topbar component for navigation header, breadcrumbs, and user controls
 */
export const Topbar: React.FC<TopbarProps> = ({ title, user = { name: "System Admin", avatar: "https://github.com/shadcn.png", email: "admin@whoosh.ai" } }) => {
  return (
    <header className="h-28 border-b border-white/5 bg-bg-1/40 backdrop-blur-3xl px-12 flex items-center justify-between sticky top-0 z-30 shadow-4xl relative overflow-hidden group">
      {/* Subtle lighting sweep */}
      <div className="absolute top-0 left-[-100%] w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent group-hover:left-[100%] transition-all duration-[2000ms] pointer-events-none opacity-50" />
      
      <div className="flex items-center gap-16 relative z-10">
        <div className="space-y-1.5 border-l-2 border-accent-primary pl-6 py-1 transition-all duration-base hover:pl-8">
           <div className="flex items-center gap-3">
             <Layers size={14} className="text-accent-primary opacity-60" />
             <p className="text-[10px] text-text-quaternary font-black uppercase tracking-[0.2em] leading-none opacity-60">System Core</p>
           </div>
           <h2 className="text-h2 font-black text-text-primary tracking-tighter uppercase leading-none mt-2 transition-transform duration-base hover:translate-x-1">
             {title}
           </h2>
        </div>
        
        {/* Search Matrix - Enhanced Premium Interaction */}
        <div className="hidden xl:flex items-center gap-4 bg-bg-2/30 border border-white/5 rounded-2xl px-6 py-3 w-[450px] group/search focus-within:border-accent-primary/40 focus-within:bg-bg-1 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all shadow-inner">
          <Search size={16} className="text-text-quaternary group-focus-within/search:text-accent-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search telemetry index..." 
            className="bg-transparent border-none outline-none text-body-reg text-text-primary placeholder:text-text-quaternary/40 w-full font-bold uppercase tracking-wider text-[11px]"
          />
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 opacity-40 group-focus-within/search:opacity-100 transition-opacity">
            <Command size={10} className="text-text-quaternary" />
            <span className="text-[9px] font-black text-text-quaternary uppercase tracking-widest">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10 relative z-10">
        <div className="flex items-center gap-6 pr-12 border-r border-white/5">
          <div className="flex flex-col items-end hidden sm:flex text-right mr-4 border-r border-white/5 pr-8 py-1">
             <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
               <p className="text-[9px] text-text-quaternary font-black uppercase tracking-[0.25em] opacity-60 leading-none">Security Active</p>
             </div>
             <p className="text-body-sm font-black text-text-primary tabular-nums tracking-widest leading-none mt-2 opacity-80 uppercase text-[10px]">
               AES-256 Link
             </p>
          </div>

          <Button variant="ghost" className="relative p-3.5 h-[52px] w-[52px] rounded-2xl hover:bg-white/5 transition-all text-text-quaternary hover:text-text-primary border border-white/5 hover:border-accent-primary/20 shadow-xl bg-bg-2/30">
            <Bell size={20} className="transition-transform duration-base group-hover:rotate-12" />
            <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-bg-1 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
          </Button>
          
          <Button variant="ghost" className="hidden lg:flex p-3.5 h-[52px] w-[52px] rounded-2xl hover:bg-white/5 transition-all text-text-quaternary hover:text-text-primary border border-white/5 hover:border-accent-primary/20 bg-bg-2/30">
            <Activity size={18} />
          </Button>
        </div>
        
        {user && (
          <div className="flex items-center gap-6 group cursor-pointer hover:bg-white/[0.02] pr-4 pl-4 py-2 rounded-2xl transition-all">
            <div className="flex flex-col items-end hidden sm:flex text-right">
              <span className="text-body-reg font-black text-text-primary group-hover:text-accent-primary transition-all tracking-tighter uppercase leading-none">
                {user.name}
              </span>
              <span className="text-[10px] text-text-quaternary font-black tracking-widest uppercase mt-2 opacity-50 ring-1 ring-white/5 px-2 py-0.5 rounded-lg">{user.email}</span>
            </div>
            <div className="relative">
               <div className="absolute inset-0 bg-accent-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
               <Avatar 
                fallback={user.name[0]} 
                src={user.avatar} 
                size="md" 
                status="online"
                className="group-hover:ring-4 group-hover:ring-accent-primary/30 transition-all filter drop-shadow-2xl relative z-10"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
