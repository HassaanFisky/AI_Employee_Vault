"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Ticket, Users, BarChart3, Settings, 
  HelpCircle, LogOut 
} from 'lucide-react';
import { Badge } from '@/components';

interface SidebarProps {
  title?: string;
  className?: string;
}

/**
 * Premium Sidebar component for navigation and usage metrics
 */
export const Sidebar: React.FC<SidebarProps> = ({ title = "ARIA Support", className }) => {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: true },
    { label: 'Tickets', href: '/tickets', icon: Ticket },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "w-72 border-r border-bg-3 bg-bg-2 h-screen fixed left-0 top-0 p-lg flex flex-col gap-3xl z-40 transition-all duration-base",
      className
    )}>
      {/* Brand */}
      <div className="flex items-center gap-md px-md">
        <div className="w-10 h-10 rounded-sm bg-accent-primary flex items-center justify-center shadow-glow">
          <Ticket size={24} className="text-white" />
        </div>
        <h2 className="text-h2 font-bold text-text-primary tracking-tight">{title}</h2>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-md">
        <p className="text-[10px] uppercase font-bold text-text-tertiary px-md tracking-[0.2em]">Menu</p>
        <nav className="space-y-xs">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center gap-md px-md py-sm rounded-sm font-medium transition-all duration-base",
                item.active 
                  ? "bg-accent-primary/10 text-accent-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-3"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform group-hover:scale-110",
                item.active ? "text-accent-primary" : "text-text-tertiary"
              )} />
              <span className="text-body-reg">{item.label}</span>
              {item.label === 'Tickets' && <Badge variant="error" className="ml-auto px-1.5 py-0 text-[10px] h-4">12</Badge>}
            </a>
          ))}
        </nav>
      </div>

      {/* Footer / Usage */}
      <div className="space-y-xl pt-lg border-t border-bg-3">
        <div className="p-md bg-bg-1 rounded-sm border border-bg-3 space-y-md">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-text-tertiary">
            <span>Usage</span>
            <span className="text-text-secondary">67%</span>
          </div>
          <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-accent-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <p className="text-body-sm text-text-secondary">667 / 1,000 tickets</p>
        </div>

        <div className="space-y-xs">
          <button className="w-full flex items-center gap-md px-md py-sm rounded-sm text-text-secondary hover:text-text-primary hover:bg-bg-3 transition-colors">
            <HelpCircle size={20} className="text-text-tertiary" />
            <span className="text-body-reg">Help Center</span>
          </button>
          <button className="w-full flex items-center gap-md px-md py-sm rounded-sm text-text-secondary hover:text-error hover:bg-error/10 transition-colors">
            <LogOut size={20} className="text-text-tertiary" />
            <span className="text-body-reg">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};


