import { useState, useEffect, useRef } from 'react';
import {
  User, Camera, Shield, Star, Briefcase, MapPin, Phone, Mail, Calendar,
  Edit3, Share2, Eye, ChevronRight, ChevronLeft, ChevronDown, Check,
  CheckCircle, Clock, AlertTriangle, X, Upload, FileText, Download,
  Lock, Key, Smartphone, Fingerprint, Bell, BellOff, Volume2, VolumeX,
  Moon, Sun, Globe, DollarSign, CreditCard, Wallet, Banknote, TrendingUp,
  ArrowUpRight, Award, BadgeCheck, Zap, Settings, LogOut, RefreshCw,
  Image, Car, Wrench, Truck, Battery, Fuel, Lock as LockIcon, MapPinned,
  ToggleLeft, ToggleRight, Info, ExternalLink, Copy, Trash2, Plus,
  MessageCircle, HelpCircle, BookOpen, Headphones, AlertCircle, PieChart,
  BarChart3,   Heart, Users, Navigation, Wifi, WifiOff, Timer, CalendarDays,
  Building, Hash, Landmark, Send, QrCode, Link as LinkIcon,
  ClipboardList, Gift
} from 'lucide-react';
import '../profile-settings.css';

interface MechanicProfilePageProps {
  onBack: () => void;
}

interface Service {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: number;
  eta: string;
  enabled: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'expired';
  uploadDate: string;
  expiryDate: string;
  icon: React.ReactNode;
}

interface Review {
  id: string;
  customer: string;
  initials: string;
  color: string;
  rating: number;
  text: string;
  date: string;
  service: string;
  replied?: string;
}

interface Achievement {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  earned: boolean;
  progress: number;
  total: number;
  description: string;
}

interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ip: string;
  time: string;
  current: boolean;
}

const services: Service[] = [
  { id: 's1', name: 'Flat Tire Repair', icon: <Car size={18} />, price: 45, eta: '20 min', enabled: true },
  { id: 's2', name: 'Battery Jump Start', icon: <Battery size={18} />, price: 35, eta: '15 min', enabled: true },
  { id: 's3', name: 'Fuel Delivery', icon: <Fuel size={18} />, price: 55, eta: '25 min', enabled: true },
  { id: 's4', name: 'Engine Repair', icon: <Wrench size={18} />, price: 120, eta: '60 min', enabled: true },
  { id: 's5', name: 'Lockout Assistance', icon: <LockIcon size={18} />, price: 60, eta: '20 min', enabled: true },
  { id: 's6', name: 'Towing', icon: <Truck size={18} />, price: 95, eta: '30 min', enabled: true },
  { id: 's7', name: 'EV Charging Support', icon: <Zap size={18} />, price: 50, eta: '25 min', enabled: false },
];

const documents: Document[] = [
  { id: 'd1', name: 'Government ID', type: 'government-id', status: 'verified', uploadDate: 'Jan 15, 2025', expiryDate: 'Jan 15, 2030', icon: <FileText size={18} /> },
  { id: 'd2', name: 'Driving License', type: 'driving-license', status: 'verified', uploadDate: 'Jan 15, 2025', expiryDate: 'Mar 20, 2028', icon: <FileText size={18} /> },
  { id: 'd3', name: 'Mechanic Certification', type: 'mechanic-cert', status: 'verified', uploadDate: 'Feb 1, 2025', expiryDate: 'Feb 1, 2027', icon: <Award size={18} /> },
  { id: 'd4', name: 'Garage License', type: 'garage-license', status: 'pending', uploadDate: 'Jul 5, 2026', expiryDate: 'Jul 5, 2027', icon: <Building size={18} /> },
  { id: 'd5', name: 'Insurance Documents', type: 'insurance', status: 'verified', uploadDate: 'Mar 10, 2025', expiryDate: 'Mar 10, 2027', icon: <Shield size={18} /> },
  { id: 'd6', name: 'Vehicle Registration', type: 'vehicle-reg', status: 'expired', uploadDate: 'Apr 20, 2024', expiryDate: 'Apr 20, 2025', icon: <Car size={18} /> },
];

const reviews: Review[] = [
  { id: 'r1', customer: 'Sarah Chen', initials: 'SC', color: '#EC4899', rating: 5, text: 'Amazing service! Arrived within 10 minutes and fixed my flat tire efficiently. Highly recommended!', date: 'Jul 10, 2026', service: 'Flat Tire Repair', replied: 'Thank you so much, Sarah! It was a pleasure helping you.' },
  { id: 'r2', customer: 'Michael Brown', initials: 'MB', color: '#2563EB', rating: 5, text: 'Very professional and friendly. Jump-started my car in no time. Fair pricing too.', date: 'Jul 9, 2026', service: 'Battery Jump Start' },
  { id: 'r3', customer: 'Emma Wilson', initials: 'EW', color: '#F59E0B', rating: 4, text: 'Good service overall. Towing was smooth and the mechanic was knowledgeable.', date: 'Jul 8, 2026', service: 'Towing' },
  { id: 'r4', customer: 'David Lee', initials: 'DL', color: '#8B5CF6', rating: 5, text: 'Excellent roadside assistance. Very quick response time and professional handling.', date: 'Jul 7, 2026', service: 'Lockout Assistance' },
  { id: 'r5', customer: 'Lisa Park', initials: 'LP', color: '#22C55E', rating: 5, text: 'Saved my day! Fuel delivery was fast and the mechanic was very courteous.', date: 'Jul 6, 2026', service: 'Fuel Delivery' },
];

const achievements: Achievement[] = [
  { id: 'a1', name: 'Top Rated Mechanic', icon: <Star size={20} />, color: '#F59E0B', earned: true, progress: 100, total: 100, description: 'Maintain 4.8+ rating for 30 days' },
  { id: 'a2', name: '100 Jobs Completed', icon: <Briefcase size={20} />, color: '#2563EB', earned: true, progress: 100, total: 100, description: 'Complete 100 service jobs' },
  { id: 'a3', name: '500 Jobs Completed', icon: <Award size={20} />, color: '#8B5CF6', earned: false, progress: 347, total: 500, description: 'Complete 500 service jobs' },
  { id: 'a4', name: 'Fast Response Award', icon: <Zap size={20} />, color: '#22C55E', earned: true, progress: 100, total: 100, description: 'Respond to requests within 2 minutes' },
  { id: 'a5', name: 'Customer Favorite', icon: <Heart size={20} />, color: '#EC4899', earned: true, progress: 100, total: 100, description: 'Receive 50+ 5-star reviews' },
  { id: 'a6', name: 'Verified Expert', icon: <BadgeCheck size={20} />, color: '#06B6D4', earned: true, progress: 100, total: 100, description: 'Complete all verification steps' },
  { id: 'a7', name: 'Night Owl', icon: <Moon size={20} />, color: '#6366F1', earned: false, progress: 12, total: 30, description: 'Complete 30 night shifts' },
  { id: 'a8', name: 'EV Pioneer', icon: <Zap size={20} />, color: '#10B981', earned: false, progress: 8, total: 25, description: 'Complete 25 EV charging jobs' },
];

const loginActivity: LoginActivity[] = [
  { id: 'l1', device: 'iPhone 15 Pro', location: 'San Francisco, CA', ip: '192.168.1.***', time: 'Now', current: true },
  { id: 'l2', device: 'MacBook Pro', location: 'San Francisco, CA', ip: '192.168.1.***', time: '2 hours ago', current: false },
  { id: 'l3', device: 'iPad Air', location: 'Oakland, CA', ip: '10.0.0.***', time: 'Yesterday', current: false },
  { id: 'l4', device: 'iPhone 15 Pro', location: 'San Jose, CA', ip: '172.16.0.***', time: '3 days ago', current: false },
];

const schedule = [
  { day: 'Monday', start: '7:00 AM', end: '6:00 PM', enabled: true },
  { day: 'Tuesday', start: '7:00 AM', end: '6:00 PM', enabled: true },
  { day: 'Wednesday', start: '7:00 AM', end: '6:00 PM', enabled: true },
  { day: 'Thursday', start: '7:00 AM', end: '6:00 PM', enabled: true },
  { day: 'Friday', start: '7:00 AM', end: '6:00 PM', enabled: true },
  { day: 'Saturday', start: '8:00 AM', end: '4:00 PM', enabled: true },
  { day: 'Sunday', start: 'Off', end: 'Off', enabled: false },
];

export default function MechanicProfilePage({ onBack }: MechanicProfilePageProps) {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  /* Profile fields */
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@roadrescue.com',
    phone: '+1 (555) 123-4567',
    garageName: 'Doe Auto Repair',
    address: '123 Main Street, San Francisco, CA 94102',
    experience: '8',
    specialization: 'Engine & Transmission',
    bio: 'ASE certified mechanic with 8+ years of experience in automotive repair and roadside assistance.',
  });

  /* Availability */
  const [availability, setAvailability] = useState({
    acceptEmergency: true,
    autoAccept: false,
    vacationMode: false,
    weeklySchedule: schedule,
  });

  /* Notification prefs */
  const [notifPrefs, setNotifPrefs] = useState({
    newRequests: true,
    paymentAlerts: true,
    customerMessages: true,
    promotions: false,
    systemUpdates: true,
    emergencyAlerts: true,
    smsAlerts: false,
    emailAlerts: true,
    pushNotifications: true,
  });

  /* Security */
  const [security, setSecurity] = useState({
    twoFactor: true,
    biometric: false,
    securityScore: 85,
  });

  /* App prefs */
  const [appPrefs, setAppPrefs] = useState({
    theme: 'light' as 'light' | 'dark',
    language: 'English',
    distanceUnit: 'KM',
    timeZone: 'Pacific Time (PT)',
    soundEnabled: true,
  });

  /* Services */
  const [serviceList, setServiceList] = useState(services);

  /* Service area */
  const [serviceArea, setServiceArea] = useState({
    radius: 25,
    autoUpdate: true,
  });

  /* Payment */
  const [payment, setPayment] = useState({
    bankName: 'Chase Bank',
    accountHolder: 'John Doe',
    accountNumber: '****4567',
    ifscCode: 'CHASUS6S',
    upiId: 'john.doe@upi',
    payoutSchedule: 'Weekly',
  });

  const handleSave = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const toggleService = (id: string) => {
    setServiceList(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const sections = [
    { key: 'profile', label: 'Profile', icon: <User size={16} /> },
    { key: 'services', label: 'Services', icon: <Wrench size={16} /> },
    { key: 'availability', label: 'Availability', icon: <Clock size={16} /> },
    { key: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { key: 'payment', label: 'Payment', icon: <CreditCard size={16} /> },
    { key: 'reviews', label: 'Reviews', icon: <Star size={16} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { key: 'security', label: 'Security', icon: <Shield size={16} /> },
    { key: 'preferences', label: 'Preferences', icon: <Settings size={16} /> },
    { key: 'achievements', label: 'Achievements', icon: <Award size={16} /> },
    { key: 'support', label: 'Support', icon: <HelpCircle size={16} /> },
  ];

  const perfStats = [
    { label: 'Total Jobs', value: '847', change: '+23 this week', up: true, icon: <Briefcase size={18} /> },
    { label: 'Active Jobs', value: '3', change: 'In progress', up: true, icon: <Zap size={18} /> },
    { label: 'Rating', value: '4.9', change: '+0.1 this month', up: true, icon: <Star size={18} /> },
    { label: 'Acceptance', value: '96%', change: '+2% vs avg', up: true, icon: <CheckCircle size={18} /> },
    { label: 'Completion', value: '98%', change: '+1% vs avg', up: true, icon: <TrendingUp size={18} /> },
    { label: 'Earnings', value: '$47.2K', change: '+15% this month', up: true, icon: <DollarSign size={18} /> },
    { label: 'Experience', value: '8 yrs', change: 'ASE Certified', up: true, icon: <Calendar size={18} /> },
    { label: 'Repeat', value: '42%', change: '+5% this quarter', up: true, icon: <Users size={18} /> },
  ];

  return (
    <div className="mp-page">
      {/* Back Button */}
      <button className="mp-back-btn" onClick={onBack}>
        <ChevronLeft size={18} /> Back to Dashboard
      </button>

      {/* ===== HERO PROFILE ===== */}
      <div className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-hero-content">
          <div className="mp-hero-left">
            <div className="mp-avatar-wrapper" onClick={() => setShowPhotoModal(true)}>
              <div className="mp-avatar">
                <span>JD</span>
              </div>
              <div className="mp-avatar-edit">
                <Camera size={14} />
              </div>
              <div className="mp-avatar-ring" />
            </div>
            <div className="mp-hero-info">
              <div className="mp-hero-name-row">
                <h1>John Doe</h1>
                <span className="mp-verified-badge"><BadgeCheck size={16} /> Verified</span>
              </div>
              <p className="mp-hero-id">Mechanic ID: MR-2024-0847</p>
              <div className="mp-hero-tags">
                <span className="mp-tag"><Wrench size={12} /> Engine & Transmission</span>
                <span className="mp-tag"><Calendar size={12} /> 8 Years Exp.</span>
                <span className="mp-tag"><MapPin size={12} /> San Francisco, CA</span>
                <span className="mp-tag"><Star size={12} /> 4.9 Rating</span>
              </div>
              <div className="mp-hero-actions">
                <button className="mp-btn mp-btn-primary" onClick={() => setIsEditing(!isEditing)}>
                  <Edit3 size={14} /> {isEditing ? 'Save Profile' : 'Edit Profile'}
                </button>
                <button className="mp-btn mp-btn-outline"><Share2 size={14} /> Share Profile</button>
                <button className="mp-btn mp-btn-ghost"><Eye size={14} /> View Public</button>
              </div>
            </div>
          </div>
          <div className="mp-hero-right">
            <div className="mp-status-card">
              <div className={`mp-status-indicator ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <div className="mp-status-info">
                <span className="mp-status-label">{isOnline ? 'Online' : 'Offline'}</span>
                <span className="mp-status-sub">{isOnline ? 'Accepting requests' : 'Not accepting requests'}</span>
              </div>
              <button
                className={`mp-toggle ${isOnline ? 'on' : 'off'}`}
                onClick={() => setIsOnline(!isOnline)}
              >
                <div className="mp-toggle-thumb" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PERFORMANCE STATS ===== */}
      <div className="mp-stats-grid">
        {perfStats.map((stat, i) => (
          <div key={i} className="mp-stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="mp-stat-icon">{stat.icon}</div>
            <div className="mp-stat-value">{stat.value}</div>
            <div className="mp-stat-label">{stat.label}</div>
            <div className={`mp-stat-change ${stat.up ? 'up' : 'down'}`}>
              {stat.up ? <ArrowUpRight size={11} /> : <ArrowUpRight size={11} style={{ transform: 'rotate(90deg)' }} />}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="mp-layout">
        {/* Sidebar Nav */}
        <nav className="mp-sidebar">
          <div className="mp-sidebar-title">Settings</div>
          {sections.map((s) => (
            <button
              key={s.key}
              className={`mp-sidebar-item ${activeSection === s.key ? 'active' : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              {s.icon}
              {s.label}
              <ChevronRight size={14} className="mp-sidebar-arrow" />
            </button>
          ))}
          <div className="mp-sidebar-divider" />
          <button className="mp-sidebar-item mp-logout-item" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={16} /> Logout
          </button>
        </nav>

        {/* Content Area */}
        <div className="mp-content">
          {/* === PROFILE SECTION === */}
          {activeSection === 'profile' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><User size={20} /> Personal Information</h2>
                <p>Manage your personal details and contact information</p>
              </div>
              <div className="mp-form-grid">
                <div className="mp-field">
                  <label>First Name</label>
                  <input className="mp-input" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} disabled={!isEditing} />
                </div>
                <div className="mp-field">
                  <label>Last Name</label>
                  <input className="mp-input" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} disabled={!isEditing} />
                </div>
                <div className="mp-field">
                  <label>Email Address</label>
                  <div className="mp-input-with-icon">
                    <Mail size={14} />
                    <input className="mp-input" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} disabled={!isEditing} />
                  </div>
                </div>
                <div className="mp-field">
                  <label>Phone Number</label>
                  <div className="mp-input-with-icon">
                    <Phone size={14} />
                    <input className="mp-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} disabled={!isEditing} />
                  </div>
                </div>
                <div className="mp-field mp-field-full">
                  <label>Garage Name</label>
                  <div className="mp-input-with-icon">
                    <Building size={14} />
                    <input className="mp-input" value={profile.garageName} onChange={e => setProfile(p => ({ ...p, garageName: e.target.value }))} disabled={!isEditing} />
                  </div>
                </div>
                <div className="mp-field mp-field-full">
                  <label>Address</label>
                  <div className="mp-input-with-icon">
                    <MapPin size={14} />
                    <input className="mp-input" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} disabled={!isEditing} />
                  </div>
                </div>
                <div className="mp-field">
                  <label>Years of Experience</label>
                  <div className="mp-input-with-icon">
                    <Briefcase size={14} />
                    <input className="mp-input" type="number" value={profile.experience} onChange={e => setProfile(p => ({ ...p, experience: e.target.value }))} disabled={!isEditing} />
                  </div>
                </div>
                <div className="mp-field">
                  <label>Specialization</label>
                  <div className="mp-input-with-icon">
                    <Wrench size={14} />
                    <input className="mp-input" value={profile.specialization} onChange={e => setProfile(p => ({ ...p, specialization: e.target.value }))} disabled={!isEditing} />
                  </div>
                </div>
                <div className="mp-field mp-field-full">
                  <label>Bio</label>
                  <textarea className="mp-textarea" rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} disabled={!isEditing} />
                </div>
              </div>

              {/* Service Area Map */}
              <div className="mp-section-header" style={{ marginTop: '2rem' }}>
                <h2><MapPinned size={20} /> Service Area</h2>
                <p>Define your working radius and preferred service locations</p>
              </div>
              <div className="mp-map-card">
                <div className="mp-map-visual">
                  <div className="mp-map-grid" />
                  <svg className="mp-map-roads" viewBox="0 0 500 300" fill="none">
                    <path d="M 50,150 Q 150,100 250,150 T 450,150" stroke="rgba(37,99,235,0.2)" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 200,30 Q 220,150 200,270" stroke="rgba(37,99,235,0.15)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 100,50 L 400,50" stroke="rgba(37,99,235,0.1)" strokeWidth="2" strokeDasharray="8 4" />
                    <path d="M 100,250 L 400,250" stroke="rgba(37,99,235,0.1)" strokeWidth="2" strokeDasharray="8 4" />
                  </svg>
                  <div className="mp-map-center-marker">
                    <div className="mp-map-pulse" />
                    <div className="mp-map-dot" />
                  </div>
                  <div className="mp-map-radius-circle" style={{ width: `${serviceArea.radius * 4}px`, height: `${serviceArea.radius * 4}px` }} />
                  <div className="mp-map-info-overlay">
                    <MapPin size={14} /> San Francisco, CA
                  </div>
                </div>
                <div className="mp-map-controls">
                  <div className="mp-field">
                    <label>Service Radius: {serviceArea.radius} km</label>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={serviceArea.radius}
                      onChange={e => setServiceArea(a => ({ ...a, radius: Number(e.target.value) }))}
                      className="mp-range"
                    />
                    <div className="mp-range-labels">
                      <span>5 km</span>
                      <span>100 km</span>
                    </div>
                  </div>
                  <div className="mp-field">
                    <label className="mp-toggle-label">
                      Auto Location Updates
                      <button
                        className={`mp-toggle sm ${serviceArea.autoUpdate ? 'on' : 'off'}`}
                        onClick={() => setServiceArea(a => ({ ...a, autoUpdate: !a.autoUpdate }))}
                      >
                        <div className="mp-toggle-thumb" />
                      </button>
                    </label>
                  </div>
                  <div className="mp-map-coverage">
                    <div className="mp-coverage-stat">
                      <span className="mp-coverage-value">{serviceArea.radius}</span>
                      <span className="mp-coverage-label">km radius</span>
                    </div>
                    <div className="mp-coverage-stat">
                      <span className="mp-coverage-value">{Math.floor(Math.PI * serviceArea.radius * serviceArea.radius).toLocaleString()}</span>
                      <span className="mp-coverage-label">km² covered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === SERVICES SECTION === */}
          {activeSection === 'services' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Wrench size={20} /> Services Offered</h2>
                <p>Manage the services you offer and set pricing</p>
              </div>
              <div className="mp-services-list">
                {serviceList.map((service) => (
                  <div key={service.id} className={`mp-service-item ${service.enabled ? '' : 'disabled'}`}>
                    <div className="mp-service-icon">{service.icon}</div>
                    <div className="mp-service-info">
                      <div className="mp-service-name">{service.name}</div>
                      <div className="mp-service-meta">
                        <span><Clock size={12} /> {service.eta}</span>
                        <span><DollarSign size={12} /> ${service.price}</span>
                      </div>
                    </div>
                    <div className="mp-service-actions">
                      <button className="mp-btn mp-btn-sm mp-btn-outline"><Edit3 size={12} /> Edit</button>
                      <button
                        className={`mp-toggle ${service.enabled ? 'on' : 'off'}`}
                        onClick={() => toggleService(service.id)}
                      >
                        <div className="mp-toggle-thumb" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mp-btn mp-btn-primary mp-add-service-btn">
                <Plus size={14} /> Add New Service
              </button>
            </div>
          )}

          {/* === AVAILABILITY SECTION === */}
          {activeSection === 'availability' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Clock size={20} /> Availability Settings</h2>
                <p>Manage your working hours and availability preferences</p>
              </div>
              <div className="mp-availability-options">
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon green"><Zap size={16} /></div>
                    <div>
                      <div className="mp-option-label">Accept Emergency Requests</div>
                      <div className="mp-option-desc">Receive high-priority emergency calls</div>
                    </div>
                  </div>
                  <button
                    className={`mp-toggle ${availability.acceptEmergency ? 'on' : 'off'}`}
                    onClick={() => setAvailability(a => ({ ...a, acceptEmergency: !a.acceptEmergency }))}
                  >
                    <div className="mp-toggle-thumb" />
                  </button>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon blue"><CheckCircle size={16} /></div>
                    <div>
                      <div className="mp-option-label">Auto Accept Requests</div>
                      <div className="mp-option-desc">Automatically accept nearby requests</div>
                    </div>
                  </div>
                  <button
                    className={`mp-toggle ${availability.autoAccept ? 'on' : 'off'}`}
                    onClick={() => setAvailability(a => ({ ...a, autoAccept: !a.autoAccept }))}
                  >
                    <div className="mp-toggle-thumb" />
                  </button>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon amber"><Calendar size={16} /></div>
                    <div>
                      <div className="mp-option-label">Vacation Mode</div>
                      <div className="mp-option-desc">Pause all incoming requests temporarily</div>
                    </div>
                  </div>
                  <button
                    className={`mp-toggle ${availability.vacationMode ? 'on' : 'off'}`}
                    onClick={() => setAvailability(a => ({ ...a, vacationMode: !a.vacationMode }))}
                  >
                    <div className="mp-toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="mp-section-subtitle">Weekly Schedule</div>
              <div className="mp-schedule-list">
                {availability.weeklySchedule.map((day, i) => (
                  <div key={i} className={`mp-schedule-row ${day.enabled ? '' : 'off'}`}>
                    <div className="mp-schedule-day">
                      <button
                        className={`mp-checkbox ${day.enabled ? 'checked' : ''}`}
                        onClick={() => {
                          const newSchedule = [...availability.weeklySchedule];
                          newSchedule[i] = { ...newSchedule[i], enabled: !newSchedule[i].enabled };
                          setAvailability(a => ({ ...a, weeklySchedule: newSchedule }));
                        }}
                      >
                        {day.enabled && <Check size={10} />}
                      </button>
                      <span>{day.day}</span>
                    </div>
                    <div className="mp-schedule-times">
                      {day.enabled ? (
                        <>
                          <span className="mp-schedule-time">{day.start}</span>
                          <span className="mp-schedule-sep">to</span>
                          <span className="mp-schedule-time">{day.end}</span>
                        </>
                      ) : (
                        <span className="mp-schedule-off">Day Off</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === DOCUMENTS SECTION === */}
          {activeSection === 'documents' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><FileText size={20} /> Documents & Verification</h2>
                <p>Upload and manage your verification documents</p>
              </div>
              <div className="mp-docs-grid">
                {documents.map((doc) => (
                  <div key={doc.id} className={`mp-doc-card ${doc.status}`}>
                    <div className="mp-doc-icon">{doc.icon}</div>
                    <div className="mp-doc-info">
                      <div className="mp-doc-name">{doc.name}</div>
                      <div className="mp-doc-dates">
                        Uploaded: {doc.uploadDate} · Expires: {doc.expiryDate}
                      </div>
                    </div>
                    <div className={`mp-doc-status ${doc.status}`}>
                      {doc.status === 'verified' && <CheckCircle size={14} />}
                      {doc.status === 'pending' && <Clock size={14} />}
                      {doc.status === 'expired' && <AlertTriangle size={14} />}
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </div>
                    <div className="mp-doc-actions">
                      <button className="mp-btn mp-btn-sm mp-btn-outline"><Eye size={12} /> View</button>
                      {doc.status === 'expired' && (
                        <button className="mp-btn mp-btn-sm mp-btn-primary"><Upload size={12} /> Re-upload</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="mp-btn mp-btn-primary" style={{ marginTop: '1rem' }}>
                <Upload size={14} /> Upload New Document
              </button>
            </div>
          )}

          {/* === PAYMENT SECTION === */}
          {activeSection === 'payment' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><CreditCard size={20} /> Payment & Bank Details</h2>
                <p>Manage your payout information and payment preferences</p>
              </div>
              <div className="mp-payment-card">
                <div className="mp-payment-header">
                  <div className="mp-payment-bank">
                    <Landmark size={20} />
                    <div>
                      <div className="mp-payment-bank-name">{payment.bankName}</div>
                      <div className="mp-payment-account">{payment.accountNumber}</div>
                    </div>
                  </div>
                  <span className="mp-doc-status verified"><CheckCircle size={14} /> Verified</span>
                </div>
                <div className="mp-form-grid">
                  <div className="mp-field">
                    <label>Bank Name</label>
                    <input className="mp-input" value={payment.bankName} readOnly />
                  </div>
                  <div className="mp-field">
                    <label>Account Holder</label>
                    <input className="mp-input" value={payment.accountHolder} readOnly />
                  </div>
                  <div className="mp-field">
                    <label>Account Number</label>
                    <input className="mp-input" value={payment.accountNumber} readOnly />
                  </div>
                  <div className="mp-field">
                    <label>IFSC Code</label>
                    <input className="mp-input" value={payment.ifscCode} readOnly />
                  </div>
                  <div className="mp-field">
                    <label>UPI ID</label>
                    <input className="mp-input" value={payment.upiId} readOnly />
                  </div>
                  <div className="mp-field">
                    <label>Payout Schedule</label>
                    <input className="mp-input" value={payment.payoutSchedule} readOnly />
                  </div>
                </div>
                <div className="mp-payment-actions">
                  <button className="mp-btn mp-btn-primary"><Edit3 size={14} /> Update Details</button>
                  <button className="mp-btn mp-btn-outline"><RefreshCw size={14} /> Verify Account</button>
                </div>
              </div>

              <div className="mp-payout-summary">
                <div className="mp-payout-box">
                  <div className="mp-payout-box-value green">$1,195</div>
                  <div className="mp-payout-box-label">Last Payout</div>
                </div>
                <div className="mp-payout-box">
                  <div className="mp-payout-box-value">$4,820</div>
                  <div className="mp-payout-box-label">This Month</div>
                </div>
                <div className="mp-payout-box">
                  <div className="mp-payout-box-value">Jul 14, 2026</div>
                  <div className="mp-payout-box-label">Next Payout</div>
                </div>
              </div>
            </div>
          )}

          {/* === REVIEWS SECTION === */}
          {activeSection === 'reviews' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Star size={20} /> Ratings & Reviews</h2>
                <p>See what customers are saying about your service</p>
              </div>
              <div className="mp-reviews-summary">
                <div className="mp-reviews-score">
                  <div className="mp-reviews-big-number">4.9</div>
                  <div className="mp-reviews-stars">
                    {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#F59E0B" color="#F59E0B" />)}
                  </div>
                  <div className="mp-reviews-count">Based on 847 reviews</div>
                </div>
                <div className="mp-reviews-bars">
                  {[5,4,3,2,1].map(star => {
                    const pct = star === 5 ? 78 : star === 4 ? 15 : star === 3 ? 5 : star === 2 ? 1 : 1;
                    return (
                      <div key={star} className="mp-review-bar-row">
                        <span className="mp-review-bar-label">{star}★</span>
                        <div className="mp-review-bar-track">
                          <div className="mp-review-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="mp-review-bar-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mp-reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="mp-review-card">
                    <div className="mp-review-header">
                      <div className="mp-review-avatar" style={{ background: review.color }}>{review.initials}</div>
                      <div className="mp-review-meta">
                        <div className="mp-review-name">{review.customer}</div>
                        <div className="mp-review-service">{review.service} · {review.date}</div>
                      </div>
                      <div className="mp-review-rating">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={13} fill={s <= review.rating ? '#F59E0B' : 'transparent'} color={s <= review.rating ? '#F59E0B' : '#CBD5E1'} />
                        ))}
                      </div>
                    </div>
                    <p className="mp-review-text">{review.text}</p>
                    {review.replied && (
                      <div className="mp-review-reply">
                        <div className="mp-review-reply-avatar">JD</div>
                        <div>
                          <div className="mp-review-reply-name">Your reply</div>
                          <p>{review.replied}</p>
                        </div>
                      </div>
                    )}
                    {!review.replied && (
                      <button className="mp-btn mp-btn-sm mp-btn-ghost"><MessageCircle size={12} /> Reply</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === NOTIFICATIONS SECTION === */}
          {activeSection === 'notifications' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Bell size={20} /> Notification Preferences</h2>
                <p>Control how and when you receive notifications</p>
              </div>
              <div className="mp-notif-grid">
                {[
                  { key: 'newRequests', label: 'New Requests', desc: 'Get notified about incoming service requests', icon: <ClipboardList size={16} />, color: '#2563EB' },
                  { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Notifications for payments and earnings', icon: <DollarSign size={16} />, color: '#22C55E' },
                  { key: 'customerMessages', label: 'Customer Messages', desc: 'Direct messages from customers', icon: <MessageCircle size={16} />, color: '#8B5CF6' },
                  { key: 'promotions', label: 'Promotions', desc: 'Deals, bonuses, and promotional offers', icon: <Gift size={16} />, color: '#F59E0B' },
                  { key: 'systemUpdates', label: 'System Updates', desc: 'App updates and new features', icon: <Info size={16} />, color: '#06B6D4' },
                  { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Critical emergency notifications', icon: <AlertTriangle size={16} />, color: '#EF4444' },
                  { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive notifications via SMS', icon: <Smartphone size={16} />, color: '#6366F1' },
                  { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email', icon: <Mail size={16} />, color: '#EC4899' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'In-app push notifications', icon: <Bell size={16} />, color: '#14B8A6' },
                ].map((item) => (
                  <div key={item.key} className="mp-notif-item">
                    <div className="mp-notif-icon" style={{ background: `${item.color}15`, color: item.color }}>{item.icon}</div>
                    <div className="mp-notif-info">
                      <div className="mp-notif-label">{item.label}</div>
                      <div className="mp-notif-desc">{item.desc}</div>
                    </div>
                    <button
                      className={`mp-toggle ${(notifPrefs as any)[item.key] ? 'on' : 'off'}`}
                      onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !(p as any)[item.key] }))}
                    >
                      <div className="mp-toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === SECURITY SECTION === */}
          {activeSection === 'security' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Shield size={20} /> Security Settings</h2>
                <p>Protect your account with advanced security features</p>
              </div>

              {/* Security Score */}
              <div className="mp-security-score">
                <div className="mp-security-ring">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#22C55E" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - security.securityScore / 100)}`}
                      strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <div className="mp-security-score-text">
                    <span className="mp-security-score-value">{security.securityScore}</span>
                    <span className="mp-security-score-label">Security Score</span>
                  </div>
                </div>
                <div className="mp-security-tips">
                  <div className="mp-security-tip"><CheckCircle size={14} color="#22C55E" /> Password is strong</div>
                  <div className="mp-security-tip"><CheckCircle size={14} color="#22C55E" /> Two-factor enabled</div>
                  <div className="mp-security-tip"><AlertTriangle size={14} color="#F59E0B" /> Add biometric login for extra security</div>
                </div>
              </div>

              <div className="mp-security-options">
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon green"><Lock size={16} /></div>
                    <div>
                      <div className="mp-option-label">Change Password</div>
                      <div className="mp-option-desc">Last changed 45 days ago</div>
                    </div>
                  </div>
                  <button className="mp-btn mp-btn-sm mp-btn-outline"><Edit3 size={12} /> Change</button>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon blue"><Smartphone size={16} /></div>
                    <div>
                      <div className="mp-option-label">Two-Factor Authentication</div>
                      <div className="mp-option-desc">Add an extra layer of security</div>
                    </div>
                  </div>
                  <button
                    className={`mp-toggle ${security.twoFactor ? 'on' : 'off'}`}
                    onClick={() => setSecurity(s => ({ ...s, twoFactor: !s.twoFactor }))}
                  >
                    <div className="mp-toggle-thumb" />
                  </button>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon purple"><Fingerprint size={16} /></div>
                    <div>
                      <div className="mp-option-label">Biometric Login</div>
                      <div className="mp-option-desc">Use fingerprint or face recognition</div>
                    </div>
                  </div>
                  <button
                    className={`mp-toggle ${security.biometric ? 'on' : 'off'}`}
                    onClick={() => setSecurity(s => ({ ...s, biometric: !s.biometric }))}
                  >
                    <div className="mp-toggle-thumb" />
                  </button>
                </div>
              </div>

              <div className="mp-section-subtitle">Login Activity</div>
              <div className="mp-login-list">
                {loginActivity.map((activity) => (
                  <div key={activity.id} className={`mp-login-item ${activity.current ? 'current' : ''}`}>
                    <div className="mp-login-device">
                      <Smartphone size={16} />
                      <div>
                        <div className="mp-login-device-name">{activity.device}</div>
                        <div className="mp-login-meta">{activity.location} · {activity.ip}</div>
                      </div>
                    </div>
                    <div className="mp-login-right">
                      <span className="mp-login-time">{activity.time}</span>
                      {activity.current && <span className="mp-current-badge">Current</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mp-section-subtitle">Trusted Devices</div>
              <div className="mp-trusted-devices">
                <div className="mp-device-item">
                  <Smartphone size={16} />
                  <div className="mp-device-info">
                    <div className="mp-device-name">iPhone 15 Pro</div>
                    <div className="mp-device-meta">iOS 18.1 · Last used: Now</div>
                  </div>
                  <button className="mp-btn mp-btn-sm mp-btn-danger"><Trash2 size={12} /> Remove</button>
                </div>
                <div className="mp-device-item">
                  <Smartphone size={16} />
                  <div className="mp-device-info">
                    <div className="mp-device-name">MacBook Pro</div>
                    <div className="mp-device-meta">macOS 15.0 · Last used: 2 hours ago</div>
                  </div>
                  <button className="mp-btn mp-btn-sm mp-btn-danger"><Trash2 size={12} /> Remove</button>
                </div>
              </div>
            </div>
          )}

          {/* === PREFERENCES SECTION === */}
          {activeSection === 'preferences' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Settings size={20} /> App Preferences</h2>
                <p>Customize your app experience</p>
              </div>
              <div className="mp-pref-options">
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon">{appPrefs.theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}</div>
                    <div>
                      <div className="mp-option-label">Theme</div>
                      <div className="mp-option-desc">Switch between light and dark mode</div>
                    </div>
                  </div>
                  <div className="mp-theme-switcher">
                    <button
                      className={`mp-theme-btn ${appPrefs.theme === 'light' ? 'active' : ''}`}
                      onClick={() => setAppPrefs(p => ({ ...p, theme: 'light' }))}
                    >
                      <Sun size={14} /> Light
                    </button>
                    <button
                      className={`mp-theme-btn ${appPrefs.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setAppPrefs(p => ({ ...p, theme: 'dark' }))}
                    >
                      <Moon size={14} /> Dark
                    </button>
                  </div>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon blue"><Globe size={16} /></div>
                    <div>
                      <div className="mp-option-label">Language</div>
                      <div className="mp-option-desc">Select your preferred language</div>
                    </div>
                  </div>
                  <select className="mp-select" value={appPrefs.language} onChange={e => setAppPrefs(p => ({ ...p, language: e.target.value }))}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Hindi</option>
                  </select>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon amber"><Navigation size={16} /></div>
                    <div>
                      <div className="mp-option-label">Distance Unit</div>
                      <div className="mp-option-desc">Choose between kilometers and miles</div>
                    </div>
                  </div>
                  <div className="mp-theme-switcher">
                    <button
                      className={`mp-theme-btn ${appPrefs.distanceUnit === 'KM' ? 'active' : ''}`}
                      onClick={() => setAppPrefs(p => ({ ...p, distanceUnit: 'KM' }))}
                    >
                      KM
                    </button>
                    <button
                      className={`mp-theme-btn ${appPrefs.distanceUnit === 'MI' ? 'active' : ''}`}
                      onClick={() => setAppPrefs(p => ({ ...p, distanceUnit: 'MI' }))}
                    >
                      Miles
                    </button>
                  </div>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon green"><Clock size={16} /></div>
                    <div>
                      <div className="mp-option-label">Time Zone</div>
                      <div className="mp-option-desc">Set your local time zone</div>
                    </div>
                  </div>
                  <select className="mp-select" value={appPrefs.timeZone} onChange={e => setAppPrefs(p => ({ ...p, timeZone: e.target.value }))}>
                    <option>Pacific Time (PT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Central Time (CT)</option>
                    <option>Eastern Time (ET)</option>
                  </select>
                </div>
                <div className="mp-option-row">
                  <div className="mp-option-info">
                    <div className="mp-option-icon">{appPrefs.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</div>
                    <div>
                      <div className="mp-option-label">Notification Sounds</div>
                      <div className="mp-option-desc">Play sounds for notifications</div>
                    </div>
                  </div>
                  <button
                    className={`mp-toggle ${appPrefs.soundEnabled ? 'on' : 'off'}`}
                    onClick={() => setAppPrefs(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
                  >
                    <div className="mp-toggle-thumb" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === ACHIEVEMENTS SECTION === */}
          {activeSection === 'achievements' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><Award size={20} /> Achievements & Badges</h2>
                <p>Track your milestones and earned badges</p>
              </div>
              <div className="mp-achievements-grid">
                {achievements.map((ach) => (
                  <div key={ach.id} className={`mp-achieve-card ${ach.earned ? 'earned' : ''}`}>
                    <div className="mp-achieve-icon" style={{ background: `${ach.color}15`, color: ach.color }}>
                      {ach.icon}
                    </div>
                    <div className="mp-achieve-name">{ach.name}</div>
                    <div className="mp-achieve-desc">{ach.description}</div>
                    <div className="mp-achieve-progress-wrap">
                      <div className="mp-achieve-progress-bar">
                        <div className="mp-achieve-progress-fill" style={{ width: `${(ach.progress / ach.total) * 100}%`, background: ach.color }} />
                      </div>
                      <span className="mp-achieve-progress-text">{ach.progress}/{ach.total}</span>
                    </div>
                    {ach.earned && (
                      <div className="mp-achieve-earned">
                        <BadgeCheck size={14} color={ach.color} /> Earned
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === SUPPORT SECTION === */}
          {activeSection === 'support' && (
            <div className="mp-section" style={{ animationDelay: '0.1s' }}>
              <div className="mp-section-header">
                <h2><HelpCircle size={20} /> Help & Support</h2>
                <p>Get help with your account and platform usage</p>
              </div>
              <div className="mp-support-grid">
                <div className="mp-support-card">
                  <div className="mp-support-icon blue"><MessageCircle size={22} /></div>
                  <h3>Live Chat</h3>
                  <p>Chat with our support team in real-time</p>
                  <button className="mp-btn mp-btn-primary mp-btn-sm"><Send size={12} /> Start Chat</button>
                </div>
                <div className="mp-support-card">
                  <div className="mp-support-icon purple"><Zap size={22} /></div>
                  <h3>AI Assistant</h3>
                  <p>Get instant answers from our AI-powered assistant</p>
                  <button className="mp-btn mp-btn-outline mp-btn-sm"><Zap size={12} /> Ask AI</button>
                </div>
                <div className="mp-support-card">
                  <div className="mp-support-icon green"><BookOpen size={22} /></div>
                  <h3>FAQ</h3>
                  <p>Browse frequently asked questions and guides</p>
                  <button className="mp-btn mp-btn-outline mp-btn-sm"><ExternalLink size={12} /> Browse</button>
                </div>
                <div className="mp-support-card">
                  <div className="mp-support-icon amber"><Headphones size={22} /></div>
                  <h3>Contact Support</h3>
                  <p>Reach our support team via phone or email</p>
                  <button className="mp-btn mp-btn-outline mp-btn-sm"><Phone size={12} /> Call Us</button>
                </div>
                <div className="mp-support-card">
                  <div className="mp-support-icon red"><AlertCircle size={22} /></div>
                  <h3>Report an Issue</h3>
                  <p>Report bugs or technical issues</p>
                  <button className="mp-btn mp-btn-outline mp-btn-sm"><FileText size={12} /> Report</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== LOGOUT MODAL ===== */}
      {showLogoutModal && (
        <div className="mp-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal-icon red"><LogOut size={28} /></div>
            <h3>Ready to leave?</h3>
            <p>You'll need to log in again to access your dashboard and manage requests.</p>
            <div className="mp-modal-actions">
              <button className="mp-btn mp-btn-ghost" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="mp-btn mp-btn-primary" onClick={onLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SAVE TOAST ===== */}
      {showSaveToast && (
        <div className="mp-toast">
          <CheckCircle size={16} /> Profile saved successfully!
        </div>
      )}

      {/* Mobile Sticky Save */}
      {isEditing && (
        <div className="mp-mobile-save">
          <button className="mp-btn mp-btn-primary mp-btn-full" onClick={() => { setIsEditing(false); handleSave(); }}>
            <Check size={14} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
}


