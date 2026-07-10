import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: 'emergency' | 'service' | 'payment' | 'ai' | 'security' | 'announcement';
  priority: 'emergency' | 'high' | 'medium' | 'low';
  isUnread: boolean;
}

export default function NotificationsCenter() {
  /* --- Notifications List State --- */
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: "Accident detected on Western Express Highway",
      body: "High-priority crash reports registered 0.5 mi away from your active coordinate pins. Emergency rescue fleets matching route paths.",
      timestamp: "09:30 AM",
      category: 'emergency',
      priority: 'emergency',
      isUnread: true
    },
    {
      id: 'n-2',
      title: "Rahul Sharma (Mechanic) is on the way",
      body: "Jumper kit dispatcher dispatched. GPS tracking initialized. Vehicle: MH-12-XX-9999 (Towing truck).",
      timestamp: "09:35 AM",
      category: 'service',
      priority: 'high',
      isUnread: true
    },
    {
      id: 'n-3',
      title: "Live GPS Tracker: Mechanic is 2 km away",
      body: "Vasant Kunj expressway lane. ETA updated: 5 minutes. Watch live routing paths.",
      timestamp: "09:40 AM",
      category: 'service',
      priority: 'medium',
      isUnread: true
    },
    {
      id: 'n-4',
      title: "Payment Captured Successfully",
      body: "Transaction Ref: TXN-RR-829103. Amount: $65.60. Billing invoice receipt saved to downloads.",
      timestamp: "09:50 AM",
      category: 'payment',
      priority: 'medium',
      isUnread: false
    },
    {
      id: 'n-5',
      title: "AI Recommendation: Tire Pressure Warning",
      body: "Obd sensor warning: Rear-Left tire pressure registers 28 PSI. Recommended: top up air to 35 PSI. AI Confidence: 99%.",
      timestamp: "Yesterday",
      category: 'ai',
      priority: 'low',
      isUnread: false
    },
    {
      id: 'n-6',
      title: "Security: New device login detected",
      body: "Device: Chrome Browser on Windows (IP: 192.168.1.42). Mumbai, India.",
      timestamp: "2 days ago",
      category: 'security',
      priority: 'high',
      isUnread: false
    },
    {
      id: 'n-7',
      title: "Loyalty Milestone: Gold Badge Unlocked",
      body: "Congratulations! You have earned 4,200 points. Gold member cashback discounts applied to future dispatches.",
      timestamp: "3 days ago",
      category: 'announcement',
      priority: 'low',
      isUnread: false
    }
  ]);

  /* --- Category Filters State --- */
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  /* --- Dropdown Filters --- */
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  /* --- Notification Preferences Toggles --- */
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [trackingAlerts, setTrackingAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  /* --- Real-Time Simulation Interval --- */
  useEffect(() => {
    const alertsPool = [
      {
        title: "Live GPS Tracker: Mechanic has arrived",
        body: "Rahul Sharma is at Bandra Kurla Complex. Look for safety towing truck MH-12-XX-9999.",
        category: 'service' as const,
        priority: 'high' as const
      },
      {
        title: "AI Recommendation: Battery Health check",
        body: "Voltage logs register 11.8V (Normal: 12.6V). Recommended: Battery replacement before winter. AI Confidence: 94%.",
        category: 'ai' as const,
        priority: 'low' as const
      },
      {
        title: "Refunding Escrow Deposit",
        body: "Escrow release complete. Refund of $10.00 initiated for double payment. Checked by YES Bank gateway.",
        category: 'payment' as const,
        priority: 'medium' as const
      }
    ];

    let alertsIdx = 0;
    const interval = setInterval(() => {
      if (alertsIdx >= alertsPool.length) {
        clearInterval(interval);
        return;
      }
      
      const newAlert: NotificationItem = {
        id: 'n-sim-' + Date.now(),
        title: alertsPool[alertsIdx].title,
        body: alertsPool[alertsIdx].body,
        timestamp: "Just Now",
        category: alertsPool[alertsIdx].category,
        priority: alertsPool[alertsIdx].priority,
        isUnread: true
      };

      setNotifications(prev => [newAlert, ...prev]);
      alertsIdx++;
    }, 20000); // Trigger mock alerts every 20 seconds to show dynamic updates

    return () => clearInterval(interval);
  }, []);

  /* --- Tallies calculations --- */
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => n.isUnread).length;
  const activeRequests = notifications.filter(n => n.category === 'service' && n.isUnread).length;
  const emergencyCount = notifications.filter(n => n.category === 'emergency').length;

  /* --- Notification Action handlers --- */
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isUnread: !n.isUnread } : n));
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  /* --- Apply Filters & Search --- */
  const filteredNotifications = notifications.filter(n => {
    // 1. Category Filter
    if (activeCategory !== 'all' && n.category !== activeCategory) return false;
    
    // 2. Priority Filter
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    
    // 3. Status Filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'unread' && !n.isUnread) return false;
      if (filterStatus === 'read' && n.isUnread) return false;
    }

    // 4. Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query);
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. HERO COUNTERS OVERVIEW */}
      <div className="db-welcome-banner" style={{ padding: '1.75rem 2rem', background: 'radial-gradient(circle at 100% 0%, rgba(37,99,235,0.06) 0%, transparent 50%)', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.25rem', textAlign: 'left', color: 'var(--text-primary)' }}>
            Notifications & Activity Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left' }}>
            Check real-time dispatch dispatches, warning lights diagnostics, payment clears, and emergency alerts.
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button 
              onClick={handleMarkAllRead} 
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: 800 }}
            >
              ✓ Mark All as Read
            </button>
            <button 
              onClick={handleClearAll} 
              className="btn btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent)' }}
            >
              Clear All Alerts
            </button>
          </div>
        </div>

        {/* Counter cards dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', width: '100%' }}>
          <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', display: 'block' }}>🔔</span>
            <strong style={{ fontSize: '1.05rem', display: 'block', color: 'var(--primary)', marginTop: '0.15rem' }}>{totalCount}</strong>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Total</span>
          </div>

          <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', display: 'block' }}>🚨</span>
            <strong style={{ fontSize: '1.05rem', display: 'block', color: 'var(--accent)', marginTop: '0.15rem' }}>{unreadCount}</strong>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Unread</span>
          </div>

          <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', display: 'block' }}>🚗</span>
            <strong style={{ fontSize: '1.05rem', display: 'block', color: 'var(--secondary)', marginTop: '0.15rem' }}>{activeRequests}</strong>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Active</span>
          </div>

          <div style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', display: 'block' }}>⚠️</span>
            <strong style={{ fontSize: '1.05rem', display: 'block', color: '#f59e0b', marginTop: '0.15rem' }}>{emergencyCount}</strong>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Alerts</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIES FILTER GRID */}
      <div className="notification-cat-grid">
        {[
          { id: 'all', label: 'All Alerts', icon: '⚡' },
          { id: 'emergency', label: 'SOS Emergency', icon: '🚨' },
          { id: 'service', label: 'Dispatches', icon: '🚗' },
          { id: 'payment', label: 'Payments', icon: '💳' },
          { id: 'ai', label: 'AI Advice', icon: '🤖' },
          { id: 'security', label: 'Security', icon: '🔒' }
        ].map(cat => (
          <div 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`notification-cat-card ${activeCategory === cat.id ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* 3. TIMELINE & SETTINGS MULTI-GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: FILTER CONTROLS & TIMELINE FEED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* SEARCH & FILTERS ROW */}
          <div className="ai-glass-panel" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem', alignItems: 'center', padding: '0.85rem' }}>
            
            <div className="ai-history-search" style={{ padding: '0.4rem 0.75rem', width: '100%' }}>
              <Search size={14} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search notification logs..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <select 
                value={filterPriority} 
                onChange={e => setFilterPriority(e.target.value)}
                className="auth-input-field" 
                style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}
              >
                <option value="all">Priority: All</option>
                <option value="emergency">🚨 Emergency</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="auth-input-field" 
                style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}
              >
                <option value="all">Status: All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

          </div>

          {/* CHRONOLOGICAL TIMELINE DISPATCH */}
          {activeCategory === 'service' && (
            <div className="ai-glass-panel">
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⏱️ Active Dispatch Telemetry Timeline
              </h3>
              
              <div className="timeline-stepper">
                <div className="timeline-step-item completed">
                  <div className="timeline-step-dot"></div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>09:30 AM - Roadside assistance request accepted</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Pune highway coordinate bounds assigned to Rahul Sharma.</span>
                </div>
                
                <div className="timeline-step-item completed">
                  <div className="timeline-step-dot"></div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>09:35 AM - Rahul Sharma is on the way</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Towing flat battery Jumper service truck MH-12-XX-9999 dispatched.</span>
                </div>

                <div className="timeline-step-item active">
                  <div className="timeline-step-dot"></div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>09:40 AM - Dispatcher is 2 km away (Active Tracker)</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live ETA countdown: 5 minutes. GPS pins locking routing directions.</span>
                </div>

                <div className="timeline-step-item">
                  <div className="timeline-step-dot"></div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>09:50 AM - Arrival confirmation</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mechanic reaches target breakdown site.</span>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION FEED CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredNotifications.map(n => (
              <div 
                key={n.id} 
                className={`notification-card priority-${n.priority} ${n.isUnread ? 'unread' : ''}`}
              >
                {/* Category Icon */}
                <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: '2px' }}>
                  {n.category === 'emergency' && '🚨'}
                  {n.category === 'service' && '🚗'}
                  {n.category === 'payment' && '💳'}
                  {n.category === 'ai' && '🤖'}
                  {n.category === 'security' && '🔒'}
                  {n.category === 'announcement' && '📢'}
                </div>

                {/* Body details */}
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{n.title}</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{n.timestamp}</span>
                  </div>
                  
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    {n.body}
                  </p>
                  
                  {/* Actions row inside card */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', borderTop: '1px dashed var(--border-light)', paddingTop: '0.4rem' }}>
                    <button 
                      onClick={() => handleToggleRead(n.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '2px 8px', fontSize: '0.68rem' }}
                    >
                      {n.isUnread ? "Mark as Read" : "Mark as Unread"}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(n.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '2px', color: 'var(--accent)', marginLeft: 'auto' }}
                      title="Archive alert"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="ai-glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>Notification center clear!</strong>
                <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                  No new alerts matching filter priority scopes.
                </span>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: NOTIFICATION SETTINGS TOGGLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* NOTIFICATION PREFERENCES */}
          <div className="ai-glass-panel">
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              ⚙️ Alert Configuration
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              <div className="toggle-switch-container">
                <div>
                  <strong style={{ fontSize: '0.78rem', display: 'block' }}>Push Notifications</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Browser notifications for live dispatches.</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={pushEnabled} onChange={e => setPushEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-switch-container">
                <div>
                  <strong style={{ fontSize: '0.78rem', display: 'block' }}>SMS Text Warnings</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Auto text contacts in crash events.</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-switch-container">
                <div>
                  <strong style={{ fontSize: '0.78rem', display: 'block' }}>Email Billing Receipts</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Invoices and payments clearances.</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={emailEnabled} onChange={e => setEmailEnabled(e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>SELECT CATEGORIES:</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.72rem' }}>
                  {[
                    { state: bookingAlerts, setter: setBookingAlerts, label: "🚗 Service Request updates" },
                    { state: trackingAlerts, setter: setTrackingAlerts, label: "📍 Live GPS ETA warnings" },
                    { state: paymentAlerts, setter: setPaymentAlerts, label: "💳 Escrow Invoice clearances" },
                    { state: aiSuggestions, setter: setAiSuggestions, label: "🤖 AI Diagnoser advice logs" },
                    { state: emergencyAlerts, setter: setEmergencyAlerts, label: "🚨 Road safety broadcasts" }
                  ].map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={item.state} onChange={e => item.setter(e.target.checked)} style={{ width: '12px', height: '12px' }} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ACTIVITY STATISTICS ANALYTICS */}
          <div className="ai-glass-panel">
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.75rem' }}>📊 Dispatch Analytics</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem 0.75rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Total Requests Run</span>
                  <strong>12</strong>
                </div>
                {/* Micro spark chart bar */}
                <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.35rem' }}>
                  <div style={{ height: '100%', width: '70%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                </div>
              </div>

              <div style={{ padding: '0.5rem 0.75rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Escrow spent</span>
                  <strong>$420.00</strong>
                </div>
                <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.35rem' }}>
                  <div style={{ height: '100%', width: '55%', background: 'var(--secondary)', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
