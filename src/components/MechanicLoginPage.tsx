import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wrench,
  Shield,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Check,
  Star,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  Zap,
  Clock,
  CreditCard,
  Users,
  MapPin,
  Heart,
  TrendingUp,
  ChevronRight,
  Send,
  RefreshCw,
  Globe,
  HelpCircle,
  MessageCircle,
  Award,
  ShieldCheck,
  Fingerprint,
  Smartphone,
  KeyRound,
  Timer,
  BadgeCheck
} from 'lucide-react';
import '../mechanic-login.css';

interface MechanicLoginPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onBack: () => void;
  onLoginSuccess?: () => void;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  initials: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Rajesh Kumar',
    role: 'ASE Certified Mechanic · 8 yrs',
    text: 'RoadRescue AI transformed my business. I get 3x more service requests now and the instant payments are a game changer.',
    rating: 5,
    initials: 'RK',
    color: '#2563EB'
  },
  {
    name: 'Maria Santos',
    role: 'Towing Specialist · 5 yrs',
    text: 'The AI-powered dispatch system routes jobs to me automatically. My earnings increased by 40% in just two months.',
    rating: 5,
    initials: 'MS',
    color: '#22C55E'
  },
  {
    name: 'Ahmed Hassan',
    role: 'Battery Expert · 6 yrs',
    text: 'Professional platform with real-time tracking. Customers trust me more since joining RoadRescue AI.',
    rating: 5,
    initials: 'AH',
    color: '#F59E0B'
  },
  {
    name: 'Priya Sharma',
    role: 'Tire Repair Pro · 4 yrs',
    text: 'The flexible hours let me work on my own schedule. Best decision I made for my roadside assistance business.',
    rating: 5,
    initials: 'PS',
    color: '#EC4899'
  },
  {
    name: 'James Wilson',
    role: 'Diesel Mechanic · 10 yrs',
    text: 'Everything is transparent — earnings, ratings, service history. This is how the gig economy should work.',
    rating: 4,
    initials: 'JW',
    color: '#8B5CF6'
  },
  {
    name: 'Fatima Al-Rashid',
    role: 'Auto Electrician · 7 yrs',
    text: 'Support team is responsive and the verification process gives customers confidence. Highly recommend.',
    rating: 5,
    initials: 'FA',
    color: '#EF4444'
  }
];

export default function MechanicLoginPage({ theme, toggleTheme, onBack, onLoginSuccess }: MechanicLoginPageProps) {
  /* --- Login Form State --- */
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  /* --- OTP State --- */
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* --- Forgot Password Modal --- */
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotErrors, setForgotErrors] = useState<{ email?: string }>({});
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* --- Mobile Menu --- */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* --- Animated Stats --- */
  const [stats, setStats] = useState({ mechanics: 0, services: 0, rating: 0, satisfaction: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  /* --- Language Selector --- */
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState('EN');

  const langs = ['EN', 'ES', 'HI', 'AR', 'FR'];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        const duration = 2200;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = progress * (2 - progress);
          setStats({
            mechanics: Math.floor(ease * 10000),
            services: Math.floor(ease * 50000),
            rating: parseFloat((ease * 4.9).toFixed(1)),
            satisfaction: Math.floor(ease * 98)
          });
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.2 });

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  /* --- OTP Countdown Timer --- */
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  /* --- Handlers --- */
  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) newErrors.email = 'Email or mobile number is required.';
    if (loginMode === 'password' && !password) newErrors.password = 'Password is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => { onLoginSuccess?.(); }, 1500);
    }, 1800);
  }, [email, password, loginMode, onLoginSuccess]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpDigits]);

  const sendOtp = useCallback(() => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email or mobile number first.' });
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);
      return;
    }
    setErrors({});
    setOtpSent(true);
    setOtpCountdown(30);
  }, [email]);

  const handleForgotSubmit = useCallback(() => {
    setForgotErrors({});
    if (!forgotEmail.trim()) {
      setForgotErrors({ email: 'Email or mobile number is required.' });
      return;
    }
    setForgotStep('otp');
  }, [forgotEmail]);

  const handleForgotOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...forgotOtp];
    newOtp[index] = value.slice(-1);
    setForgotOtp(newOtp);
    if (value && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== '')) {
      setTimeout(() => setForgotStep('success'), 500);
    }
  }, [forgotOtp]);

  const resetForgotModal = useCallback(() => {
    setShowForgotModal(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotOtp(['', '', '', '', '', '']);
    setForgotErrors({});
  }, []);

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - rect.left - 100}px`;
    ripple.style.top = `${e.clientY - rect.top - 100}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  /* --- SVG Illustrations --- */
  const HeroIllustration = () => (
    <div className="ml-illustration">
      <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Road */}
        <rect x="0" y="240" width="400" height="80" rx="8" fill="rgba(255,255,255,0.08)" />
        <line x1="20" y1="280" x2="380" y2="280" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeDasharray="20 15" />

        {/* Service Van */}
        <rect x="60" y="160" width="160" height="80" rx="12" fill="rgba(255,255,255,0.15)" />
        <rect x="70" y="170" width="60" height="40" rx="6" fill="rgba(96,165,250,0.3)" />
        <rect x="80" y="175" width="40" height="30" rx="4" fill="rgba(96,165,250,0.15)" />
        <rect x="150" y="170" width="55" height="40" rx="6" fill="rgba(96,165,250,0.2)" />
        <circle cx="90" cy="245" r="16" fill="rgba(255,255,255,0.2)" />
        <circle cx="90" cy="245" r="8" fill="rgba(255,255,255,0.1)" />
        <circle cx="190" cy="245" r="16" fill="rgba(255,255,255,0.2)" />
        <circle cx="190" cy="245" r="8" fill="rgba(255,255,255,0.1)" />

        {/* Wrench Icon on Van */}
        <g transform="translate(110, 195) rotate(-45)">
          <rect x="-2" y="-12" width="4" height="24" rx="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="0" cy="-12" r="6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        </g>

        {/* GPS Pin */}
        <g transform="translate(290, 120)">
          <circle cx="0" cy="0" r="28" fill="rgba(34,197,94,0.15)" />
          <circle cx="0" cy="0" r="18" fill="rgba(34,197,94,0.25)" />
          <circle cx="0" cy="0" r="8" fill="rgba(34,197,94,0.5)" />
          <circle cx="0" cy="0" r="3" fill="#fff" />
          <path d="M0 -28 C-8 -28 -14 -22 -14 -14 C-14 -4 0 4 0 4 C0 4 14 -4 14 -14 C14 -22 8 -28 0 -28Z" fill="rgba(34,197,94,0.4)" transform="translate(0, -18) scale(0.7)" />
        </g>

        {/* Signal Waves */}
        <circle cx="290" cy="120" r="40" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1.5">
          <animate attributeName="r" values="30;50;30" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="290" cy="120" r="60" fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="1">
          <animate attributeName="r" values="45;65;45" dur="3s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </circle>

        {/* Mechanic Figure */}
        <g transform="translate(310, 170)">
          <circle cx="0" cy="-25" r="12" fill="rgba(255,255,255,0.25)" />
          <rect x="-10" y="-12" width="20" height="30" rx="4" fill="rgba(255,255,255,0.15)" />
          <rect x="-14" y="-10" width="28" height="8" rx="3" fill="rgba(96,165,250,0.3)" />
        </g>

        {/* Tool Box */}
        <rect x="250" y="210" width="40" height="30" rx="4" fill="rgba(245,158,11,0.3)" />
        <rect x="260" y="206" width="20" height="6" rx="2" fill="rgba(245,158,11,0.2)" />

        {/* Battery Icon */}
        <g transform="translate(50, 100)">
          <rect x="0" y="4" width="30" height="18" rx="3" fill="rgba(34,197,94,0.3)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" />
          <rect x="30" y="9" width="4" height="8" rx="1.5" fill="rgba(34,197,94,0.5)" />
          <rect x="4" y="8" width="6" height="10" rx="1" fill="rgba(34,197,94,0.6)" />
          <rect x="12" y="10" width="6" height="8" rx="1" fill="rgba(34,197,94,0.4)" />
          <rect x="20" y="8" width="6" height="10" rx="1" fill="rgba(34,197,94,0.5)" />
        </g>

        {/* Sparkles */}
        <circle cx="150" cy="80" r="3" fill="rgba(245,158,11,0.6)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="350" cy="90" r="2" fill="rgba(96,165,250,0.6)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" begin="0.7s" />
        </circle>
        <circle cx="30" cy="200" r="2.5" fill="rgba(236,72,153,0.5)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" begin="1s" />
        </circle>
      </svg>
    </div>
  );

  const CtaIllustration = () => (
    <div className="ml-cta-illustration">
      <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dashboard Mockup */}
        <rect x="20" y="20" width="280" height="180" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <rect x="30" y="30" width="100" height="10" rx="5" fill="rgba(255,255,255,0.15)" />
        <rect x="30" y="48" width="60" height="8" rx="4" fill="rgba(255,255,255,0.08)" />

        {/* Chart Bars */}
        <rect x="35" y="120" width="24" height="60" rx="4" fill="rgba(96,165,250,0.3)" />
        <rect x="68" y="100" width="24" height="80" rx="4" fill="rgba(96,165,250,0.4)" />
        <rect x="101" y="80" width="24" height="100" rx="4" fill="rgba(96,165,250,0.5)" />
        <rect x="134" y="60" width="24" height="120" rx="4" fill="rgba(34,197,94,0.5)" />
        <rect x="167" y="90" width="24" height="90" rx="4" fill="rgba(96,165,250,0.4)" />

        {/* Stats Cards */}
        <rect x="210" y="65" width="80" height="40" rx="8" fill="rgba(34,197,94,0.2)" />
        <text x="250" y="82" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="bold">Earnings</text>
        <text x="250" y="98" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="14" fontWeight="bold">$2,450</text>

        <rect x="210" y="115" width="80" height="40" rx="8" fill="rgba(245,158,11,0.2)" />
        <text x="250" y="132" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="bold">Jobs Done</text>
        <text x="250" y="148" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="14" fontWeight="bold">47</text>

        {/* Phone Mockup */}
        <rect x="95" y="200" width="50" height="50" rx="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <circle cx="120" cy="225" r="12" fill="rgba(34,197,94,0.3)" />
        <path d="M115 225 l4 4 l8 -8" stroke="rgba(34,197,94,0.8)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <div className="ml-page">
      {/* ===== NAVBAR ===== */}
      <nav className="ml-navbar">
        <div className="ml-navbar-inner">
          <div className="ml-logo" onClick={onBack}>
            <div className="ml-logo-icon">
              <Wrench size={20} />
            </div>
            <span style={{ color: 'var(--primary)' }}>Road</span>
            <span>Rescue AI</span>
          </div>

          <ul className="ml-nav-links">
            <li><a className="ml-nav-link ml-focus-visible" href="#home" onClick={onBack}>Home</a></li>
            <li><a className="ml-nav-link ml-focus-visible" href="#help">Help Center</a></li>
            <li><a className="ml-nav-link ml-focus-visible" href="#contact">Contact Support</a></li>
          </ul>

          <div className="ml-nav-actions">
            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                className="ml-theme-toggle ml-focus-visible"
                onClick={() => setLangOpen(!langOpen)}
                style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}
              >
                {lang}
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--light-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '0.35rem',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 50,
                  minWidth: '60px'
                }}>
                  {langs.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.82rem',
                        fontWeight: lang === l ? 700 : 500,
                        color: lang === l ? 'var(--primary)' : 'var(--text-primary)',
                        background: lang === l ? 'var(--primary-glow)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="ml-theme-toggle ml-focus-visible" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button className="ml-mobile-menu-btn ml-focus-visible" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`ml-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <span className="ml-mobile-menu-link" onClick={onBack}>Home</span>
        <span className="ml-mobile-menu-link">Help Center</span>
        <span className="ml-mobile-menu-link">Contact Support</span>
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className="ml-hero">
        {/* Left: Branding */}
        <div className="ml-hero-left">
          <div className="ml-particle" />
          <div className="ml-particle" />
          <div className="ml-particle" />
          <div className="ml-particle" />

          <HeroIllustration />

          <div className="ml-hero-content">
            <div className="ml-hero-badge">
              <span className="ml-hero-badge-dot" />
              For Verified Mechanics
            </div>
            <h1 className="ml-hero-title">
              Welcome Back, <br /><span>Mechanic!</span>
            </h1>
            <p className="ml-hero-subtitle">
              Log in to accept nearby roadside assistance requests, manage active jobs, update your availability, and grow your earnings.
            </p>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="ml-hero-right">
          <div className={`ml-login-card ${shakeCard ? 'shake-error' : ''}`}>
            {/* Success Overlay */}
            {isSuccess && (
              <div className="ml-success-anim" style={{ position: 'absolute', inset: 0, background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <div className="ml-success-circle">
                  <Check size={36} />
                </div>
                <h3 className="ml-success-title">Authentication Secured</h3>
                <p className="ml-success-desc">Welcome back. Syncing your dashboard...</p>
              </div>
            )}

            {/* Card Header */}
            <div className="ml-card-header">
              <div className="ml-card-icon">
                <ShieldCheck size={24} />
              </div>
              <h2 className="ml-card-title">Mechanic Sign In</h2>
              <p className="ml-card-subtitle">Access your dashboard, manage jobs, and track earnings.</p>
            </div>

            {/* Mode Tabs */}
            <div className="ml-mode-tabs">
              <button
                className={`ml-mode-tab ${loginMode === 'password' ? 'active' : ''}`}
                onClick={() => { setLoginMode('password'); setErrors({}); }}
              >
                <Lock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Password
              </button>
              <button
                className={`ml-mode-tab ${loginMode === 'otp' ? 'active' : ''}`}
                onClick={() => { setLoginMode('otp'); setErrors({}); }}
              >
                <Smartphone size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                OTP Code
              </button>
            </div>

            <form onSubmit={handleLogin} noValidate>
              {/* Email / Mobile */}
              <div className={`ml-input-group ${focusedField === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
                <input
                  type="text"
                  className="ml-input ml-focus-visible"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="username"
                />
                <Mail className="ml-input-icon" size={18} />
                <label className="ml-input-label">Email or Mobile Number</label>
                {errors.email && <div className="ml-error-text">{errors.email}</div>}
              </div>

              {/* Password Mode */}
              {loginMode === 'password' && (
                <div className={`ml-input-group ${focusedField === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="ml-input ml-focus-visible"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="current-password"
                  />
                  <Lock className="ml-input-icon" size={18} />
                  <label className="ml-input-label">Password</label>
                  <button
                    type="button"
                    className="ml-pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <div className="ml-error-text">{errors.password}</div>}
                </div>
              )}

              {/* OTP Mode */}
              {loginMode === 'otp' && (
                <>
                  {!otpSent ? (
                    <button
                      type="button"
                      className="ml-submit-btn"
                      onClick={sendOtp}
                      style={{ marginBottom: '1.25rem' }}
                    >
                      <Send size={18} />
                      Send OTP Code
                    </button>
                  ) : (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div className="ml-otp-inputs">
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className={`ml-otp-digit ml-focus-visible ${digit ? 'filled' : ''}`}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : ''}
                        </span>
                        {otpCountdown === 0 && (
                          <button
                            type="button"
                            onClick={sendOtp}
                            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <RefreshCw size={13} /> Resend
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Remember Me / Forgot Password */}
              {loginMode === 'password' && (
                <div className="ml-form-row">
                  <label className="ml-checkbox" onClick={() => setRememberMe(!rememberMe)}>
                    <span className={`ml-checkbox-box ${rememberMe ? 'checked' : ''}`}>
                      {rememberMe && <Check size={12} />}
                    </span>
                    <span className="ml-checkbox-label">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="ml-forgot-link"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit */}
              {loginMode === 'password' && (
                <button
                  type="submit"
                  className="ml-submit-btn ml-focus-visible"
                  disabled={isLoading}
                  onClick={handleRipple}
                >
                  {isLoading ? (
                    <span className="ml-btn-loading">
                      <span className="ml-spinner" />
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}

              {loginMode === 'otp' && otpSent && otpDigits.every(d => d !== '') && (
                <button
                  type="button"
                  className="ml-submit-btn ml-focus-visible"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    setTimeout(() => { setIsLoading(false); setIsSuccess(true); setTimeout(() => { onLoginSuccess?.(); }, 1500); }, 1800);
                  }}
                  disabled={isLoading}
                  onClickCapture={handleRipple}
                >
                  {isLoading ? (
                    <span className="ml-btn-loading">
                      <span className="ml-spinner" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Divider */}
            <div className="ml-divider">
              <span className="ml-divider-line" />
              <span className="ml-divider-text">Continue with</span>
              <span className="ml-divider-line" />
            </div>

            {/* Social Login */}
            <div className="ml-social-buttons">
              <button className="ml-social-btn ml-focus-visible" onClick={() => alert('Google Sign-In placeholder')}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button className="ml-social-btn ml-focus-visible" onClick={() => alert('Apple Sign-In placeholder')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.52-3.74 4.25z"/>
                </svg>
                Apple
              </button>
              <button className="ml-social-btn ml-focus-visible ml-social-btn-wide" onClick={() => alert('OTP via SMS placeholder')}>
                <Smartphone size={18} />
                Continue with SMS OTP
              </button>
            </div>

            {/* Trust Badges */}
            <div className="ml-trust-badges">
              <div className="ml-trust-badge">
                <ShieldCheck className="ml-trust-badge-icon" size={16} />
                SSL Encrypted
              </div>
              <div className="ml-trust-badge">
                <BadgeCheck className="ml-trust-badge-icon" size={16} />
                Verified Mechanics
              </div>
              <div className="ml-trust-badge">
                <Fingerprint className="ml-trust-badge-icon" size={16} />
                2FA Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BECOME A MECHANIC CTA ===== */}
      <section className="ml-cta-section">
        <div className="ml-cta-inner">
          <div className="ml-cta-card">
            <div className="ml-cta-content">
              <div className="ml-cta-badge">
                <Zap size={13} /> Open to All Mechanics
              </div>
              <h2 className="ml-cta-title">Want to Join RoadRescue AI?</h2>
              <p className="ml-cta-subtitle">
                Become a verified mechanic on the leading AI-powered roadside assistance platform. Grow your business and earn more.
              </p>
              <div className="ml-cta-benefits">
                <div className="ml-cta-benefit">
                  <div className="ml-cta-benefit-icon"><MapPin size={13} /></div>
                  Receive nearby service requests
                </div>
                <div className="ml-cta-benefit">
                  <div className="ml-cta-benefit-icon"><Clock size={13} /></div>
                  Flexible working hours
                </div>
                <div className="ml-cta-benefit">
                  <div className="ml-cta-benefit-icon"><TrendingUp size={13} /></div>
                  Transparent earnings
                </div>
                <div className="ml-cta-benefit">
                  <div className="ml-cta-benefit-icon"><CreditCard size={13} /></div>
                  Instant payments
                </div>
                <div className="ml-cta-benefit">
                  <div className="ml-cta-benefit-icon"><Heart size={13} /></div>
                  Build customer trust
                </div>
                <div className="ml-cta-benefit">
                  <div className="ml-cta-benefit-icon"><Users size={13} /></div>
                  Grow your business
                </div>
              </div>
              <div className="ml-cta-buttons">
                <button className="ml-cta-btn-primary ml-focus-visible" onClick={() => alert('Registration placeholder')}>
                  Register as Mechanic <ChevronRight size={16} />
                </button>
                <button className="ml-cta-btn-secondary ml-focus-visible" onClick={() => alert('Learn more placeholder')}>
                  Learn More
                </button>
              </div>
            </div>
            <CtaIllustration />
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="ml-testimonials">
        <div className="ml-testimonials-header">
          <div className="ml-section-badge">
            <Star size={13} /> Testimonials
          </div>
          <h2 className="ml-section-title">Trusted by Mechanics Worldwide</h2>
          <p className="ml-section-desc">Hear from verified mechanics who have grown their business with RoadRescue AI.</p>
        </div>

        <div className="ml-testimonials-track">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div className="ml-testimonial-card" key={i}>
              <div className="ml-testimonial-header">
                <div className="ml-testimonial-avatar" style={{ background: `${t.color}15`, color: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <div className="ml-testimonial-name">{t.name}</div>
                  <div className="ml-testimonial-role">{t.role}</div>
                </div>
              </div>
              <div className="ml-testimonial-stars">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="ml-star" fill="#F59E0B" size={16} />
                ))}
              </div>
              <p className="ml-testimonial-text">"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PLATFORM STATS ===== */}
      <section className="ml-stats" ref={statsRef}>
        <div className="ml-stats-grid">
          <div className="ml-stat-item">
            <div className="ml-stat-number">{stats.mechanics.toLocaleString()}+</div>
            <div className="ml-stat-label">Verified Mechanics</div>
          </div>
          <div className="ml-stat-item">
            <div className="ml-stat-number">{stats.services.toLocaleString()}+</div>
            <div className="ml-stat-label">Services Completed</div>
          </div>
          <div className="ml-stat-item">
            <div className="ml-stat-number">{stats.rating}★</div>
            <div className="ml-stat-label">Average Rating</div>
          </div>
          <div className="ml-stat-item">
            <div className="ml-stat-number">{stats.satisfaction}%</div>
            <div className="ml-stat-label">Customer Satisfaction</div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="ml-footer">
        <p className="ml-footer-text">© {new Date().getFullYear()} RoadRescue AI. All rights reserved. Created for premium hackathon demonstration.</p>
        <div className="ml-footer-links">
          <a className="ml-footer-link ml-focus-visible" href="#privacy">Privacy Policy</a>
          <a className="ml-footer-link ml-focus-visible" href="#terms">Terms of Service</a>
          <a className="ml-footer-link ml-focus-visible" href="#help">Help Center</a>
        </div>
      </footer>

      {/* ===== FORGOT PASSWORD MODAL ===== */}
      {showForgotModal && (
        <div className="ml-modal-overlay" onClick={resetForgotModal}>
          <div className="ml-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ml-modal-close ml-focus-visible" onClick={resetForgotModal}>
              <X size={18} />
            </button>

            {forgotStep === 'email' && (
              <>
                <div className="ml-card-icon" style={{ marginBottom: '1rem' }}>
                  <KeyRound size={22} />
                </div>
                <h3 className="ml-modal-title">Reset Password</h3>
                <p className="ml-modal-desc">Enter your registered email or mobile number and we'll send you a verification code.</p>
                <div className={`ml-input-group ${focusedField === 'forgotEmail' ? 'focused' : ''} ${forgotEmail ? 'has-value' : ''}`}>
                  <input
                    type="text"
                    className="ml-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onFocus={() => setFocusedField('forgotEmail')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Mail className="ml-input-icon" size={18} />
                  <label className="ml-input-label">Email or Mobile Number</label>
                  {forgotErrors.email && <div className="ml-error-text">{forgotErrors.email}</div>}
                </div>
                <button className="ml-submit-btn" onClick={handleForgotSubmit} style={{ marginTop: '0.5rem' }}>
                  Send OTP <ArrowRight size={18} />
                </button>
              </>
            )}

            {forgotStep === 'otp' && (
              <>
                <div className="ml-card-icon" style={{ marginBottom: '1rem' }}>
                  <Timer size={22} />
                </div>
                <h3 className="ml-modal-title">Enter Verification Code</h3>
                <p className="ml-modal-desc">We've sent a 6-digit code to {forgotEmail || 'your email'}. Enter it below.</p>
                <div className="ml-otp-inputs">
                  {forgotOtp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { forgotOtpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`ml-otp-digit ml-focus-visible ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleForgotOtpChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && i > 0) forgotOtpRefs.current[i - 1]?.focus();
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {forgotStep === 'success' && (
              <div className="ml-success-anim">
                <div className="ml-success-circle">
                  <Check size={36} />
                </div>
                <h3 className="ml-success-title">Code Verified!</h3>
                <p className="ml-success-desc">You can now reset your password. Redirecting...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
