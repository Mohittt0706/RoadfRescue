import React, { useState, useEffect, useRef } from 'react';
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
  Download
} from 'lucide-react';

interface LiveTrackingProps {
  cancelSimulation: () => void;
  setSelectedIssue: (issue: string | null) => void;
  setActiveDashboardTab: (tab: 'home' | 'dispatch' | 'chat' | 'profile') => void;
}

export default function LiveTracking({
  cancelSimulation,
  setSelectedIssue,
  setActiveDashboardTab
}: LiveTrackingProps) {
  // Timeline/Simulation Progress: 0 to 100
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(12);
  const [dist, setDist] = useState(4.2);
  const [status, setStatus] = useState<'Searching' | 'Accepted' | 'On The Way' | 'Arrived' | 'Completed'>('Searching');
  const [truckPos, setTruckPos] = useState({ x: 100, y: 120 });
  const [routeLineProgress, setRouteLineProgress] = useState(0);
  
  // Custom Controls Toggles
  const [zoomLevel, setZoomLevel] = useState(1); // 1x, 1.2x, 1.5x simulation
  const [showTraffic, setShowTraffic] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Layout state: Mobile Bottom Sheet Height toggle ('min' | 'mid' | 'max')
  const [sheetHeight, setSheetHeight] = useState<'min' | 'mid' | 'max'>('mid');
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  // Live Notification Feeds
  const [notifications, setNotifications] = useState<string[]>([
    "🚨 SOS Broadcaster initialized on Mumbai Highway Node.",
    "📡 Telemetry channel locked. Authenticating responder..."
  ]);

  // Mechanic Info Profile
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

  // Chat Console States
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'mechanic', text: "Hi, I'm Alex from Apex Auto Recovery. I've accepted your rescue request and I'm loading my flatbed flat jack. Are you parked in a safe spot?", time: "2m ago" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Assistant Widget States
  const [aiMessages, setAiMessages] = useState<any[]>([
    { sender: 'ai', text: "Hello! I am your AI Safety Coordinator. Heavy traffic is reported 1.2 miles ahead of you. Keep your hazard warning lights engaged. How can I assist you?", time: "Just now" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  // Secure Checkout State
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [showCheckoutToast, setShowCheckoutToast] = useState(false);

  // Rating Feedback States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  // Auto-Simulation effect matching step updates
  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      setRouteLineProgress(currentProgress);

      // Status updates
      if (currentProgress < 15) {
        setStatus('Searching');
      } else if (currentProgress >= 15 && currentProgress < 35) {
        setStatus('Accepted');
        if (currentProgress === 15) {
          pushNotification("✅ Alex's Auto Recovery accepted your dispatch request.");
        }
      } else if (currentProgress >= 35 && currentProgress < 85) {
        setStatus('On The Way');
        const ratio = (currentProgress - 35) / 50;
        setEta(Math.max(2, Math.floor(11 - ratio * 8)));
        setDist(parseFloat((3.8 - ratio * 3.0).toFixed(1)));
        
        if (currentProgress === 35) {
          pushNotification("🚗 Mechanic has departed Apex Center. Dispatching Live GPS.");
        }
        if (currentProgress === 50) {
          pushNotification("🚦 Live Update: Minor traffic slowdown detected on Highway Bypass.");
          simulateMechanicReply("Getting stuck in some traffic on the bypass road, but I'm moving now. Will be there in about 4-5 minutes.");
        }
        if (currentProgress === 75) {
          pushNotification("📍 Mechanic is nearby (less than 1 km). Prepare to flag down.");
        }
      } else if (currentProgress >= 85 && currentProgress < 98) {
        setStatus('Arrived');
        setEta(1);
        setDist(0.1);
        if (currentProgress === 85) {
          pushNotification("👨🔧 Mechanic has arrived at your exact pinned GPS coordinates!");
          simulateMechanicReply("I have arrived! I see your Tesla. Please stay behind the guardrail while I position my truck.");
        }
      } else if (currentProgress >= 98) {
        setStatus('Completed');
        setEta(0);
        setDist(0);
        pushNotification("🎉 Emergency Repair Completed. Invoice payment cleared.");
        clearInterval(interval);
        
        // Auto-show Rating modal after completing repair
        setTimeout(() => {
          setShowRatingModal(true);
        }, 1200);
      }

      // Moving Vehicle SVG Coordinate Math (Translating truck from Node A to User location)
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

  // Scrolling logic helper for Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const pushNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev]);
  };

  // Draggable Bottom Sheet mouse handlers for mobile mock
  const handleTouchStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  const handleTouchMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = dragStartY - clientY;

    if (delta > 60) {
      setSheetHeight('max');
      setDragStartY(null);
    } else if (delta < -60) {
      setSheetHeight('min');
      setDragStartY(null);
    }
  };

  // Live Chat Reply Simulator
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput, time: "Just now" };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Trigger mechanic auto reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [
          ...prev,
          { sender: 'mechanic', text: "Got it! Thanks for confirming. Keep your hazard lights flashing so I can spot your model immediately on approach.", time: "Just now" }
        ]);
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

  // AI Assistant Coordinator Reply Simulator
  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { sender: 'user', text: aiInput, time: "Just now" };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');

    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      let aiResponse = "I've logged your query. Our telemetry shows weather indicators are clear. Stand at least 15 feet behind the metal guardrails for maximum safety.";
      if (aiInput.toLowerCase().includes('towing') || aiInput.toLowerCase().includes('towed')) {
        aiResponse = "Yes. Standard emergency towing is authorized. Once the flatbed arrives, our technician will secure the chassis. You can ride along in the passenger cabin.";
      } else if (aiInput.toLowerCase().includes('cancel')) {
        aiResponse = "Cancellations made within 3 minutes of dispatcher acceptance are free of charge. You can press 'Cancel Request' in the emergency tray to clear.";
      }
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse, time: "Just now" }]);
    }, 1500);
  };

  const handlePayInvoice = () => {
    setInvoicePaid(true);
    setShowCheckoutToast(true);
    pushNotification("💳 Payment of $84.22 cleared successfully via Stripe Escrow.");
    setTimeout(() => setShowCheckoutToast(false), 3000);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingStars === 0) return;

    setShowFeedbackSuccess(true);
    setTimeout(() => {
      // Complete loop - close simulation and return to home dashboard tab
      setShowRatingModal(false);
      setShowFeedbackSuccess(false);
      setSelectedIssue(null);
      cancelSimulation();
      setActiveDashboardTab('home');
    }, 2000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: isFullScreen ? '100vh' : 'calc(100vh - 120px)', minHeight: '650px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* ==========================================
          TOP LIVE NAVIGATION HEADER
          ========================================== */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--glass-bg)',
        borderBottom: '1.5px solid var(--glass-border)',
        backdropFilter: 'var(--glass-blur)',
        padding: '0.85rem 1.5rem',
        zIndex: 50,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="theme-toggle-btn"
            onClick={cancelSimulation}
            title="Cancel Dispatch & Go Back"
            style={{ width: '32px', height: '32px' }}
          >
            <ChevronDown style={{ transform: 'rotate(90deg)' }} size={18} />
          </button>
          <div className="navbar-logo" style={{ cursor: 'default' }}>
            <span style={{ color: 'var(--primary)' }}>Road</span>
            <span>Rescue</span>
          </div>
          <div className="live-pulse-badge">
            <div className="live-pulse-dot"></div>
            <span>LIVE RESCUE ACTIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Notifications panel bell */}
          <div style={{ position: 'relative' }}>
            <button 
              className="theme-toggle-btn" 
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              title="Live Notification Feeds"
            >
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
            </button>

            {showNotificationPanel && (
              <div className="db-notifications-panel animate-slide-up" style={{ right: 0, top: '2.5rem', width: '280px', maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Emergency Feeds</div>
                {notifications.map((n, idx) => (
                  <div key={idx} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => { setSelectedIssue('Emergency SOS'); cancelSimulation(); }} 
            className="btn btn-emergency animate-pulse"
            style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', fontWeight: 800 }}
          >
            🚨 Emergency SOS
          </button>
        </div>
      </nav>

      {/* ==========================================
          FULLSCREEN GPS STYLE VECTOR MAP
          ========================================== */}
      <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
        
        {/* SVG Navigation Grid */}
        <div style={{ width: '100%', height: '100%', background: '#F1F5F9', transition: 'transform 0.2s ease' }} className="dark:bg-slate-900">
          <svg 
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center',
              transition: 'transform 0.4s ease'
            }} 
            viewBox="0 0 500 350"
          >
            <defs>
              <pattern id="tracking-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tracking-grid)" />
            
            {/* Traffic flow layers */}
            {showTraffic && (
              <>
                <path d="M 0,120 L 250,120" className="map-traffic-normal" />
                <path d="M 250,120 L 250,250" className="map-traffic-heavy" />
                <path d="M 250,250 L 500,250" className="map-traffic-normal" />
              </>
            )}

            {/* Road Networks */}
            <path d="M 0,120 L 500,120" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 0,120 L 500,120" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />

            <path d="M 250,0 L 250,350" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 250,0 L 250,350" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />

            <path d="M 0,250 L 500,250" stroke="var(--border-light)" strokeWidth="18" fill="none" opacity="0.8" />
            <path d="M 0,250 L 500,250" stroke="white" strokeWidth="1.2" strokeDasharray="8,8" fill="none" opacity="0.6" />

            {/* Active Highlighted Route Line Path */}
            <path 
              d="M 100,120 L 250,120 L 250,250 L 450,250" 
              className="map-route-drawn"
              strokeDasharray="480"
              strokeDashoffset={480 - (routeLineProgress / 100) * 480}
            />

            {/* User Pin */}
            <g transform="translate(450, 250)">
              <circle cx="0" cy="0" r="16" fill="var(--accent)" opacity="0.15" className="map-pulse-circle" />
              <circle cx="0" cy="0" r="6" fill="var(--accent)" />
              <text x="-12" y="-12" fill="var(--text-primary)" fontSize="8.5" fontWeight="900">Disha (You)</text>
            </g>

            {/* Tow truck dispatch center Node */}
            <g transform="translate(100, 120)">
              <circle cx="0" cy="0" r="12" fill="var(--secondary)" opacity="0.15" />
              <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
              <text x="-25" y="-12" fill="var(--text-muted)" fontSize="8" fontWeight="800">Dispatch Center</text>
            </g>

            {/* Animated Moving Vehicle Node */}
            {status !== 'Searching' && (
              <g transform={`translate(${truckPos.x}, ${truckPos.y})`}>
                <circle cx="0" cy="0" r="14" fill="var(--primary)" opacity="0.25" className="map-pulse-circle" />
                
                {/* Truck shape vector */}
                <rect x="-9" y="-6" width="18" height="12" rx="2.5" fill="var(--primary)" />
                <circle cx="-5" cy="8" r="2.5" fill="#1E293B" />
                <circle cx="5" cy="8" r="2.5" fill="#1E293B" />
                <text x="0" y="-10" textAnchor="middle" fill="var(--primary)" fontSize="8" fontWeight="900">🚗 ALEX</text>
              </g>
            )}
          </svg>
        </div>

        {/* Map Zoom & Overlay Controls Panel */}
        <div className="map-zoom-controls">
          <button className="map-control-btn" onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))} title="Zoom In">+</button>
          <button className="map-control-btn" onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))} title="Zoom Out">-</button>
          <button className="map-control-btn" onClick={() => setShowTraffic(!showTraffic)} title="Toggle Traffic Flow" style={{ color: showTraffic ? 'var(--accent)' : 'var(--text-primary)' }}>🚦</button>
          <button className="map-control-btn" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Fullscreen">
            <Maximize2 size={14} />
          </button>
        </div>

        {/* ==========================================
            DESKTOP LAYOUT (SPLIT SIDE PANELS)
            ========================================== */}
        <div className="db-grid desktop-tracking-sidebar" style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.25rem',
          width: '380px',
          maxHeight: '90%',
          overflowY: 'auto',
          zIndex: 10,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'var(--glass-blur)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Dispatch Info Hero */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RESCUE STATUS
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>
              {status === 'Completed' ? 'Repair Completed!' : status === 'Arrived' ? 'Mechanic has Arrived!' : 'Mechanic is on the way 🚗'}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
                {status === 'Completed' ? '0' : eta} Mins
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Distance: {dist} mi
              </span>
            </div>

            {/* Glowing Stepper progress bar */}
            <div style={{ position: 'relative', height: '6px', background: 'var(--border-light)', borderRadius: '10px', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', 
                  borderRadius: '10px',
                  boxShadow: '0 0 8px var(--primary)',
                  transition: 'width 0.4s ease'
                }}
              ></div>
            </div>
          </div>

          {/* Mechanic Card */}
          <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <img src={mechanic.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt={mechanic.name} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>{mechanic.name}</h4>
                  <span className="verified-badge" style={{ fontSize: '0.55rem' }}>✓ Verified</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mechanic.experience} exp | ⭐ {mechanic.rating} ({mechanic.reviews})</span>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>Specialization:</strong> {mechanic.specialization}<br/>
              <strong>Vehicle:</strong> {mechanic.vehicle}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
              <a href={`tel:${mechanic.phone}`} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.5rem' }}>
                <Phone size={12} />
                <span>Call Mechanic</span>
              </a>
              <a href="#tracking-chat" className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.5rem' }}>
                <MessageSquare size={12} />
                <span>Chat</span>
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>JOURNEY TIMELINE:</span>
            <div className="db-timeline-list" style={{ padding: '0.25rem 0' }}>
              <div className={`db-timeline-item completed`}>
                <div className="db-timeline-dot"></div>
                <span className="db-timeline-title" style={{ fontSize: '0.75rem' }}>Request Broadcasted</span>
              </div>
              <div className={`db-timeline-item ${progress >= 15 ? 'completed' : 'active'}`}>
                <div className="db-timeline-dot"></div>
                <span className="db-timeline-title" style={{ fontSize: '0.75rem' }}>Dispatch Accepted</span>
              </div>
              <div className={`db-timeline-item ${progress >= 35 ? 'completed' : progress >= 15 ? 'active' : ''}`}>
                <div className="db-timeline-dot"></div>
                <span className="db-timeline-title" style={{ fontSize: '0.75rem' }}>Mechanic En Route</span>
              </div>
              <div className={`db-timeline-item ${progress >= 85 ? 'completed' : progress >= 35 ? 'active' : ''}`}>
                <div className="db-timeline-dot"></div>
                <span className="db-timeline-title" style={{ fontSize: '0.75rem' }}>Arrived at Destination</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            MOBILE DRAGGABLE BOTTOM SHEET LAYOUT
            ========================================== */}
        <div 
          className="draggable-bottom-sheet mobile-only" 
          style={{
            transform: sheetHeight === 'min' ? 'translateY(82%)' : sheetHeight === 'mid' ? 'translateY(40%)' : 'translateY(0%)'
          }}
        >
          {/* Header Handle Bar */}
          <div 
            className="bottom-sheet-handle-bar" 
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            onMouseMove={handleTouchMove}
            onTouchMove={handleTouchMove}
          ></div>
          
          <div className="bottom-sheet-content">
            {/* Sheet Title / ETA Hero */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', display: 'block', textTransform: 'uppercase' }}>
                  RESCUE ROUTING ETA:
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {status === 'Completed' ? 'Completed' : `${eta} Mins`}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REMAINING:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {dist} mi | Avg Speed 24mph
                </span>
              </div>
            </div>

            {/* Mechanic floating info card */}
            <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img src={mechanic.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt={mechanic.name} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{mechanic.name}</span>
                  <span className="verified-badge" style={{ fontSize: '0.55rem' }}>✓ Verified</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⭐ {mechanic.rating} ({mechanic.reviews}) | {mechanic.experience} exp</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                <a href={`tel:${mechanic.phone}`} className="theme-toggle-btn" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }} title="Call Mechanic">
                  <Phone size={16} />
                </a>
              </div>
            </div>

            {/* Stepper timeline summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 0', borderBottom: '1px solid var(--border-light)', borderTop: '1px solid var(--border-light)', margin: '1.25rem 0' }}>
              <div style={{ textAlign: 'center', opacity: progress >= 15 ? 1 : 0.4 }}>
                <span style={{ fontSize: '1rem', display: 'block' }}>📋</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>Accepted</span>
              </div>
              <div style={{ textAlign: 'center', opacity: progress >= 35 ? 1 : 0.4 }}>
                <span style={{ fontSize: '1rem', display: 'block' }}>🚗</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>En Route</span>
              </div>
              <div style={{ textAlign: 'center', opacity: progress >= 85 ? 1 : 0.4 }}>
                <span style={{ fontSize: '1rem', display: 'block' }}>📍</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>Arrived</span>
              </div>
              <div style={{ textAlign: 'center', opacity: progress >= 98 ? 1 : 0.4 }}>
                <span style={{ fontSize: '1rem', display: 'block' }}>🏁</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>Completed</span>
              </div>
            </div>

            {/* Swipe Toggle label helper */}
            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <button 
                onClick={() => setSheetHeight(prev => prev === 'max' ? 'mid' : 'max')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {sheetHeight === 'max' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{sheetHeight === 'max' ? 'Collapse Details Panel' : 'Expose Diagnostics, Chat & Invoices'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ==========================================
          LOWER CONTENT CONTAINER (CHAT, INVOICES, CHATBOTS)
          ========================================== */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '1.5rem', 
        padding: '1.5rem',
        background: 'var(--light-bg)',
        borderTop: '1.5px solid var(--border-light)',
        overflowY: 'auto',
        maxHeight: '400px'
      }}>
        
        {/* Widget 1: Live Chat Panel */}
        <div className="db-card" id="tracking-chat" style={{ padding: '1.25rem' }}>
          <div className="db-card-title-row" style={{ marginBottom: '0.75rem' }}>
            <div className="db-card-title" style={{ fontSize: '0.95rem' }}>💬 Live Mechanic Chat Logs</div>
            {isTyping && (
              <div className="typing-dots-wrapper" style={{ marginLeft: 'auto' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>

          <div className="tracking-chat-log">
            {chatMessages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className={`chat-msg-bubble ${m.sender}`}>
                  {m.text}
                </div>
                <span className="chat-receipts-row" style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.time} {m.sender === 'user' && <Check size={10} style={{ color: 'var(--primary)' }} />}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies Panel */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            {[
              "Standing safely by the road",
              "Hazard lights are flashing",
              "Okay, waiting!",
              "Do I need to do anything?"
            ].map(reply => (
              <button 
                key={reply}
                onClick={() => {
                  setChatInput(reply);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--light-surface)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Send message to mechanic..."
              className="form-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Widget 2: AI Safety Assistant Widget */}
        <div className="db-card" style={{ padding: '1.25rem' }}>
          <div className="db-card-title-row" style={{ marginBottom: '0.75rem' }}>
            <div className="db-card-title" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>🤖 AI Safety Coordinator</div>
            {aiTyping && (
              <div className="typing-dots-wrapper" style={{ marginLeft: 'auto' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>

          <div className="tracking-chat-log" style={{ height: '175px' }}>
            {aiMessages.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className={`chat-msg-bubble ${m.sender === 'ai' ? 'mechanic' : 'user'}`} style={{ borderLeft: m.sender === 'ai' ? '3px solid var(--primary)' : 'none' }}>
                  {m.text}
                </div>
                <span className="chat-receipts-row" style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Safety presets */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            {[
              "Safety checklist",
              "Will my car get towed?",
              "Cancel fees policy?"
            ].map(reply => (
              <button 
                key={reply}
                onClick={() => {
                  setAiInput(reply);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--light-surface)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendAiMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Ask safety coordinator..."
              className="form-input"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              style={{ flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Widget 3: Invoice Checkout Billing summary */}
        <div className="db-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="db-card-title-row">
            <div className="db-card-title" style={{ fontSize: '0.95rem' }}>💳 Stripe Checkout Invoice</div>
          </div>

          <div className="pricing-breakdown-card" style={{ padding: '0.85rem' }}>
            <div className="pricing-line" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <span>Base Mobilization Charge</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>$49.00</span>
            </div>
            <div className="pricing-line" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <span>Distance fee (4.2 mi)</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>$23.10</span>
            </div>
            <div className="pricing-line" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <span>GST/Taxes (18%)</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>$12.12</span>
            </div>
            <div className="pricing-line total" style={{ fontSize: '1rem', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total Secure Bill</span>
              <span style={{ color: 'var(--primary)' }}>$84.22</span>
            </div>
          </div>

          {invoicePaid ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'var(--success-glow)',
              color: 'var(--success)',
              fontWeight: 800,
              fontSize: '0.85rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--success-glow)'
            }}>
              <Check size={16} />
              <span>✓ INVOICE ESCROW PAID</span>
            </div>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handlePayInvoice}
              style={{ width: '100%', padding: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <CreditCard size={16} />
              <span>Pay Now via Stripe ($84.22)</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Download size={12} />
              <span>Invoice</span>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={cancelSimulation}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)' }}
            >
              Cancel Request
            </button>
          </div>

          {showCheckoutToast && (
            <div className="accuracy-indicator" style={{ background: 'var(--success-glow)', color: 'var(--success)', alignSelf: 'center' }}>
              <span>Payment Escrow Completed! Receipt emailed.</span>
            </div>
          )}
        </div>

      </div>

      {/* ==========================================
          EMERGENCY DRAWER CONTROLS PANEL
          ========================================== */}
      <div style={{
        background: 'var(--glass-bg)',
        borderTop: '1px solid var(--border-light)',
        backdropFilter: 'var(--glass-blur)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        zIndex: 40
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>
          <ShieldAlert size={16} />
          <span>EMERGENCY ASSIST:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href="tel:911" className="btn btn-emergency" style={{ fontSize: '0.7rem', padding: '0.4rem 0.85rem' }}>🚓 Call Police</a>
          <a href="tel:108" className="btn btn-emergency" style={{ fontSize: '0.7rem', padding: '0.4rem 0.85rem' }}>🏥 Call Ambulance</a>
          <button onClick={() => pushNotification("🚨 Family contacts notified with your exact GPS telemetry coordinates.")} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.85rem', fontWeight: 700 }}>👨👩 Emergency Contacts</button>
        </div>
      </div>

      {/* ==========================================
          RATING & STAR FEEDBACK DIALOG MODAL
          ========================================== */}
      {showRatingModal && (
        <div className="success-screen-overlay">
          <div className="success-badge-animation" style={{ background: 'var(--success-glow)' }}>
            <div className="success-badge-circle">
              <Check size={48} strokeWidth={3} />
            </div>
          </div>

          {showFeedbackSuccess ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                Thank You for Rating!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Your valuable feedback has been submitted. Clearing emergency routing nodes...
              </p>
            </div>
          ) : (
            <div className="success-detail-box" style={{ maxWidth: '400px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.25rem' }}>Rate Your Rescue Experience</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Help us keep our service quality world-class. Rate Alex's Auto Recovery.
              </p>

              <form onSubmit={handleSubmitRating} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                
                {/* Stars Grid Row */}
                <div className="feedback-stars-row">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={`star-btn-icon ${ratingStars >= star ? 'active' : ''}`}
                      onClick={() => setRatingStars(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Tipping pills */}
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                    ADD AN OPTIONAL TIP FOR ALEX:
                  </span>
                  <div className="tip-amount-pills">
                    {[5, 10, 15].map(tip => (
                      <button 
                        key={tip}
                        type="button"
                        className={`tip-pill-btn ${selectedTip === tip ? 'active' : ''}`}
                        onClick={() => setSelectedTip(tip)}
                      >
                        ${tip}
                      </button>
                    ))}
                    <button 
                      type="button" 
                      className={`tip-pill-btn ${selectedTip === 99 ? 'active' : ''}`}
                      onClick={() => setSelectedTip(99)}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label">Written Feedback</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe your experience (optional)..."
                    className="form-input"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    style={{ resize: 'none', fontSize: '0.8rem', fontFamily: 'inherit' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={ratingStars === 0}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 900, fontSize: '0.9rem', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span>Submit Star Rating</span>
                  <Check size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
