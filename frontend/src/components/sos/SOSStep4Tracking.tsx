import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, MessageSquare, ShieldAlert, Clock, Navigation, CreditCard, AlertTriangle, Check, Download } from 'lucide-react';

interface SOSStep4Props {
  data: {
    problem: string;
    address: string;
    selectedMechanic: any;
    paymentMethod: string;
    aiReport: any;
  };
  onBack: () => void;
  onDone: () => void;
  onCancel: () => void;
}

export default function SOSStep4Tracking({ data, onBack, onDone, onCancel }: SOSStep4Props) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(12);
  const [dist, setDist] = useState(4.2);
  const [status, setStatus] = useState<'Searching' | 'Accepted' | 'On The Way' | 'Arrived' | 'Completed'>('Searching');
  const [truckPos, setTruckPos] = useState({ x: 100, y: 120 });
  const [routeLineProgress, setRouteLineProgress] = useState(0);

  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'mechanic', text: "Hi, I'm Alex from Apex Auto Recovery. I've accepted your rescue request and I'm loading my flatbed. Are you parked in a safe spot?", time: '2m ago' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [aiMessages, setAiMessages] = useState<any[]>([
    { sender: 'ai', text: "Hello! I am your AI Safety Coordinator. Heavy traffic is reported 1.2 miles ahead. Keep your hazard warning lights engaged.", time: 'Just now' },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  const [_notifications, setNotifications] = useState([
    'SOS Broadcaster initialized on Mumbai Highway Node.',
    'Telemetry channel locked. Authenticating responder...',
  ]);

  const [invoicePaid, setInvoicePaid] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);

  const mechanic = data.selectedMechanic || { name: "Alex's Auto Recovery", avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150', experience: '8 years', rating: 4.9 };

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      setRouteLineProgress(currentProgress);

      if (currentProgress < 15) {
        setStatus('Searching');
      } else if (currentProgress >= 15 && currentProgress < 35) {
        setStatus('Accepted');
        if (currentProgress === 15) pushNotification("Alex's Auto Recovery accepted your dispatch request.");
      } else if (currentProgress >= 35 && currentProgress < 85) {
        setStatus('On The Way');
        const ratio = (currentProgress - 35) / 50;
        setEta(Math.max(2, Math.floor(11 - ratio * 8)));
        setDist(parseFloat((3.8 - ratio * 3.0).toFixed(1)));
        if (currentProgress === 50) simulateMechanicReply('Stuck in traffic on the bypass road. Will be there in about 4-5 minutes.');
      } else if (currentProgress >= 85 && currentProgress < 98) {
        setStatus('Arrived');
        setEta(1);
        setDist(0.1);
        if (currentProgress === 85) {
          pushNotification('Mechanic has arrived at your exact pinned GPS coordinates!');
          simulateMechanicReply('I have arrived! I see your vehicle. Please stay behind the guardrail.');
        }
      } else if (currentProgress >= 98) {
        setStatus('Completed');
        setEta(0);
        setDist(0);
        pushNotification('Emergency Repair Completed. Invoice payment cleared.');
        clearInterval(interval);
        setTimeout(() => setShowRating(true), 1200);
      }

      if (currentProgress < 33) {
        const t = currentProgress / 33;
        setTruckPos({ x: 100 + t * 150, y: 120 });
      } else if (currentProgress >= 33 && currentProgress < 66) {
        const t = (currentProgress - 33) / 33;
        setTruckPos({ x: 250, y: 120 + t * 130 });
      } else {
        const t = Math.min(1, (currentProgress - 66) / 34);
        setTruckPos({ x: 250 + t * 200, y: 250 });
      }
    }, 450);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isTyping]);

  const pushNotification = (msg: string) => setNotifications(prev => [msg, ...prev]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput, time: 'Just now' }]);
    setChatInput('');
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'mechanic', text: 'Got it! Keep your hazard lights flashing so I can spot your vehicle on approach.', time: 'Just now' }]);
      }, 2000);
    }, 1000);
  };

  const simulateMechanicReply = (text: string) => {
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'mechanic', text, time: 'Just now' }]);
      }, 2000);
    }, 1500);
  };

  const handleSendAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAiMessages(prev => [...prev, { sender: 'user', text: aiInput, time: 'Just now' }]);
    setAiInput('');
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      let aiResponse = "I've logged your query. Our telemetry shows weather indicators are clear. Stand at least 15 feet behind the metal guardrails.";
      if (aiInput.toLowerCase().includes('cancel')) {
        aiResponse = "Cancellations within 3 minutes of dispatcher acceptance are free of charge.";
      }
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse, time: 'Just now' }]);
    }, 1500);
  };

  const handlePayInvoice = () => {
    setInvoicePaid(true);
    pushNotification('Payment of $84.22 cleared successfully via Stripe Escrow.');
  };

  const statusColor = status === 'Completed' ? 'var(--secondary)' : status === 'Arrived' ? 'var(--accent)' : 'var(--primary)';
  const statusLabel = status === 'Completed' ? 'Repair Completed' : status === 'Arrived' ? 'Mechanic Arrived' : status === 'On The Way' ? 'Mechanic En Route' : status === 'Accepted' ? 'Request Accepted' : 'Searching for Mechanic';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Live Status Header */}
        <div className="sos-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={onBack} className="sos-btn sos-btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
              <Navigation size={16} /> Back
            </button>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, textAlign: 'left', margin: 0 }}>RoadRescue Live Rescue</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Real-time emergency tracking</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="sos-live-badge">
              <div className="sos-live-dot" />
              <span>LIVE RESCUE ACTIVE</span>
            </motion.div>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} />
              <span>{status === 'Completed' ? '0' : eta} min ETA</span>
            </div>
          </div>
        </div>

        {/* Large Map */}
        <div className="sos-tracking-map">
          <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 500 350">
            <defs>
              <pattern id="track-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#track-grid)" />
            <path d="M 0,120 L 500,120" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 0,120 L 500,120" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />
            <path d="M 250,0 L 250,350" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 250,0 L 250,350" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />
            <path d="M 0,250 L 500,250" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 0,250 L 500,250" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />
            <path d="M 100,120 L 250,120 L 250,250 L 450,250" stroke="var(--primary)" strokeWidth="3" fill="none" strokeDasharray="480" strokeDashoffset={480 - (routeLineProgress / 100) * 480} style={{ transition: 'stroke-dashoffset 0.4s ease' }} />

            <g transform="translate(450, 250)">
              <circle cx="0" cy="0" r="16" fill="var(--accent)" opacity="0.15" className="map-pulse-circle" />
              <circle cx="0" cy="0" r="6" fill="var(--accent)" />
              <text x="-12" y="-12" fill="var(--text-primary)" fontSize="8.5" fontWeight="900">You</text>
            </g>
            <g transform="translate(100, 120)">
              <circle cx="0" cy="0" r="12" fill="var(--secondary)" opacity="0.15" />
              <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
              <text x="-25" y="-12" fill="var(--text-muted)" fontSize="8" fontWeight="800">Dispatch Center</text>
            </g>
            {status !== 'Searching' && (
              <g transform={`translate(${truckPos.x}, ${truckPos.y})`}>
                <circle cx="0" cy="0" r="14" fill="var(--primary)" opacity="0.25" className="map-pulse-circle" />
                <rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="var(--primary)" />
                <circle cx="-5" cy="8" r="2.5" fill="#1E293B" />
                <circle cx="5" cy="8" r="2.5" fill="#1E293B" />
                <text x="0" y="-10" textAnchor="middle" fill="var(--primary)" fontSize="8" fontWeight="900">ALEX</text>
              </g>
            )}
          </svg>

          {/* Mechanic Overlay Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="sos-tracking-overlay">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <img src={mechanic.avatar} alt={mechanic.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--primary-glow)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{mechanic.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MH-12-TX-0922 · {mechanic.experience || '8 years'}</div>
              </div>
              <div style={{ background: statusColor, color: 'white', fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap' }}>{statusLabel}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{status === 'Completed' ? '0' : eta}<span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 2 }}>min</span></div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{dist} mi away</div>
              </div>
              <div style={{ width: 60, height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, var(--primary), var(--secondary))`, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Two Column: Chat + Sidebar */}
        <div className="sos-tracking-grid">
          {/* Left: Chat + Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Live Chat */}
            <div className="sos-chat-panel">
              <div className="sos-chat-header">
                <div className="sos-chat-title"><MessageSquare size={16} style={{ color: 'var(--primary)' }} /> Live Mechanic Chat</div>
                {isTyping && <div className="sos-typing-indicator"><div className="sos-typing-dot" /><div className="sos-typing-dot" /><div className="sos-typing-dot" /></div>}
              </div>
              <div className="sos-chat-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div className={`sos-chat-msg ${m.sender === 'user' ? 'user' : 'other'}`}>{m.text}</div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', marginTop: 2 }}>{m.time}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="sos-chat-quick-replies">
                {['Standing safely by the road', 'Hazard lights are flashing', 'Okay, waiting!'].map(r => (
                  <button key={r} className="sos-chat-quick-reply" onClick={() => setChatInput(r)}>{r}</button>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="sos-chat-input-row">
                <input type="text" className="sos-chat-input" placeholder="Send message to mechanic..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                <button type="submit" className="sos-chat-send-btn"><Send size={14} /></button>
              </form>
            </div>

            {/* Timeline */}
            <div className="sos-chat-panel">
              <div className="sos-chat-title" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}><Navigation size={16} style={{ color: 'var(--primary)' }} /> Journey Timeline</div>
              <div className="sos-timeline">
                <div className="sos-timeline-line" />
                {[
                  { label: 'Request Broadcasted', desc: 'SOS signal sent to nearby mechanics', done: true },
                  { label: 'Dispatch Accepted', desc: "Alex's Auto Recovery accepted", done: progress >= 15 },
                  { label: 'Mechanic En Route', desc: `${eta} min · ${dist} mi remaining`, done: progress >= 35, active: progress >= 15 && progress < 85 },
                  { label: 'Arrived at Destination', desc: 'Mechanic is at your location', done: progress >= 85, active: progress >= 35 && progress < 98 },
                  { label: 'Repair Completed', desc: 'Service verified & invoiced', done: progress >= 98, active: progress >= 85 },
                ].map((step, i) => (
                  <div key={i} className={`sos-timeline-step ${step.done ? 'done' : ''} ${step.active ? 'active' : ''}`}>
                    <div className="sos-timeline-dot">{step.done ? <Check size={12} /> : i + 1}</div>
                    <div>
                      <div className="sos-timeline-label">{step.label}</div>
                      <div className="sos-timeline-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI + Payment + Emergency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* AI Safety Coordinator */}
            <div className="sos-chat-panel">
              <div className="sos-chat-header">
                <div className="sos-chat-title" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}><ShieldAlert size={14} /> AI Safety Coordinator</div>
                {aiTyping && <div className="sos-typing-indicator"><div className="sos-typing-dot" /><div className="sos-typing-dot" /><div className="sos-typing-dot" /></div>}
              </div>
              <div className="sos-chat-messages" style={{ height: 140 }}>
                {aiMessages.map((m, i) => (
                  <div key={i} style={{
                    padding: '0.5rem 0.75rem', borderRadius: 12, fontSize: '0.75rem', maxWidth: '85%', lineHeight: 1.35, fontWeight: 500,
                    background: m.sender === 'ai' ? 'var(--primary-glow)' : 'var(--primary)',
                    color: m.sender === 'ai' ? 'var(--primary)' : 'white',
                    alignSelf: m.sender === 'ai' ? 'flex-start' : 'flex-end',
                    borderLeft: m.sender === 'ai' ? '3px solid var(--primary)' : 'none',
                  }}>{m.text}</div>
                ))}
              </div>
              <form onSubmit={handleSendAi} className="sos-chat-input-row" style={{ marginTop: '0.5rem' }}>
                <input type="text" className="sos-chat-input" placeholder="Ask safety coordinator..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} style={{ fontSize: '0.8rem' }} />
                <button type="submit" className="sos-chat-send-btn" style={{ width: 34, height: 34 }}><Send size={12} /></button>
              </form>
            </div>

            {/* Payment Summary */}
            <div className="sos-chat-panel">
              <div className="sos-chat-title" style={{ marginBottom: '0.85rem' }}><CreditCard size={14} style={{ color: 'var(--primary)' }} /> Payment Summary</div>
              <div className="sos-price-breakdown" style={{ borderStyle: 'dashed' }}>
                {[
                  { label: 'Base Mobilization', value: '$49.00' },
                  { label: `Distance (${dist} mi)`, value: '$23.10' },
                  { label: 'GST/Taxes (18%)', value: '$12.12' },
                ].map((item, i) => (
                  <div key={i} className="sos-price-row"><span>{item.label}</span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span></div>
                ))}
                <div className="sos-price-total"><span>Total</span><span style={{ color: 'var(--primary)' }}>$84.22</span></div>
              </div>
              {invoicePaid ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--success-glow)', color: 'var(--secondary)', fontWeight: 800, fontSize: '0.8rem', padding: '0.65rem', borderRadius: 12, border: '1px solid rgba(34,197,94,0.15)', marginTop: '0.75rem' }}>
                  <Check size={14} /> Invoice Paid
                </div>
              ) : (
                <button onClick={handlePayInvoice} className="sos-btn sos-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
                  <CreditCard size={14} /> Pay Now ($84.22)
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                <button className="sos-btn sos-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.72rem' }}><Download size={11} /> Invoice</button>
                <button className="sos-cancel-btn" onClick={onCancel} style={{ flex: 1, textAlign: 'center' }}>Cancel Request</button>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="sos-chat-panel">
              <div className="sos-chat-title" style={{ marginBottom: '0.85rem' }}><Phone size={14} style={{ color: 'var(--accent)' }} /> Emergency Contacts</div>
              <div className="sos-emergency-contacts">
                {[
                  { label: 'Police', number: '911', type: 'police' },
                  { label: 'Ambulance', number: '108', type: 'ambulance' },
                  { label: 'Family Contact', number: '+91 98765 43210', type: 'family' },
                ].map((c, i) => (
                  <a key={i} href={`tel:${c.number}`} className={`sos-emergency-contact ${c.type}`}>
                    <span className="sos-emergency-contact-label">{c.label}</span>
                    <span className="sos-emergency-contact-number">{c.number}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Emergency Safety Tips */}
            <div className="sos-safety-alert">
              <div className="sos-safety-alert-title"><AlertTriangle size={14} /> Emergency Safety Tips</div>
              <ul className="sos-safety-alert-list">
                {['Turn off engine & engage parking brake', 'Activate hazard warning lights', 'Stand behind guardrails away from traffic', 'Keep phone charged for mechanic contact'].map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="sos-bottom-bar">
          <button className="sos-btn sos-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            <Navigation size={18} /> Track Mechanic
          </button>
          <button className="sos-btn sos-btn-secondary" onClick={onCancel} style={{ color: 'var(--accent)', borderColor: 'rgba(239,68,68,0.2)' }}>
            Cancel Request
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sos-rating-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="sos-rating-modal">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={36} strokeWidth={3} color="white" />
                  </div>
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem', textAlign: 'center' }}>Rate Your Rescue Experience</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Help us keep our service quality world-class.</p>
              </div>
              <div className="sos-stars" style={{ marginBottom: '1.25rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={`sos-star ${ratingStars >= star ? 'active' : ''}`} onClick={() => setRatingStars(star)}>★</span>
                ))}
              </div>
              <button className="sos-btn sos-btn-primary" disabled={ratingStars === 0} onClick={() => { onDone(); }} style={{ width: '100%', justifyContent: 'center' }}>
                Submit Rating
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
