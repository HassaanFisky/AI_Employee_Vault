"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select, Textarea, RadioGroup, Toast } from '@/components';
import { Check } from 'lucide-react';

interface FormData {
  full_name: string;
  email: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Premium Support Form component
 * Handles user support requests with real-time validation and rich feedback
 */
export const SupportForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    category: '',
    priority: 'Medium',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const categories = [
    { value: 'General Inquiry', label: 'General Inquiry' },
    { value: 'Billing', label: 'Billing' },
    { value: 'Technical', label: 'Technical' },
    { value: 'Feature Request', label: 'Feature Request' },
  ];

  const priorities = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
  ];

  // Validation logic
  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'full_name' && value.length < 2) {
      error = 'Full name must be at least 2 characters';
    } else if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Please enter a valid email address';
    } else if (name === 'category' && !value) {
      error = 'Please select a category';
    } else if (name === 'subject' && !value) {
      error = 'Subject is required';
    } else if (name === 'message' && value.length < 10) {
      error = 'Please provide more detail (at least 10 characters)';
    }
    return error;
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof FormData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const isFormValid = () => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setStatus('loading');
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Submission failed');

      const data = await response.json();
      setTicketId(data.ticket_id);
      setStatus('success');
      
      // Auto-hide success message after 8 seconds
      setTimeout(() => {
        if (status === 'success') setStatus('idle');
      }, 8000);

    } catch (err) {
      setStatus('error');
      setShowToast(true);
      setTimeout(() => setStatus('idle'), 30000); // 30s timeout as requested
    }
  };

  if (status === 'success' && ticketId) {
    return (
      <div className="max-w-[600px] mx-auto p-10 animate-fade-in">
        <Card className="bg-bg-2 border-white/10 p-[48px] text-center flex flex-col items-center gap-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="w-[100px] h-[100px] bg-accent-primary flex items-center justify-center rounded-3xl animate-bounce-in text-bg-1 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Check size={50} strokeWidth={4} />
          </div>
          <div className="space-y-3">
            <h2 className="text-h1 tracking-tighter text-text-primary font-bold">Session Initialized</h2>
            <p className="font-mono text-body-sm text-accent-primary font-bold uppercase tracking-widest">{ticketId}</p>
          </div>
          <p className="text-body-reg text-text-secondary leading-relaxed opacity-90 max-w-[400px]">
            Your WHOOSH support session has been queued. An intelligent agent will respond shortly within your private dashboard.
          </p>
          <div className="flex flex-col gap-4 w-full pt-4">
            <Button className="w-full py-4 rounded-xl text-body-reg font-black uppercase tracking-[0.1em]" onClick={() => router.push(`/tickets/${ticketId}`)}>
              Enter Session
            </Button>
            <Button variant="ghost" className="text-text-quaternary hover:text-text-secondary font-bold uppercase tracking-widest text-[11px]" onClick={() => {
              setStatus('idle');
              setFormData({
                full_name: '',
                email: '',
                category: '',
                priority: 'Medium',
                subject: '',
                message: '',
              });
              setTouched({});
            }}>
              New Request
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto p-10 animate-slide-up">
      {/* Hero Section */}
      <div className="text-center mb-10 flex flex-col items-center">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent mb-8" />
        <h1 className="text-h1 tracking-tighter bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
          Support
        </h1>
        <p className="text-body-reg text-text-tertiary mt-2 tracking-wide font-medium">
          Intelligent agents · Ready 24/7
        </p>
      </div>

      {status === 'error' && (
        <div className="bg-[#FEE2E2] border-l-4 border-error p-md mb-lg flex justify-between items-center animate-fade-in">
          <div className="flex items-center gap-md">
            <div className="w-5 h-5 bg-error text-white rounded-full flex items-center justify-center text-[10px]">X</div>
            <p className="text-body-reg text-error font-medium">Submission failed. Please try again.</p>
          </div>
          <Button size="sm" variant="danger" onClick={handleSubmit}>Retry</Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
        <Input
          label="Full Name"
          placeholder="Your full name"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          onBlur={() => handleBlur('full_name')}
          error={errors.full_name}
          isSuccess={touched.full_name && !errors.full_name}
          disabled={status === 'loading'}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={errors.email}
          isSuccess={touched.email && !errors.email}
          disabled={status === 'loading'}
        />

        <Select
          label="Category"
          placeholder="--Select category--"
          options={categories}
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          onBlur={() => handleBlur('category')}
          error={errors.category}
          disabled={status === 'loading'}
        />

        <RadioGroup
          label="Priority"
          options={priorities}
          value={formData.priority}
          onChange={(val) => handleChange('priority', val)}
          error={errors.priority}
        />

        <Input
          label="Subject"
          placeholder="Describe your issue in one line"
          maxLength={200}
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          onBlur={() => handleBlur('subject')}
          error={errors.subject}
          isSuccess={touched.subject && !errors.subject}
          disabled={status === 'loading'}
        />

        <Textarea
          label="Detailed Message"
          placeholder="Please provide as much detail as possible..."
          maxLength={2000}
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          error={errors.message}
          disabled={status === 'loading'}
        />

        <div className="mt-10">
          <Button
            type="submit"
            className="w-full py-4 rounded-xl text-body-reg font-black uppercase tracking-[0.2em] shadow-lg shadow-accent-primary/10 transition-all hover:shadow-accent-primary/20"
            isLoading={status === 'loading'}
            disabled={status === 'loading' || Object.values(errors).some(e => e !== '') || Object.keys(touched).length < Object.keys(formData).length}
          >
            Initialize Support Session
          </Button>
          {status === 'loading' && (
            <p className="text-[10px] text-text-quaternary text-center mt-4 font-bold uppercase tracking-widest animate-pulse">
              Encrypting session telemetry...
            </p>
          )}
        </div>
      </form>

      {showToast && (
        <Toast
          type="error"
          message="Submission failed. Please check your connection and try again."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

