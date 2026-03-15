"use client";

import React, { useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Overlay: React.FC<OverlayProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative w-full max-w-lg bg-surface-2 border border-border rounded-[2.5rem] shadow-2xl animate-widget-in', className)}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          {title && <h3 className="text-xl font-bold text-text-primary">{title}</h3>}
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-xl transition-colors">
            ✕
          </button>
        </div>
        <div className="px-8 py-8">{children}</div>
      </div>
    </div>
  );
};
