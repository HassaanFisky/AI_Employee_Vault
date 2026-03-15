"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Textarea, Toast } from '@/components';
import { Bot, User, Clock, Calendar, Tag, ShieldAlert, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender: 'ai' | 'human' | 'user';
  name: string;
  content: string;
  timestamp: string;
}

interface TicketData {
  id: string;
  customer_name: string;
  customer_email: string;
  category: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  created_at: string;
  responses: Message[];
}

interface TicketViewerProps {
  ticketId: string;
}

/**
 * Premium Ticket Viewer component
 * Shows ticket details, conversation timeline, and evaluation survey
 */
export const TicketViewer: React.FC<TicketViewerProps> = ({ ticketId }) => {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTicket();
    setupWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Ticket not found');
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/tickets/${ticketId}`);
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'new_response') {
        setTicket(prev => prev ? ({
          ...prev,
          responses: [...prev.responses, data]
        }) : null);
        setToastMessage('New response from support');
        setShowToast(true);
        
        // Smooth scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (type === 'status_changed') {
        setTicket(prev => prev ? ({ ...prev, status: data.status }) : null);
        setToastMessage(`Ticket marked as ${data.status}`);
        setShowToast(true);
      }
    };

    return () => ws.close();
  };

  const submitSatisfaction = async () => {
    if (npsScore === null) return;
    try {
      const response = await fetch(`/api/tickets/${ticketId}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nps_score: npsScore, feedback_text: feedback }),
      });
      if (response.ok) {
        setSurveySubmitted(true);
        setToastMessage('Thank you for your feedback!');
        setShowToast(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3xl h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center p-3xl">
        <h2 className="text-h2 text-text-primary mb-md">Ticket Not Found</h2>
        <p className="text-text-secondary">Please check the ID and try again.</p>
      </div>
    );
  }

  const statusVariants: Record<string, 'neutral' | 'warning' | 'error' | 'success' | 'info'> = {
    'Open': 'error',
    'In Progress': 'warning',
    'Resolved': 'success',
    'Closed': 'neutral'
  };

  const priorityVariants: Record<string, 'success' | 'warning' | 'error'> = {
    'Low': 'success',
    'Medium': 'warning',
    'High': 'error'
  };

  return (
    <div className="max-w-[1000px] mx-auto p-lg animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div className="space-y-xs">
          <p className="font-mono text-body-sm text-text-tertiary">{ticket.id}</p>
          <h1 className="text-h2 text-text-primary">{ticket.subject}</h1>
        </div>
        <div className="flex items-center gap-sm">
          <Badge variant={statusVariants[ticket.status]}>{ticket.status}</Badge>
          <Badge variant={priorityVariants[ticket.priority]}>{ticket.priority} Priority</Badge>
          <div className="flex items-center gap-xs text-text-tertiary text-body-sm ml-sm">
            <Clock size={14} />
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Ticket Info Card */}
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-3xl">
        <div className="space-y-sm">
          <div className="space-y-xs">
            <label className="text-body-sm font-medium text-text-tertiary">Customer</label>
            <p className="text-body-reg text-text-primary">{ticket.customer_name}</p>
            <p className="text-body-sm text-text-secondary">{ticket.customer_email}</p>
          </div>
          <div className="space-y-xs pt-sm">
            <label className="text-body-sm font-medium text-text-tertiary flex items-center gap-xs">
              <Tag size={14} /> Category
            </label>
            <p className="text-body-reg text-text-primary">{ticket.category}</p>
          </div>
        </div>
        <div className="space-y-sm">
          <div className="space-y-xs">
            <label className="text-body-sm font-medium text-text-tertiary">Original Message</label>
            <p className="text-body-reg text-text-secondary line-clamp-4 italic">&quot;{ticket.message}&quot;</p>
          </div>
        </div>
      </Card>

      {/* Messages Timeline */}
      <div className="space-y-2xl">
        <h3 className="text-h3 text-text-primary border-b border-bg-3 pb-sm">Response History</h3>
        
        <div className="space-y-lg relative">
          <div className="absolute left-[20px] top-0 bottom-0 w-[1px] bg-bg-3 z-0" />
          
          {ticket.responses.map((msg, idx) => (
            <div 
              key={msg.id} 
              className="flex gap-md group animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="relative z-10 flex-shrink-0">
                <div className={cn(
                  "w-[40px] h-[40px] rounded-full flex items-center justify-center border-2",
                  msg.sender === 'ai' ? "bg-accent-primary border-accent-border text-white transition-transform group-hover:scale-110" : "bg-bg-3 border-bg-4 text-text-secondary"
                )}>
                  {msg.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
              </div>
              <div className="flex-grow space-y-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="text-body-reg font-semibold text-text-primary">
                      {msg.sender === 'ai' ? 'AI Support Agent' : msg.name}
                    </span>
                    {msg.sender === 'ai' && <Badge variant="success" className="h-4 py-0 text-[10px]">AI</Badge>}
                  </div>
                  <span className="text-body-sm text-text-tertiary flex items-center gap-xs">
                    <Calendar size={12} />
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="bg-bg-2 border-l-4 border-accent-primary p-md rounded-sm shadow-sm">
                  <p className="text-body-reg text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Satisfaction Survey */}
      {ticket.status === 'Resolved' && !surveySubmitted && (
        <Card className="mt-3xl bg-accent-light border-accent-border animate-slide-up">
          <h3 className="text-h3 text-text-inverse mb-md">How would you rate your support experience?</h3>
          <p className="text-body-reg text-text-inverse opacity-80 mb-lg">Your feedback helps us improve our service.</p>
          
          <div className="grid grid-cols-5 md:grid-cols-10 gap-sm mb-xl">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setNpsScore(num)}
                className={cn(
                  "h-[40px] flex items-center justify-center rounded-sm font-semibold transition-all duration-fast",
                  npsScore === num 
                    ? "bg-accent-primary text-white shadow-md scale-110" 
                    : "bg-bg-3 text-text-primary hover:bg-bg-4"
                )}
              >
                {num}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Tell us what could be better... (Optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="bg-white/50 border-accent-border text-text-inverse placeholder:text-text-tertiary"
          />

          <Button 
            className="mt-lg w-full md:w-auto"
            disabled={npsScore === null}
            onClick={submitSatisfaction}
          >
            Submit Feedback
          </Button>
        </Card>
      )}

      {surveySubmitted && (
        <Card className="mt-3xl bg-accent-light border-accent-border text-center py-xl animate-fade-in">
          <Check size={48} className="text-accent-primary mx-auto mb-md" />
          <h3 className="text-h3 text-text-inverse">Thank you for your feedback!</h3>
        </Card>
      )}

      {showToast && (
        <Toast 
          message={toastMessage} 
          type="success" 
          onClose={() => setShowToast(false)} 
        />
      )}
    </div>
  );
};
