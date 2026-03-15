"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface NavProps {
  items: { label: string; href: string; active?: boolean }[];
  className?: string;
}

/**
 * Premium Navigation component for lists of links
 */
export const Nav: React.FC<NavProps> = ({ items, className }) => {
  return (
    <nav className={cn('flex flex-col gap-xs', className)}>
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          className={cn(
            'px-md py-sm rounded-sm text-body-reg font-medium transition-all duration-base',
            item.active
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-3'
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
};

