"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortConfig?: { key: keyof T | string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: keyof T | string) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * Premium Responsive Table component with sorting and clickable rows
 */
export const Table = <T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  sortConfig,
  onSort,
  className,
  emptyMessage = 'No data found'
}: TableProps<T>) => {
  return (
    <div className={cn('w-full bg-bg-2 border border-bg-3 rounded-sm shadow-md overflow-hidden', className)}>
      <div className="overflow-x-auto scrollbar-premium">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-bg-3 border-b border-bg-3">
              {columns.map((column, i) => (
                <th 
                  key={i} 
                  className={cn(
                    "px-md py-md text-body-sm font-semibold text-text-secondary uppercase tracking-wider transition-colors select-none",
                    column.sortable && "cursor-pointer hover:text-text-primary"
                  )}
                  onClick={() => column.sortable && onSort?.(typeof column.accessor === 'string' ? column.accessor : column.header)}
                >
                  <div className="flex items-center gap-sm">
                    {column.header}
                    {column.sortable && (
                      <div className="text-text-tertiary">
                        {sortConfig?.key === (typeof column.accessor === 'string' ? column.accessor : column.header) ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} opacity={0.5} />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-3">
            {data.length > 0 ? (
              data.map((item, i) => (
                <tr 
                  key={item.id} 
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "transition-all duration-fast group h-[64px]",
                    i % 2 === 1 ? "bg-bg-1/20" : "bg-bg-2",
                    onRowClick && "cursor-pointer hover:bg-bg-3"
                  )}
                >
                  {columns.map((column, j) => (
                    <td key={j} className="px-md py-sm text-body-reg text-text-primary">
                      {typeof column.accessor === 'function' 
                        ? column.accessor(item) 
                        : (item[column.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-md py-3xl text-center text-text-tertiary text-body-lg">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

