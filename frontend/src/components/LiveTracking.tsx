import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Phone, 
  MessageSquare, 
  Bell, 
  ChevronDown, 
  ChevronUp,
  Check, 
  Send, 
  ShieldAlert, 
  Maximize2, 
  Download,
  ArrowLeft,
  Share2,
  MapPin,
  Clock,
  AlertTriangle,
  Navigation,
  Shield,
  User,
  FileText,
  Star,
  Wifi,
  Zap,
  TrendingDown
} from 'lucide-react';

interface LiveTrackingProps {
  cancelSimulation: () => void;
  setSelectedIssue: (issue: string | null) => void;
  setActiveDashboardTab: (tab: 'home' | 'dispatch' | 'chat' | 'profile') => void;
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function LiveTracking({
  cancelSimulation,
  setSelectedIssue,
  setActiveDashboardTab
}: LiveTrackingProps) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(12);
  const [dist, setDist] = useState(4.2);
  const [status, setStatus] = useState<'Searching' | 'Accepted' | 'On The Way' | 'Arrived' | 'Completed'>('Searching');
  const [truckPos, setTruckPos] = useState({ x: 100, y: 120 });
  const [routeLineProgress, setRouteLineProgress] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTraffic, setShowTraffic] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<'min' | 'mid' | 'max'>('mid');
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<string[]>([
    "SOS Broadcaster initialized on Mumbai Highway Node.",
    "Telemetry channel locked. Authenticating responder..."
  ]);

  const mechanic = {
    name: "Alex's Auto Recovery",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150",
    experience: "8 years",
    rating: 4.9,
    reviews: 42,
    specialization: "Tesla & EV Diagnostics Specialist",
    vehicle: "Premium Flatbed Tow Unit (MH-12-TX-0922)",
    phone: "+919876543210"
  };

  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'mechanic', text: "Hi, I'm Alex from Apex Auto Recovery. I've accepted your rescue request and I'm loading my flatbed flat jack. Are you parked in a safe spot?", time: "2m ago" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [aiMessages, setAiMessages] = useState<any[]>([
    { sender: 'ai', text: "Hello! I am your AI Safety Coordinator. Heavy traffic is reported 1.2 miles ahead of you. Keep your hazard warning lights engaged. How can I assist you?", time: "Just now" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  const [invoicePaid, setInvoicePaid] = useState(false);
  const [showCheckoutToast, setShowCheckoutToast] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

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
        if (currentProgress === 35) pushNotification("Mechanic has departed Apex Center. Dispatching Live GPS.");
        if (currentProgress === 50) {
          pushNotification("Live Update: Minor traffic slowdown on Highway Bypass.");
          simulateMechanicReply("Getting stuck in some traffic on the bypass road, but I'm moving now. Will be there in about 4-5 minutes.");
        }
        if (currentProgress === 75) pushNotification("Mechanic is nearby (less than 1 km). Prepare to flag down.");
      } else if (currentProgress >= 85 && currentProgress < 98) {
        setStatus('Arrived');
        setEta(1);
        setDist(0.1);
        if (currentProgress === 85) {
          pushNotification("Mechanic has arrived at your exact pinned GPS coordinates!");
          simulateMechanicReply("I have arrived! I see your Tesla. Please stay behind the guardrail while I position my truck.");
        }
      } else if (currentProgress >= 98) {
        setStatus('Completed');
        setEta(0);
        setDist(0);
        pushNotification("Emergency Repair Completed. Invoice payment cleared.");
        clearInterval(interval);
        setTimeout(() => setShowRatingModal(true), 1200);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const pushNotification = (msg: string) => setNotifications(prev => [msg, ...prev]);

  const handleTouchStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  const handleTouchMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = dragStartY - clientY;
    if (delta > 60) { setSheetHeight('max'); setDragStartY(null); }
    else if (delta < -60) { setSheetHeight('min'); setDragStartY(null); }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput, time: "Just now" }]);
    setChatInput('');
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'mechanic', text: "Got it! Thanks for confirming. Keep your hazard lights flashing so I can spot your model immediately on approach.", time: "Just now" }]);
      }, 2000);
    }, 1000);
  };

  const simulateMechanicReply = (text: string) => {
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'mechanic', text, time: "Just now" }]);
      }, 2000);
    }, 1500);
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAiMessages(prev => [...prev, { sender: 'user', text: aiInput, time: "Just now" }]);
    setAiInput('');
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      let aiResponse = "I've logged your query. Our telemetry shows weather indicators are clear. Stand at least 15 feet behind the metal guardrails for maximum safety.";
      if (aiInput.toLowerCase().includes('towing') || aiInput.toLowerCase().includes('towed')) {
        aiResponse = "Standard emergency towing is authorized. Once the flatbed arrives, our technician will secure the chassis. You can ride along in the passenger cabin.";
      } else if (aiInput.toLowerCase().includes('cancel')) {
        aiResponse = "Cancellations made within 3 minutes of dispatcher acceptance are free of charge. You can press 'Cancel Request' in the emergency tray to clear.";
      }
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse, time: "Just now" }]);
    }, 1500);
  };

  const handlePayInvoice = () => {
    setInvoicePaid(true);
    setShowCheckoutToast(true);
    pushNotification("Payment of $84.22 cleared successfully via Stripe Escrow.");
    setTimeout(() => setShowCheckoutToast(false), 3000);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingStars === 0) return;
    setShowFeedbackSuccess(true);
    setTimeout(() => {
      setShowRatingModal(false);
      setShowFeedbackSuccess(false);
      setSelectedIssue(null);
      cancelSimulation();
      setActiveDashboardTab('home');
    }, 2000);
  };

  const statusColor = status === 'Completed' ? 'var(--secondary)' : status === 'Arrived' ? 'var(--accent)' : 'var(--primary)';
  const statusLabel = status === 'Completed' ? 'Repair Completed' : status === 'Arrived' ? 'Mechanic Arrived' : status === 'On The Way' ? 'Mechanic En Route' : status === 'Accepted' ? 'Request Accepted' : 'Searching for Mechanic';

  return (
    <motion.div
      initial="hidden" animate="visible" variants={stagger}
      style={{ position: 'relative', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0 0 2rem' }}
    >
      {/* ── TOP HEADER BAR ── */}
      <motion.div variants={fadeUp} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        backdropFilter: 'var(--glass-blur)', borderRadius: '20px',
        padding: '1rem 1.5rem', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={cancelSimulation} style={{
            width: 40, height: 40, borderRadius: 12, border: '1px solid var(--border-light)',
            background: 'var(--light-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s'
          }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              RoadRescue Live Rescue
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Real-time emergency tracking</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--accent-glow)', color: 'var(--accent)',
            fontSize: '0.7rem', fontWeight: 800, padding: '0.4rem 0.85rem',
            borderRadius: '9999px', border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'live-indicator-ping 1.5s infinite' }} />
            <span>LIVE RESCUE ACTIVE</span>
          </motion.div>
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, padding: '0.4rem 0.85rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid rgba(37,99,235,0.15)' }}>
            <Clock size={12} />
            <span>{status === 'Completed' ? '0' : eta} min ETA</span>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotificationPanel(!showNotificationPanel)} style={{
              width: 38, height: 38, borderRadius: 12, border: '1px solid var(--border-light)',
              background: 'var(--light-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', position: 'relative'
            }}>
              <Bell size={16} />
              <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--light-surface)' }} />
            </button>
            <AnimatePresence>
              {showNotificationPanel && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} style={{
                  position: 'absolute', right: 0, top: '2.8rem', width: 300, maxHeight: 320, overflowY: 'auto',
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)',
                  borderRadius: 16, padding: '1rem', boxShadow: 'var(--shadow-lg)', zIndex: 50
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Emergency Feeds</div>
                  {notifications.map((n, idx) => (
                    <div key={idx} style={{ padding: '0.5rem 0', borderBottom: idx < notifications.length - 1 ? '1px solid var(--border-light)' : 'none', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => { setSelectedIssue('Emergency SOS'); cancelSimulation(); }} style={{
            background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1rem',
            borderRadius: 12, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
          }}>
            <ShieldAlert size={14} /> Emergency SOS
          </button>
        </div>
      </motion.div>

      {/* ── MAP SECTION ── */}
      <motion.div variants={fadeUp} style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)',
        background: 'var(--light-surface)', height: isFullScreen ? '80vh' : 460
      }}>
        <div style={{ width: '100%', height: '100%', background: '#F1F5F9' }} className="dark:bg-slate-900">
          <svg style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.4s ease' }} viewBox="0 0 500 350">
            <defs>
              <pattern id="tracking-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tracking-grid)" />
            {showTraffic && (
              <>
                <path d="M 0,120 L 250,120" className="map-traffic-normal" />
                <path d="M 250,120 L 250,250" className="map-traffic-heavy" />
                <path d="M 250,250 L 500,250" className="map-traffic-normal" />
              </>
            )}
            <path d="M 0,120 L 500,120" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 0,120 L 500,120" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />
            <path d="M 250,0 L 250,350" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 250,0 L 250,350" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />
            <path d="M 0,250 L 500,250" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 0,250 L 500,250" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />
            <path d="M 100,120 L 250,120 L 250,250 L 450,250" className="map-route-drawn" strokeDasharray="480" strokeDashoffset={480 - (routeLineProgress / 100) * 480} />
            <g transform="translate(450, 250)">
              <circle cx="0" cy="0" r="16" fill="var(--accent)" opacity="0.15" className="map-pulse-circle" />
              <circle cx="0" cy="0" r="6" fill="var(--accent)" />
              <text x="-12" y="-12" fill="var(--text-primary)" fontSize="8.5" fontWeight="900">Disha (You)</text>
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
        </div>

        {/* Map Controls - Top Right */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
          {[
            { icon: '+', action: () => setZoomLevel(p => Math.min(1.5, p + 0.1)), label: 'Zoom In' },
            { icon: '−', action: () => setZoomLevel(p => Math.max(0.8, p - 0.1)), label: 'Zoom Out' },
            { icon: <Maximize2 size={14} />, action: () => setIsFullScreen(!isFullScreen), label: 'Fullscreen' }
          ].map((ctrl, i) => (
            <button key={i} onClick={ctrl.action} title={ctrl.label} style={{
              width: 38, height: 38, borderRadius: 10, background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
            }}>{ctrl.icon}</button>
          ))}
        </div>

        {/* Overlay Card - Top Left: Mechanic Info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          backdropFilter: 'var(--glass-blur)', borderRadius: 16, padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow-lg)', width: 280
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <img src={mechanic.avatar} alt={mechanic.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--primary-glow)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mechanic.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MH-12-TX-0922 · {mechanic.experience}</div>
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

        {/* Overlay Card - Top Right: Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} style={{
          position: 'absolute', top: 16, right: 64, zIndex: 10,
          display: 'flex', gap: 6
        }}>
          {[
            { icon: <Phone size={14} />, label: 'Call', bg: 'var(--primary)', action: () => {} },
            { icon: <Share2 size={14} />, label: 'Share', bg: 'var(--secondary)', action: () => pushNotification("Live location shared with emergency contacts.") },
            { icon: <ShieldAlert size={14} />, label: 'SOS', bg: 'var(--accent)', action: () => { setSelectedIssue('Emergency SOS'); cancelSimulation(); } }
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} title={btn.label} style={{
              width: 36, height: 36, borderRadius: 10, background: btn.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', boxShadow: `0 4px 12px ${btn.bg}33`, transition: 'all 0.2s', border: 'none'
            }}>{btn.icon}</button>
          ))}
        </motion.div>
      </motion.div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>

        {/* LEFT COLUMN (65%) */}
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Live Chat */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.5rem', boxShadow: 'var(--shadow-sm)',
            transition: 'box-shadow 0.3s'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Live Mechanic Chat</span>
              </div>
              {isTyping && (
                <div style={{ display: 'flex', gap: 3, padding: '4px 10px', background: 'var(--light-surface)', borderRadius: 12 }}>
                  {[0, 0.2, 0.4].map(d => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)', animation: `typing-dot-bounce 1.4s infinite alternate`, animationDelay: `${d}s` }} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 220, overflowY: 'auto', padding: '0.75rem', background: 'rgba(148,163,184,0.04)', borderRadius: 14, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {chatMessages.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{
                    padding: '0.6rem 0.85rem', borderRadius: 14, fontSize: '0.8rem', maxWidth: '75%', lineHeight: 1.4, fontWeight: 500,
                    background: m.sender === 'user' ? 'var(--primary)' : 'var(--light-surface)',
                    color: m.sender === 'user' ? 'white' : 'var(--text-primary)',
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    borderBottomRightRadius: m.sender === 'user' ? 4 : 14,
                    borderBottomLeftRadius: m.sender === 'user' ? 14 : 4,
                    border: m.sender !== 'user' ? '1px solid var(--border-light)' : 'none'
                  }}>{m.text}</div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', marginTop: 2 }}>
                    {m.time} {m.sender === 'user' && <Check size={10} style={{ color: 'var(--primary)' }} />}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              {["Standing safely by the road", "Hazard lights are flashing", "Okay, waiting!", "Do I need to do anything?"].map(reply => (
                <button key={reply} onClick={() => setChatInput(reply)} style={{
                  padding: '5px 12px', borderRadius: 12, border: '1px solid var(--border-light)',
                  background: 'var(--light-surface)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  color: 'var(--text-secondary)', whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}>{reply}</button>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="Send message to mechanic..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} style={{
                flex: 1, padding: '0.65rem 1rem', borderRadius: 12, border: '1.5px solid var(--border-light)',
                background: 'var(--light-surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem',
                outline: 'none', transition: 'border-color 0.2s'
              }} />
              <button type="submit" style={{
                width: 40, height: 40, borderRadius: 12, background: 'var(--primary)',
                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s'
              }}><Send size={14} /></button>
            </form>
          </div>

          {/* Timeline */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.5rem', boxShadow: 'var(--shadow-sm)'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <Navigation size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Journey Timeline</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: 'var(--border-light)' }} />
              {[
                { label: 'Request Broadcasted', desc: 'SOS signal sent to nearby mechanics', done: true },
                { label: 'Dispatch Accepted', desc: "Alex's Auto Recovery accepted", done: progress >= 15 },
                { label: 'Mechanic En Route', desc: `${eta} min · ${dist} mi remaining`, done: progress >= 35, active: progress >= 15 && progress < 85 },
                { label: 'Arrived at Destination', desc: 'Mechanic is at your location', done: progress >= 85, active: progress >= 35 && progress < 98 },
                { label: 'Repair Completed', desc: 'Service verified & invoiced', done: progress >= 98, active: progress >= 85 }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative', paddingBottom: i < 4 ? '1.25rem' : 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.done ? 'var(--secondary)' : step.active ? 'var(--primary)' : 'var(--light-surface)',
                    border: `2.5px solid ${step.done ? 'var(--secondary)' : step.active ? 'var(--primary)' : 'var(--border-light)'}`,
                    color: step.done || step.active ? 'white' : 'var(--text-muted)',
                    fontSize: '0.65rem', fontWeight: 800, zIndex: 1, flexShrink: 0,
                    boxShadow: step.active ? '0 0 0 4px var(--primary-glow)' : 'none',
                    transition: 'all 0.3s'
                  }}>{step.done ? <Check size={12} /> : i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: step.active ? 800 : 700, fontSize: '0.85rem', color: step.done || step.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Tracking */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.5rem', boxShadow: 'var(--shadow-sm)'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Vehicle Tracking</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Vehicle', value: 'Tesla Model Y', sub: 'White · MH-12-AB-1234' },
                { label: 'Speed', value: '0 km/h', sub: 'Parked · Hazard ON' },
                { label: 'ETA', value: `${status === 'Completed' ? '0' : eta} min`, sub: `${dist} mi remaining` },
                { label: 'Status', value: statusLabel, sub: `Progress ${progress}%` }
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '0.85rem 1rem' }} className="dark:bg-[#0b0f19]">
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN (35%) */}
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* AI Safety Coordinator */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.25rem', boxShadow: 'var(--shadow-sm)'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>AI Safety Coordinator</span>
              </div>
              {aiTyping && (
                <div style={{ display: 'flex', gap: 3, padding: '3px 8px', background: 'var(--light-surface)', borderRadius: 10 }}>
                  {[0, 0.2, 0.4].map(d => (
                    <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', animation: `typing-dot-bounce 1.4s infinite alternate`, animationDelay: `${d}s` }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ height: 160, overflowY: 'auto', padding: '0.5rem', background: 'rgba(148,163,184,0.04)', borderRadius: 12, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {aiMessages.map((m, idx) => (
                <div key={idx} style={{
                  padding: '0.5rem 0.75rem', borderRadius: 12, fontSize: '0.75rem', maxWidth: '85%', lineHeight: 1.35, fontWeight: 500,
                  background: m.sender === 'ai' ? 'var(--primary-glow)' : 'var(--primary)',
                  color: m.sender === 'ai' ? 'var(--primary)' : 'white',
                  alignSelf: m.sender === 'ai' ? 'flex-start' : 'flex-end',
                  borderLeft: m.sender === 'ai' ? '3px solid var(--primary)' : 'none'
                }}>{m.text}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.4rem' }}>
              {["Safety checklist", "Will my car get towed?", "Cancel fees policy?"].map(reply => (
                <button key={reply} onClick={() => setAiInput(reply)} style={{
                  padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border-light)',
                  background: 'var(--light-surface)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                  color: 'var(--text-secondary)', whiteSpace: 'nowrap'
                }}>{reply}</button>
              ))}
            </div>
            <form onSubmit={handleSendAiMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="Ask safety coordinator..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} style={{
                flex: 1, padding: '0.55rem 0.85rem', borderRadius: 10, border: '1.5px solid var(--border-light)',
                background: 'var(--light-surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', outline: 'none'
              }} />
              <button type="submit" style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', border: 'none',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}><Send size={13} /></button>
            </form>
          </div>

          {/* Emergency Tips */}
          <div style={{
            background: 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.15)',
            borderRadius: 20, padding: '1.25rem', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent)' }}>Emergency Safety Tips</span>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1rem', margin: 0 }}>
              {['Turn off engine & engage parking brake', 'Activate hazard warning lights', 'Stand behind guardrails away from traffic', 'Keep phone charged for mechanic contact'].map((tip, i) => (
                <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 600 }}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Trip Status */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.25rem', boxShadow: 'var(--shadow-sm)'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <TrendingDown size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Trip Status</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Request ID', value: 'RR-48291' },
                { label: 'Distance', value: `${dist} mi` },
                { label: 'Elapsed Time', value: `${Math.floor(progress * 0.45)}m ${Math.floor(Math.random() * 59)}s` },
                { label: 'Mechanic ETA', value: `${status === 'Completed' ? '0' : eta} min` }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.25rem', boxShadow: 'var(--shadow-sm)'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <CreditCard size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Payment Summary</span>
            </div>
            <div style={{ background: 'var(--light-surface)', border: '1px dashed var(--border-light)', borderRadius: 14, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }} className="dark:bg-[#0b0f19]">
              {[
                { label: 'Base Mobilization', value: '$49.00' },
                { label: `Distance (${dist} mi)`, value: '$23.10' },
                { label: 'GST/Taxes (18%)', value: '$12.12' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span>{item.label}</span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '0.5rem', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900 }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ color: 'var(--primary)' }}>$84.22</span>
              </div>
            </div>
            {invoicePaid ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--success-glow)', color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem', padding: '0.65rem', borderRadius: 12, border: '1px solid rgba(34,197,94,0.15)', marginTop: '0.75rem' }}>
                <Check size={14} /> Invoice Paid
              </div>
            ) : (
              <button onClick={handlePayInvoice} style={{
                width: '100%', padding: '0.65rem', borderRadius: 12, background: 'var(--primary)',
                border: 'none', color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)', marginTop: '0.75rem', transition: 'all 0.2s'
              }}>
                <CreditCard size={14} /> Pay Now via Stripe ($84.22)
              </button>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
              <button style={{
                flex: 1, padding: '0.5rem', borderRadius: 10, background: 'var(--light-surface)',
                border: '1px solid var(--border-light)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: 'var(--text-secondary)', transition: 'all 0.2s'
              }}><Download size={11} /> Invoice</button>
              <button onClick={cancelSimulation} style={{
                flex: 1, padding: '0.5rem', borderRadius: 10, background: 'var(--light-surface)',
                border: '1px solid var(--border-light)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                color: 'var(--accent)', transition: 'all 0.2s'
              }}>Cancel Request</button>
            </div>
            {showCheckoutToast && (
              <div style={{ background: 'var(--success-glow)', color: 'var(--success)', fontWeight: 700, fontSize: '0.72rem', padding: '0.4rem 0.85rem', borderRadius: 10, marginTop: '0.5rem', textAlign: 'center', border: '1px solid rgba(34,197,94,0.15)' }}>
                Payment Escrow Completed! Receipt emailed.
              </div>
            )}
          </div>

          {/* Emergency Contacts */}
          <div style={{
            background: 'var(--light-bg)', border: '1px solid var(--border-light)',
            borderRadius: 20, padding: '1.25rem', boxShadow: 'var(--shadow-sm)'
          }} className="dark:bg-[var(--light-surface)]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Phone size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Emergency Contacts</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Police', number: '911', color: 'var(--accent)', bg: 'rgba(239,68,68,0.08)' },
                { label: 'Ambulance', number: '108', color: 'var(--accent)', bg: 'rgba(239,68,68,0.08)' },
                { label: 'Family Contact', number: '+91 98765 43210', color: 'var(--primary)', bg: 'var(--primary-glow)' }
              ].map((c, i) => (
                <a key={i} href={`tel:${c.number}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem', borderRadius: 12, background: c.bg,
                  border: `1px solid ${c.color}22`, textDecoration: 'none', transition: 'all 0.2s'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{c.label}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.75rem', color: c.color }}>{c.number}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <motion.div variants={fadeUp} style={{
        display: 'flex', gap: '1rem', justifyContent: 'center', padding: '1rem 0 0'
      }}>
        <button style={{
          padding: '0.85rem 3rem', borderRadius: 16, background: 'var(--primary)',
          border: 'none', color: 'white', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          boxShadow: '0 8px 24px rgba(37,99,235,0.35)', transition: 'all 0.2s'
        }}>
          <Navigation size={18} /> Track Mechanic
        </button>
        <button onClick={cancelSimulation} style={{
          padding: '0.85rem 2.5rem', borderRadius: 16, background: 'var(--light-surface)',
          border: '1.5px solid var(--border-light)', color: 'var(--accent)',
          fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
        }} className="dark:bg-[var(--dark-surface)]">
          Cancel Request
        </button>
      </motion.div>

      {/* ── RATING MODAL ── */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem'
          }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{
              background: 'var(--light-bg)', border: '1px solid var(--border-light)',
              borderRadius: 24, padding: '2rem', maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-lg)'
            }} className="dark:bg-[var(--light-surface)]">
              {showFeedbackSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={36} strokeWidth={3} color="white" />
                    </div>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Thank You for Rating!</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your valuable feedback has been submitted.</p>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={36} strokeWidth={3} color="white" />
                      </div>
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Rate Your Rescue Experience</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Help us keep our service quality world-class.</p>
                  </div>
                  <form onSubmit={handleSubmitRating} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => setRatingStars(star)} style={{
                          fontSize: '2.25rem', cursor: 'pointer', transition: 'transform 0.2s',
                          color: ratingStars >= star ? 'var(--warning)' : 'var(--text-muted)',
                          filter: ratingStars >= star ? 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' : 'none',
                          transform: ratingStars >= star ? 'scale(1.15)' : 'scale(1)'
                        }}>★</span>
                      ))}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Optional Tip</span>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {[5, 10, 15].map(tip => (
                          <button key={tip} type="button" onClick={() => setSelectedTip(tip)} style={{
                            padding: '0.4rem 1.15rem', borderRadius: 9999, border: `1.5px solid ${selectedTip === tip ? 'var(--secondary)' : 'var(--border-light)'}`,
                            background: selectedTip === tip ? 'var(--success-glow)' : 'var(--light-surface)',
                            fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                            color: selectedTip === tip ? 'var(--secondary)' : 'var(--text-secondary)', transition: 'all 0.2s'
                          }} className="dark:bg-[var(--dark-surface)]">${tip}</button>
                        ))}
                      </div>
                    </div>
                    <textarea rows={3} placeholder="Describe your experience (optional)..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} style={{
                      padding: '0.65rem 1rem', borderRadius: 12, border: '1.5px solid var(--border-light)',
                      background: 'var(--light-surface)', color: 'var(--text-primary)', fontWeight: 500,
                      fontSize: '0.82rem', resize: 'none', fontFamily: 'inherit', outline: 'none'
                    }} className="dark:bg-[#0b0f19]" />
                    <button type="submit" disabled={ratingStars === 0} style={{
                      width: '100%', padding: '0.75rem', borderRadius: 14, background: ratingStars === 0 ? 'var(--border-light)' : 'var(--primary)',
                      border: 'none', color: ratingStars === 0 ? 'var(--text-muted)' : 'white',
                      fontWeight: 900, fontSize: '0.9rem', cursor: ratingStars === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: ratingStars > 0 ? '0 4px 12px rgba(37,99,235,0.3)' : 'none', transition: 'all 0.2s'
                    }}>
                      Submit Rating <Check size={16} />
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
