import { useState, useEffect, useRef } from 'react';
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
  ChevronDown, 
  Send, 
  Upload, 
  Mic, 
  Smartphone, 
  Check, 
  Play, 
  ArrowRight, 
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
  Calendar,
  LogOut,
  BookOpen
} from 'lucide-react';

import RequestAssistance from './components/RequestAssistance';
import LiveTracking from './components/LiveTracking';
import NearbyServices from './components/NearbyServices';
import MechanicProfile from './components/MechanicProfile';
import AIAssistant from './components/AIAssistant';
import CheckoutPage from './components/CheckoutPage';
import ProfileSettingsPage from './components/ProfileSettingsPage';
import HelpSupportPage from './components/HelpSupportPage';
import NotificationsCenter from './components/NotificationsCenter';

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
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'mechanicProfile' | 'checkout'>('landing');
  const [checkoutData, setCheckoutData] = useState<any>(null);

  /* --- Dashboard Tab Switcher --- */
  const [activeDashboardTab, setActiveDashboardTab] = useState<'home' | 'dispatch' | 'chat' | 'profile' | 'nearby' | 'help' | 'notifications'>('home');

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
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

  /* --- Animated Counters (Intersection Observer) --- */
  const [counts, setCounts] = useState({
    requests: 0,
    mechanics: 0,
    cities: 0,
    satisfaction: 0
  });
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  useEffect(() => {
    if (currentView !== 'landing') return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const easeProgress = progress * (2 - progress);

          setCounts({
            requests: Math.floor(easeProgress * 25000),
            mechanics: Math.floor(easeProgress * 5000),
            cities: Math.floor(easeProgress * 150),
            satisfaction: parseFloat((easeProgress * 98.7).toFixed(1))
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }
    }, { threshold: 0.1 });

    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }
    return () => observer.disconnect();
  }, [currentView]);

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
        cost = "$49 - $80";
        mechanic = "Rescue Mobile Repair (1.2 miles away)";
      } else if (cleaned.includes('battery') || cleaned.includes('dead') || cleaned.includes('start')) {
        aiText = "🔍 AI DIAGNOSIS: Vehicle battery voltage critical. Requires jump start or battery replacement. Match found: 3 mobile dispatchers nearby carry premium replacement batteries for your model.";
        cost = "$65 - $110";
        mechanic = "Apex Battery & Auto (2.0 miles away)";
      } else if (cleaned.includes('smoke') || cleaned.includes('overheat') || cleaned.includes('engine')) {
        aiText = "🚨 HIGH CRITICAL ALERT: Fluid leakage or cylinder cooling failure. Running engine now can cause catastrophic damage. Please turn off your ignition immediately, step safely behind the guard rail, and wait. Dispatching high-capacity flatbed tow truck.";
        cost = "$120 - $220";
        mechanic = "Tow Pro Logistics (2.8 miles away)";
      } else {
        aiText = "🔍 AI DIAGNOSIS: Custom vehicle diagnostic request received. Estimating location and connecting you with the closest technician specializing in engine troubleshooting.";
        cost = "$90 - $150";
        mechanic = "Certified Engine Care Mobile (1.5 miles away)";
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

  /* --- Smartphone Mockup Screens --- */
  const [activePhoneTab, setActivePhoneTab] = useState<'Home' | 'Tracking' | 'AI Assistant' | 'Profile'>('Home');

  /* --- Collapsible Accordion (FAQ) States --- */
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How fast does a mechanic arrive?",
      a: "Our AI routing model dispatches the nearest technician in real time. On average, rescue vehicles arrive within 10 to 18 minutes depending on local traffic."
    },
    {
      q: "Do I need a monthly membership subscription?",
      a: "No! RoadRescue AI operates on a pay-as-you-go flat pricing model. You only pay when you request assistance. No annual contracts or hidden subscription fees."
    },
    {
      q: "Can I track my tow truck or mechanic live?",
      a: "Yes. Once a mechanic accepts your dispatch, you get a secure tracking link showing their live GPS coordinates, vehicle details, profile, and an animated ETA."
    },
    {
      q: "What payment methods are supported?",
      a: "We support all major credit cards, Apple Pay, Google Pay, and major digital bank integrations. Payments are processed securely via Stripe."
    },
    {
      q: "What happens if I need to cancel my request?",
      a: "You can cancel free of charge within 3 minutes of the dispatch acceptance. A small dispatch fee may apply afterward if the technician is already close to your location."
    },
    {
      q: "Is medical emergency assistance integrated?",
      a: "Yes. If our AI or your physical SOS button indicates safety risk or crash impact, the platform immediately relays critical telemetry and location data to local 911 dispatchers."
    }
  ];

  /* ==========================================================================
     AUTHENTICATION FORM STATE & HANDLERS
     ========================================================================== */
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp' | 'magic'>('password');
  const [otpCode, setOtpCode] = useState('');

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

  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [biometricsScanning, setBiometricsScanning] = useState(false);
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    let errors: { email?: string; password?: string } = {};
    if (!loginEmail.trim()) errors.email = "Email or mobile number is required.";
    if (loginMode === 'password' && !loginPassword) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
      return;
    }

    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      setAuthSuccess('login');
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentView('dashboard');
      }, 1500);
    }, 1800);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setAuthLoading(false);
      setAuthSuccess('signup');
      triggerConfetti();
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentView('dashboard');
      }, 2500);
    }, 2000);
  };

  const startBiometricScan = () => {
    setShowBiometricsModal(true);
    setBiometricsScanning(true);
    setTimeout(() => {
      setBiometricsScanning(false);
      setTimeout(() => {
        setShowBiometricsModal(false);
        setAuthSuccess('login');
        setTimeout(() => {
          setAuthSuccess(null);
          setCurrentView('dashboard');
        }, 1500);
      }, 1000);
    }, 2000);
  };

  /* ==========================================================================
     DASHBOARD SPECIFIC STATES
     ========================================================================== */
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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



  return (
    <>
      {/* ==========================================
          DASHBOARD SCREEN VIEW
          ========================================== */}
      {currentView === 'dashboard' ? (
        <div className="db-layout">
          
          {/* Top Sticky Header */}
          <header className="navbar-header scrolled">
            <div className="container navbar-container">
              
              <div className="navbar-logo" onClick={() => setCurrentView('landing')}>
                <span className="navbar-logo-icon" style={{ fontSize: '1.6rem' }}>🚨</span>
                <span style={{ color: 'var(--primary)' }}>Road</span>
                <span>Rescue AI</span>
                <span style={{ 
                  background: 'var(--primary-glow)', 
                  color: 'var(--primary)', 
                  fontSize: '0.65rem', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontWeight: 800,
                  marginLeft: '0.5rem'
                }}>PORTAL</span>
              </div>

              {/* Center Search bar */}
              <div className="db-search-bar">
                <Search size={16} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Search for fuel, mechanics, centers..." 
                  className="db-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="navbar-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                
                {/* SOS Button always visible */}
                <button 
                  onClick={() => handleQuickIssueSelect('General Emergency SOS')}
                  className="btn btn-emergency" 
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  🚨 Emergency SOS
                </button>

                {/* Notifications Bell */}
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => { setActiveDashboardTab('notifications'); setNotificationCount(0); }}
                    className="theme-toggle-btn"
                    title="View Notifications"
                  >
                    <Bell size={20} />
                    {notificationCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--accent)'
                      }}></span>
                    )}
                  </button>
                  
                  {/* Notifications Log Dropdown panel removed */}
                </div>

                {/* Theme Switcher Toggle */}
                <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Mode">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* User Profile Avatar */}
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="db-mech-avatar cursor-pointer"
                    style={{ width: '38px', height: '38px', background: 'var(--primary)', fontSize: '0.95rem' }}
                  >
                    D
                  </div>
                  
                  {/* Profile Menu Dropdown */}
                  {profileDropdownOpen && (
                    <div className="db-notifications-panel" style={{ width: '200px', top: '100%', right: 0 }}>
                      <div style={{ padding: '0.25rem 0' }}>
                        <div style={{ fontWeight: 800 }}>Disha</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VIP Gold Member</div>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />
                      <button 
                        onClick={() => { setCurrentView('landing'); setProfileDropdownOpen(false); }}
                        className="btn btn-secondary" 
                        style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', justifyContent: 'flex-start', gap: '0.5rem' }}
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </header>

          {/* Main Dashboard Container */}
          <main className="container" style={{ marginTop: '2rem' }}>
            
            {/* Desktop Tabs Header Selector */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setActiveDashboardTab('home')}
                className={`btn ${activeDashboardTab === 'home' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                🏠 Home Feed
              </button>
              <button 
                onClick={() => setActiveDashboardTab('dispatch')}
                className={`btn ${activeDashboardTab === 'dispatch' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                🗺️ SOS Live Dispatch
              </button>
              <button 
                onClick={() => setActiveDashboardTab('chat')}
                className={`btn ${activeDashboardTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                🤖 AI Diagnoser Chat
              </button>
              <button 
                onClick={() => setActiveDashboardTab('profile')}
                className={`btn ${activeDashboardTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                👤 Billing & Profile
              </button>
              <button 
                onClick={() => setActiveDashboardTab('nearby')}
                className={`btn ${activeDashboardTab === 'nearby' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                🔍 Nearby Services
              </button>
              <button 
                onClick={() => setActiveDashboardTab('help')}
                className={`btn ${activeDashboardTab === 'help' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              >
                ❓ Help & Support
              </button>
            </div>

            {/* TAB PANEL 1: HOME PANEL */}
            {activeDashboardTab === 'home' && (
              <div className="animate-slide-up">
                {/* Welcome section banner */}
                <div className="db-welcome-banner">
                  <div className="db-welcome-info">
                    <h2 style={{ textAlign: 'left', margin: 0 }}>Good Morning, Disha 👋</h2>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Need help today? We're ready to assist you anytime.</p>
                    
                    <div className="db-safety-ribbon">
                      <BookOpen size={16} />
                      <span><strong>Safety Tip of the Day:</strong> Never stand close to active traffic lanes. Step behind roadside guardrails while waiting for dispatches.</span>
                    </div>
                  </div>
                  
                  {/* Weather/Date metadata pills */}
                  <div className="db-welcome-widgets">
                    <div className="db-widget-pill">
                      <span>🌤️ Sunny 24°C</span>
                    </div>
                    <div className="db-widget-pill">
                      <Calendar size={14} />
                      <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} | {liveTime}</span>
                    </div>
                    <div className="db-widget-pill">
                      <MapPin size={14} />
                      <span>Mumbai, MH</span>
                    </div>
                  </div>
                </div>

                {/* Grid stats/rewards */}
                <div className="db-grid">
                  
                  {/* Left block home panels */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Hero Immediate Emergency Action card */}
                    <div className="db-card db-emergency-panel">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🚨 Need Immediate Roadside Assistance?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Select your issue category to trace coordinates and initiate matching.</p>
                      
                      <div className="db-issue-selector-grid">
                        <button onClick={() => handleQuickIssueSelect('Flat Tire')} className={`db-issue-btn ${selectedIssue === 'Flat Tire' ? 'active' : ''}`}>
                          <div className="db-issue-icon">🔧</div>
                          <span>Flat Tire</span>
                        </button>
                        <button onClick={() => handleQuickIssueSelect('Dead Battery')} className={`db-issue-btn ${selectedIssue === 'Dead Battery' ? 'active' : ''}`}>
                          <div className="db-issue-icon">🔋</div>
                          <span>Battery Dead</span>
                        </button>
                        <button onClick={() => handleQuickIssueSelect('Fuel Empty')} className={`db-issue-btn ${selectedIssue === 'Fuel Empty' ? 'active' : ''}`}>
                          <div className="db-issue-icon">⛽</div>
                          <span>Fuel Empty</span>
                        </button>
                        <button onClick={() => handleQuickIssueSelect('Engine Overheat')} className={`db-issue-btn ${selectedIssue === 'Engine Overheat' ? 'active' : ''}`}>
                          <div className="db-issue-icon">💨</div>
                          <span>Engine Smoke</span>
                        </button>
                        <button onClick={() => handleQuickIssueSelect('Vehicle Accident')} className={`db-issue-btn ${selectedIssue === 'Vehicle Accident' ? 'active' : ''}`}>
                          <div className="db-issue-icon">🚨</div>
                          <span>Accident</span>
                        </button>
                        <button onClick={() => handleQuickIssueSelect('Car Towing')} className={`db-issue-btn ${selectedIssue === 'Car Towing' ? 'active' : ''}`}>
                          <div className="db-issue-icon">🚛</div>
                          <span>Towing</span>
                        </button>
                        <button onClick={() => handleQuickIssueSelect('Lockout Bypass')} className={`db-issue-btn ${selectedIssue === 'Lockout Bypass' ? 'active' : ''}`}>
                          <div className="db-issue-icon">🔓</div>
                          <span>Locked Out</span>
                        </button>
                      </div>

                      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleQuickIssueSelect('General SOS Emergency')}
                          className="btn btn-emergency"
                          style={{ padding: '1rem 2.5rem', width: '100%', maxWidth: '350px' }}
                        >
                          🚨 Request Emergency Help
                        </button>
                      </div>
                    </div>

                    {/* View Mechanic Profile Button */}
                    <div className="db-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('mechanicProfile')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img 
                            src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100" 
                            alt="Alex Thompson" 
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>👨‍🔧 Alex Thompson</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Apex Auto Recovery • ⭐ 4.9 (142 reviews)</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)' }}></span>
                              Available Now • 6 min ETA
                            </div>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                          View Profile →
                        </button>
                      </div>
                    </div>

                    {/* Dashboard stats numbers */}
                    <div className="db-card">
                      <div className="db-card-title-row">
                        <div className="db-card-title">📈 Your Driving & Safety Records</div>
                      </div>
                      <div className="db-stats-panel-grid">
                        <div className="db-stat-box">
                          <span className="db-stat-num">12</span>
                          <span className="db-stat-lbl">Services Completed</span>
                        </div>
                        <div className="db-stat-box">
                          <span className="db-stat-num">9.5m</span>
                          <span className="db-stat-lbl">Avg Response Time</span>
                        </div>
                        <div className="db-stat-box">
                          <span className="db-stat-num">$140</span>
                          <span className="db-stat-lbl">Money Saved (AI Diagnostics)</span>
                        </div>
                        <div className="db-stat-box">
                          <span className="db-stat-num">142 mi</span>
                          <span className="db-stat-lbl">Distance Covered</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right block cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Gamified points circle */}
                    <div className="db-card">
                      <div className="db-card-title-row">
                        <div className="db-card-title">⭐ Rewards & membership</div>
                      </div>
                      <div className="db-rewards-circle-container">
                        <div className="db-rewards-circle">
                          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <circle cx="50" cy="50" r="40" className="circle-bg" />
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              className="circle-progress" 
                              strokeDasharray="251"
                              strokeDashoffset="75" // 70% progress fill representation
                            />
                          </svg>
                          <div className="circle-text">
                            <span style={{ fontWeight: 900, fontSize: '1.25rem' }}>4,200</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PTS</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Gold Tier Driver</div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You have <strong>2 emergency credits</strong> remaining. Refer friends to earn more credits!</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Payment Saved Card */}
                    <div className="db-card">
                      <div className="db-card-title-row">
                        <div className="db-card-title">💳 Quick Payment Method</div>
                      </div>
                      <div className="db-payment-card-visual">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>ROADRESCUE AI VIP</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>VISA</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', letterSpacing: '0.15em', fontWeight: 700, margin: '0.75rem 0' }}>**** **** **** 4920</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8' }}>
                            <span>CARDHOLDER: DISHA</span>
                            <span>EXP: 09/29</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert("Invoice downloaded successfully.")}
                        className="btn btn-secondary" 
                        style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                      >
                        📄 Download Recent Invoice
                      </button>
                    </div>

                    {/* Customer Support Floating Links */}
                    <div className="db-card">
                      <div className="db-card-title-row">
                        <div className="db-card-title">📞 24/7 Hotline support</div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Get instant help from live human operators.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <a href="tel:+1800555SOSAI" className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}>
                          📞 Dispatch Hotline (+1-800-555-SOS)
                        </a>
                        <a href="https://wa.me/1800555SOS" className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center', borderColor: '#22C55E' }}>
                          💬 Chat on WhatsApp
                        </a>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TAB PANEL 2: MAP / DISPATCH LIVE PANEL */}
            {activeDashboardTab === 'dispatch' && (
              <div className="animate-slide-up">
                {!isSimulating ? (
                  <RequestAssistance 
                    startSimulation={startMapSimulation}
                    setMapStatus={setMapStatus}
                    setMapEta={setMapEta}
                    setMapDist={setMapDist}
                    setSelectedIssue={setSelectedIssue}
                    setActiveDashboardTab={setActiveDashboardTab}
                    onTriggerCheckout={(payload) => {
                      setCheckoutData(payload);
                      setCurrentView('checkout');
                    }}
                  />
                ) : (
                  <LiveTracking 
                    cancelSimulation={cancelSimulation}
                    setSelectedIssue={setSelectedIssue}
                    setActiveDashboardTab={setActiveDashboardTab}
                  />
                )}
              </div>
            )}

            {/* TAB PANEL 3: AI DIAGNOSER CHAT */}
            {activeDashboardTab === 'chat' && (
              <div className="animate-slide-up">
                <AIAssistant />
              </div>
            )}

            {/* TAB PANEL 4: BILLING & PROFILE */}
            {activeDashboardTab === 'profile' && (
              <div className="animate-slide-up">
                <ProfileSettingsPage onLogout={() => setCurrentView('landing')} />
              </div>
            )}

            {/* TAB PANEL 5: NEARBY SERVICES */}
            {activeDashboardTab === 'nearby' && (
              <div className="animate-slide-up">
                <NearbyServices />
              </div>
            )}

            {/* TAB PANEL 6: HELP & SUPPORT */}
            {activeDashboardTab === 'help' && (
              <div className="animate-slide-up">
                <HelpSupportPage setActiveDashboardTab={setActiveDashboardTab} />
              </div>
            )}

            {/* TAB PANEL 7: NOTIFICATIONS & ACTIVITY CENTER */}
            {activeDashboardTab === 'notifications' && (
              <div className="animate-slide-up">
                <NotificationsCenter />
              </div>
            )}

          </main>

          {/* Sticky Mobile Bottom Navigation Bar */}
          <div className="mobile-bottom-nav">
            <button 
              onClick={() => setActiveDashboardTab('home')}
              className={`mobile-bottom-tab ${activeDashboardTab === 'home' ? 'active' : ''}`}
            >
              <span>🏠</span>
              <span>Home</span>
            </button>
            <button 
              onClick={() => setActiveDashboardTab('dispatch')}
              className={`mobile-bottom-tab ${activeDashboardTab === 'dispatch' ? 'active' : ''}`}
            >
              <span>🗺️</span>
              <span>Live SOS</span>
            </button>
            <button 
              onClick={() => setActiveDashboardTab('chat')}
              className={`mobile-bottom-tab ${activeDashboardTab === 'chat' ? 'active' : ''}`}
            >
              <span>🤖</span>
              <span>AI Chat</span>
            </button>
            <button 
              onClick={() => setActiveDashboardTab('profile')}
              className={`mobile-bottom-tab ${activeDashboardTab === 'profile' ? 'active' : ''}`}
            >
              <span>👤</span>
              <span>Profile</span>
            </button>
            <button 
              onClick={() => setActiveDashboardTab('nearby')}
              className={`mobile-bottom-tab ${activeDashboardTab === 'nearby' ? 'active' : ''}`}
            >
              <span>🔍</span>
              <span>Nearby</span>
            </button>
            <button 
              onClick={() => setActiveDashboardTab('help')}
              className={`mobile-bottom-tab ${activeDashboardTab === 'help' ? 'active' : ''}`}
            >
              <span>❓</span>
              <span>Help</span>
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
                  <MapPin size={12} color="var(--primary)" /> 📍 GPS
                </div>
                <div className="floating-element float-wrench">
                  <Wrench size={12} color="var(--primary)" /> 🔧 Wrench
                </div>
                <div className="floating-element float-sos">
                  <ShieldAlert size={12} color="var(--accent)" /> 🚨 SOS
                </div>
                <div className="floating-element float-shield">
                  <Shield size={12} color="var(--secondary)" /> 🛡 Shield
                </div>
                <div className="floating-element float-lightning">
                  <span>⚡</span> AI
                </div>
                <div className="floating-element float-rating">
                  <Star size={12} fill="#F59E0B" color="#F59E0B" /> 5-Star
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
                    {authSuccess === 'login' ? 'Authentication Secured' : 'Account Configured!'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {authSuccess === 'login' 
                      ? 'Welcome back. Syncing localized coordinates...' 
                      : 'Launching diagnostics dashboard...'}
                  </p>
                </div>
              )}

              {currentView === 'login' ? (
                /* ==========================================
                   LOGIN VIEW FORM
                   ========================================== */
                <form onSubmit={handleLoginSubmit}>
                  <div className="auth-form-header">
                    <h2 className="auth-form-title" style={{ textAlign: 'left' }}>Secure Sign In</h2>
                    <p className="auth-form-subtitle">
                      Don't have an account?{' '}
                      <span className="auth-form-switch-link" onClick={() => { setCurrentView('signup'); setLoginErrors({}); }}>
                        Create Account →
                      </span>
                    </p>
                  </div>

                  {/* Social Buttons */}
                  <div className="auth-social-buttons">
                    <button type="button" className="auth-social-btn" onClick={() => alert("Google Auth integration placeholder")}>
                      <span>🌐 Google</span>
                    </button>
                    <button type="button" className="auth-social-btn" onClick={() => alert("Apple ID integration placeholder")}>
                      <span>🍏 Apple</span>
                    </button>
                    <button type="button" className="auth-social-btn" onClick={() => alert("GitHub OAuth integration placeholder")}>
                      <span>🐙 GitHub</span>
                    </button>
                  </div>

                  <div className="auth-divider">OR</div>

                  {/* Login Modes Switcher */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--light-surface)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                    <button 
                      type="button" 
                      onClick={() => setLoginMode('password')}
                      className="btn" 
                      style={{ 
                        flexGrow: 1, 
                        fontSize: '0.85rem', 
                        padding: '0.4rem', 
                        borderRadius: '6px',
                        background: loginMode === 'password' ? 'var(--light-bg)' : 'transparent',
                        color: loginMode === 'password' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: loginMode === 'password' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      Password
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLoginMode('otp')}
                      className="btn" 
                      style={{ 
                        flexGrow: 1, 
                        fontSize: '0.85rem', 
                        padding: '0.4rem', 
                        borderRadius: '6px',
                        background: loginMode === 'otp' ? 'var(--light-bg)' : 'transparent',
                        color: loginMode === 'otp' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: loginMode === 'otp' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      OTP Code
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLoginMode('magic')}
                      className="btn" 
                      style={{ 
                        flexGrow: 1, 
                        fontSize: '0.85rem', 
                        padding: '0.4rem', 
                        borderRadius: '6px',
                        background: loginMode === 'magic' ? 'var(--light-bg)' : 'transparent',
                        color: loginMode === 'magic' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: loginMode === 'magic' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      Magic Link
                    </button>
                  </div>

                  {/* Email/Mobile Input */}
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
                    <label htmlFor="loginEmail" className="auth-input-label">Email or Mobile Number</label>
                    {loginErrors.email && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px', fontWeight: 600 }}>{loginErrors.email}</span>
                    )}
                  </div>

                  {/* Password Input (Traditional Mode) */}
                  {loginMode === 'password' && (
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
                  )}

                  {/* OTP Code Fields (OTP Mode) */}
                  {loginMode === 'otp' && (
                    <div className={`auth-input-group ${focusedField === 'otpCode' ? 'focused' : ''} ${otpCode ? 'has-value' : ''}`}>
                      <input 
                        type="text" 
                        id="otpCode"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        className="auth-input-field"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        onFocus={() => setFocusedField('otpCode')}
                        onBlur={() => setFocusedField(null)}
                        style={{ letterSpacing: '0.3em', textAlign: 'center', paddingLeft: '1rem' }}
                      />
                      <label htmlFor="otpCode" className="auth-input-label" style={{ left: '1rem' }}>One-Time Password Code</label>
                    </div>
                  )}

                  {/* Magic Link helper text */}
                  {loginMode === 'magic' && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.5rem' }}>
                      ⚡ We will send a secure sign-in token to your registered email above. Click it to log in instantly.
                    </p>
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
                      <span>Remember Device</span>
                    </label>
                    <a href="#forgot" className="auth-forgot-link" onClick={() => alert("Password reset workflow placeholder")}>Forgot Password?</a>
                  </div>

                  {/* Biometric trigger helper */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <button 
                      type="button" 
                      onClick={startBiometricScan}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', width: '100%', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span>👤</span> Scan Face ID / Fingerprint
                    </button>
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
                      <>🚗 {loginMode === 'magic' ? 'Send Magic Link' : loginMode === 'otp' ? 'Verify Code' : 'Login Securely'}</>
                    )}
                  </button>
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

          {/* Biometrics Scan Simulator Modal */}
          {showBiometricsModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15,23,42,0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999
            }}>
              <div className="glass-card" style={{ width: '320px', textAlign: 'center', padding: '2.5rem 2rem', background: 'var(--light-bg)', color: 'var(--text-primary)' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem', 
                  animation: biometricsScanning ? 'pulse-emergency 1.5s infinite' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(37,99,235,0.06)'
                }}>
                  {biometricsScanning ? '🧬' : '🟢'}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Biometric Verification</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {biometricsScanning 
                    ? 'Scanning Face ID / Fingerprint sensor...' 
                    : 'Security Match Verified! Logged in.'}
                </p>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ==========================================
           STANDARD LANDING PAGE VIEW
           ========================================== */
        <>
          {/* Header */}
          <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-container">
              <a href="#home" className="navbar-logo" onClick={() => setCurrentView('landing')}>
                <span className="navbar-logo-icon" style={{ fontSize: '1.6rem' }}>🚨</span>
                <span style={{ color: 'var(--primary)' }}>Road</span>
                <span style={{ color: 'var(--text-primary)' }}>Rescue AI</span>
              </a>

              <nav className="navbar-menu">
                <li><a href="#home" className="navbar-link">Home</a></li>
                <li><a href="#features" className="navbar-link">Features</a></li>
                <li><a href="#services" className="navbar-link">Services</a></li>
                <li><a href="#how-it-works" className="navbar-link">How It Works</a></li>
                <li><a href="#reviews" className="navbar-link">Reviews</a></li>
                <li><a href="#faq" className="navbar-link">FAQ</a></li>
                <li><a href="#contact" className="navbar-link">Contact</a></li>
              </nav>

              <div className="navbar-actions">
                <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Theme">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                
                <button 
                  onClick={() => setCurrentView('login')} 
                  className="navbar-link cursor-pointer" 
                  style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: '0.95rem' }}
                >
                  Login
                </button>
                <button 
                  onClick={() => setCurrentView('signup')} 
                  className="btn btn-secondary cursor-pointer"
                >
                  Sign Up
                </button>
                <a href="#emergency" className="btn btn-emergency cursor-pointer">🚨 Emergency SOS</a>
              </div>

              <button 
                className="mobile-nav-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
              <div className="mobile-menu-drawer" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--light-bg)',
                borderBottom: '1px solid var(--border-light)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                zIndex: 999
              }}>
                <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }} className="btn btn-secondary" style={{ width: '100%' }}>Login</button>
                  <a href="#emergency" className="btn btn-emergency" style={{ width: '100%' }}>🚨 Emergency SOS</a>
                </div>
              </div>
            )}
          </header>

          {/* Hero */}
          <section id="home" className="section" style={{ overflow: 'hidden', paddingBottom: '2rem' }}>
            <div className="hero-gradient-blobs">
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
              <div className="blob blob-3"></div>
            </div>

            <div className="container hero-wrapper">
              <div className="hero-content animate-slide-up">
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  width: 'max-content'
                }}>
                  <Sparkles size={16} /> Premium AI Roadside Dispatch
                </div>

                <h1 className="hero-heading">
                  Emergency Roadside <br />
                  <span className="gradient-text">Assistance in Minutes.</span>
                </h1>

                <p className="hero-subheading">
                  Connect instantly with nearby verified mechanics using AI diagnostics and live GPS tracking. Get help anywhere, anytime with secure payments and real-time updates.
                </p>

                <div className="hero-ctas">
                  <a href="#emergency" className="btn btn-emergency cursor-pointer">
                    <span>🚗</span> Get Emergency Help
                  </a>
                  <button 
                    onClick={startMapSimulation} 
                    className="btn btn-secondary cursor-pointer"
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Play size={18} fill="currentColor" /> Watch Dispatch Demo
                  </button>
                </div>

                <div className="hero-trust-badges">
                  <div className="hero-badge-item">
                    <Check size={16} className="hero-badge-icon" />
                    <span>Available 24/7</span>
                  </div>
                  <div className="hero-badge-item">
                    <Check size={16} className="hero-badge-icon" />
                    <span>Verified Mechanics</span>
                  </div>
                  <div className="hero-badge-item">
                    <Check size={16} className="hero-badge-icon" />
                    <span>AI Powered</span>
                  </div>
                  <div className="hero-badge-item">
                    <Check size={16} className="hero-badge-icon" />
                    <span>Live GPS Tracking</span>
                  </div>
                </div>
              </div>

              {/* Right Side Mockup */}
              <div className="hero-visual-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
                    <MapPin size={16} color="var(--primary)" /> 📍 GPS Live
                  </div>
                  <div className="floating-element float-wrench">
                    <Wrench size={16} color="var(--primary)" /> 🔧 Mechanic Matched
                  </div>
                  <div className="floating-element float-sos">
                    <ShieldAlert size={16} color="var(--accent)" /> 🚨 SOS Active
                  </div>
                  <div className="floating-element float-shield">
                    <Shield size={16} color="var(--secondary)" /> 🛡 Verified Safe
                  </div>
                  <div className="floating-element float-lightning">
                    <span>⚡</span> AI Diagnostic
                  </div>
                  <div className="floating-element float-rating">
                    <Star size={14} fill="#F59E0B" color="#F59E0B" /> 4.9 Rating
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section ref={statsSectionRef} className="stats-section">
            <div className="container stats-grid">
              <div className="stat-item">
                <span className="stat-number">{counts.requests.toLocaleString()}+</span>
                <span className="stat-label">Emergency Requests Done</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{counts.mechanics.toLocaleString()}+</span>
                <span className="stat-label">Verified Mechanics</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{counts.cities.toLocaleString()}+</span>
                <span className="stat-label">Cities Covered</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{counts.satisfaction}%</span>
                <span className="stat-label">Satisfaction Rate</span>
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
                  <div className="service-meta">
                    <div className="service-eta"><span className="service-eta-label">ETA</span><span className="service-eta-val">12 Mins</span></div>
                    <div className="service-price"><span className="service-price-label">Price</span><span className="service-price-val">$49+</span></div>
                  </div>
                  <a href="#emergency" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</a>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="service-icon-box"><Activity size={24} /></div>
                  <h3 className="service-title">Battery Jump Start</h3>
                  <p className="service-description">Fast ignition jump or dynamic battery replacement. Mechanics carry stock batteries.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Professional Jump</li>
                    <li className="service-feature-item"><Check size={14} /> Alternator Diagnostics</li>
                  </ul>
                  <div className="service-meta">
                    <div className="service-eta"><span className="service-eta-label">ETA</span><span className="service-eta-val">10 Mins</span></div>
                    <div className="service-price"><span className="service-price-label">Price</span><span className="service-price-val">$59+</span></div>
                  </div>
                  <a href="#emergency" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</a>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="service-icon-box"><Compass size={24} /></div>
                  <h3 className="service-title">Fuel Delivery</h3>
                  <p className="service-description">Emergency delivery of unleaded fuel or diesel directly to your locked location on the highway.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> 2 Gallons Included</li>
                    <li className="service-feature-item"><Check size={14} /> Unleaded & Diesel</li>
                  </ul>
                  <div className="service-meta">
                    <div className="service-eta"><span className="service-eta-label">ETA</span><span className="service-eta-val">15 Mins</span></div>
                    <div className="service-price"><span className="service-price-label">Price</span><span className="service-price-val">$39+</span></div>
                  </div>
                  <a href="#emergency" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</a>
                </div>

                <div className="service-card animate-slide-up">
                  <div className="service-icon-box"><AlertTriangle size={24} /></div>
                  <h3 className="service-title">Engine Breakdown</h3>
                  <p className="service-description">AI diagnostic check + onsite cooling/mechanical troubleshooting by verified mechanics.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Full System Diagnostic</li>
                    <li className="service-feature-item"><Check size={14} /> Hose & Belt Fixes</li>
                  </ul>
                  <div className="service-meta">
                    <div className="service-eta"><span className="service-eta-label">ETA</span><span className="service-eta-val">18 Mins</span></div>
                    <div className="service-price"><span className="service-price-label">Price</span><span className="service-price-val">$89+</span></div>
                  </div>
                  <a href="#emergency" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</a>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="service-icon-box"><Navigation size={24} /></div>
                  <h3 className="service-title">Car Towing</h3>
                  <p className="service-description">Premium flatbed or wheel-lift towing to your home, a local dealer, or our nearest service garage.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> First 5 Miles Included</li>
                    <li className="service-feature-item"><Check size={14} /> Low Clearance Flatbeds</li>
                  </ul>
                  <div className="service-meta">
                    <div className="service-eta"><span className="service-eta-label">ETA</span><span className="service-eta-val">20 Mins</span></div>
                    <div className="service-price"><span className="service-price-label">Price</span><span className="service-price-val">$99+</span></div>
                  </div>
                  <a href="#emergency" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</a>
                </div>

                <div className="service-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="service-icon-box"><Lock size={24} /></div>
                  <h3 className="service-title">Lockout Assistance</h3>
                  <p className="service-description">Fast and non-destructive vehicle opening using professional lockout entry gear.</p>
                  <ul className="service-features-list">
                    <li className="service-feature-item"><Check size={14} /> Damage-Free Guarantee</li>
                    <li className="service-feature-item"><Check size={14} /> Smart Key Bypass</li>
                  </ul>
                  <div className="service-meta">
                    <div className="service-eta"><span className="service-eta-label">ETA</span><span className="service-eta-val">12 Mins</span></div>
                    <div className="service-price"><span className="service-price-label">Price</span><span className="service-price-val">$59+</span></div>
                  </div>
                  <a href="#emergency" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</a>
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

          {/* Interactive Map */}
          <section className="section">
            <div className="container map-section-wrapper">
              <div className="map-card animate-scale">
                <div className="map-status-overlay">
                  <div className="map-status-pill">
                    <span className={`map-status-indicator ${mapStatus.replace(/\s+/g, '').toLowerCase()}`}></span>
                    <span>Status: <strong>{mapStatus}</strong></span>
                  </div>
                  <div className="map-eta-box">
                    <Clock size={14} />
                    <span>ETA: {mapEta} Mins</span>
                  </div>
                </div>

                <div className="map-svg-container">
                  <svg className="map-svg" viewBox="0 0 500 350">
                    <defs>
                      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    <rect x="20" y="30" width="120" height="80" rx="10" fill="#E2F0D9" opacity="0.7" />
                    <rect x="300" y="40" width="160" height="90" rx="10" fill="#E2F0D9" opacity="0.7" />
                    <rect x="60" y="240" width="140" height="80" rx="10" fill="#E2F0D9" opacity="0.7" />

                    <path d="M 0,120 L 500,120" className="map-road-network map-road-main" />
                    <path d="M 250,0 L 250,350" className="map-road-network map-road-main" />
                    <path d="M 0,250 L 500,250" className="map-road-network map-road-main" />
                    <path d="M 100,0 L 100,350" className="map-road-network map-road-inner" />
                    <path d="M 400,0 L 400,350" className="map-road-network map-road-inner" />

                    {mapStatus !== 'Searching' && (
                      <path 
                        d="M 100,120 L 250,120 L 250,250 L 450,250" 
                        fill="none" 
                        stroke="var(--primary)" 
                        strokeWidth="6" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        opacity="0.85"
                        strokeDasharray="480"
                        strokeDashoffset={480 - (routeLineProgress / 100) * 480}
                      />
                    )}

                    <g transform="translate(450, 250)">
                      <circle cx="0" cy="0" r="16" fill="var(--accent)" opacity="0.2" className="map-pulse-circle" />
                      <circle cx="0" cy="0" r="6" fill="var(--accent)" />
                      <text x="-18" y="-12" fill="var(--text-primary)" fontSize="9" fontWeight="700">Your Location</text>
                    </g>

                    <g transform="translate(100, 120)">
                      <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
                      <circle cx="0" cy="0" r="12" fill="var(--secondary)" opacity="0.15" />
                      <text x="-30" y="-12" fill="var(--text-secondary)" fontSize="8" fontWeight="600">Apex Rescue Station</text>
                    </g>

                    <g transform={`translate(${truckPos.x}, ${truckPos.y})`}>
                      <circle cx="0" cy="0" r="12" fill="var(--primary)" opacity="0.25" className="map-pulse-circle" />
                      <rect x="-10" y="-7" width="20" height="14" fill="var(--primary)" rx="2" />
                      <rect x="4" y="-5" width="5" height="10" fill="#FFF" />
                      <circle cx="-5" cy="8" r="3" fill="#1E293B" />
                      <circle cx="5" cy="8" r="3" fill="#1E293B" />
                    </g>
                  </svg>
                </div>

                <div className="map-controls-overlay">
                  <div className="map-route-info">
                    <div className="map-route-title">Rescue Route Tracker</div>
                    <div className="map-route-meta">Distance: {mapDist} miles | Avg Speed: 24mph</div>
                  </div>
                  <button 
                    onClick={startMapSimulation} 
                    disabled={isSimulating}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
                  >
                    {isSimulating ? 'Dispatch Active...' : '🚨 Simulate SOS Dispatch'}
                  </button>
                </div>
              </div>

              <div className="map-content-right animate-slide-up">
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <Navigation size={16} /> Live GPS Routing System
                </div>
                <h2 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Interactive Live Tracking</h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  Watch dispatch logic run in real time. Press <strong>Simulate SOS Dispatch</strong> to witness our routing engine match a responder, lock down the optimal street grid coordinates, and track progress live.
                </p>
                <p>
                  Your dispatch undergoes a status pipeline from <code>Searching</code> ➔ <code>Accepted</code> ➔ <code>On The Way</code> ➔ <code>Arriving</code>, giving you exact transparency and reducing rescue anxiety.
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
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

          {/* Why Choose Us */}
          <section id="features" className="section">
            <div className="container">
              <h2>Why Choose RoadRescue AI</h2>
              <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                Our features are built from the ground up for speed, verified security, and absolute reliability.
              </p>

              <div className="bento-grid">
                <div className="bento-card large animate-slide-up">
                  <div className="bento-icon-box"><Navigation size={22} /></div>
                  <h3 className="bento-title">Real-Time Precision GPS</h3>
                  <p className="bento-desc">
                    We don't play guessing games with address fields. Our platform tracks live coordinates down to 3 meters, matching the closest possible responder and updating routing paths relative to real-time city traffic bottlenecks.
                  </p>
                </div>

                <div className="bento-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="bento-icon-box"><Shield size={22} /></div>
                  <h3 className="bento-title">Verified Mechanics</h3>
                  <p className="bento-desc">
                    Every single partner mechanic undergoes intensive background vetting, certification verification, and regular rating audits to ensure premium service quality.
                  </p>
                </div>

                <div className="bento-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="bento-icon-box"><CreditCard size={22} /></div>
                  <h3 className="bento-title">Secure Billing</h3>
                  <p className="bento-desc">
                    Flat rates are calculated beforehand. Secure escrow integration ensures mechanics only get paid once the job is fully completed.
                  </p>
                </div>

                <div className="bento-card large animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <div className="bento-icon-box"><Sparkles size={22} /></div>
                  <h3 className="bento-title">AI Diagnostics & Image Scanning</h3>
                  <p className="bento-desc">
                    Unsure why the engine is smoking or knocking? Snap a quick photo or describe the noise to our AI diagnostic engine. It queries thousands of manufacturer manuals to isolate potential faults and equips the dispatched mechanic with the correct replacement components.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* App Preview */}
          <section className="section" style={{ background: 'var(--light-surface)' }}>
            <div className="container mobile-preview-wrapper">
              <div className="phone-mockup-container animate-scale">
                <div className="phone-frame">
                  <div className="phone-island"></div>
                  <div className="phone-screen">
                    <div className="phone-header">
                      <span>9:41</span>
                      <span style={{ color: 'var(--primary)' }}>RoadRescue AI</span>
                      <span style={{ fontSize: '0.65rem' }}>🔋 100%</span>
                    </div>

                    <div className="phone-content">
                      {activePhoneTab === 'Home' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ background: 'var(--light-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>🚨 Need Help Now?</div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Request high-speed roadside dispatch in one click.</p>
                            <button className="btn btn-emergency" style={{ fontSize: '0.7rem', padding: '0.5rem 1rem', width: '100%' }}>Get Help</button>
                          </div>
                          <div style={{ background: 'var(--light-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Active Diagnoses</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Diagnostic History</span>
                              <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700 }}>Clean</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activePhoneTab === 'Tracking' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                          <div style={{ background: '#E2E8F0', height: '150px', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '40%', left: '45%', fontWeight: 800, color: 'var(--primary)' }}>🗺️ MAP</div>
                            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'black', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem' }}>ETA: 8m</div>
                          </div>
                          <div style={{ background: 'var(--light-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontWeight: 700 }}>Tow Master #402</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status: Driving to you</div>
                          </div>
                        </div>
                      )}

                      {activePhoneTab === 'AI Assistant' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ background: 'var(--light-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', maxWidth: '90%' }}>
                              Hey, describe your trouble!
                            </div>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '8px', alignSelf: 'flex-end', maxWidth: '90%' }}>
                              Flat tire on I-95
                            </div>
                            <div style={{ background: 'var(--light-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', maxWidth: '90%' }}>
                              🛠 Dispatching tire team. ETA: 12 minutes. Price: $49.
                            </div>
                          </div>
                        </div>
                      )}

                      {activePhoneTab === 'Profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center', paddingTop: '1rem' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👤</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Sarah Jenkins</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Premium Member | Tesla Model 3</div>
                          </div>
                          <div style={{ width: '100%', background: 'var(--light-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'left', fontSize: '0.65rem' }}>
                            <div>💳 Visa **** 4920</div>
                            <div style={{ marginTop: '0.25rem' }}>🛡 State Farm Policy Verified</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="phone-footer">
                      <div className={`phone-tab-icon cursor-pointer ${activePhoneTab === 'Home' ? 'active' : ''}`} onClick={() => setActivePhoneTab('Home')}>
                        <Smartphone size={14} />
                        <span>Home</span>
                      </div>
                      <div className={`phone-tab-icon cursor-pointer ${activePhoneTab === 'Tracking' ? 'active' : ''}`} onClick={() => setActivePhoneTab('Tracking')}>
                        <Navigation size={14} />
                        <span>Track</span>
                      </div>
                      <div className={`phone-tab-icon cursor-pointer ${activePhoneTab === 'AI Assistant' ? 'active' : ''}`} onClick={() => setActivePhoneTab('AI Assistant')}>
                        <Sparkles size={14} />
                        <span>AI Assistant</span>
                      </div>
                      <div className={`phone-tab-icon cursor-pointer ${activePhoneTab === 'Profile' ? 'active' : ''}`} onClick={() => setActivePhoneTab('Profile')}>
                        <User size={14} />
                        <span>Profile</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="phone-control-panel animate-slide-up">
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  width: 'max-content'
                }}>
                  <Smartphone size={16} /> Premium Native Mobile App
                </div>
                <h2>Mobile App Preview</h2>
                <p style={{ marginBottom: '1rem' }}>
                  We support a fully integrated native application. Toggle the buttons below to interact with screens inside the smartphone mockup frame.
                </p>

                <div className={`phone-tab-trigger-card ${activePhoneTab === 'Home' ? 'active' : ''}`} onClick={() => setActivePhoneTab('Home')}>
                  <div className="phone-trigger-icon"><Smartphone size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>One-Click SOS Dashboard</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instantly request emergency help in a single tap.</p>
                  </div>
                </div>

                <div className={`phone-tab-trigger-card ${activePhoneTab === 'Tracking' ? 'active' : ''}`} onClick={() => setActivePhoneTab('Tracking')}>
                  <div className="phone-trigger-icon"><Navigation size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>Live Tracker Screen</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Follow the exact path of your dispatched tow responder.</p>
                  </div>
                </div>

                <div className={`phone-tab-trigger-card ${activePhoneTab === 'AI Assistant' ? 'active' : ''}`} onClick={() => setActivePhoneTab('AI Assistant')}>
                  <div className="phone-trigger-icon"><Sparkles size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>AI Vehicle Diagnoser</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Troubleshoot error codes and get immediate costs.</p>
                  </div>
                </div>

                <div className={`phone-tab-trigger-card ${activePhoneTab === 'Profile' ? 'active' : ''}`} onClick={() => setActivePhoneTab('Profile')}>
                  <div className="phone-trigger-icon"><User size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>User Profile & Insurance</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verify roadside coverages and card payment details.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section id="reviews" className="section" style={{ overflow: 'hidden' }}>
            <div className="container">
              <h2>Loved by Drivers Everywhere</h2>
              <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                Hear from stranded motorists rescued by our AI dispatcher and network of verified mechanics.
              </p>

              <div className="reviews-carousel-wrapper">
                <div className="reviews-carousel-track">
                  <div className="review-card">
                    <div className="review-stars">
                      <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                    </div>
                    <p className="review-text">
                      "I was stranded on the I-95 at 2 AM with a blown radiator. The AI Chatbot diagnosed the issue instantly and mapped a flatbed to me. Arrived in 11 minutes flat. Absolutely brilliant service!"
                    </p>
                    <div className="review-user-box">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100" alt="Sarah J." className="review-avatar" />
                      <div>
                        <div className="review-user-name">Sarah Jenkins</div>
                        <div className="review-user-meta">Tesla Model 3 | Boston</div>
                      </div>
                    </div>
                  </div>

                  <div className="review-card">
                    <div className="review-stars">
                      <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                    </div>
                    <p className="review-text">
                      "Pay-as-you-go flat rates are a game changer. Standard tow truck companies wanted to charge me double because of rain. RoadRescue matched me instantly for $99 flat."
                    </p>
                    <div className="review-user-box">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100" alt="Marcus T." className="review-avatar" />
                      <div>
                        <div className="review-user-name">Marcus Thompson</div>
                        <div className="review-user-meta">Ford F-150 | Seattle</div>
                      </div>
                    </div>
                  </div>

                  <div className="review-card">
                    <div className="review-stars">
                      <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
                    </div>
                    <p className="review-text">
                      "My battery died in a parking garage with low clearance. The app let me select an option specifically for low ceiling garages, and they sent a responder with the correct setup. Outstanding UI."
                    </p>
                    <div className="review-user-box">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" alt="Elena R." className="review-avatar" />
                      <div>
                        <div className="review-user-name">Elena Rostova</div>
                        <div className="review-user-meta">BMW X5 | Chicago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trusted Partners */}
          <section className="trusted-section">
            <div className="container">
              <div className="trusted-title">INTEGRATED WITH LEADING PROVIDERS</div>
              <div className="logo-ticker-container">
                <div className="logo-ticker-track">
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>STATE FARM</span>
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>GEICO</span>
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>TESLA MOTORS</span>
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>UBER DISPATCH</span>
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>STRIPE PAY</span>
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>PROGRESSIVE</span>
                  <span className="trusted-logo" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>VISA BRAND</span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="section">
            <div className="container">
              <h2>Frequently Asked Questions</h2>
              <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                Got questions? We have answers. Find details about tracking, payments, pricing, and safety.
              </p>

              <div className="faq-accordion">
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className={`faq-item ${activeFaq === index ? 'open' : ''}`}
                  >
                    <button 
                      className="faq-question-btn"
                      onClick={() => toggleFaq(index)}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className="faq-chevron" size={20} />
                    </button>
                    <div className="faq-answer-container">
                      <p className="faq-answer">{faq.a}</p>
                    </div>
                  </div>
                ))}
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
                onClick={startMapSimulation} 
                className="btn btn-emergency btn-lg cursor-pointer"
                style={{ fontSize: '1.3rem', padding: '1.2rem 2.5rem' }}
              >
                🚨 Request Emergency Help
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer-main" id="contact">
            <div className="container">
              <div className="footer-grid">
                
                <div className="footer-brand">
                  <div className="footer-logo">
                    <span>🚨</span>
                    <span style={{ color: 'var(--primary)' }}>Road</span>
                    <span>Rescue AI</span>
                  </div>
                  <p className="footer-desc">
                    High-fidelity, AI-powered roadside assistance networks matching stranded motorists with certified service specialists dynamically in under 15 minutes.
                  </p>
                  <div className="footer-socials">
                    <a href="#fb" className="footer-social-icon">F</a>
                    <a href="#tw" className="footer-social-icon">T</a>
                    <a href="#li" className="footer-social-icon">L</a>
                    <a href="#yt" className="footer-social-icon">Y</a>
                  </div>
                </div>

                <div className="footer-col">
                  <h4 className="footer-col-title">Quick Links</h4>
                  <ul className="footer-links">
                    <li><a href="#home" className="footer-link">Home</a></li>
                    <li><a href="#features" className="footer-link">Features</a></li>
                    <li><a href="#services" className="footer-link">Services</a></li>
                    <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4 className="footer-col-title">Services</h4>
                  <ul className="footer-links">
                    <li><a href="#services" className="footer-link">Towing Dispatch</a></li>
                    <li><a href="#services" className="footer-link">Battery Boost</a></li>
                    <li><a href="#services" className="footer-link">Tire Repair</a></li>
                    <li><a href="#services" className="footer-link">Fuel Delivery</a></li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4 className="footer-col-title">Contact Us</h4>
                  <ul className="footer-links" style={{ color: '#94A3B8' }}>
                    <li>✉️ support@roadrescue.ai</li>
                    <li>📞 +1 (800) 555-SOS-AI</li>
                    <li>📍 100 Pine Street, San Francisco, CA</li>
                  </ul>
                </div>

                <div className="footer-col footer-newsletter">
                  <h4 className="footer-col-title">Newsletter</h4>
                  <p style={{ fontSize: '0.85rem' }}>Subscribe to get winter safety guidelines and platform updates.</p>
                  <div className="newsletter-input-box">
                    <input type="email" placeholder="Your email address" className="newsletter-input" />
                    <button className="newsletter-btn" onClick={() => alert("Thank you for subscribing!")}>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

              </div>

              <div className="footer-bottom">
                <p>© {new Date().getFullYear()} RoadRescue AI. All rights reserved. Created for premium hackathon demonstration.</p>
                <div className="footer-bottom-links">
                  <a href="#privacy" className="footer-link">Privacy Policy</a>
                  <a href="#terms" className="footer-link">Terms of Service</a>
                  <a href="#cookies" className="footer-link">Cookie Settings</a>
                </div>
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
    </>
  );
}
