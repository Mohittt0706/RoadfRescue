import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  MapPin, 
  Activity, 
  Shield, 
  Star, 
  ShieldAlert, 
  Navigation, 
  Clock, 
  CreditCard, 
  Menu, 
  X, 
  Send, 
  Upload, 
  Mic, 
  Check, 
  Play, 
  Lock, 
  User, 
  Sparkles, 
  AlertTriangle, 
  Compass,
  ArrowUp,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Bell,
  Search,
  LogOut,
  Zap,
  Fuel,
  Battery,
  ChevronRight,
  PhoneCall,
  MessageCircle,
  Bot,
  Home,
  Radio,
  UserCircle,
  HelpCircle,
  Bookmark,
  Truck,
  Settings,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import SOSDispatch from './components/SOSDispatch';
import NearbyServices from './components/NearbyServices';
import MechanicProfile from './components/MechanicProfile';
import AIAssistant from './components/AIAssistant';
import CheckoutPage from './components/CheckoutPage';
import ProfileSettingsPage from './components/ProfileSettingsPage';
import HelpSupportPage from './components/HelpSupportPage';
import NotificationsCenter from './components/NotificationsCenter';
import BookingModal from './components/BookingModal';
import AdminDashboard from './components/AdminDashboard';
import MyBookings from './components/MyBookings';
import EmergencyBookingModal from './components/EmergencyBookingModal';
import EmergencyTracking from './components/EmergencyTracking';
import MechanicDashboard from './components/MechanicDashboard';
import Silk from './components/Silk';
import { authService } from './services/authService';
import { NotificationStore, socket, syncAllStores } from './services/store';

// Types for Chatbot
interface Message {
  id: number;
  text: string;
  sender: 'ai' | 'user';
  time: string;
  costEstimate?: string;
  mechanicName?: string;
}

// Types for Confetti particle
interface ConfettiItem {
  id: number;
  left: number;
  delay: number;
  color: string;
  size: number;
}

export default function App() {
  /* --- Routing State --- */
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'mechanicProfile' | 'checkout' | 'admin' | 'myBookings' | 'emergencyTrack' | 'mechanicDashboard'>('landing');
  const [checkoutData, setCheckoutData] = useState<any>(null);

  /* --- Authentication State --- */
  const [currentUser, setCurrentUser] = useState<any>(null);


  /* --- Booking Modal State --- */
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingService, setBookingService] = useState({ name: '', price: 0 });

  /* --- Emergency Modal & Tracking States --- */
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);

  /* --- Dashboard Tab Switcher --- */
  const [activeDashboardTab, setActiveDashboardTab] = useState<'home' | 'dispatch' | 'chat' | 'profile' | 'nearby' | 'help' | 'notifications' | 'myBookings'>('home');

  /* --- Scroll to top on tab change (fixes Home navigation bug) --- */
  useEffect(() => {
    const contentEl = document.querySelector('.dsb-content');
    if (contentEl) contentEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeDashboardTab]);

  /* --- Theme State --- */
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('roadrescue-theme');
    return (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('roadrescue-theme', theme);
  }, [theme]);

  /* --- Check Existing Auth Session on Mount --- */
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      socket.connect();
      syncAllStores();
      // Auto redirect to their matching dashboard if they reload and are logged in
      if (user.role === 'admin') {
        setCurrentView('admin');
      } else if (user.role === 'mechanic') {
        setCurrentView('mechanicDashboard');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, []);

  useEffect(() => {
    const updateNotificationsCount = () => {
      const user = authService.getCurrentUser();
      if (user) {
        const count = NotificationStore.getUnreadCount(user.role);
        setNotificationCount(count);
      }
    };
    updateNotificationsCount();
    const unsubscribe = NotificationStore.subscribe(updateNotificationsCount);
    return () => unsubscribe();
  }, [currentUser]);

  /* --- Route Protection for private dashboards --- */
  useEffect(() => {
    const user = authService.getCurrentUser();
    
    if (currentView === 'dashboard' && (!user || user.role !== 'user')) {
      setCurrentView('login');
    } else if (currentView === 'mechanicDashboard' && (!user || user.role !== 'mechanic')) {
      setCurrentView('login');
    } else if (currentView === 'admin' && (!user || user.role !== 'admin')) {
      setCurrentView('login');
    }
  }, [currentView, currentUser]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  /* --- Live Digital Clock for Welcome Banner --- */
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* --- Navbar Scroll State --- */
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentView === 'landing') {
        const sections = ['contact', 'faq', 'reviews', 'how-it-works', 'services', 'features', 'home'];
        for (const id of sections) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 120) {
              setActiveSection(id);
              break;
            }
          }
        }
      }

      const backToTopBtn = document.getElementById('back-to-top');
      if (backToTopBtn) {
        if (window.scrollY > 500) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* --- Interactive Map Simulation State --- */
  const [mapStatus, setMapStatus] = useState<'Searching' | 'Accepted' | 'On The Way' | 'Arriving' | 'Completed'>('Searching');
  const [mapEta, setMapEta] = useState(12);
  const [truckPos, setTruckPos] = useState({ x: 100, y: 120 });
  const [routeLineProgress, setRouteLineProgress] = useState(0);
  const [mapDist, setMapDist] = useState(4.2);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef<any>(null);

  const cancelSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
    setMapStatus('Searching');
    setMapEta(12);
    setMapDist(4.2);
    setTruckPos({ x: 100, y: 120 });
    setRouteLineProgress(0);
  };

  const startMapSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setMapStatus('Searching');
    setMapEta(12);
    setMapDist(4.2);
    setTruckPos({ x: 100, y: 120 });
    setRouteLineProgress(0);

    let progress = 0;
    simulationIntervalRef.current = setInterval(() => {
      progress += 1;
      setRouteLineProgress(progress);

      if (progress < 15) {
        setMapStatus('Searching');
      } else if (progress >= 15 && progress < 30) {
        setMapStatus('Accepted');
        setMapEta(11);
      } else if (progress >= 30 && progress < 80) {
        setMapStatus('On The Way');
        const ratio = (progress - 30) / 50;
        setMapEta(Math.max(2, Math.floor(10 - ratio * 8)));
        setMapDist(parseFloat((3.5 - ratio * 3.0).toFixed(1)));
      } else if (progress >= 80 && progress < 98) {
        setMapStatus('Arriving');
        setMapEta(1);
        setMapDist(0.2);
      } else if (progress >= 98) {
        setMapStatus('Completed');
        setMapEta(0);
        setMapDist(0);
        setIsSimulating(false);
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
      }

      if (progress < 33) {
        const t = progress / 33;
        setTruckPos({ x: 100 + t * 150, y: 120 });
      } else if (progress >= 33 && progress < 66) {
        const t = (progress - 33) / 33;
        setTruckPos({ x: 250, y: 120 + t * 130 });
      } else {
        const t = Math.min(1, (progress - 66) / 34);
        setTruckPos({ x: 250 + t * 200, y: 250 });
      }
    }, 150);
  };

  /* --- AI Chatbot Diagnostic States --- */
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am your AI Roadside Assistant. What is the current issue with your vehicle? Select one of the presets or describe it in detail below.",
      sender: 'ai',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const simulateAiReply = (userInput: string) => {
    setIsAiTyping(true);
    
    setTimeout(() => {
      let aiText = "";
      let cost = "";
      let mechanic = "";

      const cleaned = userInput.toLowerCase();
      if (cleaned.includes('tire') || cleaned.includes('flat')) {
        aiText = "🔍 AI DIAGNOSIS: Standard tire puncture or structural damage detected. Recommend direct tire swap or puncture repair. Safety advice: Please park your car safely in the emergency lane, put on hazard warning lights, and do not attempt to stand near highway lanes.";
        cost = "₹699";
        mechanic = "Rescue Mobile Repair (1.2 km away)";
      } else if (cleaned.includes('battery') || cleaned.includes('dead') || cleaned.includes('start')) {
        aiText = "🔍 AI DIAGNOSIS: Vehicle battery voltage critical. Requires jump start or battery replacement. Match found: 3 mobile dispatchers nearby carry premium replacement batteries for your model.";
        cost = "₹999";
        mechanic = "Apex Battery & Auto (2.0 km away)";
      } else if (cleaned.includes('smoke') || cleaned.includes('overheat') || cleaned.includes('engine')) {
        aiText = "🚨 HIGH CRITICAL ALERT: Fluid leakage or cylinder cooling failure. Running engine now can cause catastrophic damage. Please turn off your ignition immediately, step safely behind the guard rail, and wait. Dispatching high-capacity flatbed tow truck.";
        cost = "₹1,499";
        mechanic = "Tow Pro Logistics (2.8 km away)";
      } else {
        aiText = "🔍 AI DIAGNOSIS: Custom vehicle diagnostic request received. Estimating location and connecting you with the closest technician specializing in engine troubleshooting.";
        cost = "₹899 - ₹1,499";
        mechanic = "Certified Engine Care Mobile (1.5 km away)";
      }

      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 2,
          text: aiText,
          sender: 'ai',
          time: 'Just now',
          costEstimate: cost,
          mechanicName: mechanic
        }
      ]);
      setIsAiTyping(false);
    }, 1500);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = {
      id: messages.length + 1,
      text: text,
      sender: 'user',
      time: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    simulateAiReply(text);
  };

  /* ==========================================================================
     AUTHENTICATION FORM STATE & HANDLERS
     ========================================================================== */
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRemember, setLoginRemember] = useState(false);
  const [selectedLoginRole, setSelectedLoginRole] = useState<'user' | 'mechanic' | 'admin'>('user');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupVehicle, setSignupVehicle] = useState('Sedan');
  const [signupCarNum, setSignupCarNum] = useState('');
  const [signupEmergencyContact, setSignupEmergencyContact] = useState('');
  const [signupTerms, setSignupTerms] = useState(false);
  const [signupAlerts, setSignupAlerts] = useState(false);

  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [signupErrors, setSignupErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string; general?: string }>({});
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<'login' | 'signup' | null>(null);
  const [shakeCard, setShakeCard] = useState(false);

  const [confetti, setConfetti] = useState<ConfettiItem[]>([]);

  const formatPhoneNumber = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
    return `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'signup' | 'emergency') => {
    const formatted = formatPhoneNumber(e.target.value);
    if (type === 'signup') {
      setSignupPhone(formatted);
    } else {
      setSignupEmergencyContact(formatted);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return { score, label: 'None', colorClass: '' };
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = 'Weak';
    let colorClass = 'weak';
    if (score >= 4) {
      label = 'Strong';
      colorClass = 'strong';
    } else if (score >= 2) {
      label = 'Medium';
      colorClass = 'medium';
    }
    return { score, label, colorClass };
  };

  const pwStrength = calculatePasswordStrength(signupPassword);

  const triggerConfetti = () => {
    const colors = ['#2563EB', '#22C55E', '#EF4444', '#EAB308', '#EC4899', '#8B5CF6'];
    const items: ConfettiItem[] = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6
    }));
    setConfetti(items);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    let errors: { email?: string; password?: string } = {};
    if (!loginEmail.trim()) errors.email = "Email or mobile number is required.";
    if (!loginPassword) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
      return;
    }

    setAuthLoading(true);
    try {
      // Authenticate against backend
      let user: any;
      let targetView: string;

      if (selectedLoginRole === 'admin') {
        user = await authService.login(loginEmail, loginPassword, 'admin');
        targetView = 'admin';
      } else if (selectedLoginRole === 'mechanic') {
        user = await authService.login(loginEmail, loginPassword, 'mechanic');
        targetView = 'mechanicDashboard';
      } else {
        user = await authService.login(loginEmail, loginPassword, 'user');
        targetView = 'dashboard';
      }

      setCurrentUser(user);
      socket.connect();
      syncAllStores();
      setAuthLoading(false);
      setAuthSuccess('login');
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentView(targetView as any);
      }, 1000); // Redirect after 1 second
    } catch (err: any) {
      setAuthLoading(false);
      setLoginErrors({ general: err.message || 'Incorrect credentials.' });
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    let errors: { name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string } = {};
    if (!signupName.trim()) errors.name = "Full name is required.";
    if (!signupEmail.trim() || !/\S+@\S+\.\S+/.test(signupEmail)) errors.email = "Please enter a valid email address.";
    if (!signupPhone.trim()) errors.phone = "Mobile number is required.";
    if (signupPassword.length < 8) errors.password = "Password must be at least 8 characters.";
    if (signupPassword !== signupConfirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (!signupTerms) {
      setSignupErrors(prev => ({ ...prev, general: "You must accept the terms & conditions." }));
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setSignupErrors(errors);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
      return;
    }

    setAuthLoading(true);
    try {
      // Register against backend
      const user = await authService.register({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword,
        vehicleType: signupVehicle,
        vehicleNumber: signupCarNum,
        emergencyContact: signupEmergencyContact
      });
      setCurrentUser(user);
      socket.connect();
      syncAllStores();
      setAuthLoading(false);
      setAuthSuccess('signup');
      triggerConfetti();
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentView('dashboard');
      }, 2500);
    } catch (err: any) {
      setAuthLoading(false);
      setSignupErrors({ general: err.message || 'Registration failed.' });
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
    }
  };

  /* --- Unified Logout Handler --- */
  const handleLogout = () => {
    authService.logout();
    socket.disconnect();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  /* ==========================================================================
     DASHBOARD SPECIFIC STATES
     ========================================================================== */
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick select issue handler
  const handleQuickIssueSelect = (issue: string) => {
    setSelectedIssue(issue);
    setActiveDashboardTab('dispatch');
    startMapSimulation();
    
    // Simulate AI logging of the select issue
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: `🚗 Dispatch Selected: ${issue}. Initializing real-time GPS telemetry...`,
        sender: 'user',
        time: 'Just now'
      }
    ]);
    simulateAiReply(issue);
  };

  // Book Now handler - opens booking modal with service details
  const handleBookService = (serviceName: string, price: number) => {
    setBookingService({ name: serviceName, price });
    setShowBookingModal(true);
  };

  // Handle booking confirmed
  const handleBookingConfirmed = (booking: any) => {
    setNotificationCount(prev => prev + 1);
  };



  return (
    <>
      <div className="global-silk-bg-container">
        <Silk
          speed={theme === 'dark' ? 1.2 : 1.8}
          scale={0.9}
          color={theme === 'dark' ? '#2563EB' : '#3B82F6'}
          noiseIntensity={theme === 'dark' ? 0.8 : 0.4}
        />
      </div>
      {/* ==========================================
          DASHBOARD SCREEN VIEW (SIDEBAR v3)
          ========================================== */}
      {currentView === 'dashboard' ? (
        <div className="dsb-root">

          {/* ── Mobile Overlay ── */}
          {mobileSidebarOpen && (
            <div className="dsb-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />
          )}

          {/* ── Left Sidebar ── */}
          <aside className={`dsb-sidebar ${sidebarCollapsed ? 'dsb-collapsed' : ''} ${mobileSidebarOpen ? 'dsb-mobile-open' : ''}`}>
            {/* Logo */}
            <div className="dsb-sidebar-logo">
              <span style={{ fontSize: '1.3rem' }}>🚨</span>
              {!sidebarCollapsed && <span className="dsb-logo-text"><span style={{ color: 'var(--primary)' }}>Road</span>Rescue</span>}
            </div>

            {/* Collapse Toggle */}
            <button className="dsb-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Main Nav Items */}
            <nav className="dsb-nav">
              {[
                { id: 'home',        icon: <Home size={19} />,        label: 'Home' },
                { id: 'dispatch',    icon: <Radio size={19} />,       label: 'SOS Dispatch' },
                { id: 'chat',        icon: <Bot size={19} />,         label: 'AI Diagnosis' },
                { id: 'nearby',      icon: <MapPin size={19} />,      label: 'Nearby Services' },
                { id: 'myBookings',  icon: <Bookmark size={19} />,    label: 'My Bookings' },
                { id: 'profile',     icon: <UserCircle size={19} />,  label: 'Billing & Profile' },
                { id: 'notifications', icon: <Bell size={19} />,      label: 'Notifications' },
                { id: 'help',        icon: <HelpCircle size={19} />,  label: 'Help & Support' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveDashboardTab(item.id as any); setMobileSidebarOpen(false); }}
                  className={`dsb-nav-item ${activeDashboardTab === item.id ? 'dsb-active' : ''}`}
                  title={item.label}
                >
                  {activeDashboardTab === item.id && <span className="dsb-active-bar" />}
                  <span className="dsb-nav-icon">{item.icon}</span>
                  {!sidebarCollapsed && <span className="dsb-nav-label">{item.label}</span>}
                  {!sidebarCollapsed && item.id === 'notifications' && notificationCount > 0 && (
                    <span className="dsb-badge">{notificationCount}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="dsb-divider" />

            {/* Bottom Items */}
            <nav className="dsb-nav">
              {currentUser?.role === 'admin' && (
                <button onClick={() => { setCurrentView('admin'); setMobileSidebarOpen(false); }} className="dsb-nav-item" title="Admin Panel">
                  <span className="dsb-nav-icon"><Settings size={19} /></span>
                  {!sidebarCollapsed && <span className="dsb-nav-label">Admin Panel</span>}
                </button>
              )}
              <button onClick={handleLogout} className="dsb-nav-item" title="Logout">
                <span className="dsb-nav-icon"><LogOut size={19} /></span>
                {!sidebarCollapsed && <span className="dsb-nav-label">Logout</span>}
              </button>
            </nav>

            {/* User Card */}
            <div className="dsb-sidebar-user">
              <div className="dsb-user-avatar">D</div>
              {!sidebarCollapsed && (
                <div className="dsb-user-info">
                  <div className="dsb-user-name">Disha</div>
                  <div className="dsb-user-role">Gold Member</div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main Content Area ── */}
          <div className={`dsb-main ${sidebarCollapsed ? 'dsb-main-expanded' : ''}`}>

            {/* Top Header */}
            <header className="dsb-topbar">
              {/* Mobile hamburger */}
              <button className="dsb-hamburger" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
                <Menu size={20} />
              </button>

              {/* Search */}
              <div className="dsb-search">
                <Search size={15} />
                <input type="text" placeholder="Search services, mechanics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              {/* Right actions */}
              <div className="dsb-topbar-actions">
                <button onClick={() => setShowEmergencyModal(true)} className="dsb-sos-btn">
                  <ShieldAlert size={14} /> Emergency SOS
                </button>
                <button onClick={() => { setActiveDashboardTab('notifications'); setNotificationCount(0); }} className="dsb-icon-btn" title="Notifications" style={{ position: 'relative' }}>
                  <Bell size={18} />
                  {notificationCount > 0 && <span className="dsb-notif-dot" />}
                </button>
                <button onClick={toggleTheme} className="dsb-icon-btn" title="Toggle Theme">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <div className="dsb-avatar-wrap" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                  <div className="dsb-avatar">D</div>
                  {profileDropdownOpen && (
                    <div className="dsb-profile-dropdown">
                      <div style={{ padding: '0.25rem 0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Disha</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gold Member</div>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />
                      <button onClick={() => { handleLogout(); setProfileDropdownOpen(false); }} className="dsb-dropdown-item">
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="dsb-content">
              <AnimatePresence mode="wait">
                {/* ── HOME TAB ── */}
                {activeDashboardTab === 'home' && (
                  <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

                    <div className="db2-hero">
                      <motion.h2 className="db2-hero-greeting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        Good Morning, Disha 👋
                      </motion.h2>
                      <div className="db2-hero-sub">
                        <span className="db2-hero-pill"><MapPin size={14} /> Mumbai, MH</span>
                        <span className="db2-hero-pill"><span>🌤️</span> 24°C Sunny</span>
                        <span className="db2-hero-pill"><Clock size={14} /> {liveTime}</span>
                        <span className="db2-hero-status safe"><span className="db2-hero-status-dot" /> All Systems Normal</span>
                      </div>
                    </div>

                    <div className="db2-safety-banner">
                      <ShieldAlert size={15} />
                      <span><strong>Safety Tip:</strong> Never stand close to active traffic lanes. Step behind guardrails while waiting.</span>
                      <button onClick={() => {}}><X size={14} /></button>
                    </div>

                    {activeEmergencyId && (
                      <motion.div className="db2-active-card" style={{ marginBottom: '1.5rem' }} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="db2-active-icon"><ShieldAlert size={18} /></div>
                        <div className="db2-active-info">
                          <div className="db2-active-title">Active SOS Emergency</div>
                          <div className="db2-active-sub">Emergency in progress</div>
                        </div>
                        <button onClick={() => setCurrentView('emergencyTrack')} className="db2-active-track-btn">Track →</button>
                      </motion.div>
                    )}

                    <div className="db2-main-grid">
                      <div className="db2-left-col">

                        {/* Quick Actions */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                          <div className="db2-section-header">
                            <h3 className="db2-section-title">Quick Actions</h3>
                          </div>
                          <div className="db2-quick-actions">
                            {[
                              { label: 'Fuel', icon: <Fuel size={22} />, action: 'Fuel Empty' },
                              { label: 'Battery', icon: <Battery size={22} />, action: 'Dead Battery' },
                              { label: 'Tire', icon: <Wrench size={22} />, action: 'Flat Tire' },
                              { label: 'Tow', icon: <Truck size={22} />, action: 'Car Towing' },
                              { label: 'Lockout', icon: <Lock size={22} />, action: 'Lockout Bypass' },
                              { label: 'SOS', icon: <ShieldAlert size={22} />, action: null, isSos: true },
                            ].map(qa => (
                              <motion.button key={qa.label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => qa.isSos ? setShowEmergencyModal(true) : handleQuickIssueSelect(qa.action!)} className={`db2-quick-action-btn ${qa.isSos ? 'sos' : ''}`}>
                                {qa.icon}
                                <span>{qa.label}</span>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>

                        {/* Nearby Services */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                          <div className="db2-section-header">
                            <h3 className="db2-section-title">Nearby Services</h3>
                            <span className="db2-section-link" onClick={() => setActiveDashboardTab('nearby')}>View All →</span>
                          </div>
                          <div className="db2-card">
                            {[
                              { name: 'Apex Auto Recovery', meta: '⭐ 4.9 · Tire, Battery, Fuel', dist: '1.2 km', icon: '🔧', color: 'rgba(37,99,235,0.1)' },
                              { name: 'QuickFix Mechanics', meta: '⭐ 4.7 · Towing, Engine', dist: '2.0 km', icon: '⚡', color: 'rgba(34,197,94,0.1)' },
                              { name: 'RoadAssist Pro', meta: '⭐ 4.8 · All Services', dist: '2.8 km', icon: '🛡️', color: 'rgba(139,92,246,0.1)' },
                            ].map(s => (
                              <div key={s.name} className="db2-nearby-item">
                                <div className="db2-nearby-icon" style={{ background: s.color }}>{s.icon}</div>
                                <div className="db2-nearby-info">
                                  <div className="db2-nearby-name">{s.name}</div>
                                  <div className="db2-nearby-meta">{s.meta}</div>
                                </div>
                                <span className="db2-nearby-dist">{s.dist}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Service Cards */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                          <div className="db2-section-header">
                            <h3 className="db2-section-title">Services</h3>
                          </div>
                          <div className="db2-services-grid">
                            {[
                              { name: 'Flat Tire Repair', price: 699, icon: '🔧', eta: '15-20 min' },
                              { name: 'Battery Jump', price: 999, icon: '🔋', eta: '10-15 min' },
                              { name: 'Fuel Delivery', price: 799, icon: '⛽', eta: '20-25 min' },
                              { name: 'Engine Diagnosis', price: 1499, icon: '🔍', eta: '20-30 min' },
                              { name: 'Car Towing', price: 1999, icon: '🚛', eta: '25-35 min' },
                              { name: 'Lockout Help', price: 899, icon: '🔓', eta: '10-15 min' },
                            ].map(s => (
                              <motion.div key={s.name} className="db2-service-card" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                                <div className="db2-service-icon">{s.icon}</div>
                                <div className="db2-service-name">{s.name}</div>
                                <div className="db2-service-meta">
                                  <span className="db2-service-eta">⏱ {s.eta}</span>
                                  <span className="db2-service-price">₹{s.price.toLocaleString('en-IN')}</span>
                                </div>
                                <button onClick={() => handleBookService(s.name, s.price)} className="db2-service-book-btn">Book Now</button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* AI Diagnosis Shortcut */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={() => setActiveDashboardTab('chat')} style={{ cursor: 'pointer' }}>
                          <div className="db2-ai-widget">
                            <div className="db2-ai-widget-icon"><Sparkles size={18} /></div>
                            <div className="db2-ai-widget-text">
                              <div className="db2-ai-widget-title">AI Diagnosis</div>
                              <div className="db2-ai-widget-sub">Describe your issue and get instant analysis</div>
                            </div>
                            <ChevronRight size={16} className="db2-ai-widget-arrow" />
                          </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                          <div className="db2-section-header">
                            <h3 className="db2-section-title">Recent Activity</h3>
                          </div>
                          <div className="db2-card">
                            {[
                              { text: 'Battery Jump Start completed', time: '2h ago', dot: 'success' },
                              { text: 'Flat Tire Repair booked', time: '1d ago', dot: 'info' },
                              { text: 'Payment of ₹999 processed', time: '1d ago', dot: 'success' },
                              { text: 'AI Diagnosis: Engine Overheat', time: '3d ago', dot: 'warning' },
                            ].map((a, i) => (
                              <div key={i} className="db2-activity-item">
                                <div className={`db2-activity-dot ${a.dot}`} />
                                <span className="db2-activity-text">{a.text}</span>
                                <span className="db2-activity-time">{a.time}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Emergency CTA */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                          <button onClick={() => setShowEmergencyModal(true)} className="btn btn-emergency" style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem' }}>
                            <ShieldAlert size={16} /> Request Emergency Help
                          </button>
                        </motion.div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="db2-right-col">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="db2-membership-card">
                          <div className="db2-membership-tier">VIP Gold Member</div>
                          <div className="db2-membership-name">Disha's Membership</div>
                          <div className="db2-membership-points">
                            <span className="db2-membership-points-num">4,200</span>
                            <span className="db2-membership-points-label">PTS</span>
                          </div>
                          <div className="db2-membership-progress">
                            <div className="db2-membership-progress-fill" style={{ width: '70%' }} />
                          </div>
                          <div className="db2-membership-desc">2 emergency credits remaining. Refer friends to earn more!</div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="db2-card">
                          <div className="db2-card-title"><CreditCard size={15} /> Wallet & Credits</div>
                          <div className="db2-wallet">
                            <div>
                              <div className="db2-wallet-balance">₹2,450</div>
                              <div className="db2-wallet-label">Available Balance</div>
                            </div>
                            <button className="db2-wallet-add-btn">+ Add Funds</button>
                          </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="db2-card">
                          <div className="db2-card-title"><Phone size={15} /> Emergency Contacts</div>
                          {[
                            { name: 'Mom', relation: 'Family', phone: '+91 98765 43210', color: 'rgba(239,68,68,0.15)', text: '#EF4444' },
                            { name: 'Priya', relation: 'Friend', phone: '+91 87654 32109', color: 'rgba(139,92,246,0.15)', text: '#8B5CF6' },
                          ].map(c => (
                            <div key={c.name} className="db2-contact-item">
                              <div className="db2-contact-avatar" style={{ background: c.color, color: c.text }}>{c.name[0]}</div>
                              <div className="db2-contact-info">
                                <div className="db2-contact-name">{c.name}</div>
                                <div className="db2-contact-relation">{c.relation}</div>
                              </div>
                              <span className="db2-contact-phone">{c.phone}</span>
                            </div>
                          ))}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="db2-card">
                          <div className="db2-card-title"><PhoneCall size={15} /> 24/7 Hotline</div>
                          <div className="db2-hotline">
                            <div className="db2-hotline-icon"><PhoneCall size={18} /></div>
                            <div className="db2-hotline-info">
                              <div className="db2-hotline-number">+1-800-555-SOS</div>
                              <div className="db2-hotline-label">Dispatch Hotline</div>
                            </div>
                            <a href="tel:+1800555SOSAI" className="db2-hotline-call-btn">Call</a>
                          </div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href="https://wa.me/1800555SOS" className="db2-hotline" style={{ borderColor: 'rgba(34,197,94,0.15)' }}>
                              <div className="db2-hotline-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}><MessageCircle size={18} /></div>
                              <div className="db2-hotline-info">
                                <div className="db2-hotline-number" style={{ color: '#22C55E' }}>WhatsApp</div>
                                <div className="db2-hotline-label">Chat with us</div>
                              </div>
                            </a>
                          </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} onClick={() => setActiveDashboardTab('chat')} className="db2-ai-widget">
                          <div className="db2-ai-widget-icon"><Bot size={18} /></div>
                          <div className="db2-ai-widget-text">
                            <div className="db2-ai-widget-title">AI Assistant</div>
                            <div className="db2-ai-widget-sub">Ask anything about your vehicle</div>
                          </div>
                          <ChevronRight size={16} className="db2-ai-widget-arrow" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── DISPATCH TAB ── */}
                {activeDashboardTab === 'dispatch' && (
                  <motion.div key="dispatch" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <SOSDispatch onBack={() => setActiveDashboardTab('home')} />
                  </motion.div>
                )}

                {/* ── AI CHAT TAB ── */}
                {activeDashboardTab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <AIAssistant onBookService={(name, price) => handleBookService(name, price)} />
                  </motion.div>
                )}

                {/* ── PROFILE TAB ── */}
                {activeDashboardTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <ProfileSettingsPage onLogout={handleLogout} />
                  </motion.div>
                )}

                {/* ── NEARBY TAB ── */}
                {activeDashboardTab === 'nearby' && (
                  <motion.div key="nearby" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <NearbyServices />
                  </motion.div>
                )}

                {/* ── HELP TAB ── */}
                {activeDashboardTab === 'help' && (
                  <motion.div key="help" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <HelpSupportPage setActiveDashboardTab={setActiveDashboardTab} />
                  </motion.div>
                )}

                {/* ── NOTIFICATIONS TAB ── */}
                {activeDashboardTab === 'notifications' && (
                  <motion.div key="notif" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <NotificationsCenter />
                  </motion.div>
                )}

                {/* ── BOOKINGS TAB ── */}
                {activeDashboardTab === 'myBookings' && (
                  <motion.div key="bookings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    <MyBookings />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Bottom Nav */}
          <div className="mobile-bottom-nav">
            <button onClick={() => setActiveDashboardTab('home')} className={`mobile-bottom-tab ${activeDashboardTab === 'home' ? 'active' : ''}`}>
              <Home size={20} /><span>Home</span>
            </button>
            <button onClick={() => setActiveDashboardTab('dispatch')} className={`mobile-bottom-tab ${activeDashboardTab === 'dispatch' ? 'active' : ''}`}>
              <Radio size={20} /><span>Dispatch</span>
            </button>
            <button onClick={() => setActiveDashboardTab('chat')} className={`mobile-bottom-tab ${activeDashboardTab === 'chat' ? 'active' : ''}`}>
              <Bot size={20} /><span>AI Chat</span>
            </button>
            <button onClick={() => setActiveDashboardTab('nearby')} className={`mobile-bottom-tab ${activeDashboardTab === 'nearby' ? 'active' : ''}`}>
              <MapPin size={20} /><span>Nearby</span>
            </button>
            <button onClick={() => setActiveDashboardTab('myBookings')} className={`mobile-bottom-tab ${activeDashboardTab === 'myBookings' ? 'active' : ''}`}>
              <Bookmark size={20} /><span>Bookings</span>
            </button>
          </div>

        </div>
      ) : currentView === 'mechanicProfile' ? (
        /* ==========================================
           MECHANIC PROFILE PAGE
           ========================================== */
        <MechanicProfile onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'checkout' ? (
        /* ==========================================
           SECURE CHECKOUT & PAYMENT PAGE
           ========================================== */
        <CheckoutPage 
          checkoutData={checkoutData}
          onPaymentSuccess={() => {
            setCurrentView('dashboard');
            setActiveDashboardTab('dispatch');
            if (checkoutData) {
              setMapEta(checkoutData.eta);
              setMapDist(parseFloat(checkoutData.distance.split(' ')[0]));
              setSelectedIssue(checkoutData.serviceType);
            }
            startMapSimulation();
          }}
          onBack={() => {
            setCurrentView('dashboard');
            setActiveDashboardTab('dispatch');
          }}
        />
      ) : currentView === 'emergencyTrack' ? (
        /* ==========================================
           EMERGENCY SOS TRACKING PAGE
           ========================================== */
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
          {activeEmergencyId && (
            <EmergencyTracking 
              emergencyId={activeEmergencyId} 
              onBack={() => {
                setCurrentView('dashboard');
                setActiveDashboardTab('home');
              }} 
            />
          )}
        </div>
      ) : currentView === 'admin' ? (
        /* ==========================================
           ADMIN DASHBOARD (Protected - Admin Only)
           ========================================== */
        currentUser?.role === 'admin' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          /* Redirect non-admins to admin login */
          <div className="auth-page">
            <div className="auth-form-side" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                <AlertTriangle size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  You don't have admin privileges. Please sign in with an admin account.
                </p>
                <button onClick={() => setCurrentView('login')} className="btn btn-primary" style={{ width: '100%' }}>
                  Go to Login
                </button>
                <button onClick={() => setCurrentView('landing')} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )
      ) : currentView === 'mechanicDashboard' ? (
        /* ==========================================
           MECHANIC DASHBOARD (PREMIUM)
           ========================================== */
        <MechanicDashboard
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
      ) : currentView !== 'landing' ? (
        /* ==========================================
           AUTHENTICATION VIEW (SPLIT-SCREEN LOGIN/SIGNUP)
           ========================================== */
        <div className="auth-page">
          {confetti.length > 0 && (
            <div className="confetti-wrapper">
              {confetti.map(c => (
                <div 
                  key={c.id} 
                  className="confetti-particle" 
                  style={{
                    left: `${c.left}%`,
                    animationDelay: `${c.delay}s`,
                    backgroundColor: c.color,
                    width: `${c.size}px`,
                    height: `${c.size}px`
                  }} 
                />
              ))}
            </div>
          )}

          {/* Left Panel: Brand Showcase */}
          <div className="auth-brand-side">
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }}>
              <Silk speed={3} scale={1.2} color="#2563EB" noiseIntensity={0.8} />
            </div>
            <div className="auth-brand-glow-blob"></div>
            
            <div className="auth-brand-logo" onClick={() => setCurrentView('landing')}>
              <span className="navbar-logo-icon" style={{ fontSize: '1.75rem' }}>🚨</span>
              <span>RoadRescue AI</span>
            </div>

            <div className="auth-brand-showcase animate-slide-up">
              <div className="auth-brand-text">
                <h2 className="auth-brand-headline" style={{ textAlign: 'left' }}>
                  Your Emergency Starts Here.<br />
                  <span className="gradient-text-accent" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Your Rescue Starts Now.
                  </span>
                </h2>
                <p className="auth-brand-desc">
                  Join thousands of drivers who trust RoadRescue AI for instant roadside assistance, live tracking, AI-powered diagnostics, and verified mechanics.
                </p>
              </div>

              {/* Vector repair mockup */}
              <div className="auth-brand-vector">
                <svg viewBox="0 0 400 240" style={{ width: '100%', height: '100%' }}>
                  <rect width="100%" height="100%" fill="rgba(15,23,42,0.4)" />
                  <path d="M 0,160 L 400,160" stroke="rgba(255,255,255,0.08)" strokeWidth="32" />
                  <path d="M 0,160 L 400,160" stroke="#FFFFFF" strokeDasharray="10 10" strokeWidth="1" opacity="0.3" />
                  
                  <g transform="translate(40, 110)">
                    <rect x="0" y="20" width="80" height="30" fill="var(--primary)" rx="4" />
                    <rect x="55" y="5" width="20" height="20" fill="#3B82F6" rx="2" />
                    <circle cx="20" cy="50" r="10" fill="#1E293B" />
                    <circle cx="65" cy="50" r="10" fill="#1E293B" />
                    <path d="M -10,30 L 10,15" stroke="white" strokeWidth="2" />
                  </g>

                  <g transform="translate(240, 120)">
                    <rect x="0" y="10" width="80" height="30" fill="#EF4444" rx="4" />
                    <path d="M 12,10 L 25,0 L 55,0 L 68,10 Z" fill="#991B1B" />
                    <circle cx="20" cy="40" r="10" fill="#1E293B" />
                    <circle cx="60" cy="40" r="10" fill="#1E293B" />
                    <circle cx="10" cy="-10" r="8" fill="white" opacity="0.15" />
                    <circle cx="18" cy="-20" r="12" fill="white" opacity="0.1" />
                  </g>

                  <g transform="translate(320, 90)">
                    <circle cx="0" cy="0" r="15" fill="var(--accent)" opacity="0.25" className="map-pulse-circle" />
                    <circle cx="0" cy="0" r="6" fill="var(--accent)" />
                  </g>
                </svg>

                {/* Floating elements inside Left Panel */}
                <div className="floating-element float-gps">
                  <MapPin size={14} color="var(--primary)" /> <span>GPS Tracking</span>
                </div>
                <div className="floating-element float-wrench">
                  <Wrench size={14} color="var(--primary)" /> <span>Quick Dispatch</span>
                </div>
                <div className="floating-element float-sos">
                  <ShieldAlert size={14} color="var(--accent)" /> <span>SOS Emergency</span>
                </div>
                <div className="floating-element float-shield">
                  <Shield size={14} color="var(--secondary)" /> <span>Verified Safety</span>
                </div>
                <div className="floating-element float-lightning">
                  <Zap size={14} color="#EAB308" /> <span>AI Diagnostics</span>
                </div>
                <div className="floating-element float-rating">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" /> <span>5-Star Service</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="auth-trust-badges-grid">
                <div className="auth-trust-item"><Check size={14} /> 24/7 Dispatch</div>
                <div className="auth-trust-item"><Check size={14} /> Verified Mechanics</div>
                <div className="auth-trust-item"><Check size={14} /> Secure Login</div>
                <div className="auth-trust-item"><Check size={14} /> AI Diagnostics</div>
                <div className="auth-trust-item"><Check size={14} /> 256-bit Encryption</div>
              </div>
            </div>

            <div className="auth-brand-footer">
              <span>© {new Date().getFullYear()} RoadRescue AI.</span>
              <div className="auth-security-badges">
                <div className="auth-security-badge">
                  <div className="lock-animation-box">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="lock-shackle">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                    </svg>
                  </div>
                  <span>SSL Protected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Authentication Card */}
          <div className="auth-form-side">
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
              <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Theme">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>

            <div className={`auth-card-entrance glass-card ${shakeCard ? 'shake-error' : ''}`} style={{ width: '100%' }}>
              
              {authSuccess && (
                <div className="auth-success-overlay">
                  <div className="success-check-circle">
                    <Check size={40} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {authSuccess === 'login' ? 'Login Successful' : 'Account Configured!'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {authSuccess === 'login' 
                      ? 'Redirecting to your dashboard...' 
                      : 'Launching diagnostics dashboard...'}
                  </p>
                </div>
              )}

              {currentView === 'login' ? (
                <form onSubmit={handleLoginSubmit}>
                  <div className="auth-form-header">
                    <h2 className="auth-form-title" style={{ textAlign: 'left' }}>Sign In</h2>
                    <p className="auth-form-subtitle">
                      Don't have an account?{' '}
                      <span className="auth-form-switch-link" onClick={() => { setCurrentView('signup'); setLoginErrors({}); }}>
                        Create Account →
                      </span>
                    </p>
                  </div>

                  {/* Role Selector */}
                  <div style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
                    background: 'var(--light-surface)', padding: '4px', borderRadius: 'var(--radius-sm)'
                  }}>
                    {(['user', 'mechanic', 'admin'] as const).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedLoginRole(role)}
                        className="btn"
                        style={{
                          flexGrow: 1, fontSize: '0.8rem', padding: '0.5rem 0.3rem',
                          borderRadius: '6px', fontWeight: 700,
                          background: selectedLoginRole === role ? 'var(--light-bg)' : 'transparent',
                          color: selectedLoginRole === role ? 'var(--text-primary)' : 'var(--text-secondary)',
                          boxShadow: selectedLoginRole === role ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        {role === 'user' ? 'User' : role === 'mechanic' ? 'Mechanic' : 'Admin'}
                      </button>
                    ))}
                  </div>

                  {/* Email Input */}
                  <div className={`auth-input-group ${focusedField === 'loginEmail' ? 'focused' : ''} ${loginEmail ? 'has-value' : ''}`}>
                    <input
                      type="text"
                      id="loginEmail"
                      className="auth-input-field"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onFocus={() => setFocusedField('loginEmail')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Mail className="auth-input-icon" size={18} />
                    <label htmlFor="loginEmail" className="auth-input-label">Email</label>
                    {loginErrors.email && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px', fontWeight: 600 }}>{loginErrors.email}</span>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className={`auth-input-group ${focusedField === 'loginPassword' ? 'focused' : ''} ${loginPassword ? 'has-value' : ''}`}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="loginPassword"
                      className="auth-input-field"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onFocus={() => setFocusedField('loginPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Lock className="auth-input-icon" size={18} />
                    <label htmlFor="loginPassword" className="auth-input-label">Password</label>
                    <button
                      type="button"
                      className="auth-pw-toggle"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {loginErrors.password && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px', fontWeight: 600 }}>{loginErrors.password}</span>
                    )}
                  </div>

                  {loginErrors.general && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: 'var(--accent)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '1rem'
                    }}>
                      <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                      {loginErrors.general}
                    </div>
                  )}

                  {/* Login Form Aux Controls */}
                  <div className="auth-form-actions">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={loginRemember}
                        onChange={(e) => setLoginRemember(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Remember Me</span>
                    </label>
                    <a href="#forgot" className="auth-forgot-link" onClick={() => alert("Password reset workflow placeholder")}>Forgot Password?</a>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '1rem' }}
                  >
                    {authLoading ? (
                      <span className="chatbot-typing" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                        <span className="typing-dot" style={{ backgroundColor: 'white' }}></span>
                        <span className="typing-dot" style={{ backgroundColor: 'white' }}></span>
                        <span className="typing-dot" style={{ backgroundColor: 'white' }}></span>
                      </span>
                    ) : (
                      <>{selectedLoginRole === 'admin' ? 'Sign In as Admin' : selectedLoginRole === 'mechanic' ? 'Sign In as Mechanic' : 'Sign In Securely'}</>
                    )}
                  </button>

                  {/* Default credentials hint for admin */}
                  {selectedLoginRole === 'admin' && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <p>Demo: <strong>admin@roadrescue.in</strong> / <strong>admin123</strong></p>
                    </div>
                  )}
                  {selectedLoginRole === 'mechanic' && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <p>Demo: <strong>mechanic@roadrescue.in</strong> / <strong>mechanic123</strong></p>
                    </div>
                  )}
                  {selectedLoginRole === 'user' && (
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <p>Demo: <strong>user@roadrescue.in</strong> / <strong>user123</strong></p>
                    </div>
                  )}
                </form>
              ) : (
                /* ==========================================
                   SIGN UP VIEW FORM
                   ========================================== */
                <form onSubmit={handleSignupSubmit}>
                  <div className="auth-form-header">
                    <h2 className="auth-form-title" style={{ textAlign: 'left' }}>Create Account</h2>
                    <p className="auth-form-subtitle">
                      Already have an account?{' '}
                      <span className="auth-form-switch-link" onClick={() => { setCurrentView('login'); setSignupErrors({}); }}>
                        Login →
                      </span>
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className={`auth-input-group ${focusedField === 'signupName' ? 'focused' : ''} ${signupName ? 'has-value' : ''}`}>
                    <input 
                      type="text" 
                      id="signupName"
                      className="auth-input-field"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      onFocus={() => setFocusedField('signupName')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <User className="auth-input-icon" size={18} />
                    <label htmlFor="signupName" className="auth-input-label">Full Name</label>
                    {signupErrors.name && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>{signupErrors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className={`auth-input-group ${focusedField === 'signupEmail' ? 'focused' : ''} ${signupEmail ? 'has-value' : ''}`}>
                    <input 
                      type="email" 
                      id="signupEmail"
                      className="auth-input-field"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      onFocus={() => setFocusedField('signupEmail')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Mail className="auth-input-icon" size={18} />
                    <label htmlFor="signupEmail" className="auth-input-label">Email Address</label>
                    {signupErrors.email && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>{signupErrors.email}</span>}
                  </div>

                  {/* Phone Number */}
                  <div className={`auth-input-group ${focusedField === 'signupPhone' ? 'focused' : ''} ${signupPhone ? 'has-value' : ''}`}>
                    <input 
                      type="text" 
                      id="signupPhone"
                      placeholder="(555) 000-0000"
                      className="auth-input-field"
                      value={signupPhone}
                      onChange={(e) => handlePhoneChange(e, 'signup')}
                      onFocus={() => setFocusedField('signupPhone')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Phone className="auth-input-icon" size={18} />
                    <label htmlFor="signupPhone" className="auth-input-label">Mobile Number</label>
                    {signupErrors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>{signupErrors.phone}</span>}
                  </div>

                  {/* Password with Strength Meter */}
                  <div className={`auth-input-group ${focusedField === 'signupPassword' ? 'focused' : ''} ${signupPassword ? 'has-value' : ''}`}>
                    <input 
                      type="password" 
                      id="signupPassword"
                      className="auth-input-field"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      onFocus={() => setFocusedField('signupPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Lock className="auth-input-icon" size={18} />
                    <label htmlFor="signupPassword" className="auth-input-label">Password</label>
                    {signupErrors.password && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>{signupErrors.password}</span>}
                  </div>

                  {/* Strength indicators */}
                  {signupPassword && (
                    <div className="pw-strength-container">
                      <div className="pw-strength-bars">
                        <div className={`pw-strength-bar ${pwStrength.score >= 1 ? `active ${pwStrength.colorClass}` : ''}`}></div>
                        <div className={`pw-strength-bar ${pwStrength.score >= 2 ? `active ${pwStrength.colorClass}` : ''}`}></div>
                        <div className={`pw-strength-bar ${pwStrength.score >= 3 ? `active ${pwStrength.colorClass}` : ''}`}></div>
                        <div className={`pw-strength-bar ${pwStrength.score >= 4 ? `active ${pwStrength.colorClass}` : ''}`}></div>
                      </div>
                      <div className="pw-strength-text" style={{ color: pwStrength.score >= 3 ? 'var(--secondary)' : pwStrength.score >= 2 ? '#EAB308' : 'var(--accent)' }}>
                        <span>Strength: <strong>{pwStrength.label}</strong></span>
                        <span>(Use capitals, symbols, numbers)</span>
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className={`auth-input-group ${focusedField === 'signupConfirmPassword' ? 'focused' : ''} ${signupConfirmPassword ? 'has-value' : ''}`}>
                    <input 
                      type="password" 
                      id="signupConfirmPassword"
                      className="auth-input-field"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('signupConfirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Lock className="auth-input-icon" size={18} />
                    <label htmlFor="signupConfirmPassword" className="auth-input-label">Confirm Password</label>
                    {signupErrors.confirmPassword && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>{signupErrors.confirmPassword}</span>}
                  </div>

                  {/* Vehicle Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Vehicle Type</label>
                      <select 
                        value={signupVehicle}
                        onChange={(e) => setSignupVehicle(e.target.value)}
                        className="auth-input-field"
                        style={{ paddingLeft: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '48px', marginTop: '4px' }}
                      >
                        <option>Sedan</option>
                        <option>SUV</option>
                        <option>Pickup Truck</option>
                        <option>EV (Electric Vehicle)</option>
                        <option>Motorcycle</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Car Plate (Opt.)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 7XYZ99"
                        className="auth-input-field"
                        value={signupCarNum}
                        onChange={(e) => setSignupCarNum(e.target.value.toUpperCase())}
                        style={{ paddingLeft: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', height: '48px', marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className={`auth-input-group ${focusedField === 'signupEmergencyContact' ? 'focused' : ''} ${signupEmergencyContact ? 'has-value' : ''}`}>
                    <input 
                      type="text" 
                      id="signupEmergencyContact"
                      className="auth-input-field"
                      value={signupEmergencyContact}
                      onChange={(e) => handlePhoneChange(e, 'emergency')}
                      onFocus={() => setFocusedField('signupEmergencyContact')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Phone className="auth-input-icon" size={18} />
                    <label htmlFor="signupEmergencyContact" className="auth-input-label">Emergency Contact Number</label>
                  </div>

                  {/* Checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <label className="auth-checkbox-label" style={{ fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={signupTerms}
                        onChange={(e) => setSignupTerms(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>I accept the Terms & Conditions and Privacy Policies.</span>
                    </label>

                    <label className="auth-checkbox-label" style={{ fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={signupAlerts}
                        onChange={(e) => setSignupAlerts(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Receive emergency alerts and safety notifications.</span>
                    </label>
                  </div>

                  {/* Signup Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '1rem' }}
                  >
                    {authLoading ? (
                      <span className="chatbot-typing" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                        <span className="typing-dot" style={{ backgroundColor: 'white' }}></span>
                        <span className="typing-dot" style={{ backgroundColor: 'white' }}></span>
                        <span className="typing-dot" style={{ backgroundColor: 'white' }}></span>
                      </span>
                    ) : (
                      'Create My Account'
                    )}
                  </button>

                  {signupErrors.general && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.5rem', fontWeight: 600, textAlign: 'center' }}>
                      {signupErrors.general}
                    </div>
                  )}
                </form>
              )}

            </div>
          </div>

        </div>
      ) : (
        /* ==========================================
           STANDARD LANDING PAGE VIEW
           ========================================== */
        <>
          {/* Header */}
          <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
              <a href="#home" className="navbar-logo" onClick={() => setCurrentView('landing')}>
                <span className="navbar-logo-icon" style={{ fontSize: '1.6rem' }}>🚨</span>
                <span style={{ color: 'var(--primary)' }}>Road</span>
                <span style={{ color: 'var(--text-primary)' }}>Rescue AI</span>
              </a>

              <nav className="navbar-menu">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'services', label: 'Services' },
                  { id: 'how-it-works', label: 'How It Works' },
                ].map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`navbar-link ${activeSection === item.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        const el = document.getElementById(item.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </nav>

              <div className="navbar-actions">
                <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Theme">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <button
                  onClick={() => setCurrentView('login')}
                  className="navbar-login-btn"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentView('signup')}
                  className="btn btn-secondary"
                >
                  Sign Up
                </button>
                <a href="#emergency" className="btn btn-emergency btn-sos">🚨 SOS</a>
              </div>

              <button
                className="mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="mobile-menu-drawer">
                {[
                  { id: 'home', label: 'Home' },
                  { id: 'services', label: 'Services' },
                  { id: 'how-it-works', label: 'How It Works' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={activeSection === item.id ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {item.label}
                  </a>
                ))}
                <hr className="mobile-divider" />
                <div className="mobile-actions">
                  <button onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }} className="btn btn-secondary">Login</button>
                  <button onClick={() => { setCurrentView('signup'); setMobileMenuOpen(false); }} className="btn btn-secondary">Sign Up</button>
                  <a href="#emergency" className="btn btn-emergency">🚨 Emergency SOS</a>
                </div>
              </div>
            )}
          </header>

          {/* Hero */}
          <section id="home" className="section hero-section">
            <div className="hero-noise"></div>
            <div className="hero-radial-bg-text"></div>
            <div className="hero-radial-bg-illus"></div>

            <div className="container hero-wrapper">
              <div className="hero-content animate-slide-up">
                <div className="hero-eyebrow">
                  <Sparkles size={14} />
                  <span>AI-Powered Roadside Dispatch</span>
                </div>

                <h1 className="hero-heading">
                  Emergency Roadside<br />
                  Assistance Across India<br />
                  <span className="gradient-text">Powered by AI.</span>
                </h1>

                <p className="hero-subheading">
                  Get instant roadside help, AI diagnostics, verified mechanics, and live GPS tracking—all in one platform.
                </p>

                <div className="hero-ctas">
                  <a href="#emergency" className="btn btn-hero-primary cursor-pointer">
                    <span>🚨</span> Get Emergency Help
                  </a>
                  <button
                    onClick={startMapSimulation}
                    className="btn btn-hero-secondary cursor-pointer"
                  >
                    <Play size={18} fill="currentColor" /> Try AI Diagnosis
                  </button>
                </div>

                <div className="hero-trust-badges">
                  <div className="hero-badge-item">
                    <Check size={14} className="hero-badge-icon" />
                    <span>24×7 Support</span>
                  </div>
                  <div className="hero-badge-item">
                    <Check size={14} className="hero-badge-icon" />
                    <span>Verified Mechanics</span>
                  </div>
                  <div className="hero-badge-item">
                    <Check size={14} className="hero-badge-icon" />
                    <span>AI Powered Dispatch</span>
                  </div>
                </div>
              </div>

              {/* Right Side Mockup */}
              <div className="hero-visual-container animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="hero-illustration-glow"></div>
                <div className="hero-mockup-wrapper">
                  <div className="hero-3d-scene">
                    <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}>
                      <path d="M 0,250 L 400,250" stroke="#CBD5E1" strokeWidth="48" />
                      <path d="M 0,250 L 400,250" stroke="#FFF" strokeWidth="2" strokeDasharray="16" />
                      
                      <g transform="translate(60, 200)">
                        <rect x="0" y="20" width="80" height="30" fill="var(--primary)" rx="4" />
                        <rect x="50" y="5" width="25" height="20" fill="#3B82F6" rx="2" />
                        <polygon points="50,20 80,20 80,35 50,35" fill="rgba(255,255,255,0.7)" />
                        <circle cx="20" cy="50" r="10" fill="#1E293B" />
                        <circle cx="65" cy="50" r="10" fill="#1E293B" />
                        <path d="M -10,35 L 10,20" stroke="#F1F5F9" strokeWidth="4" />
                        <text x="12" y="40" fill="white" fontSize="9" fontWeight="800">TOW</text>
                      </g>

                      <g transform="translate(240, 215)">
                        <rect x="0" y="10" width="70" height="25" fill="#EF4444" rx="4" />
                        <path d="M 10,10 L 25,-2 L 50,-2 L 60,10 Z" fill="#991B1B" />
                        <circle cx="15" cy="35" r="9" fill="#1E293B" />
                        <circle cx="55" cy="35" r="9" fill="#1E293B" />
                        <path d="M 5,10 L 20,-2" stroke="#FFF" strokeWidth="2" />
                        <circle cx="10" cy="-8" r="8" fill="#94A3B8" opacity="0.4" />
                        <circle cx="18" cy="-16" r="11" fill="#94A3B8" opacity="0.3" />
                      </g>

                      <g transform="translate(190, 210)">
                        <path d="M 0,35 C 0,15 20,15 20,35 Z" fill="#1E3A8A" />
                        <circle cx="10" cy="10" r="8" fill="#FDBA74" />
                        <path d="M 3,24 L 17,24" stroke="#EAB308" strokeWidth="5" />
                        <path d="M -2,12 L 2,8" stroke="#64748B" strokeWidth="3" />
                      </g>

                      <circle cx="100" cy="180" r="12" fill="#3B82F6" opacity="0.15" className="map-pulse-circle" />
                      <circle cx="270" cy="170" r="12" fill="#EF4444" opacity="0.15" className="map-pulse-circle" />
                    </svg>
                  </div>

                  <div className="floating-element float-gps">
                    <MapPin size={14} color="var(--primary)" /> <span>GPS Live</span>
                  </div>
                  <div className="floating-element float-wrench">
                    <Wrench size={14} color="var(--primary)" /> <span>Mechanic Matched</span>
                  </div>
                  <div className="floating-element float-sos">
                    <ShieldAlert size={14} color="var(--accent)" /> <span>SOS Active</span>
                  </div>
                  <div className="floating-element float-shield">
                    <Shield size={14} color="var(--secondary)" /> <span>Verified Safe</span>
                  </div>
                  <div className="floating-element float-lightning">
                    <span>⚡</span> <span>AI Diagnostic</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section id="services" className="section">
            <div className="container">
              <h2 className="animate-slide-up">Our Premium Rescue Services</h2>
              <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                Choose from a comprehensive range of transparently priced services, available for instant AI dispatch 24 hours a day.
              </p>

              <div className="services-grid">
                <div className="service-card animate-slide-up">
                  <div className="service-icon-box"><Wrench size={24} /></div>
                  <h3 className="service-title">Flat Tire Repair</h3>
                  <p className="service-description">Puncture repair, spare tire installation, or roadside wheel swap. Includes pressure checks.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Spare Swap</li>
                    <li className="service-feature-item"><Check size={14} /> Puncture Plugging</li>
                  </ul>
                  <button onClick={() => handleBookService('Flat Tire Repair', 699)} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem', width: '100%', marginTop: 'auto' }}>Book Now</button>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="service-icon-box"><Activity size={24} /></div>
                  <h3 className="service-title">Battery Jump Start</h3>
                  <p className="service-description">Fast ignition jump or dynamic battery replacement. Mechanics carry stock batteries.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Professional Jump</li>
                    <li className="service-feature-item"><Check size={14} /> Alternator Diagnostics</li>
                  </ul>
                  <button onClick={() => handleBookService('Battery Jump Start', 999)} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem', width: '100%', marginTop: 'auto' }}>Book Now</button>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="service-icon-box"><Compass size={24} /></div>
                  <h3 className="service-title">Fuel Delivery</h3>
                  <p className="service-description">Emergency delivery of fuel directly to your locked location on the highway.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> 5 Liters Included</li>
                    <li className="service-feature-item"><Check size={14} /> Petrol & Diesel</li>
                  </ul>
                  <button onClick={() => handleBookService('Fuel Delivery', 799)} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem', width: '100%', marginTop: 'auto' }}>Book Now</button>
                </div>

                <div className="service-card animate-slide-up">
                  <div className="service-icon-box"><AlertTriangle size={24} /></div>
                  <h3 className="service-title">Engine Breakdown</h3>
                  <p className="service-description">AI diagnostic check + onsite cooling/mechanical troubleshooting by verified mechanics.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Full System Diagnostic</li>
                    <li className="service-feature-item"><Check size={14} /> Hose & Belt Fixes</li>
                  </ul>
                  <button onClick={() => handleBookService('Engine Breakdown Diagnosis', 1499)} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem', width: '100%', marginTop: 'auto' }}>Book Now</button>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="service-icon-box"><Navigation size={24} /></div>
                  <h3 className="service-title">Car Towing</h3>
                  <p className="service-description">Premium flatbed or wheel-lift towing to your home, a local dealer, or our nearest service garage.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> First 10 km Included</li>
                    <li className="service-feature-item"><Check size={14} /> ₹35/km after 10 km</li>
                  </ul>
                  <button onClick={() => handleBookService('Car Towing', 1999)} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem', width: '100%', marginTop: 'auto' }}>Book Now</button>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="service-icon-box"><Lock size={24} /></div>
                  <h3 className="service-title">Lockout Assistance</h3>
                  <p className="service-description">Fast and non-destructive vehicle opening using professional lockout entry gear.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Damage-Free Guarantee</li>
                    <li className="service-feature-item"><Check size={14} /> Smart Key Bypass</li>
                  </ul>
                  <button onClick={() => handleBookService('Lockout Assistance', 899)} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem', width: '100%', marginTop: 'auto' }}>Book Now</button>
                </div>
              </div>
            </div>
          </section>

          {/* Chatbot */}
          <section className="section" style={{ background: 'var(--light-surface)' }}>
            <div className="container ai-section-wrapper">
              <div className="ai-content-left animate-slide-up">
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(34, 197, 94, 0.08)',
                  color: 'var(--secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <Sparkles size={16} /> Instant AI Diagnostic Engine
                </div>
                <h2 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Chat With RoadRescue AI</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  Describe your vehicle trouble or select a preset problem below. Our AI assistant analyzes symptoms, computes repair costs, matches local mechanics, and offers emergency steps.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Check size={18} style={{ color: 'var(--secondary)' }} />
                    <span style={{ fontWeight: 600 }}>Diagnoses vehicle problems dynamically</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Check size={18} style={{ color: 'var(--secondary)' }} />
                    <span style={{ fontWeight: 600 }}>Calculates approximate repair costs instantly</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Check size={18} style={{ color: 'var(--secondary)' }} />
                    <span style={{ fontWeight: 600 }}>Matches closest dispatch specialists</span>
                  </div>
                </div>
              </div>

              <div className="chatbot-container animate-scale">
                <div className="chatbot-header">
                  <div className="chatbot-header-info">
                    <div className="chatbot-avatar">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="chatbot-title">RoadRescue AI Core</div>
                      <div className="chatbot-status">Active & Match Ready</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="chatbot-action-btn" title="Simulate Image Scan" onClick={() => handleSendMessage("📸 [Image Scan: Underhood Battery Corrosion]")}><Upload size={16} /></button>
                    <button className="chatbot-action-btn" title="Simulate Voice Input" onClick={() => handleSendMessage("🎙️ [Voice Input: My engine won't turn over at all]")}><Mic size={16} /></button>
                  </div>
                </div>

                <div className="chatbot-body">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.sender}`}>
                      <div>{msg.text}</div>
                      {msg.costEstimate && (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          background: 'rgba(37,99,235,0.06)', 
                          padding: '0.5rem 0.75rem', 
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--primary)',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Dispatch Match Info:</div>
                          <div style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            📍 Mechanic: <strong>{msg.mechanicName}</strong>
                          </div>
                          <div style={{ color: 'var(--text-primary)' }}>
                            💵 Est. Cost: <strong>{msg.costEstimate}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isAiTyping && (
                    <div className="chatbot-typing">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  )}
                </div>

                <div className="chatbot-options">
                  <button onClick={() => handleSendMessage("🔋 Battery is dead")} className="chatbot-option-btn">🔋 Dead Battery</button>
                  <button onClick={() => handleSendMessage("🚗 I have a flat tire")} className="chatbot-option-btn">🚗 Flat Tire</button>
                  <button onClick={() => handleSendMessage("💨 Smoke is coming from my engine")} className="chatbot-option-btn">💨 Engine Smoke</button>
                </div>

                <div className="chatbot-footer">
                  <input 
                    type="text" 
                    placeholder="Type your vehicle problem..." 
                    className="chatbot-input" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                  />
                  <button 
                    onClick={() => handleSendMessage(chatInput)} 
                    className="chatbot-action-btn send"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="section" style={{ background: 'var(--light-surface)' }}>
            <div className="container">
              <h2>How It Works</h2>
              <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                We have simplified vehicle dispatch into 5 quick stages, completed in under 5 minutes.
              </p>

              <div className="timeline-container">
                <div className="timeline-line"></div>
                <div className="timeline-progress-line" style={{ width: '100%' }}></div>

                <div className="timeline-step active completed">
                  <div className="timeline-circle">1</div>
                  <h4 className="timeline-step-title">Share Location</h4>
                  <p className="timeline-step-desc">Open the app or site, letting GPS instantly map coordinates.</p>
                </div>

                <div className="timeline-step active completed">
                  <div className="timeline-circle">2</div>
                  <h4 className="timeline-step-title">Select Issue</h4>
                  <p className="timeline-step-desc">Click your trouble category or query the AI assistant.</p>
                </div>

                <div className="timeline-step active">
                  <div className="timeline-circle">3</div>
                  <h4 className="timeline-step-title">Mechanic Accepts</h4>
                  <p className="timeline-step-desc">A certified local responder claims your task immediately.</p>
                </div>

                <div className="timeline-step">
                  <div className="timeline-circle">4</div>
                  <h4 className="timeline-step-title">Track Live Arrival</h4>
                  <p className="timeline-step-desc">Watch the vehicle approach in real time on the live map.</p>
                </div>

                <div className="timeline-step">
                  <div className="timeline-circle">5</div>
                  <h4 className="timeline-step-title">Secure Payment</h4>
                  <p className="timeline-step-desc">Pay seamlessly via credit card, Apple Pay, or Stripe.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency CTA */}
          <section id="emergency" className="section emergency-cta-section">
            <div className="flashing-lights"></div>
            <div className="container" style={{ position: 'relative', zIndex: 5 }}>
              <h2>Need Help Right Now?</h2>
              <p style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                Skip the forms. Get connected with a verified mobile mechanic, battery charger, or tow specialist in under 5 minutes.
              </p>
              <button 
                onClick={() => setShowEmergencyModal(true)}
                className="btn btn-emergency btn-lg cursor-pointer"
                style={{ fontSize: '1.3rem', padding: '1.2rem 2.5rem' }}
              >
                🚨 Request Emergency Help
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer style={{
            borderTop: '1px solid var(--border-light)',
            padding: '3rem 0',
            textAlign: 'center'
          }}>
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>🚨</span>
                <span style={{ color: 'var(--primary)' }}>Road</span>
                <span>Rescue AI</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© {new Date().getFullYear()} RoadRescue AI. All rights reserved.</p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="#privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="#terms" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>Terms</a>
                <a href="mailto:support@roadrescue.ai" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>support@roadrescue.ai</a>
              </div>
            </div>
          </footer>

          <button 
            id="back-to-top" 
            className="back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Back to Top"
          >
            <ArrowUp size={20} />
          </button>
        </>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        serviceName={bookingService.name}
        price={bookingService.price}
        onBookingConfirmed={handleBookingConfirmed}
      />

      {/* Emergency SOS Booking Modal */}
      <EmergencyBookingModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSuccess={(emergency) => {
          setShowEmergencyModal(false);
          setActiveEmergencyId(emergency.id);
          setCurrentView('emergencyTrack');
        }}
      />
    </>
  );
}
