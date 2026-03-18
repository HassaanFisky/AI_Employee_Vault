"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortConfig?: { key: keyof T | string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: keyof T | string) => void;
  className?: string;
  emptyMessage?: string;
  renderExpandedRow?: (item: T) => React.ReactNode;
  expandedRowId?: string | number | null;
}

/**
 * Premium Responsive Table component with sorting, clickable rows, and expansion
 */
export const Table = <T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  sortConfig,
  onSort,
  className,
  emptyMessage = 'No data found',
  renderExpandedRow,
  expandedRowId
}: TableProps<T>) => {
  return (
    <div className={cn('w-full bg-bg-2 border border-white/5 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md', className)}>
      <div className="overflow-x-auto scrollbar-premium">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              {columns.map((column, i) => (
                <th 
                  key={i} 
                  className={cn(
                    "px-10 py-5 text-h2 uppercase text-text-quaternary font-bold tracking-[0.1em] transition-colors select-none",
                    column.sortable && "cursor-pointer hover:text-text-primary",
                    column.className
                  )}
                  onClick={() => column.sortable && onSort?.(typeof column.accessor === 'string' ? column.accessor : column.header)}
                >
                  <div className="flex items-center gap-sm">
                    {column.header}
                    {column.sortable && (
                      <div className="text-text-tertiary">
                        {sortConfig?.key === (typeof column.accessor === 'string' ? column.accessor : column.header) ? (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-accent-primary" /> : <ChevronDown size={14} className="text-accent-primary" />
                        ) : (
                          <ArrowUpDown size={14} opacity={0.3} />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length > 0 ? (
              data.map((item, i) => {
                const isExpanded = expandedRowId === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr 
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        "transition-all duration-base group",
                        onRowClick && "cursor-pointer hover:bg-white/[0.04]",
                        isExpanded && "bg-white/[0.03]"
                      )}
                    >
                      {columns.map((column, j) => (
                        <td key={j} className={cn("px-10 py-6 text-body-reg font-medium text-text-secondary group-hover:text-text-primary transition-colors", column.className)}>
                          {typeof column.accessor === 'function' 
                            ? column.accessor(item) 
                            : (item[column.accessor] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr className="animate-fade-in">
                        <td colSpan={columns.length} className="p-0">
                          {renderExpandedRow(item)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-10 py-32 text-center text-text-tertiary text-body-lg uppercase font-bold tracking-widest opacity-50">
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

