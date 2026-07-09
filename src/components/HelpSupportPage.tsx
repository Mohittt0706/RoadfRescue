import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Paperclip, 
  Check
} from 'lucide-react';

interface HelpSupportPageProps {
  setActiveDashboardTab: (tab: 'home' | 'dispatch' | 'chat' | 'profile' | 'nearby' | 'help') => void;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  isRead?: boolean;
}

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  date: string;
}

export default function HelpSupportPage({ setActiveDashboardTab }: HelpSupportPageProps) {
  /* --- Autocomplete Search Query --- */
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchSuggestions = [
    "Flat tire help",
    "Battery dead jumpstart",
    "Payment issue secure check",
    "Booking problem cancelation",
    "Track mechanic live ETA",
    "Cancel request policy",
    "Insurance claim guide",
    "Refund status",
    "Account preferences settings"
  ];

  const filteredSuggestions = searchSuggestions.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* --- FAQ Accordion states --- */
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('booking');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const faqData: FaqItem[] = [
    { id: 'faq-1', category: 'booking', question: "How do I request roadside assistance?", answer: "Go to the SOS Live Dispatch tab, select your location, vehicle details, describe the issue, and match with an active nearby service mechanic. Our AI will automatically diagnose coordinates." },
    { id: 'faq-2', category: 'booking', question: "Can I cancel a dispatch request?", answer: "Yes, you can cancel any request before the mechanic reaches your location. If canceled within 2 minutes of dispatch, it is completely free; otherwise, a $10.00 cancellation fee applies." },
    { id: 'faq-3', category: 'payments', question: "What payment methods do you support?", answer: "We support Visa/Mastercard credit and debit cards, BHIM UPI apps (GPay, PhonePe), Apple Pay, and offline cash collected by the recovery mechanic." },
    { id: 'faq-4', category: 'payments', question: "Is my transaction secure?", answer: "Yes, all payments are cleared via PCI DSS certified gateways with 256-bit SSL encryption, escrowed to ensure mechanic arrival." },
    { id: 'faq-5', category: 'tracking', question: "How do I track my dispatched mechanic?", answer: "Once matched, you will see a live GPS tracker pin map showing the driver's vehicle model, registration number, and live ETA." },
    { id: 'faq-6', category: 'vehicle', question: "What vehicles can RoadRescue assist?", answer: "We support sedans, SUVs, electric vehicles (EVs), hybrids, motorcycles, and light commercial vehicles." },
    { id: 'faq-7', category: 'ai', question: "How does the AI Diagnoser work?", answer: "Our AI Assistant parses warning light descriptions, OBD codes, or photos you upload to calculate repair costs and recommend immediate safety steps." }
  ];

  const filteredFaqs = faqData.filter(faq => faq.category === selectedFaqCategory);

  /* --- Live Chat State --- */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm-1', sender: 'agent', text: "Hello Disha! I'm David, your dedicated RoadRescue agent. How can I assist you with your Tesla Model Y today?", timestamp: "12:30 PM", isRead: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    setIsAgentTyping(true);

    // Simulate Agent responses based on input keywords
    setTimeout(() => {
      let reply = "I've logged your request. Our dispatcher team is reviewing your telemetry details.";
      if (query.includes('tire')) {
        reply = "I see you're asking about tires. We can dispatch a tire puncture support vehicle immediately. Should I trigger the garage matched queue?";
      } else if (query.includes('battery') || query.includes('charge')) {
        reply = "For dead batteries, our emergency trucks carry portable EV fast chargers and heavy-duty jumper kits. Is your Tesla Model Y parked safely?";
      } else if (query.includes('refund') || query.includes('money')) {
        reply = "I've checked transaction reference TXN-RR-829103. The refund process has been approved by our escrow bank and will credit back to your Visa card within 2 days.";
      }
      
      const agentMsg: ChatMessage = {
        id: 'm-agent-' + Date.now(),
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true
      };

      setChatMessages(prev => {
        // mark previous user messages as read
        return prev.map(m => m.sender === 'user' ? { ...m, isRead: true } : m).concat(agentMsg);
      });
      setIsAgentTyping(false);
      addHelpNotification("Agent replied to your chat request.");
    }, 1200);
  };

  /* --- Support Tickets State --- */
  const [tickets, setTickets] = useState<SupportTicket[]>([
    { id: 'TCK-92810', category: 'Refunds', subject: 'Refund duplicate battery charge', status: 'open', priority: 'medium', date: 'July 5, 2026' },
    { id: 'TCK-81029', category: 'Tracking', subject: 'GPS coordinate mismatch on Delhi Highway', status: 'resolved', priority: 'high', date: 'June 18, 2026' }
  ]);

  const [ticketCategory, setTicketCategory] = useState('Billing');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [showAddTicketForm, setShowAddTicketForm] = useState(false);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    const newTicket: SupportTicket = {
      id: 'TCK-' + Math.floor(10000 + Math.random() * 90000),
      category: ticketCategory,
      subject: ticketSubject.trim(),
      status: 'open',
      priority: ticketPriority,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setTickets(prev => [newTicket, ...prev]);
    setTicketSubject('');
    setTicketDesc('');
    setAttachedFiles([]);
    setShowAddTicketForm(false);
    addHelpNotification(`Support ticket ${newTicket.id} created successfully.`);
    alert(`Ticket ${newTicket.id} submitted. Our helpline agent will review it shortly.`);
  };

  /* --- Survey star feedback rating --- */
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  /* --- Smart Notification list --- */
  const [helpNotifications, setHelpNotifications] = useState<string[]>([]);

  const addHelpNotification = (text: string) => {
    setHelpNotifications(prev => [text, ...prev].slice(0, 3));
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      
      {/* SMART ALERT NOTIFICATION TOASTS */}
      <div style={{ position: 'fixed', top: '90px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '300px', pointerEvents: 'none' }}>
        {helpNotifications.map((note, index) => (
          <div 
            key={index}
            className="animate-slide-up"
            style={{ 
              background: 'var(--glass-bg)', 
              backdropFilter: 'var(--glass-blur)', 
              border: '1px solid var(--glass-border)', 
              padding: '0.6rem 0.85rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              boxShadow: 'var(--shadow-md)',
              borderLeft: '4px solid var(--primary)',
              color: 'var(--text-primary)',
              fontWeight: 700
            }}
          >
            🔔 {note}
          </div>
        ))}
      </div>

      {/* 1. HERO SECTION BANNER */}
      <div className="db-welcome-banner" style={{ padding: '2.5rem 2rem', background: 'radial-gradient(circle at 100% 100%, rgba(37,99,235,0.06) 0%, transparent 60%)', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 950, marginBottom: '0.5rem', textAlign: 'left', color: 'var(--text-primary)' }}>
              How Can We Help You Today?
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', textAlign: 'left' }}>
              Get instant support through AI chatbot diagnostics, interactive FAQ accordions, ticket portals, or match directly with live help desk agents.
            </p>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setActiveDashboardTab('chat')}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 800 }}
              >
                🤖 Ask AI Assistant
              </button>
              <a 
                href="#livechat"
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 800 }}
              >
                💬 Live Help Chat
              </a>
              <a 
                href="tel:+1800555SOS"
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 800 }}
              >
                📞 Call Helpline
              </a>
              <button 
                onClick={() => {
                  alert("Relaying SOS Coordinates directly to active emergency services.");
                  addHelpNotification("SOS Alert Broadcasted!");
                }}
                className="btn btn-emergency animate-pulse"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem', fontWeight: 800, background: 'var(--accent)' }}
              >
                🚨 SOS Emergency
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '1.25rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)', maxWidth: '280px' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🦺</span>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>Verified Support Agents</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Average response time: <strong>&lt; 90 seconds</strong> 24 hours a day.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR & SUGGESTIONS */}
      <div className="container" style={{ maxWidth: '780px', margin: '0 auto 2rem auto', position: 'relative' }}>
        <div className="ai-history-search" style={{ padding: '0.65rem 1rem', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search help articles (e.g. flat tire, dead battery, refunds)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{ fontSize: '0.95rem' }}
          />
        </div>

        {/* Suggestions Autocomplete popup */}
        {showSuggestions && searchQuery.trim() !== '' && (
          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', marginTop: '0.5rem', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden' }}>
            {filteredSuggestions.map((suggestion, index) => (
              <div 
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion);
                  setShowSuggestions(false);
                  addHelpNotification(`Filtered results for: ${suggestion}`);
                }}
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--light-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                🔍 {suggestion}
              </div>
            ))}
            {filteredSuggestions.length === 0 && (
              <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No results match your search. Type keywords like 'tire' or 'insurance'.
              </div>
            )}
          </div>
        )}

        {/* Trending Tags below search */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800 }}>Trending:</span>
          {['flat tire', 'battery dead', 'refunds', 'cancel request'].map((term) => (
            <button 
              key={term}
              onClick={() => {
                setSearchQuery(term);
                setShowSuggestions(false);
                addHelpNotification(`Filtered results for: ${term}`);
              }}
              style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              #{term}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID SPLIT */}
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: FAQS & SAFETY & TICKETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* FAQ ACCORDIONS */}
          <div className="ai-glass-panel">
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              ❓ Help Center FAQs
            </h3>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
              {[
                { id: 'booking', label: 'Booking' },
                { id: 'payments', label: 'Billing' },
                { id: 'tracking', label: 'GPS Tracking' },
                { id: 'vehicle', label: 'Vehicles' },
                { id: 'ai', label: 'AI Diagnoser' }
              ].map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => {
                    setSelectedFaqCategory(cat.id);
                    setExpandedFaqId(null);
                  }}
                  className={`btn ${selectedFaqCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '4px', whiteSpace: 'nowrap' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {filteredFaqs.map(faq => {
                const isActive = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className={`faq-accordion-item ${isActive ? 'active' : ''}`}>
                    <div 
                      className="faq-accordion-header"
                      onClick={() => setExpandedFaqId(isActive ? null : faq.id)}
                    >
                      <span>{faq.question}</span>
                      {isActive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    <div className="faq-accordion-body">
                      {faq.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SAFETY EMERGENCY GUIDE */}
          <div className="ai-glass-panel">
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              🛡️ Roadside Emergency Safety Guides
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              
              <div style={{ background: 'var(--light-surface)', border: '1.5px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '1.75rem' }}>🩹</span>
                <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)', marginTop: '0.25rem' }}>Accident Safety</strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.35rem 0' }}>
                  Turn on hazard flashers. Move all passengers away from active lanes. Capture photos only when safe.
                </p>
                <button onClick={() => alert("Safety Guidelines: 1. Pull over to shoulder. 2. Wear reflective jacket. 3. Place warning triangles 100ft behind.")} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.68rem', borderColor: 'var(--accent)' }}>Read Protocol</button>
              </div>

              <div style={{ background: 'var(--light-surface)', border: '1.5px solid rgba(245,158,11,0.2)', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '1.75rem' }}>🛞</span>
                <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)', marginTop: '0.25rem' }}>Flat Tire Safety</strong>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0.35rem 0' }}>
                  Secure parking brake. Never change tire on the side facing traffic lanes. Use solid blocks under jacks.
                </p>
                <button onClick={() => alert("Safety Guidelines: 1. Engage park gear. 2. Loosen lug nuts before raising. 3. Slip spare tire under frame for safety backup.")} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.68rem', borderColor: 'var(--border-light)' }}>Read Protocol</button>
              </div>

            </div>
          </div>

          {/* TICKET SUBMISSION PORTAL */}
          <div className="ai-glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>🎫 Support Ticket Portal</h3>
              <button 
                onClick={() => setShowAddTicketForm(!showAddTicketForm)}
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                {showAddTicketForm ? "View Ticket List" : "+ Open New Ticket"}
              </button>
            </div>

            {showAddTicketForm ? (
              <form onSubmit={handleCreateTicket} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Category</label>
                    <select value={ticketCategory} onChange={e => setTicketCategory(e.target.value)} className="auth-input-field" style={{ height: '34px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                      <option>Billing & Refunds</option>
                      <option>GPS Live Tracking</option>
                      <option>AI Assistant Diagnostic</option>
                      <option>Cancellation Policy</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Priority Level</label>
                    <select value={ticketPriority} onChange={e => setTicketPriority(e.target.value as any)} className="auth-input-field" style={{ height: '34px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency 🚨</option>
                    </select>
                  </div>
                </div>

                <div className="auth-input-group active" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>SUBJECT TITLE</label>
                  <input type="text" required placeholder="Brief title of the issue" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} className="auth-input-field" style={{ height: '34px', fontSize: '0.8rem', paddingLeft: '0.5rem' }} />
                </div>

                <div className="auth-input-group active" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>ISSUE DESCRIPTION</label>
                  <textarea required placeholder="Explain coordinates, diagnostic warn lights, vehicle brand..." value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} className="chatbot-input" style={{ minHeight: '65px', fontSize: '0.8rem', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '6px', resize: 'none' }} />
                </div>

                {/* Attach documents */}
                <div style={{ display: 'flex', justifySelf: 'flex-start', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setAttachedFiles(["invoice_screenshot.jpg"]);
                      addHelpNotification("Screen capture mock attachment linked");
                    }}
                    className="btn btn-secondary" 
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                  >
                    <Paperclip size={12} /> Attach Image/Log
                  </button>
                  {attachedFiles.map(f => (
                    <span key={f} style={{ fontSize: '0.7rem', color: 'var(--secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                      <Check size={10} /> {f}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="button" onClick={() => setShowAddTicketForm(false)} className="btn btn-secondary" style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}>Submit Ticket</button>
                </div>

              </form>
            ) : (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tickets.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--light-surface)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.82rem' }}>{t.subject}</strong>
                        <span className={`ticket-status-pill ${t.status === 'open' ? 'open' : t.status === 'resolved' ? 'resolved' : 'in-progress'}`}>{t.status}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                        ID: {t.id} • Category: {t.category} • Priority: <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{t.priority}</span> • Date: {t.date}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => alert(`Reviewing replies logs for Support Ticket ${t.id}`)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE CHAT & SERVICE CENTERS MAP */}
        <div id="livechat" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* LIVE CHAT SUPPORT PANEL */}
          <div className="ai-glass-panel">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100" alt="Agent" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px', background: 'var(--secondary)', borderRadius: '50%', border: '1.5px solid white' }}></div>
              </div>
              
              <div>
                <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--text-primary)' }}>David (Customer Support)</strong>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Online • average response speed &lt; 90s</span>
              </div>
            </div>

            {/* Chat Messages scroll area */}
            <div className="support-chat-messages" style={{ minHeight: '220px' }}>
              {chatMessages.map(msg => (
                <div key={msg.id} className={`support-chat-bubble ${msg.sender}`}>
                  <div>{msg.text}</div>
                  <span className="support-chat-meta">
                    {msg.timestamp} {msg.sender === 'user' && (msg.isRead ? '• ✓ Read' : '• Sent')}
                  </span>
                </div>
              ))}

              {isAgentTyping && (
                <div className="typing-indicator-row">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
            </div>

            {/* Quick replies buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', margin: '0.5rem 0', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                "My tire is flat",
                "Dead battery jump",
                "Where is my mechanic?",
                "Cancel my dispatch request"
              ].map(reply => (
                <button 
                  key={reply}
                  onClick={() => {
                    setChatInput(reply);
                    addHelpNotification(`Quick reply selected: ${reply}`);
                  }}
                  style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input 
                type="text"
                placeholder="Type message to agent..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="chatbot-input"
                style={{ height: '36px', fontSize: '0.8rem', paddingLeft: '0.75rem', flexGrow: 1 }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', justifyContent: 'center' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* NEAREST SERVICE CENTERS Google Maps mock */}
          <div className="ai-glass-panel">
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '0.5rem' }}>📍 Interactive Workshop Locator</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Showing 3 active workshops and towing facilities matching your coordinates.</p>
            
            <div className="locator-map-placeholder" style={{ marginBottom: '1rem' }}>
              <div className="locator-map-grid"></div>
              
              {/* Mock map coordinate pins */}
              <div style={{ position: 'absolute', top: '35%', left: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>📍</span>
                <span style={{ fontSize: '0.62rem', background: 'black', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>Vasant Kunj Workshop</span>
              </div>
              <div style={{ position: 'absolute', top: '65%', left: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>📍</span>
                <span style={{ fontSize: '0.62rem', background: 'black', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>Elite Towing Hub</span>
              </div>
              <div style={{ position: 'absolute', top: '15%', left: '60%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>📍</span>
                <span style={{ fontSize: '0.62rem', background: 'black', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>Safdarjung Fuel Center</span>
              </div>
            </div>

            {/* List nearby stations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div>
                  <strong>Safdarjung Fuel Station</strong>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Distance: 0.8 mi • Fuel & Air</span>
                </div>
                <button onClick={() => alert("Relaying directions: Head North-East on Ring Road for 0.8 mi.")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>Get directions</button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div>
                  <strong>Elite Towing Hub</strong>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Distance: 1.4 mi • Towing & Recovery</span>
                </div>
                <button onClick={() => alert("Relaying directions: Exit Highway towards Sector 4, Towing Hub is on the left.")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>Get directions</button>
              </div>
            </div>
          </div>

          {/* RATING SECTION */}
          <div className="ai-glass-panel" style={{ textAlign: 'center' }}>
            {feedbackSubmitted ? (
              <div className="animate-slide-up" style={{ padding: '1rem 0' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--secondary)' }}>Thank You for your Feedback!</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Your support rating response has been logged to improve our dispatch services.
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem' }}>⭐ Rate Customer Support</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>How would you rate your support experience today?</span>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      style={{ fontSize: '1.75rem', background: 'transparent', border: 'none', cursor: 'pointer', color: feedbackRating >= star ? '#f59e0b' : 'var(--border-light)' }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea 
                  placeholder="Suggestions or agent appreciation comments..."
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  className="chatbot-input"
                  style={{ minHeight: '55px', padding: '0.5rem', fontSize: '0.8rem', width: '100%', border: '1px solid var(--border-light)', borderRadius: '6px', marginBottom: '0.75rem', resize: 'none' }}
                />

                <button 
                  onClick={() => {
                    setFeedbackSubmitted(true);
                    addHelpNotification("Support rating logged successfully");
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 1.25rem' }}
                >
                  Submit Survey
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
