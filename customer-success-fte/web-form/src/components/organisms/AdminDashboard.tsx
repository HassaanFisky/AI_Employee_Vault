"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Card, Badge, Button, Input, Select, Table, type Column 
} from '@/components';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Ticket, Clock, CheckCircle, Star, Search, Filter, 
  LogOut, ArrowUpRight, ArrowDownRight, MoreHorizontal 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Metric {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
}

interface TicketRecord {
  id: string;
  customer: string;
  created: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  agent: string;
  responseTime: string;
}

/**
 * Premium Admin Dashboard component
 * Provides an overview of support performance and ticket management
 */
export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Mock data for charts
  const chartData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 24 },
    { name: 'Fri', count: 20 },
    { name: 'Sat', count: 8 },
    { name: 'Sun', count: 10 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mock metrics fetching
      setMetrics([
        { title: 'Open Tickets', value: 12, change: 5, icon: Ticket },
        { title: 'Avg Response Time', value: '8m 24s', change: -2, icon: Clock },
        { title: 'SLA Adherence', value: '94%', change: 2, icon: CheckCircle },
        { title: 'Customer Satisfaction', value: '4.6/5.0', change: -0.1, icon: Star },
      ]);

      // Mock tickets fetching
      setTickets([
        { id: 'TKT-1001', customer: 'john@example.com', created: new Date().toISOString(), priority: 'High', status: 'Open', agent: 'AI Agent', responseTime: 'Pending' },
        { id: 'TKT-1002', customer: 'alice@corp.com', created: new Date(Date.now() - 3600000).toISOString(), priority: 'Medium', status: 'In Progress', agent: 'AI Agent', responseTime: '8m' },
        { id: 'TKT-1003', customer: 'bob@dev.io', created: new Date(Date.now() - 7200000).toISOString(), priority: 'Low', status: 'Resolved', agent: 'Human Agent', responseTime: '12m' },
        { id: 'TKT-1004', customer: 'sarah@web.com', created: new Date(Date.now() - 86400000).toISOString(), priority: 'High', status: 'Closed', agent: 'AI Agent', responseTime: '5m' },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTickets = tickets
    .filter(t => 
      (statusFilter === 'All' || t.status === statusFilter) &&
      (t.id.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aValue = a[sortConfig.key as keyof TicketRecord];
      const bValue = b[sortConfig.key as keyof TicketRecord];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const columns: Column<TicketRecord>[] = [
    { header: 'Ticket ID', accessor: 'id', sortable: true },
    { header: 'Customer', accessor: 'customer', sortable: true },
    { 
      header: 'Created', 
      accessor: (t) => formatDistanceToNow(new Date(t.created), { addSuffix: true }),
      sortable: true 
    },
    { 
      header: 'Priority', 
      accessor: (t) => (
        <Badge variant={t.priority === 'High' ? 'error' : t.priority === 'Medium' ? 'warning' : 'success'}>
          {t.priority}
        </Badge>
      ),
      sortable: true
    },
    { 
      header: 'Status', 
      accessor: (t) => (
        <Badge variant={t.status === 'Resolved' ? 'success' : t.status === 'Open' ? 'error' : t.status === 'In Progress' ? 'warning' : 'neutral'}>
          {t.status}
        </Badge>
      ),
      sortable: true
    },
    { header: 'Agent', accessor: 'agent' },
    { header: 'Response Time', accessor: 'responseTime' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg-1 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-xl border-2 border-white/5 animate-pulse" />
          <div className="absolute inset-0 rounded-xl border-t-2 border-accent-primary animate-spin" />
        </div>
        <p className="text-body-sm text-text-quaternary font-bold uppercase tracking-[0.3em] animate-pulse">Syncing Vitals...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-1 p-10 md:p-14 animate-fade-in space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-3">
          <h1 className="text-h1 tracking-tighter bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Operations Pulse</h1>
          <p className="text-body-reg text-text-tertiary tracking-wide font-medium">Real-time telemetry and interaction management</p>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-body-sm text-text-quaternary font-bold uppercase tracking-widest hidden md:block">
            Last Index: Just now
          </p>
          <Button variant="danger" size="sm" className="px-6 py-2.5 rounded-xl text-body-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95" onClick={() => console.log('Logout')}>
            <LogOut size={16} className="mr-2" /> Terminate
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((metric, idx) => (
          <Card 
            key={metric.title} 
            className="group animate-slide-up relative overflow-hidden bg-bg-2 border-white/5 hover:border-white/10 transition-all p-8 rounded-2xl"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-body-sm font-black text-text-quaternary uppercase tracking-widest">{metric.title}</span>
              <div className="p-3 rounded-xl bg-accent-primary/5 text-accent-primary group-hover:bg-accent-primary group-hover:text-bg-1 transition-all shadow-sm">
                <metric.icon size={20} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h2 className="text-h1 text-text-primary font-black tabular-nums tracking-tighter">{metric.value}</h2>
              <div className={cn(
                "flex items-center text-body-sm font-black tabular-nums tracking-widest mb-1 px-2 py-0.5 rounded-full",
                metric.change > 0 ? "text-success bg-success/10" : "text-error bg-error/10"
              )}>
                {metric.change > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                {Math.abs(metric.change)}%
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-3xl">
        <Card className="lg:col-span-2 p-xl">
          <h3 className="text-h3 text-text-primary mb-xl">Tickets Created This Week</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="flex flex-col items-center justify-center text-center p-xl">
          <h3 className="text-h3 text-text-primary mb-md">System Health</h3>
          <div className="relative w-[200px] h-[200px] flex items-center justify-center">
            {/* Simple circular gauge simulation */}
            <div className="absolute inset-0 border-[8px] border-bg-3 rounded-full" />
            <div className="absolute inset-0 border-[8px] border-accent-primary rounded-full border-b-transparent border-l-transparent -rotate-45" />
            <div className="space-y-xs">
              <p className="text-h2 font-bold text-text-primary">99.9%</p>
              <p className="text-body-sm text-text-tertiary">Uptime</p>
            </div>
          </div>
          <p className="mt-xl text-body-reg text-text-secondary">
            All systems operational. Next scheduled maintenance in 12 days.
          </p>
        </Card>
      </div>

      {/* Tickets Table Section */}
      <div className="space-y-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h3 className="text-h3 text-text-primary">Recent Tickets</h3>
          <div className="flex flex-col sm:flex-row items-center gap-md">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-md top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <Input 
                placeholder="Search tickets..." 
                className="pl-[48px]" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-sm">
               <Select 
                options={[
                  { value: 'All', label: 'All Status' },
                  { value: 'Open', label: 'Open' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Resolved', label: 'Resolved' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[140px]"
              />
            </div>
          </div>
        </div>

        <Table 
          columns={columns} 
          data={filteredTickets} 
          sortConfig={sortConfig} 
          onSort={handleSort}
          onRowClick={(t) => window.location.href = `/tickets/${t.id}`}
        />
        
        <div className="flex items-center justify-between text-body-sm text-text-tertiary mt-md">
          <p>Showing 1-{filteredTickets.length} of {tickets.length} tickets</p>
          <div className="flex items-center gap-md">
            <Button variant="ghost" size="sm" disabled>Previous</Button>
            <Button variant="ghost" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
