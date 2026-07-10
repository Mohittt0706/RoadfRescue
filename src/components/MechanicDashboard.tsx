import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, ClipboardList, Briefcase, History, DollarSign, Star, Bell, User,
  HelpCircle, LogOut, Search, MapPin, Sun, Moon, Menu, X, ChevronRight, ChevronDown,
  Phone, MessageCircle, Navigation, Clock, Check, AlertTriangle, Zap, Shield,
  Send, Mic, Image, TrendingUp, Award, Calendar, RefreshCw, Locate, Maximize2,
  Minimize2, ArrowUpRight, ArrowDownRight, Users, Wrench, Car, Truck, Battery,
  Fuel, AlertCircle, Timer, BadgeCheck, CircleDot, Play, RotateCcw
} from 'lucide-react';
import '../mechanic-dashboard.css';
import { BookingStore, NotificationStore, MechanicStore, EmergencyStore } from '../services/store';
import IncomingRequestsPage from './IncomingRequestsPage';
import ActiveJobsPage from './ActiveJobsPage';
import EarningsDashboard from './EarningsDashboard';
import MechanicProfilePage from './MechanicProfilePage';

interface MechanicDashboardProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
}

interface IncomingRequest {
  id: string;
  customer: string;
  vehicle: string;
  plate: string;
  problem: string;
  distance: string;
  eta: string;
  earnings: number;
  priority: 'high' | 'medium' | 'low';
  timeLeft: number;
}

interface ActiveJob {
  id: string;
  customer: string;
  vehicle: string;
  issue: string;
  status: 'accepted' | 'driving' | 'arrived' | 'repairing' | 'completed';
  eta: string;
  distance: string;
}

interface Review {
  name: string;
  vehicle: string;
  rating: number;
  text: string;
  initials: string;
  color: string;
}

interface Notification {
  id: string;
  type: 'request' | 'message' | 'payment' | 'rating' | 'reward' | 'alert';
  text: string;
  time: string;
  unread: boolean;
}

interface ChatMessage {
  text: string;
  incoming: boolean;
  time: string;
}

interface ScheduleItem {
  title: string;
  time: string;
  status: 'upcoming' | 'active' | 'done';
}

const reviews: Review[] = [
  { name: 'Sarah Chen', vehicle: 'Honda Civic 2022', rating: 5, text: 'Amazing service! Arrived within 10 minutes and fixed my flat tire efficiently. Highly recommended.', initials: 'SC', color: '#2563EB' },
  { name: 'Michael Brown', vehicle: 'Toyota Camry 2021', rating: 5, text: 'Very professional and friendly. Jump-started my car in no time. Fair pricing too.', initials: 'MB', color: '#22C55E' },
  { name: 'Emma Wilson', vehicle: 'Ford F-150 2023', rating: 4, text: 'Good service overall. Towing was smooth and the mechanic was knowledgeable.', initials: 'EW', color: '#F59E0B' },
  { name: 'David Lee', vehicle: 'BMW X5 2022', rating: 5, text: 'Excellent roadside assistance. Very quick response time and professional handling.', initials: 'DL', color: '#8B5CF6' },
];

const initialRequests: IncomingRequest[] = [
  { id: 'r1', customer: 'Alex Thompson', vehicle: 'Toyota Camry', plate: 'ABC-1234', problem: 'Flat tire on highway', distance: '2.3 km', eta: '8 min', earnings: 45, priority: 'high', timeLeft: 30 },
  { id: 'r2', customer: 'Lisa Park', vehicle: 'Honda Civic', plate: 'XYZ-5678', problem: 'Dead battery', distance: '1.7 km', eta: '5 min', earnings: 35, priority: 'medium', timeLeft: 25 },
  { id: 'r3', customer: 'James Miller', vehicle: 'Ford Escape', plate: 'DEF-9012', problem: 'Out of fuel', distance: '4.1 km', eta: '12 min', earnings: 55, priority: 'low', timeLeft: 20 },
];

const initialJobs: ActiveJob[] = [
  { id: 'j1', customer: 'Rachel Green', vehicle: 'Chevrolet Malibu 2021', issue: 'Engine overheating', status: 'driving', eta: '6 min', distance: '3.2 km' },
  { id: 'j2', customer: 'Tom Anderson', vehicle: 'Nissan Altima 2022', issue: 'Lockout service', status: 'arrived', eta: '0 min', distance: '0 km' },
];

const notifications: Notification[] = [
  { id: 'n1', type: 'request', text: 'New request: Flat tire - Alex Thompson', time: '2 min ago', unread: true },
  { id: 'n2', type: 'payment', text: 'Payment received: $35.00 from Lisa Park', time: '15 min ago', unread: true },
  { id: 'n3', type: 'rating', text: 'New 5-star rating from Sarah Chen', time: '1 hour ago', unread: false },
  { id: 'n4', type: 'reward', text: 'Bonus earned: 10 jobs completed this week!', time: '2 hours ago', unread: false },
  { id: 'n5', type: 'message', text: 'Customer message from Rachel Green', time: '3 hours ago', unread: false },
];

const schedule: ScheduleItem[] = [
  { title: 'Battery jump - Mike S.', time: '8:00 AM', status: 'done' },
  { title: 'Tire change - Lisa P.', time: '9:30 AM', status: 'done' },
  { title: 'Engine diagnostics - Rachel G.', time: '11:00 AM', status: 'active' },
  { title: 'Towing - James M.', time: '1:30 PM', status: 'upcoming' },
  { title: 'Fuel delivery - Emma W.', time: '3:00 PM', status: 'upcoming' },
  { title: 'Break reminder', time: '12:00 PM', status: 'upcoming' },
];

const quickReplies = [
  "I'm on my way!",
  "I've arrived",
  "Almost there",
  "Can you share your location?",
  "Estimated 5 min",
  "Thank you!"
];

export default function MechanicDashboard({ theme, toggleTheme, onLogout }: MechanicDashboardProps) {
  /* --- Sidebar --- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  /* --- Availability --- */
  const [isOnline, setIsOnline] = useState(true);

  /* --- Requests & Jobs --- */
  const [requests, setRequests] = useState(initialRequests);
  const [jobs, setJobs] = useState(initialJobs);

  /* --- Chat --- */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { text: "Hi! I'm the customer. My car broke down on Main Street.", incoming: true, time: '10:30 AM' },
    { text: "Hello Rachel, I'm on my way! I'll be there in about 6 minutes.", incoming: false, time: '10:31 AM' },
    { text: "Thank you so much! I'm near the gas station.", incoming: true, time: '10:31 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* --- AI Widget --- */
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    { text: "Hello! I'm your AI assistant. How can I help you today?", incoming: true, time: 'Now' },
  ]);

  /* --- Notifications --- */
  const [notifOpen, setNotifOpen] = useState(false);

  /* --- Stats --- */
  const [stats, setStats] = useState({ completed: 0, active: 0, pending: 0, earnings: 0, rating: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  /* --- Earnings chart data --- */
  const weeklyEarnings = [120, 180, 95, 210, 155, 240, 190];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* --- Performance metrics --- */
  const [perfMetrics, setPerfMetrics] = useState({ acceptance: 0, completion: 0, response: 0, satisfaction: 0, total: 0, onTime: 0 });

  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadData = () => {
    const userStr = localStorage.getItem('user');
    let email = 'rajesh@roadrescue.in';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        if (u.email) email = u.email;
      } catch (e) {
        console.error(e);
      }
    }

    const allBookings = BookingStore.getAll();
    const allSOS = EmergencyStore.getAll();
    
    // SOS Requests assigned to this mechanic
    const sosRequests = allSOS
      .filter((s: any) => s.assigned_mechanic_email?.toLowerCase() === email.toLowerCase() && s.status === 'Mechanic Assigned')
      .map((s: any) => ({
        id: s.id,
        customer: s.customer_name,
        vehicle: s.vehicle_type || s.vehicle,
        plate: s.vehicle_number,
        problem: `🚨 SOS: ${s.emergency_type}`,
        distance: '2.5 km',
        eta: s.eta || '15 mins',
        earnings: Math.floor((s.price || 0) * 0.8),
        priority: (s.priority === 'Critical' ? 'high' : s.priority === 'Urgent' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        timeLeft: 30,
        isSOS: true
      }));

    // SOS Active Jobs accepted by this mechanic
    const sosActiveJobs = allSOS
      .filter((s: any) => s.assigned_mechanic_email?.toLowerCase() === email.toLowerCase() && ['Accepted', 'Mechanic Assigned', 'Mechanic En Route', 'Arrived', 'In Progress'].includes(s.status))
      .map((s: any) => ({
        id: s.id,
        customer: s.customer_name,
        vehicle: s.vehicle_type || s.vehicle,
        issue: `🚨 SOS: ${s.emergency_type}`,
        status: (s.status === 'Mechanic Assigned' ? 'accepted' : s.status === 'Mechanic En Route' ? 'driving' : s.status === 'Arrived' ? 'arrived' : s.status === 'In Progress' ? 'repairing' : 'accepted') as 'accepted' | 'driving' | 'arrived' | 'repairing' | 'completed',
        eta: s.eta || '15 mins',
        distance: '2.5 km'
      }));

    // Regular booking requests
    const bookingRequests = allBookings
      .filter((b: any) => b.mechanic_email?.toLowerCase() === email.toLowerCase() && b.status === 'Mechanic Assigned')
      .map((b: any) => ({
        id: b.id,
        customer: b.customer,
        vehicle: b.vehicle,
        plate: b.vehicle_number,
        problem: b.service,
        distance: '2.5 km',
        eta: b.eta,
        earnings: Math.floor((b.price || 0) * 0.8),
        priority: 'high' as const,
        timeLeft: 30,
        isSOS: false
      }));

    // Active jobs from regular bookings
    const bookingActiveJobs = allBookings
      .filter((b: any) => b.mechanic_email?.toLowerCase() === email.toLowerCase() && ['Accepted', 'Mechanic Accepted', 'Mechanic Started', 'Mechanic Nearby', 'Arrived', 'In Progress'].includes(b.status))
      .map((b: any) => ({
        id: b.id,
        customer: b.customer,
        vehicle: b.vehicle,
        issue: b.service,
        status: b.status === 'Mechanic Assigned' ? 'accepted' as const : b.status === 'Mechanic Started' ? 'driving' as const : b.status === 'Arrived' ? 'arrived' as const : b.status === 'In Progress' ? 'repairing' as const : 'accepted' as const,
        eta: b.eta,
        distance: '2.5 km'
      }));

    // Merge SOS + regular, SOS first
    const incomingRequests = [...sosRequests, ...bookingRequests];

    const activeJobs = [...sosActiveJobs, ...bookingActiveJobs];

    // Notifications
    const notifs = NotificationStore.getAll()
      .filter((n: any) => n.role === 'mechanic')
      .map((n: any) => ({
        id: n.id,
        type: n.type || 'request',
        text: n.message,
        time: 'Just now',
        unread: !n.read
      }));

    setRequests(incomingRequests);
    setJobs(activeJobs);
    setNotifications(notifs);

    // Compute stats
    const completedBookingCount = allBookings.filter((b: any) => b.mechanic_email?.toLowerCase() === email.toLowerCase() && b.status === 'Completed').length;
    const completedSOSCount = allSOS.filter((s: any) => s.assigned_mechanic_email?.toLowerCase() === email.toLowerCase() && s.status === 'Completed').length;
    const completedCount = completedBookingCount + completedSOSCount;
    const activeCount = activeJobs.length;
    const pendingCount = incomingRequests.length;
    const totalEarnings = allBookings
      .filter((b: any) => b.mechanic_email?.toLowerCase() === email.toLowerCase() && b.status === 'Completed')
      .reduce((sum: number, b: any) => sum + ((b.price || 0) * 0.8), 0);
    const sosEarnings = allSOS
      .filter((s: any) => s.assigned_mechanic_email?.toLowerCase() === email.toLowerCase() && s.status === 'Completed')
      .reduce((sum: number, s: any) => sum + ((s.price || 0) * 0.8), 0);

    setStats({
      completed: completedCount,
      active: activeCount,
      pending: pendingCount,
      earnings: totalEarnings + sosEarnings,
      rating: 4.9
    });
  };

  useEffect(() => {
    loadData();
    const unsubscribeBookings = BookingStore.subscribe(loadData);
    const unsubscribeNotifications = NotificationStore.subscribe(loadData);
    const unsubscribeEmergencies = EmergencyStore.subscribe(loadData);

    return () => {
      unsubscribeBookings();
      unsubscribeNotifications();
      unsubscribeEmergencies();
    };
  }, []);

  /* --- Animate stats --- */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        const duration = 2000;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = progress * (2 - progress);
          setStats({
            completed: Math.floor(ease * 12),
            active: Math.floor(ease * 3),
            pending: Math.floor(ease * 5),
            earnings: Math.floor(ease * 347),
            rating: parseFloat((ease * 4.9).toFixed(1)),
          });
          setPerfMetrics({
            acceptance: Math.floor(ease * 96),
            completion: Math.floor(ease * 98),
            response: Math.floor(ease * 94),
            satisfaction: Math.floor(ease * 97),
            total: Math.floor(ease * 847),
            onTime: Math.floor(ease * 92),
          });
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.2 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  /* --- Chat auto-scroll --- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* --- Handlers --- */
  const handleAcceptRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    const req = requests.find((r) => r.id === id);
    if (req) {
      // Update store status
      if (id.startsWith('SOS-')) {
        EmergencyStore.updateStatus(id, 'Accepted', 'Mechanic accepted');
      } else {
        BookingStore.updateStatus(id, 'Accepted', 'Mechanic accepted');
      }

      setJobs((prev) => [...prev, {
        id: id,
        customer: req.customer,
        vehicle: req.vehicle,
        issue: req.problem,
        status: 'accepted',
        eta: req.eta,
        distance: req.distance,
      }]);
    }
  }, [requests]);

  const handleDeclineRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleAdvanceJob = useCallback((id: string) => {
    const stageOrder: ActiveJob['status'][] = ['accepted', 'driving', 'arrived', 'repairing', 'completed'];
    const sosStatusMap: Record<string, string> = {
      'accepted': 'Accepted',
      'driving': 'Mechanic En Route',
      'arrived': 'Arrived',
      'repairing': 'In Progress',
      'completed': 'Completed'
    };
    setJobs((prev) => prev.map((j) => {
      if (j.id !== id) return j;
      const idx = stageOrder.indexOf(j.status);
      const next = idx < stageOrder.length - 1 ? stageOrder[idx + 1] : j.status;

      // If this is an SOS job (id starts with SOS-), update EmergencyStore
      if (id.startsWith('SOS-')) {
        EmergencyStore.updateStatus(id, sosStatusMap[next] || 'Completed');
      } else {
        BookingStore.updateStatus(id, sosStatusMap[next] || 'Completed');
      }

      return { ...j, status: next, eta: next === 'completed' ? 'Done' : next === 'arrived' ? '0 min' : j.eta };
    }));
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { text: chatInput, incoming: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { text: "Thanks for the update! I'll wait here.", incoming: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  }, [chatInput]);

  const handleAiSend = useCallback(() => {
    if (!aiInput.trim()) return;
    setAiMessages((prev) => [...prev, { text: aiInput, incoming: false, time: 'Now' }]);
    const q = aiInput.toLowerCase();
    setAiInput('');
    setTimeout(() => {
      let reply = "I can help with navigation, repair tips, or customer communication. What do you need?";
      if (q.includes('route') || q.includes('navigate')) reply = "Optimizing your route now. Take Highway 101 North, then exit at Elm Street. ETA reduced by 3 minutes.";
      else if (q.includes('repair') || q.includes('fix')) reply = "For engine overheating: Check coolant levels, inspect thermostat, and verify radiator fan operation. Avoid revving the engine.";
      else if (q.includes('customer')) reply = "Suggested message: 'I'm approximately 5 minutes away. Please keep your hazard lights on and stay in a safe location.'";
      else if (q.includes('earnings') || q.includes('money')) reply = "You've earned $347 this week! That's 15% higher than last week. Keep up the great work!";
      setAiMessages((prev) => [...prev, { text: reply, incoming: true, time: 'Now' }]);
    }, 1000);
  }, [aiInput]);

  /* --- Greeting --- */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  /* --- Sidebar Nav Items --- */
  const navItems = [
    { key: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'requests', label: 'Incoming Requests', icon: ClipboardList, badge: requests.length },
    { key: 'jobs', label: 'Active Jobs', icon: Briefcase, badge: jobs.length },
    { key: 'history', label: 'Job History', icon: History },
    { key: 'earnings', label: 'Earnings', icon: DollarSign },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => n.unread).length },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  /* --- Map Markers (simulated positions) --- */
  const mapMarkers = [
    { type: 'user' as const, top: '45%', left: '48%' },
    { type: 'customer' as const, top: '30%', left: '65%' },
    { type: 'mechanic' as const, top: '60%', left: '35%' },
  ];

  const maxEarning = Math.max(...weeklyEarnings);

  /* --- Circular progress helper --- */
  const circleRadius = 30;
  const circleCircumference = 2 * Math.PI * circleRadius;

  return (
    <div className="md-page">
      {/* ===== SIDEBAR ===== */}
      <aside className={`md-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="md-sidebar-logo">
          <div className="md-sidebar-logo-icon"><Wrench size={18} /></div>
          <span style={{ color: 'var(--primary)' }}>Road</span>
          <span>Rescue AI</span>
        </div>

        <nav className="md-sidebar-nav">
          <div className="md-nav-section">Main Menu</div>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`md-nav-item md-focus ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            >
              <item.icon size={18} />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`md-nav-badge ${item.key === 'notifications' ? 'success' : ''}`}>{item.badge}</span>
              )}
            </button>
          ))}

          <div className="md-nav-section" style={{ marginTop: '0.5rem' }}>Settings</div>
          <button className="md-nav-item md-focus" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button className="md-nav-item md-focus" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </nav>

        <div className="md-sidebar-footer">
          <div className="md-sidebar-user">
            <div className="md-sidebar-avatar">
              {currentUser?.name ? currentUser.name.split(' ').map((n: any) => n[0]).join('') : 'RK'}
            </div>
            <div className="md-sidebar-user-info">
              <div className="md-sidebar-user-name">{currentUser?.name || 'Rajesh Kumar'}</div>
              <div className="md-sidebar-user-role">ASE Certified</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div className={`md-mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ===== MAIN CONTENT ===== */}
      <main className="md-main">
        {/* Top Navbar */}
        <header className="md-topnav">
          <div className="md-topnav-logo" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
            <span style={{ color: 'var(--primary)' }}>Road</span>Rescue
          </div>

          <div className="md-topnav-search">
            <Search className="md-topnav-search-icon" size={16} />
            <input className="md-topnav-search-input md-focus" placeholder="Search jobs, customers..." />
          </div>

          <div className="md-topnav-center">
            <button
              className={`md-avail-toggle ${isOnline ? 'online' : 'offline'}`}
              onClick={() => setIsOnline(!isOnline)}
            >
              <span className={`md-avail-dot ${isOnline ? 'online' : 'offline'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>

          <div className="md-topnav-right">
            <div className="md-topnav-location">
              <MapPin size={14} />
              <span>San Francisco, CA</span>
            </div>

            <button className="md-topnav-btn md-focus" onClick={() => setNotifOpen(!notifOpen)}>
              <Bell size={18} />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="badge">{notifications.filter(n => n.unread).length}</span>
              )}
            </button>

            <button className="md-topnav-btn md-focus" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <div className="md-topnav-avatar">
              {currentUser?.name ? currentUser.name.split(' ').map((n: any) => n[0]).join('') : 'RK'}
            </div>
          </div>
        </header>

        {/* Notifications Dropdown */}
        {notifOpen && (
          <div className="md-card" style={{ position: 'absolute', top: 65, right: 20, width: 360, zIndex: 50, maxHeight: 400, overflow: 'auto' }}>
            <div className="md-card-header">
              <h4 className="md-card-title"><Bell size={16} /> Notifications</h4>
              <button className="md-btn md-btn-outline" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>Mark all read</button>
            </div>
            {notifications.map((n) => (
              <div key={n.id} className="md-notif-item">
                <div className={`md-notif-icon ${n.type === 'payment' ? 'green' : n.type === 'request' ? 'blue' : n.type === 'rating' ? 'amber' : n.type === 'reward' ? 'purple' : n.type === 'alert' ? 'red' : 'blue'}`}>
                  {n.type === 'request' && <ClipboardList size={16} />}
                  {n.type === 'payment' && <DollarSign size={16} />}
                  {n.type === 'rating' && <Star size={16} />}
                  {n.type === 'reward' && <Award size={16} />}
                  {n.type === 'message' && <MessageCircle size={16} />}
                  {n.type === 'alert' && <AlertCircle size={16} />}
                </div>
                <div className="md-notif-content">
                  <div className="md-notif-text">{n.text}</div>
                  <div className="md-notif-time">{n.time}</div>
                </div>
                {n.unread && <div className="md-notif-unread" />}
              </div>
            ))}
          </div>
        )}

        {/* Page Content */}
        <div className="md-content" ref={statsRef}>
          {/* === Greeting === */}
          <div className="md-page-header">
            <h1 className="md-greeting">{greeting}, {currentUser?.name?.split(' ')[0] || 'Rajesh'} <span>👋</span></h1>
            <p className="md-greeting-sub">
              {isOnline
                ? "You're online and ready to assist drivers nearby."
                : "You're currently offline. Go online to start receiving requests."}
            </p>
          </div>

          {activeTab === 'requests' ? (
            <IncomingRequestsPage onBack={() => setActiveTab('home')} />
          ) : activeTab === 'jobs' ? (
            <ActiveJobsPage onBack={() => setActiveTab('home')} />
          ) : activeTab === 'earnings' ? (
            <EarningsDashboard onBack={() => setActiveTab('home')} />
          ) : activeTab === 'profile' ? (
            <MechanicProfilePage onBack={() => setActiveTab('home')} onLogout={onLogout} />
          ) : (
          <>
          {/* === Stats Row === */}
          <div className="md-stats-row">
            <div className="md-stat-card">
              <div className="md-stat-icon green"><Check size={20} /></div>
              <div className="md-stat-value">{stats.completed}</div>
              <div className="md-stat-label">Completed Today</div>
              <div className="md-stat-change up"><ArrowUpRight size={12} /> +3 vs yesterday</div>
            </div>
            <div className="md-stat-card">
              <div className="md-stat-icon blue"><Briefcase size={20} /></div>
              <div className="md-stat-value">{stats.active}</div>
              <div className="md-stat-label">Active Jobs</div>
            </div>
            <div className="md-stat-card">
              <div className="md-stat-icon amber"><Clock size={20} /></div>
              <div className="md-stat-value">{stats.pending}</div>
              <div className="md-stat-label">Pending Requests</div>
            </div>
            <div className="md-stat-card">
              <div className="md-stat-icon purple"><DollarSign size={20} /></div>
              <div className="md-stat-value">${stats.earnings}</div>
              <div className="md-stat-label">Today's Earnings</div>
              <div className="md-stat-change up"><ArrowUpRight size={12} /> +18% vs avg</div>
            </div>
            <div className="md-stat-card">
              <div className="md-stat-icon blue"><Star size={20} /></div>
              <div className="md-stat-value">{stats.rating}★</div>
              <div className="md-stat-label">Average Rating</div>
            </div>
          </div>

          {/* === Main Grid === */}
          <div className="md-grid">
            {/* LEFT COLUMN */}

            {/* Availability Card */}
            <div className="md-card md-availability" style={{ animationDelay: '0.15s' }}>
              <div className="md-avail-status">
                <div className={`md-avail-status-indicator ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? <Zap size={22} color="#fff" /> : <AlertTriangle size={22} color="#fff" />}
                </div>
                <div className="md-avail-status-text">
                  <h3>{isOnline ? 'You\'re Online' : 'You\'re Offline'}</h3>
                  <p>{isOnline ? 'Ready to receive new service requests' : 'Go online to start receiving requests'}</p>
                </div>
              </div>
              <div className="md-avail-actions">
                {isOnline ? (
                  <button className="md-avail-btn md-avail-btn-ghost" onClick={() => setIsOnline(false)}>Go Offline</button>
                ) : (
                  <button className="md-avail-btn md-avail-btn-primary" onClick={() => setIsOnline(true)}>Go Online</button>
                )}
                <button className="md-avail-btn md-avail-btn-ghost"><Navigation size={16} /> Share Location</button>
              </div>
              <div className="md-avail-meta">
                <div className="md-avail-meta-item"><Clock size={13} /> Shift: 6h 23m</div>
                <div className="md-avail-meta-item"><MapPin size={13} /> SF Bay Area</div>
                <div className="md-avail-meta-item"><Shield size={13} /> Verified</div>
              </div>
            </div>

            {/* Active Jobs */}
            <div className="md-card" style={{ animationDelay: '0.2s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><Briefcase size={18} /> Active Jobs ({jobs.length})</h3>
              </div>
              <div className="md-card-body">
                {jobs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.9rem' }}>No active jobs. Accept a request to get started!</p>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="md-job-card">
                      <div className="md-job-header">
                        <div className="md-job-customer">
                          <div className="md-request-avatar" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: 36, height: 36, fontSize: '0.75rem' }}>
                            {job.customer.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="md-request-name" style={{ fontSize: '0.88rem' }}>{job.customer}</div>
                            <div className="md-request-vehicle">{job.vehicle}</div>
                          </div>
                        </div>
                        <span className={`md-job-status-badge ${job.status}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>

                      <div className="md-job-progress">
                        <div className="md-job-progress-bar">
                          <div className={`md-job-progress-fill ${job.status}`} />
                        </div>
                        <div className="md-job-stages">
                          {['accepted', 'driving', 'arrived', 'repairing', 'completed'].map((s, i) => (
                            <span key={s} className={`md-job-stage ${['accepted', 'driving', 'arrived', 'repairing', 'completed'].indexOf(job.status) >= i ? (['accepted', 'driving', 'arrived', 'repairing', 'completed'].indexOf(job.status) === i ? 'active' : 'done') : ''}`}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="md-job-info">
                        <div className="md-job-info-item"><MapPin size={14} /> {job.distance}</div>
                        <div className="md-job-info-item"><Clock size={14} /> ETA: {job.eta}</div>
                        <div className="md-job-info-item"><Wrench size={14} /> {job.issue}</div>
                        <div className="md-job-info-item"><Car size={14} /> {job.vehicle}</div>
                      </div>

                      <div className="md-job-actions">
                        <button className="md-btn md-btn-primary" onClick={() => setChatOpen(true)}>
                          <MessageCircle size={14} /> Message
                        </button>
                        <button className="md-btn md-btn-outline">
                          <Navigation size={14} /> Navigate
                        </button>
                        {job.status !== 'completed' && (
                          <button className="md-btn md-btn-accept" onClick={() => handleAdvanceJob(job.id)}>
                            <ChevronRight size={14} /> Advance Stage
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Map */}
            <div className="md-card" style={{ animationDelay: '0.25s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><MapPin size={18} /> Live Map</h3>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="md-btn md-btn-icon md-btn-outline" title="Recenter"><Locate size={14} /></button>
                  <button className="md-btn md-btn-icon md-btn-outline" title="Navigate"><Navigation size={14} /></button>
                  <button className="md-btn md-btn-icon md-btn-outline" title="Fullscreen"><Maximize2 size={14} /></button>
                </div>
              </div>
              <div className="md-card-body-compact">
                <div className="md-map">
                  <div className="md-map-grid" />
                  <svg className="md-map-roads" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 50,150 Q 150,100 250,150 T 450,150" stroke="rgba(37,99,235,0.2)" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 200,30 Q 220,150 200,270" stroke="rgba(37,99,235,0.15)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 100,50 L 400,50" stroke="rgba(37,99,235,0.1)" strokeWidth="2" strokeDasharray="8 4" />
                    <path d="M 100,250 L 400,250" stroke="rgba(37,99,235,0.1)" strokeWidth="2" strokeDasharray="8 4" />
                  </svg>
                  {mapMarkers.map((m, i) => (
                    <div key={i} className="md-map-marker" style={{ top: m.top, left: m.left, transform: 'translate(-50%, -50%)' }}>
                      <div className={`md-map-marker-${m.type}`} />
                    </div>
                  ))}
                  <div className="md-map-controls">
                    <button className="md-map-control-btn md-focus"><Locate size={14} /></button>
                    <button className="md-map-control-btn md-focus"><Navigation size={14} /></button>
                    <button className="md-map-control-btn md-focus"><Maximize2 size={14} /></button>
                  </div>
                  <div className="md-map-info">
                    <div className="md-map-info-item"><Navigation size={13} /> 3.2 km</div>
                    <div className="md-map-info-item"><Clock size={13} /> 6 min</div>
                    <div className="md-map-info-item"><MapPin size={13} /> Main St & 5th Ave</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings */}
            <div className="md-card" style={{ animationDelay: '0.3s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><DollarSign size={18} /> Earnings Overview</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>This Week</span>
              </div>
              <div className="md-card-body">
                <div className="md-earnings-summary">
                  <div className="md-earnings-box">
                    <div className="md-earnings-box-value" style={{ color: 'var(--primary)' }}>$347</div>
                    <div className="md-earnings-box-label">Today</div>
                  </div>
                  <div className="md-earnings-box">
                    <div className="md-earnings-box-value">$1,195</div>
                    <div className="md-earnings-box-label">This Week</div>
                  </div>
                  <div className="md-earnings-box">
                    <div className="md-earnings-box-value">$4,820</div>
                    <div className="md-earnings-box-label">This Month</div>
                  </div>
                </div>
                <div className="md-chart-container">
                  {weeklyEarnings.map((val, i) => (
                    <div key={i} className="md-chart-bar-group">
                      <div
                        className={`md-chart-bar ${i === new Date().getDay() - 1 ? 'green' : 'primary'}`}
                        style={{ height: `${(val / maxEarning) * 130}px` }}
                      />
                      <span className="md-chart-label">{dayLabels[i]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Avg per job: $28.50</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}><ArrowUpRight size={13} /> +15% vs last week</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="md-card" style={{ animationDelay: '0.35s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><TrendingUp size={18} /> Performance</h3>
              </div>
              <div className="md-card-body">
                <div className="md-perf-grid">
                  {[
                    { label: 'Acceptance', value: perfMetrics.acceptance, color: '#2563EB' },
                    { label: 'Completion', value: perfMetrics.completion, color: '#22C55E' },
                    { label: 'On-Time', value: perfMetrics.onTime, color: '#F59E0B' },
                    { label: 'Response', value: perfMetrics.response, color: '#8B5CF6' },
                    { label: 'Satisfaction', value: perfMetrics.satisfaction, color: '#EC4899' },
                    { label: 'Total Jobs', value: Math.min(perfMetrics.total, 100), color: '#06B6D4', raw: perfMetrics.total, suffix: '' },
                  ].map((m) => {
                    const offset = circleCircumference - (m.value / 100) * circleCircumference;
                    return (
                      <div key={m.label} className="md-perf-item">
                        <div className="md-perf-circle">
                          <svg viewBox="0 0 72 72">
                            <circle className="md-perf-circle-bg" cx="36" cy="36" r={circleRadius} />
                            <circle className="md-perf-circle-fill" cx="36" cy="36" r={circleRadius} stroke={m.color} strokeDasharray={circleCircumference} strokeDashoffset={offset} />
                          </svg>
                          <div className="md-perf-circle-text">{m.raw !== undefined ? m.raw : `${m.value}%`}</div>
                        </div>
                        <div className="md-perf-label">{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="md-card" style={{ animationDelay: '0.4s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><Star size={18} /> Recent Reviews</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>4.9★ avg</span>
              </div>
              <div className="md-card-body-compact" style={{ padding: 0 }}>
                {reviews.map((r, i) => (
                  <div key={i} className="md-review-card">
                    <div className="md-review-header">
                      <div className="md-review-avatar" style={{ background: r.color }}>{r.initials}</div>
                      <div style={{ flex: 1 }}>
                        <div className="md-review-name">{r.name}</div>
                        <div className="md-review-vehicle">{r.vehicle}</div>
                      </div>
                      <div className="md-review-stars">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} className="md-review-star" fill="#F59E0B" size={14} />
                        ))}
                      </div>
                    </div>
                    <p className="md-review-text">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="md-card" style={{ animationDelay: '0.45s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><Bell size={18} /> Notifications</h3>
              </div>
              <div className="md-card-body-compact" style={{ padding: 0 }}>
                {notifications.map((n) => (
                  <div key={n.id} className="md-notif-item">
                    <div className={`md-notif-icon ${n.type === 'payment' ? 'green' : n.type === 'request' ? 'blue' : n.type === 'rating' ? 'amber' : n.type === 'reward' ? 'purple' : 'blue'}`}>
                      {n.type === 'request' && <ClipboardList size={16} />}
                      {n.type === 'payment' && <DollarSign size={16} />}
                      {n.type === 'rating' && <Star size={16} />}
                      {n.type === 'reward' && <Award size={16} />}
                      {n.type === 'message' && <MessageCircle size={16} />}
                    </div>
                    <div className="md-notif-content">
                      <div className="md-notif-text">{n.text}</div>
                      <div className="md-notif-time">{n.time}</div>
                    </div>
                    {n.unread && <div className="md-notif-unread" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="md-card" style={{ animationDelay: '0.5s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><MessageCircle size={18} /> Customer Chat</h3>
                <button className="md-btn md-btn-icon md-btn-outline"><Phone size={14} /></button>
              </div>
              <div className="md-chat">
                <div className="md-chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`md-chat-msg ${msg.incoming ? 'incoming' : 'outgoing'}`}>
                      {msg.text}
                      <div className="md-chat-msg-time">{msg.time}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="md-quick-replies">
                  {quickReplies.map((qr, i) => (
                    <button key={i} className="md-quick-reply" onClick={() => setChatInput(qr)}>{qr}</button>
                  ))}
                </div>
                <div className="md-chat-input-area">
                  <input className="md-chat-input md-focus" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." />
                  <button className="md-btn md-btn-icon md-btn-outline"><Mic size={14} /></button>
                  <button className="md-btn md-btn-icon md-btn-outline"><Image size={14} /></button>
                  <button className="md-chat-send-btn md-focus" onClick={handleSendMessage}><Send size={14} /></button>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="md-card" style={{ animationDelay: '0.55s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><Award size={18} /> Rewards</h3>
              </div>
              <div className="md-card-body">
                <div className="md-rewards-grid">
                  <div className="md-reward-card">
                    <div className="md-reward-icon" style={{ background: 'rgba(245,158,11,0.12)' }}><DollarSign size={20} color="#F59E0B" /></div>
                    <div className="md-reward-value">$150</div>
                    <div className="md-reward-label">Monthly Bonus</div>
                  </div>
                  <div className="md-reward-card">
                    <div className="md-reward-icon" style={{ background: 'var(--secondary-glow)' }}><TrendingUp size={20} color="var(--secondary)" /></div>
                    <div className="md-reward-value">$75</div>
                    <div className="md-reward-label">Performance</div>
                  </div>
                  <div className="md-reward-card">
                    <div className="md-reward-icon" style={{ background: 'var(--primary-glow)' }}><Users size={20} color="var(--primary)" /></div>
                    <div className="md-reward-value">$50</div>
                    <div className="md-reward-label">Referral Bonus</div>
                  </div>
                  <div className="md-reward-card">
                    <div className="md-reward-icon" style={{ background: 'rgba(139,92,246,0.12)' }}><Award size={20} color="#8B5CF6" /></div>
                    <div className="md-reward-value">7</div>
                    <div className="md-reward-label">Badges Earned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="md-card" style={{ animationDelay: '0.6s' }}>
              <div className="md-card-header">
                <h3 className="md-card-title"><Calendar size={18} /> Today's Schedule</h3>
              </div>
              <div className="md-card-body-compact" style={{ padding: 0 }}>
                <div className="md-schedule-list">
                  {schedule.map((item, i) => (
                    <div key={i} className="md-schedule-item">
                      <div className={`md-schedule-dot ${item.status}`} />
                      <div className="md-schedule-info">
                        <div className="md-schedule-title">{item.title}</div>
                        <div className="md-schedule-time">{item.time}</div>
                      </div>
                      <span className={`md-schedule-status ${item.status}`}>
                        {item.status === 'active' ? 'In Progress' : item.status === 'done' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Incoming Requests */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="md-card" style={{ animationDelay: '0.65s' }}>
                <div className="md-card-header">
                  <h3 className="md-card-title"><ClipboardList size={18} /> Incoming Requests ({requests.length})</h3>
                  <button className="md-btn md-btn-outline" style={{ fontSize: '0.75rem' }}><RefreshCw size={13} /> Refresh</button>
                </div>
                <div className="md-card-body">
                  {requests.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.9rem' }}>No pending requests. Stay online to receive new ones!</p>
                  ) : (
                    requests.map((req) => (
                      <div key={req.id} className="md-request-card">
                        <div className="md-request-header">
                          <div className="md-request-customer">
                            <div className="md-request-avatar" style={{ background: req.priority === 'high' ? 'var(--accent)' : req.priority === 'medium' ? '#F59E0B' : 'var(--secondary)' }}>
                              {req.customer.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="md-request-name">{req.customer}</div>
                              <div className="md-request-vehicle">{req.vehicle} · {req.plate}</div>
                            </div>
                          </div>
                          <span className={`md-request-priority ${req.priority}`}>
                            <AlertCircle size={10} /> {req.priority}
                          </span>
                        </div>

                        <div className="md-request-details">
                          <div className="md-request-detail"><Wrench size={14} /> {req.problem}</div>
                          <div className="md-request-detail"><MapPin size={14} /> {req.distance}</div>
                          <div className="md-request-detail"><Clock size={14} /> ETA: {req.eta}</div>
                          <div className="md-request-detail"><DollarSign size={14} /> ~${req.earnings}</div>
                        </div>

                        <div className="md-countdown">
                          <Timer size={12} />
                          <span>Expires in {req.timeLeft}s</span>
                          <div className="md-countdown-bar">
                            <div className="md-countdown-fill" style={{ width: `${(req.timeLeft / 30) * 100}%` }} />
                          </div>
                        </div>

                        <div className="md-request-actions" style={{ marginTop: '0.65rem' }}>
                          <button className="md-btn md-btn-accept" onClick={() => handleAcceptRequest(req.id)}>
                            <Check size={14} /> Accept
                          </button>
                          <button className="md-btn md-btn-decline" onClick={() => handleDeclineRequest(req.id)}>
                            <X size={14} /> Decline
                          </button>
                          <button className="md-btn md-btn-outline"><ChevronRight size={14} /> Details</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </main>

      {/* ===== EMERGENCY FLOATING BUTTONS ===== */}
      <div className="md-emergency-float">
        <button className="md-emergency-float-btn sos md-focus">
          <AlertTriangle size={14} /> Emergency SOS
        </button>
        <button className="md-emergency-float-btn support md-focus">
          <Phone size={14} /> Call Support
        </button>
      </div>

      {/* ===== AI ASSISTANT WIDGET ===== */}
      <div className="md-ai-widget">
        {aiOpen && (
          <div className="md-ai-panel">
            <div className="md-card-header" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#fff' }}>
              <h3 className="md-card-title" style={{ color: '#fff' }}><Zap size={18} /> AI Assistant</h3>
              <button onClick={() => setAiOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="md-chat-messages" style={{ flex: 1, minHeight: 250 }}>
              {aiMessages.map((msg, i) => (
                <div key={i} className={`md-chat-msg ${msg.incoming ? 'incoming' : 'outgoing'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="md-chat-input-area" style={{ borderTop: '1px solid var(--border-light)' }}>
              <input className="md-chat-input md-focus" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSend()} placeholder="Ask AI anything..." />
              <button className="md-chat-send-btn md-focus" onClick={handleAiSend} style={{ background: '#8B5CF6' }}><Send size={14} /></button>
            </div>
          </div>
        )}
        <button className="md-ai-btn md-focus" onClick={() => setAiOpen(!aiOpen)} title="AI Assistant">
          <Zap size={22} />
        </button>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md-bottom-nav">
        <div className="md-bottom-nav-inner">
          {[
            { key: 'home', label: 'Home', icon: LayoutDashboard },
            { key: 'requests', label: 'Requests', icon: ClipboardList },
            { key: 'jobs', label: 'Jobs', icon: Briefcase },
            { key: 'chat', label: 'Chat', icon: MessageCircle },
            { key: 'earnings', label: 'Earnings', icon: DollarSign },
            { key: 'profile', label: 'Profile', icon: User },
          ].map((item) => (
            <button key={item.key} className={`md-bottom-tab ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
