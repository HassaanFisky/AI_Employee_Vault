import React, { useState } from 'react';

const SupportForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [ticketId, setTicketId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing/Account' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'bug_report', label: 'Bug Report' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:8000/support/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json.json.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setTicketId(data.ticket_id);
      } else {
        setStatus('error');
        setErrorMessage(data.detail?.[0]?.msg || data.detail || 'Submission failed');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Could not connect to the support server.');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-emerald-100 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Support Request Received</h2>
        <p className="text-gray-600 mb-6">Our AI assistant is reviewing your request and will respond shortly.</p>
        <div className="bg-gray-50 rounded-lg p-4 inline-block mb-8">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Your Ticket ID</p>
          <p className="text-2xl font-mono text-emerald-700 font-bold">{ticketId}</p>
        </div>
        <button 
          onClick={() => { setStatus('idle'); setFormData({ ...formData, message: '', subject: '' }); }}
          className="block w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-200 shadow-lg shadow-emerald-200"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">TechCorp Support</h1>
        <p className="text-gray-500">24/7 AI-powered assistance for all your technical needs.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
              placeholder="jane@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none appearance-none"
            >
              {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none appearance-none"
            >
              {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
            placeholder="How can we help?"
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">Detailed Message</label>
            <span className={`text-xs font-medium ${formData.message.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
              {formData.message.length}/1000
            </span>
          </div>
          <textarea
            name="message"
            required
            rows="5"
            maxLength="1000"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none resize-none"
            placeholder="Please provide as much detail as possible..."
          />
        </div>

        {status === 'error' && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-shake">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2
            ${status === 'loading' ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-[0.98]'}`}
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing...</span>
            </>
          ) : 'Submit Support Request'}
        </button>
      </form>
    </div>
  );
};

export default SupportForm;
