"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

/**
 * Premium Avatar component with status indicator and fallback support
 */
export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  fallback, 
  size = 'md', 
  status, 
  className, 
  ...props 
}) => {
  const sizes = {
    sm: 'w-xl h-xl text-[10px]',
    md: 'w-[40px] h-[40px] text-body-sm',
    lg: 'w-2xl h-2xl text-body-reg',
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-text-tertiary',
    busy: 'bg-error',
  };

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)} {...props}>
      <div className={cn(
        'rounded-full overflow-hidden border-2 border-bg-3 bg-bg-4 select-none flex items-center justify-center font-bold text-text-primary shadow-sm transition-transform duration-base hover:scale-105', 
        sizes[size]
      )}>
        {src ? (
          <div className="relative w-full h-full">
             <Image 
              src={src} 
              alt={alt || fallback} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 40px, 60px"
            />
          </div>
        ) : (
          <span className="uppercase tracking-tighter">{fallback.substring(0, 2)}</span>
        )}
      </div>
      
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 border-2 border-bg-2 rounded-full ring-1 ring-black/10',
            size === 'lg' ? 'w-4 h-4' : 'w-3 h-3',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

