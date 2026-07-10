import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardList, MapPin, Clock, Check, X, Phone, MessageCircle, Navigation,
  ChevronRight, Search, Filter, RefreshCw, Locate, Maximize2, Eye, Send,
  AlertTriangle, Zap, Wrench, Car, Timer, DollarSign, Star, TrendingUp,
  ArrowUpRight, Image, Shield, Bot, Bell, AlertCircle, CheckCircle, Info,
  Camera, FileText, User, Truck
} from 'lucide-react';
import '../incoming-requests.css';
import { BookingStore, NotificationStore } from '../services/store';

interface IncomingRequestsPageProps {
  onBack: () => void;
}

interface Request {
  id: string;
  customer: string;
  initials: string;
  avatarColor: string;
  phone: string;
  vehicle: string;
  vehicleType: string;
  plate: string;
  issue: string;
  issueIcon: string;
  description: string;
  distance: string;
  eta: string;
  serviceTime: string;
  earnings: number;
  priority: 'emergency' | 'high' | 'medium' | 'normal';
  timeLeft: number;
  matchScore: number;
  location: string;
  images: number;
  paymentMethod: string;
  emergencyContact: string;
  customerNotes: string;
  aiSeverity: string;
  aiRepairTime: string;
  aiTools: string;
  aiParts: string;
  aiCost: string;
  aiConfidence: number;
}

interface FeedItem {
  id: string;
  type: 'new' | 'update' | 'cancel' | 'accepted' | 'eta';
  text: string;
  time: string;
}

const initialRequests: Request[] = [
  {
    id: 'r1', customer: 'Sarah Chen', initials: 'SC', avatarColor: '#EC4899', phone: '+1 (415) 555-0123',
    vehicle: 'Honda Civic 2022', vehicleType: 'Sedan', plate: 'ABC-1234',
    issue: 'Flat Tire', issueIcon: 'tire', description: 'Rear left tire completely flat after hitting a pothole on Highway 101. Spare tire in trunk.',
    distance: '1.8 km', eta: '6 min', serviceTime: '25 min', earnings: 45, priority: 'high', timeLeft: 85, matchScore: 94,
    location: 'Main St & 5th Ave, San Francisco', images: 3, paymentMethod: 'Credit Card', emergencyContact: 'Mike Chen +1 (415) 555-0456',
    customerNotes: 'Parked near the gas station on the corner. Hazard lights are on.', aiSeverity: 'Medium', aiRepairTime: '20-30 min',
    aiTools: 'Jack, Lug Wrench', aiParts: 'Spare Tire', aiCost: '$40-55', aiConfidence: 92
  },
  {
    id: 'r2', customer: 'James Miller', initials: 'JM', avatarColor: '#2563EB', phone: '+1 (415) 555-0789',
    vehicle: 'Toyota Camry 2021', vehicleType: 'Sedan', plate: 'XYZ-5678',
    issue: 'Dead Battery', issueIcon: 'battery', description: 'Car won\'t start after leaving lights on overnight. Dashboard lights flicker when key turned.',
    distance: '2.4 km', eta: '8 min', serviceTime: '15 min', earnings: 35, priority: 'medium', timeLeft: 72, matchScore: 88,
    location: 'Oak Park Dr, San Francisco', images: 1, paymentMethod: 'Apple Pay', emergencyContact: 'N/A',
    customerNotes: '', aiSeverity: 'Low', aiRepairTime: '10-15 min',
    aiTools: 'Jump Starter', aiParts: 'N/A', aiCost: '$30-40', aiConfidence: 96
  },
  {
    id: 'r3', customer: 'Emergency: Lisa Park', initials: 'LP', avatarColor: '#EF4444', phone: '+1 (415) 555-0345',
    vehicle: 'Ford F-150 2023', vehicleType: 'Truck', plate: 'DEF-9012',
    issue: 'Engine Overheating', issueIcon: 'engine', description: 'Temperature gauge in red zone. Steam coming from hood. On highway shoulder - need immediate assistance.',
    distance: '3.1 km', eta: '10 min', serviceTime: '45 min', earnings: 85, priority: 'emergency', timeLeft: 45, matchScore: 97,
    location: 'Highway 101 Northbound, Mile Marker 42', images: 4, paymentMethod: 'Credit Card', emergencyContact: '911 Called',
    customerNotes: 'SAFETY CONCERN - vehicle on highway shoulder', aiSeverity: 'Critical', aiRepairTime: '40-60 min',
    aiTools: 'Coolant, Radiator Tools', aiParts: 'Coolant, Thermostat', aiCost: '$75-110', aiConfidence: 85
  },
  {
    id: 'r4', customer: 'David Lee', initials: 'DL', avatarColor: '#22C55E', phone: '+1 (415) 555-0567',
    vehicle: 'BMW X5 2022', vehicleType: 'SUV', plate: 'GHI-3456',
    issue: 'Lockout', issueIcon: 'lock', description: 'Keys locked inside car. Fob battery also dead. Need professional unlock service.',
    distance: '4.2 km', eta: '12 min', serviceTime: '20 min', earnings: 55, priority: 'normal', timeLeft: 120, matchScore: 82,
    location: 'Market Street Parking, SF', images: 0, paymentMethod: 'Google Pay', emergencyContact: 'N/A',
    customerNotes: 'In a rush - have a meeting in 30 minutes', aiSeverity: 'Low', aiRepairTime: '15-20 min',
    aiTools: 'Lockout Kit, Slim Jim', aiParts: 'N/A', aiCost: '$50-65', aiConfidence: 98
  },
];

const feedItems: FeedItem[] = [
  { id: 'f1', type: 'new', text: 'New request from Sarah Chen - Flat Tire', time: '30s ago' },
  { id: 'f2', type: 'eta', text: 'Customer updated: James Miller location changed', time: '1m ago' },
  { id: 'f3', type: 'new', text: 'EMERGENCY: Lisa Park - Engine Overheating', time: '2m ago' },
  { id: 'f4', type: 'accepted', text: 'Request r5 accepted by another mechanic', time: '3m ago' },
  { id: 'f5', type: 'cancel', text: 'Request r6 cancelled by customer', time: '5m ago' },
  { id: 'f6', type: 'update', text: 'ETA updated: David Lee - 12 min', time: '6m ago' },
];

const quickReplies = [
  "I'm on my way!",
  "Almost there",
  "Can you share location?",
  "Check your hazard lights",
  "I'll call you"
];

export default function IncomingRequestsPage({ onBack }: IncomingRequestsPageProps) {
  /* --- State --- */
  const [requests, setRequests] = useState<any[]>([]);
  const [detailRequest, setDetailRequest] = useState<any | null>(null);
  const [chatRequest, setChatRequest] = useState<any | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ text: string; out: boolean }[]>([
    { text: "Hi! I'm on my way to assist you.", out: true },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const userStr = localStorage.getItem('user');
    let email = 'rajesh@roadrescue.in';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.email) email = u.email;
      } catch (e) {}
    }

    const list = BookingStore.getAll()
      .filter((b: any) => b.mechanic_email?.toLowerCase() === email.toLowerCase() && b.status === 'Mechanic Assigned')
      .map((b: any) => ({
        id: b.id,
        customer: b.customer,
        initials: b.customer.split(' ').map((n: any) => n[0]).join(''),
        avatarColor: '#EC4899',
        phone: b.phone,
        vehicle: b.vehicle,
        vehicleType: 'Sedan',
        plate: b.vehicle_number,
        issue: b.service,
        description: b.notes || 'Roadside assistance requested.',
        distance: '2.5 km',
        eta: b.eta,
        serviceTime: '25 min',
        earnings: Math.floor((b.price || 0) * 0.8),
        priority: 'high',
        timeLeft: 90,
        matchScore: 95,
        location: b.address,
        images: 0,
        paymentMethod: b.paymentMethod || 'Cash',
        emergencyContact: 'N/A',
        customerNotes: b.notes || '',
        aiSeverity: 'Medium',
        aiRepairTime: '20-30 min',
        aiTools: 'Wrench, Jack',
        aiParts: 'N/A',
        aiCost: `₹${b.price}`,
        aiConfidence: 94
      }));
    setRequests(list);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = BookingStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  /* --- Filters --- */
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterDistance, setFilterDistance] = useState('all');
  const [filterIssue, setFilterIssue] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('nearest');

  /* --- Animated counters --- */
  const [counters, setCounters] = useState({ new: 0, nearby: 0, emergency: 0, accepted: 0 });
  const countersRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countersAnimated.current) {
        countersAnimated.current = true;
        const duration = 1800;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = progress * (2 - progress);
          setCounters({
            new: Math.floor(ease * requests.length),
            nearby: Math.floor(ease * requests.filter(r => parseFloat(r.distance) < 3).length),
            emergency: Math.floor(ease * requests.filter(r => r.priority === 'emergency').length),
            accepted: Math.floor(ease * 8),
          });
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.2 });
    if (countersRef.current) observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, [requests.length]);

  /* --- Countdown timers --- */
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests(prev => prev.map(r => {
        if (r.timeLeft <= 0) return r;
        return { ...r, timeLeft: r.timeLeft - 1 };
      }).filter(r => r.timeLeft > 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* --- Chat auto-scroll --- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* --- Handlers --- */
  const handleAccept = useCallback((id: string) => {
    BookingStore.updateStatus(id, 'Mechanic Accepted');
    NotificationStore.create({
      title: '✅ Job Accepted',
      message: `Mechanic accepted job ${id}`,
      role: 'admin',
      type: 'alert'
    });
    loadData();
  }, []);

  const handleDecline = useCallback((id: string) => {
    BookingStore.updateStatus(id, 'Cancelled', 'Mechanic declined the request');
    loadData();
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { text: chatInput, out: true }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: "Thanks for the update! I'll wait here.", out: false }]);
    }, 1000);
  }, [chatInput]);

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - rect.left - 75}px`;
    ripple.style.top = `${e.clientY - rect.top - 75}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }, []);

  /* --- Filter & Sort --- */
  const filteredRequests = requests
    .filter(r => filterVehicle === 'all' || r.vehicleType.toLowerCase() === filterVehicle)
    .filter(r => filterDistance === 'all' || parseFloat(r.distance) <= parseFloat(filterDistance))
    .filter(r => filterIssue === 'all' || r.issue.toLowerCase().includes(filterIssue))
    .filter(r => filterPriority === 'all' || r.priority === filterPriority)
    .sort((a, b) => {
      if (sortBy === 'nearest') return parseFloat(a.distance) - parseFloat(b.distance);
      if (sortBy === 'earnings') return b.earnings - a.earnings;
      if (sortBy === 'emergency') {
        const order: Record<string, number> = { emergency: 0, high: 1, medium: 2, normal: 3 };
        return order[a.priority] - order[b.priority];
      }
      return 0;
    });

  /* --- Map markers --- */
  const mapMarkers = [
    { top: '48%', left: '45%', type: 'user' as const, label: 'You' },
    ...filteredRequests.map((r, i) => ({
      top: `${25 + i * 12}%`,
      left: `${55 + (i % 2) * 15}%`,
      type: r.priority === 'emergency' ? 'customer-high' as const : 'customer-normal' as const,
      label: r.customer.split(' ')[0],
    }))
  ];

  const getIssueIcon = (issue: string) => {
    if (issue.toLowerCase().includes('tire')) return <Car size={20} />;
    if (issue.toLowerCase().includes('battery')) return <Zap size={20} />;
    if (issue.toLowerCase().includes('engine') || issue.toLowerCase().includes('overheat')) return <AlertTriangle size={20} />;
    if (issue.toLowerCase().includes('lock')) return <Shield size={20} />;
    return <Wrench size={20} />;
  };

  const getIssueColor = (issue: string) => {
    if (issue.toLowerCase().includes('tire')) return { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' };
    if (issue.toLowerCase().includes('battery')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
    if (issue.toLowerCase().includes('engine') || issue.toLowerCase().includes('overheat')) return { bg: 'var(--accent-glow)', color: '#EF4444' };
    if (issue.toLowerCase().includes('lock')) return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' };
    return { bg: 'var(--secondary-glow)', color: '#22C55E' };
  };

  const getCountdownClass = (timeLeft: number) => {
    if (timeLeft <= 20) return 'urgent';
    if (timeLeft <= 50) return 'warning';
    return 'safe';
  };

  return (
    <div className="mir-page">
      {/* ===== HERO ===== */}
      <div className="mir-hero" ref={countersRef}>
        <div className="mir-hero-content">
          <div className="mir-hero-badge">
            <span className="mir-hero-badge-dot" />
            Live Updates Active
          </div>
          <h1>Incoming Assistance Requests</h1>
          <p>Review nearby roadside assistance requests in real time. Accept jobs that match your location, expertise, and availability.</p>
          <div className="mir-hero-counters">
            <div className="mir-hero-counter">
              <span className="mir-hero-counter-value">{counters.new}</span>
              <span className="mir-hero-counter-label">New Requests</span>
            </div>
            <div className="mir-hero-counter">
              <span className="mir-hero-counter-value">{counters.nearby}</span>
              <span className="mir-hero-counter-label">Nearby</span>
            </div>
            <div className="mir-hero-counter">
              <span className="mir-hero-counter-value">{counters.emergency}</span>
              <span className="mir-hero-counter-label">High Priority</span>
            </div>
            <div className="mir-hero-counter">
              <span className="mir-hero-counter-value">{counters.accepted}</span>
              <span className="mir-hero-counter-label">Accepted Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="mir-filters">
        <Filter size={16} color="var(--text-muted)" />
        <div className="mir-filter-group">
          <span className="mir-filter-label">Vehicle:</span>
          <select className="mir-filter-select" value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)}>
            <option value="all">All Types</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="truck">Truck</option>
          </select>
        </div>
        <div className="mir-filter-group">
          <span className="mir-filter-label">Distance:</span>
          <select className="mir-filter-select" value={filterDistance} onChange={(e) => setFilterDistance(e.target.value)}>
            <option value="all">Any</option>
            <option value="2">Under 2 km</option>
            <option value="5">Under 5 km</option>
            <option value="10">Under 10 km</option>
          </select>
        </div>
        <div className="mir-filter-group">
          <span className="mir-filter-label">Priority:</span>
          <select className="mir-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All</option>
            <option value="emergency">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        <div className="mir-filter-pills">
          <button className={`mir-filter-pill ${sortBy === 'nearest' ? 'active' : ''}`} onClick={() => setSortBy('nearest')}>
            <MapPin size={12} /> Nearest
          </button>
          <button className={`mir-filter-pill ${sortBy === 'earnings' ? 'active' : ''}`} onClick={() => setSortBy('earnings')}>
            <DollarSign size={12} /> Highest Pay
          </button>
          <button className={`mir-filter-pill ${sortBy === 'emergency' ? 'active' : ''}`} onClick={() => setSortBy('emergency')}>
            <AlertTriangle size={12} /> Emergency
          </button>
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="mir-layout">
        {/* LEFT: Request Cards */}
        <div className="mir-requests-list">
          {filteredRequests.length === 0 ? (
            <div className="mir-empty">
              <div className="mir-empty-icon"><ClipboardList size={28} /></div>
              <h3>No matching requests</h3>
              <p>Try adjusting your filters or wait for new requests to come in.</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div key={req.id} className="mir-card">
                {/* Top: Customer Info */}
                <div className="mir-card-top">
                  <div className="mir-card-customer">
                    <div className="mir-card-avatar" style={{ background: req.avatarColor }}>
                      {req.initials}
                      <div className="mir-card-avatar-online" />
                    </div>
                    <div className="mir-card-customer-info">
                      <div className="mir-card-customer-name">{req.customer}</div>
                      <div className="mir-card-customer-meta">
                        <Clock size={12} /> {req.eta} away · {req.distance}
                      </div>
                    </div>
                  </div>
                  <div className="mir-card-badges">
                    <span className={`mir-priority-badge ${req.priority}`}>
                      {req.priority === 'emergency' && <AlertTriangle size={10} />}
                      {req.priority === 'high' && <ArrowUpRight size={10} />}
                      {req.priority}
                    </span>
                    <span className="mir-match-badge">
                      <TrendingUp size={10} /> {req.matchScore}% Match
                    </span>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="mir-card-vehicle">
                  <div className="mir-vehicle-icon">
                    {req.vehicleType === 'Truck' ? <Truck size={24} /> : <Car size={24} />}
                  </div>
                  <div className="mir-vehicle-info">
                    <div className="mir-vehicle-name">{req.vehicle}</div>
                    <div className="mir-vehicle-plate">{req.plate}</div>
                    <span className="mir-vehicle-type">{req.vehicleType}</span>
                  </div>
                </div>

                {/* Issue */}
                <div className="mir-card-issue">
                  <div className="mir-issue-header">
                    <div className="mir-issue-type">
                      <div className="mir-issue-type-icon" style={getIssueColor(req.issue)}>
                        {getIssueIcon(req.issue)}
                      </div>
                      {req.issue}
                    </div>
                  </div>
                  <p className="mir-issue-desc">{req.description}</p>
                </div>

                {/* Stats */}
                <div className="mir-card-stats">
                  <div className="mir-stat">
                    <div className="mir-stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><MapPin size={14} /></div>
                    <div className="mir-stat-value">{req.distance}</div>
                    <div className="mir-stat-label">Distance</div>
                  </div>
                  <div className="mir-stat">
                    <div className="mir-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}><Timer size={14} /></div>
                    <div className="mir-stat-value">{req.serviceTime}</div>
                    <div className="mir-stat-label">Est. Time</div>
                  </div>
                  <div className="mir-stat">
                    <div className="mir-stat-icon" style={{ background: 'var(--secondary-glow)', color: 'var(--secondary)' }}><DollarSign size={14} /></div>
                    <div className="mir-stat-value">${req.earnings}</div>
                    <div className="mir-stat-label">Earnings</div>
                  </div>
                  <div className="mir-stat">
                    <div className="mir-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}><Clock size={14} /></div>
                    <div className="mir-stat-value">{req.eta}</div>
                    <div className="mir-stat-label">ETA</div>
                  </div>
                </div>

                {/* Uploaded Images */}
                {req.images > 0 && (
                  <div className="mir-card-images">
                    <div className="mir-images-label"><Camera size={12} /> {req.images} photos uploaded</div>
                    <div className="mir-images-row">
                      {Array.from({ length: req.images }).map((_, i) => (
                        <div key={i} className="mir-image-thumb">
                          <Image size={16} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                <div className="mir-ai-card">
                  <div className="mir-ai-header">
                    <span className="mir-ai-badge"><Bot size={11} /> AI Analysis</span>
                    <span className="mir-ai-title">Problem Assessment</span>
                  </div>
                  <div className="mir-ai-grid">
                    <div className="mir-ai-item">
                      <div className="mir-ai-item-value" style={{ color: req.aiSeverity === 'Critical' ? 'var(--accent)' : req.aiSeverity === 'Medium' ? '#F59E0B' : 'var(--secondary)' }}>{req.aiSeverity}</div>
                      <div className="mir-ai-item-label">Severity</div>
                    </div>
                    <div className="mir-ai-item">
                      <div className="mir-ai-item-value">{req.aiRepairTime}</div>
                      <div className="mir-ai-item-label">Repair Time</div>
                    </div>
                    <div className="mir-ai-item">
                      <div className="mir-ai-item-value">{req.aiCost}</div>
                      <div className="mir-ai-item-label">Est. Cost</div>
                    </div>
                    <div className="mir-ai-item">
                      <div className="mir-ai-item-value">{req.aiTools}</div>
                      <div className="mir-ai-item-label">Tools Needed</div>
                    </div>
                    <div className="mir-ai-item">
                      <div className="mir-ai-item-value">{req.aiParts}</div>
                      <div className="mir-ai-item-label">Parts</div>
                    </div>
                    <div className="mir-ai-item">
                      <div className="mir-ai-item-value">{req.matchScore}%</div>
                      <div className="mir-ai-item-label">Your Match</div>
                    </div>
                  </div>
                  <div className="mir-ai-confidence">
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Confidence</span>
                    <div className="mir-ai-confidence-bar">
                      <div className="mir-ai-confidence-fill" style={{ width: `${req.aiConfidence}%` }} />
                    </div>
                    <span className="mir-ai-confidence-text">{req.aiConfidence}%</span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="mir-card-countdown">
                  <Timer size={16} color="var(--accent)" />
                  <span className="mir-countdown-label">Accept within</span>
                  <span className="mir-countdown-timer">
                    {String(Math.floor(req.timeLeft / 60)).padStart(2, '0')}:{String(req.timeLeft % 60).padStart(2, '0')}
                  </span>
                  <div className="mir-countdown-bar">
                    <div className={`mir-countdown-fill ${getCountdownClass(req.timeLeft)}`} style={{ width: `${(req.timeLeft / 120) * 100}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="mir-card-actions">
                  <button className="mir-action-btn accept" onClick={(e) => { handleRipple(e); handleAccept(req.id); }}>
                    <Check size={16} /> Accept Request
                  </button>
                  <button className="mir-action-btn decline" onClick={() => handleDecline(req.id)}>
                    <X size={14} />
                  </button>
                  <button className="mir-action-btn secondary" onClick={() => setDetailRequest(req)}>
                    <Eye size={14} /> Details
                  </button>
                  <button className="mir-action-btn secondary">
                    <Navigation size={14} /> Route
                  </button>
                  <button className="mir-action-btn call" onClick={() => setChatRequest(req)}>
                    <Phone size={14} />
                  </button>
                  <button className="mir-action-btn secondary" onClick={() => setChatRequest(req)}>
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="mir-right-panel">
          {/* Map */}
          <div className="mir-map-card">
            <div className="mir-map-header">
              <div className="mir-map-title"><MapPin size={16} /> Live Map</div>
              <div className="mir-map-controls">
                <button className="mir-map-ctrl mir-focus"><Locate size={14} /></button>
                <button className="mir-map-ctrl mir-focus"><Navigation size={14} /></button>
                <button className="mir-map-ctrl mir-focus"><Maximize2 size={14} /></button>
              </div>
            </div>
            <div className="mir-map-body">
              <div className="mir-map-grid" />
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 320" fill="none">
                <path d="M 50,160 Q 120,100 200,160 T 350,140" stroke="rgba(37,99,235,0.15)" strokeWidth="3" strokeLinecap="round" />
                <path d="M 180,30 Q 190,160 170,290" stroke="rgba(37,99,235,0.1)" strokeWidth="2" strokeLinecap="round" />
                <path d="M 80,60 L 320,60" stroke="rgba(37,99,235,0.06)" strokeWidth="1.5" strokeDasharray="6 4" />
                <path d="M 80,260 L 320,260" stroke="rgba(37,99,235,0.06)" strokeWidth="1.5" strokeDasharray="6 4" />
              </svg>
              {mapMarkers.map((m, i) => (
                <div key={i} className="mir-map-marker" style={{ top: m.top, left: m.left }}>
                  <div className="mir-map-marker-pin">
                    <div className={`mir-map-marker-dot ${m.type}`} />
                  </div>
                  <span className="mir-map-marker-label">{m.label}</span>
                </div>
              ))}
              <div className="mir-map-info-bar">
                <div className="mir-map-info-item"><Navigation size={13} /> 3 nearby</div>
                <div className="mir-map-info-item"><Clock size={13} /> ~8 min avg</div>
              </div>
            </div>
          </div>

          {/* Real-time Feed */}
          <div className="mir-feed-card">
            <div className="mir-feed-header">
              <div className="mir-feed-title">
                <span className="mir-feed-live-dot" /> Live Feed
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><RefreshCw size={14} /></button>
            </div>
            <div className="mir-feed-list">
              {feedItems.map((item) => (
                <div key={item.id} className="mir-feed-item">
                  <div className={`mir-feed-icon ${item.type === 'new' ? 'blue' : item.type === 'cancel' ? 'red' : item.type === 'accepted' ? 'green' : 'amber'}`}>
                    {item.type === 'new' && <ClipboardList size={13} />}
                    {item.type === 'update' && <RefreshCw size={13} />}
                    {item.type === 'cancel' && <X size={13} />}
                    {item.type === 'accepted' && <CheckCircle size={13} />}
                    {item.type === 'eta' && <Clock size={13} />}
                  </div>
                  <div>
                    <div className="mir-feed-text">{item.text}</div>
                    <div className="mir-feed-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {detailRequest && (
        <div className="mir-modal-overlay" onClick={() => setDetailRequest(null)}>
          <div className="mir-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mir-modal-header">
              <h3 className="mir-modal-title">Request Details</h3>
              <button className="mir-modal-close mir-focus" onClick={() => setDetailRequest(null)}><X size={16} /></button>
            </div>
            <div className="mir-modal-body">
              {/* Customer Info */}
              <div className="mir-modal-section">
                <div className="mir-modal-section-title"><User size={13} /> Customer Information</div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Name</span>
                  <span className="mir-modal-field-value">{detailRequest.customer}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Phone</span>
                  <span className="mir-modal-field-value">{detailRequest.phone}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Emergency Contact</span>
                  <span className="mir-modal-field-value">{detailRequest.emergencyContact}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Payment Method</span>
                  <span className="mir-modal-field-value">{detailRequest.paymentMethod}</span>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="mir-modal-section">
                <div className="mir-modal-section-title"><Car size={13} /> Vehicle Details</div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Vehicle</span>
                  <span className="mir-modal-field-value">{detailRequest.vehicle}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Type</span>
                  <span className="mir-modal-field-value">{detailRequest.vehicleType}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Plate</span>
                  <span className="mir-modal-field-value" style={{ fontFamily: 'monospace' }}>{detailRequest.plate}</span>
                </div>
              </div>

              {/* Issue */}
              <div className="mir-modal-section">
                <div className="mir-modal-section-title"><AlertTriangle size={13} /> Issue Description</div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Type</span>
                  <span className="mir-modal-field-value">{detailRequest.issue}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Description</span>
                  <span className="mir-modal-field-value">{detailRequest.description}</span>
                </div>
                {detailRequest.customerNotes && (
                  <div className="mir-modal-field">
                    <span className="mir-modal-field-label">Customer Notes</span>
                    <span className="mir-modal-field-value">{detailRequest.customerNotes}</span>
                  </div>
                )}
              </div>

              {/* Location & Timing */}
              <div className="mir-modal-section">
                <div className="mir-modal-section-title"><MapPin size={13} /> Location & Timing</div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Location</span>
                  <span className="mir-modal-field-value">{detailRequest.location}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Distance</span>
                  <span className="mir-modal-field-value">{detailRequest.distance}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">ETA</span>
                  <span className="mir-modal-field-value">{detailRequest.eta}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Service Time</span>
                  <span className="mir-modal-field-value">{detailRequest.serviceTime}</span>
                </div>
              </div>

              {/* AI Diagnosis */}
              <div className="mir-modal-section">
                <div className="mir-modal-section-title"><Bot size={13} /> AI Diagnosis</div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Severity</span>
                  <span className="mir-modal-field-value">{detailRequest.aiSeverity}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Repair Time</span>
                  <span className="mir-modal-field-value">{detailRequest.aiRepairTime}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Tools</span>
                  <span className="mir-modal-field-value">{detailRequest.aiTools}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Parts</span>
                  <span className="mir-modal-field-value">{detailRequest.aiParts}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Estimated Cost</span>
                  <span className="mir-modal-field-value" style={{ color: 'var(--secondary)', fontWeight: 700 }}>{detailRequest.aiCost}</span>
                </div>
                <div className="mir-modal-field">
                  <span className="mir-modal-field-label">Earnings</span>
                  <span className="mir-modal-field-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>${detailRequest.earnings}</span>
                </div>
              </div>
            </div>
            <div className="mir-modal-footer">
              <button className="mir-action-btn accept" style={{ flex: 1 }} onClick={() => { handleAccept(detailRequest.id); setDetailRequest(null); }}>
                <Check size={16} /> Accept (${detailRequest.earnings})
              </button>
              <button className="mir-action-btn call"><Phone size={14} /> Call</button>
              <button className="mir-action-btn secondary" onClick={() => { setChatRequest(detailRequest); setDetailRequest(null); }}>
                <MessageCircle size={14} /> Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHAT MODAL ===== */}
      {chatRequest && (
        <div className="mir-modal-overlay" onClick={() => setChatRequest(null)}>
          <div className="mir-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="mir-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="mir-card-avatar" style={{ background: chatRequest.avatarColor, width: 36, height: 36, fontSize: '0.75rem', borderRadius: 10 }}>
                  {chatRequest.initials}
                </div>
                <div>
                  <h3 className="mir-modal-title" style={{ fontSize: '0.95rem' }}>{chatRequest.customer}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{chatRequest.vehicle}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className="mir-action-btn call" style={{ flex: 'none', padding: '0.5rem' }}><Phone size={14} /></button>
                <button className="mir-modal-close mir-focus" onClick={() => setChatRequest(null)}><X size={16} /></button>
              </div>
            </div>
            <div className="mir-chat-panel">
              <div className="mir-chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`mir-chat-msg ${msg.out ? 'out' : 'in'}`}>{msg.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="mir-quick-replies">
                {quickReplies.map((qr, i) => (
                  <button key={i} className="mir-quick-reply" onClick={() => setChatInput(qr)}>{qr}</button>
                ))}
              </div>
              <div className="mir-chat-input-area">
                <input className="mir-chat-input mir-focus" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." />
                <button className="mir-chat-send mir-focus" onClick={handleSendMessage}><Send size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
