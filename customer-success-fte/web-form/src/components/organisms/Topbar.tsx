"use client";

import React from 'react';
import { Avatar, Button } from '@/components';
import { Bell, Search, Command } from 'lucide-react';

interface TopbarProps {
  title: string;
  user?: { name: string; avatar: string; email: string };
}

/**
 * Premium Topbar component with search, notifications, and user profile
 */
export const Topbar: React.FC<TopbarProps> = ({ title, user }) => {
  return (
    <header className="h-20 border-b border-bg-3 bg-bg-2/80 backdrop-blur-xl px-xl flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-xl">
        <h1 className="text-h3 font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        
        {/* Search Bar Placeholder */}
        <div className="hidden lg:flex items-center gap-sm bg-bg-1 border border-bg-3 rounded-sm px-md py-xs w-80 group focus-within:ring-2 focus-within:ring-accent-primary/20 transition-all">
          <Search size={16} className="text-text-tertiary group-focus-within:text-accent-primary" />
          <input 
            type="text" 
            placeholder="Search tickets, customers..." 
            className="bg-transparent border-none outline-none text-body-sm text-text-primary placeholder:text-text-tertiary w-full"
          />
          <div className="flex items-center gap-[2px] opacity-50">
            <Command size={12} className="text-text-tertiary" />
            <span className="text-[10px] font-bold text-text-tertiary">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-md pr-lg border-r border-bg-3">
          <Button variant="ghost" size="sm" className="relative p-2 h-auto rounded-full hover:bg-bg-3">
            <Bell size={20} className="text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-bg-2" />
          </Button>
        </div>

        {user && (
          <div className="flex items-center gap-md pl-4 group cursor-pointer">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-body-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                {user.name}
              </span>
              <span className="text-[10px] text-text-tertiary">{user.email}</span>
            </div>
            <Avatar 
              fallback={user.name[0]} 
              src={user.avatar} 
              size="md" 
              status="online"
              className="group-hover:ring-2 group-hover:ring-accent-primary/20 transition-all"
            />
          </div>
        )}
      </div>
    </header>
  );
};

