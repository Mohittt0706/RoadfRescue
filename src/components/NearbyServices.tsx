import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
  Bookmark,
  Share2,
  Filter,
  ChevronDown,
  X,
  Fuel,
  Wrench,
  AlertTriangle,
  Heart,
  Sparkles,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  BadgeCheck,
  Truck,
  Battery,
  Lock,
  BatteryCharging,
  Timer,
  DollarSign,
  Bell,
  MapPinned,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  ShieldCheck,
  BookmarkCheck,
  Repeat,
  History,
  Gauge,
  Circle,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

/* ─── Types ─── */
interface ServiceProvider {
  id: number;
  name: string;
  logo: string;
  photo: string;
  verified: boolean;
  distance: string;
  distanceNum: number;
  eta: number;
  rating: number;
  reviews: number;
  experience: number;
  price: number;
  priceLabel: string;
  availability: 'online' | 'busy' | 'offline';
  services: string[];
  category: string;
  address: string;
  phone: string;
  description: string;
  certifications: string[];
  workingHours: string;
  paymentMethods: string[];
  specialOffers?: string;
  aiScore?: number;
  aiReason?: string;
  x: number;
  y: number;
}

interface Review {
  id: number;
  customerName: string;
  customerPhoto: string;
  rating: number;
  vehicle: string;
  service: string;
  date: string;
  text: string;
  verified: boolean;
}

interface Notification {
  id: number;
  type: 'available' | 'eta' | 'discount' | 'traffic' | 'emergency';
  message: string;
  time: string;
}

/* ─── Mock Data ─── */
const serviceProviders: ServiceProvider[] = [
  {
    id: 1, name: 'Apex Auto Recovery', logo: '🔧', photo: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=250&fit=crop',
    verified: true, distance: '0.8 mi', distanceNum: 0.8, eta: 6, rating: 4.9, reviews: 142,
    experience: 12, price: 49, priceLabel: 'from $49', availability: 'online',
    services: ['Tire Repair', 'Battery Jump Start', 'Engine Repair', 'Lockout Assistance'],
    category: 'mechanic', address: '142 Oak Street, Downtown', phone: '+1 (555) 234-5678',
    description: 'Award-winning mobile mechanic team with 12+ years of experience. Specializing in emergency roadside repairs and diagnostics.',
    certifications: ['ASE Certified', 'AAA Approved', 'EPA Certified'], workingHours: '24/7 Emergency Service',
    paymentMethods: ['Credit Card', 'Debit', 'Apple Pay', 'Cash'], specialOffers: '10% off first booking',
    aiScore: 96, aiReason: 'Closest verified provider with highest rating and fastest ETA',
    x: 180, y: 130
  },
  {
    id: 2, name: 'QuickFix Mobile Repair', logo: '⚡', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop',
    verified: true, distance: '1.2 mi', distanceNum: 1.2, eta: 9, rating: 4.8, reviews: 98,
    experience: 8, price: 59, priceLabel: 'from $59', availability: 'online',
    services: ['Battery Jump Start', 'Fuel Delivery', 'Tire Repair', 'EV Charging'],
    category: 'battery', address: '78 Maple Avenue, Midtown', phone: '+1 (555) 345-6789',
    description: 'Fast response mobile battery and fuel service. We come to you anywhere in the city within minutes.',
    certifications: ['ASE Certified', 'Insured & Bonded'], workingHours: '6 AM - 11 PM Daily',
    paymentMethods: ['Credit Card', 'Debit', 'Venmo', 'Cash'],
    aiScore: 91, aiReason: 'Excellent reviews with EV charging support and fast response',
    x: 320, y: 180
  },
  {
    id: 3, name: 'Metro Heavy Towing', logo: '🚛', photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=250&fit=crop',
    verified: true, distance: '1.8 mi', distanceNum: 1.8, eta: 14, rating: 4.7, reviews: 203,
    experience: 15, price: 99, priceLabel: 'from $99', availability: 'online',
    services: ['Towing', 'Engine Repair', 'Accident Recovery', 'Flatbed Service'],
    category: 'towing', address: '310 Industrial Blvd, Southside', phone: '+1 (555) 456-7890',
    description: 'Heavy-duty towing and recovery specialists. Licensed, insured, and available 24/7 for all vehicle types.',
    certifications: ['USDOT Certified', 'TCA Member', 'BBB A+ Rated'], workingHours: '24/7',
    paymentMethods: ['Credit Card', 'Debit', 'Insurance Direct Bill', 'Cash'],
    aiScore: 85, aiReason: 'Best for heavy towing and large vehicle recovery',
    x: 120, y: 250
  },
  {
    id: 4, name: 'GreenFuel Express', logo: '⛽', photo: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=400&h=250&fit=crop',
    verified: true, distance: '2.1 mi', distanceNum: 2.1, eta: 18, rating: 4.6, reviews: 76,
    experience: 5, price: 39, priceLabel: 'from $39', availability: 'online',
    services: ['Fuel Delivery', 'Diesel Delivery', 'Fuel System Cleaning'],
    category: 'fuel', address: '55 Greenway Drive, Westside', phone: '+1 (555) 567-8901',
    description: 'Eco-friendly fuel delivery service. We bring gas, diesel, and specialty fuels directly to your location.',
    certifications: ['EPA Compliant', 'Hazmat Certified'], workingHours: '5 AM - 12 AM Daily',
    paymentMethods: ['Credit Card', 'Debit', 'Apple Pay', 'Google Pay'],
    specialOffers: 'Free delivery on orders over 10 gallons',
    aiScore: 88, aiReason: 'Most affordable fuel delivery with eco-friendly approach',
    x: 400, y: 100
  },
  {
    id: 5, name: 'Volt EV Solutions', logo: '🔋', photo: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=250&fit=crop',
    verified: true, distance: '2.5 mi', distanceNum: 2.5, eta: 22, rating: 4.9, reviews: 64,
    experience: 3, price: 79, priceLabel: 'from $79', availability: 'online',
    services: ['EV Charging', 'Battery Diagnostic', 'Hybrid Repair', 'Tire Repair'],
    category: 'ev', address: '200 Electric Avenue, Tech District', phone: '+1 (555) 678-9012',
    description: 'Specialized EV and hybrid vehicle service. Mobile Level 2 and Level 3 charging available.',
    certifications: ['Tesla Certified', 'EV Aware Certified'], workingHours: '7 AM - 10 PM Daily',
    paymentMethods: ['Credit Card', 'Debit', 'Tesla Wallet', 'Apple Pay'],
    aiScore: 93, aiReason: 'Top-rated EV specialist with fastest charging equipment',
    x: 280, y: 300
  },
  {
    id: 6, name: 'SafeGuard Tire Center', logo: '🛞', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop',
    verified: false, distance: '3.0 mi', distanceNum: 3.0, eta: 25, rating: 4.4, reviews: 51,
    experience: 7, price: 45, priceLabel: 'from $45', availability: 'busy',
    services: ['Tire Repair', 'Tire Replacement', 'Wheel Alignment', 'Flatbed Towing'],
    category: 'tire', address: '88 Tire Row, Eastside', phone: '+1 (555) 789-0123',
    description: 'Complete tire solutions from patch jobs to full replacements. We stock all major brands.',
    certifications: ['TIA Certified'], workingHours: '8 AM - 8 PM Mon-Sat',
    paymentMethods: ['Credit Card', 'Debit', 'Cash'],
    x: 450, y: 220
  },
  {
    id: 7, name: 'LockPro Emergency', logo: '🔐', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=250&fit=crop',
    verified: true, distance: '1.5 mi', distanceNum: 1.5, eta: 10, rating: 4.7, reviews: 89,
    experience: 10, price: 55, priceLabel: 'from $55', availability: 'online',
    services: ['Lockout Assistance', 'Key Replacement', 'Ignition Repair', 'Transponder Programming'],
    category: 'lockout', address: '45 Security Lane, Central', phone: '+1 (555) 890-1234',
    description: 'Fast, damage-free vehicle lockout service. We handle all car makes and models including smart keys.',
    certifications: ['ALOA Certified', 'Insured'], workingHours: '24/7 Emergency',
    paymentMethods: ['Credit Card', 'Debit', 'Cash', 'Venmo'],
    aiScore: 90, aiReason: 'Fastest lockout response with 100% damage-free record',
    x: 200, y: 80
  },
  {
    id: 8, name: 'Precision Engine Works', logo: '⚙️', photo: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=250&fit=crop',
    verified: true, distance: '3.8 mi', distanceNum: 3.8, eta: 30, rating: 4.8, reviews: 167,
    experience: 20, price: 89, priceLabel: 'from $89', availability: 'online',
    services: ['Engine Repair', 'Transmission', 'Diagnostics', 'Electrical Repair'],
    category: 'mechanic', address: '500 Mechanic Way, Northside', phone: '+1 (555) 901-2345',
    description: 'Master technicians with 20+ years experience. Specializing in complex engine diagnostics and repair.',
    certifications: ['ASE Master Tech', 'Manufacturer Certified'], workingHours: '7 AM - 7 PM Mon-Sat',
    paymentMethods: ['Credit Card', 'Debit', 'Financing Available', 'Cash'],
    x: 80, y: 320
  }
];

const reviews: Review[] = [
  { id: 1, customerName: 'Sarah M.', customerPhoto: '👩', rating: 5, vehicle: 'Toyota Camry 2023', service: 'Tire Repair', date: '2 hours ago', text: 'Incredibly fast response! The mechanic arrived in under 8 minutes and had my flat tire patched perfectly. Very professional and friendly.', verified: true },
  { id: 2, customerName: 'James K.', customerPhoto: '👨', rating: 5, vehicle: 'Honda CR-V 2022', service: 'Battery Jump Start', date: '5 hours ago', text: 'My car died in a parking lot at night. RoadRescue connected me with a nearby mechanic who arrived with a smile and got me going in minutes. Lifesaver!', verified: true },
  { id: 3, customerName: 'Maria L.', customerPhoto: '👩‍🦱', rating: 4, vehicle: 'Ford F-150 2024', service: 'Fuel Delivery', date: '1 day ago', text: 'Ran out of gas on the highway. Fuel was delivered quickly and the pricing was fair. The app tracking made it easy to know when help was arriving.', verified: true },
  { id: 4, customerName: 'David R.', customerPhoto: '👨‍🦳', rating: 5, vehicle: 'Tesla Model 3', service: 'EV Charging', date: '2 days ago', text: 'As an EV owner, finding mobile charging used to be impossible. This service is a game-changer. Professional, equipped, and knowledgeable about EVs.', verified: true },
  { id: 5, customerName: 'Priya S.', customerPhoto: '👩‍🔬', rating: 5, vehicle: 'BMW X5 2023', service: 'Lockout Assistance', date: '3 days ago', text: 'Locked my keys in the car during a grocery run. The lockout specialist was there in 10 minutes, no damage at all. Amazing service!', verified: false },
  { id: 6, customerName: 'Tom W.', customerPhoto: '🧑', rating: 4, vehicle: 'Jeep Wrangler 2022', service: 'Towing', date: '4 days ago', text: 'Needed a tow after an accident. The tow truck arrived quickly and handled everything professionally. Insurance billing was seamless.', verified: true }
];

const notifications: Notification[] = [
  { id: 1, type: 'available', message: 'Apex Auto Recovery just became available nearby', time: 'Just now' },
  { id: 2, type: 'eta', message: 'ETA reduced to 4 min for QuickFix Mobile Repair', time: '2 min ago' },
  { id: 3, type: 'discount', message: '15% off tire repair at SafeGuard Tire Center today', time: '10 min ago' },
  { id: 4, type: 'traffic', message: 'Heavy traffic on Route 101 - alternate routes recommended', time: '15 min ago' },
  { id: 5, type: 'emergency', message: 'Emergency vehicle service available within 0.5 mi', time: '20 min ago' }
];

const filterCategories = [
  { id: 'all', label: 'All Services', icon: <Layers size={14} /> },
  { id: 'mechanic', label: 'Mechanics', icon: <Wrench size={14} /> },
  { id: 'towing', label: 'Towing', icon: <Truck size={14} /> },
  { id: 'fuel', label: 'Fuel Delivery', icon: <Fuel size={14} /> },
  { id: 'battery', label: 'Battery', icon: <Battery size={14} /> },
  { id: 'tire', label: 'Tire Repair', icon: <Circle size={14} /> },
  { id: 'ev', label: 'EV Charging', icon: <BatteryCharging size={14} /> },
  { id: 'lockout', label: 'Lockout', icon: <Lock size={14} /> }
];

const priceComparisonData = [
  { service: 'Tire Repair', apex: 49, quickfix: 59, safeguard: 45, bestValue: 'safeguard' },
  { service: 'Battery Jump', apex: 59, quickfix: 55, safeguard: null, bestValue: 'quickfix' },
  { service: 'Fuel Delivery', apex: null, quickfix: 49, safeguard: null, bestValue: null, greenfuel: 39 },
  { service: 'Towing', apex: null, quickfix: null, metro: 99, bestValue: 'metro' },
  { service: 'EV Charging', apex: null, quickfix: 79, volt: 79, bestValue: 'volt' },
  { service: 'Lockout', apex: 55, lockpro: 55, safeguard: null, bestValue: 'lockpro' }
];

/* ─── Component ─── */
export default function NearbyServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'eta' | 'price' | 'popular'>('nearest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [favorites, setFavorites] = useState<number[]>([1, 5]);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [activeNotification, setActiveNotification] = useState(0);
  const [hoveredProvider, setHoveredProvider] = useState<number | null>(null);
  const [showAIRecommendation, setShowAIRecommendation] = useState(true);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [selectedReviewIdx, setSelectedReviewIdx] = useState(0);
  const [showMobileBottomSheet, setShowMobileBottomSheet] = useState<'map' | 'list'>('map');
  const [mapTrafficLayer, setMapTrafficLayer] = useState(false);
  const [mapMarkerCluster, setMapMarkerCluster] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  /* Animated service count on mount */
  useEffect(() => {
    const target = serviceProviders.length;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      setAnimatedCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  /* Auto-rotate notifications */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNotification(prev => (prev + 1) % notifications.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /* Auto-rotate reviews */
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedReviewIdx(prev => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const filteredProviders = serviceProviders
    .filter(p => {
      if (activeFilter !== 'all' && p.category !== activeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.services.some(s => s.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nearest': return a.distanceNum - b.distanceNum;
        case 'rating': return b.rating - a.rating;
        case 'eta': return a.eta - b.eta;
        case 'price': return a.price - b.price;
        case 'popular': return b.reviews - a.reviews;
        default: return 0;
      }
    });

  const aiRecommended = serviceProviders.find(p => p.id === 1)!;

  return (
    <div className="ns-page">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="ns-navbar">
        <div className="ns-navbar-inner">
          <div className="ns-navbar-left">
            <div className="ns-logo">
              <span className="ns-logo-icon">🚨</span>
              <span className="ns-logo-text"><span style={{ color: 'var(--primary)' }}>Road</span>Rescue AI</span>
            </div>
          </div>
          <div className="ns-navbar-center">
            <div className="ns-search-bar">
              <Search size={18} className="ns-search-icon" />
              <input
                type="text"
                placeholder="Search mechanics, services, workshops..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ns-search-input"
              />
              {searchQuery && (
                <button className="ns-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="ns-navbar-right">
            <div className="ns-location-pill">
              <MapPin size={14} />
              <span>San Francisco, CA</span>
              <ChevronDown size={14} />
            </div>
            <button className="ns-nav-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              <span className="ns-nav-badge">3</span>
            </button>
            <div className="ns-avatar">
              <span>D</span>
            </div>
            <button className="ns-sos-btn">
              <AlertTriangle size={16} />
              <span>SOS</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Notification Dropdown ─── */}
      {showNotifications && (
        <div className="ns-notifications-dropdown">
          <div className="ns-notif-header">
            <h4>Live Updates</h4>
            <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
          </div>
          {notifications.map(n => (
            <div key={n.id} className={`ns-notif-item ns-notif-${n.type}`}>
              <div className="ns-notif-dot" />
              <div className="ns-notif-content">
                <p>{n.message}</p>
                <span>{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Hero Section ─── */}
      <section className="ns-hero">
        <div className="ns-hero-bg" />
        <div className="ns-hero-content">
          <div className="ns-hero-text">
            <div className="ns-hero-badge">
              <Sparkles size={14} />
              <span>AI-Powered Discovery</span>
            </div>
            <h1>Find Trusted Roadside Assistance Near You</h1>
            <p>Discover verified mechanics, tow trucks, fuel delivery, battery jump-start services, and emergency assistance near your location in real time.</p>
            <div className="ns-hero-stats">
              <div className="ns-hero-stat">
                <MapPin size={16} />
                <div>
                  <span className="ns-hero-stat-value">{animatedCount}</span>
                  <span className="ns-hero-stat-label">Providers Nearby</span>
                </div>
              </div>
              <div className="ns-hero-stat">
                <Timer size={16} />
                <div>
                  <span className="ns-hero-stat-value">~8 min</span>
                  <span className="ns-hero-stat-label">Avg Response</span>
                </div>
              </div>
              <div className="ns-hero-stat">
                <CheckCircle2 size={16} />
                <div>
                  <span className="ns-hero-stat-value">Live</span>
                  <span className="ns-hero-stat-label">Availability</span>
                </div>
              </div>
            </div>
          </div>
          <div className="ns-hero-visual">
            <div className="ns-hero-map-preview">
              <svg viewBox="0 0 400 260" className="ns-hero-map-svg">
                <defs>
                  <pattern id="heroGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-light)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="260" fill="var(--light-surface)" rx="12" />
                <rect width="400" height="260" fill="url(#heroGrid)" />
                {/* Roads */}
                <line x1="0" y1="130" x2="400" y2="130" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="8,4" />
                <line x1="200" y1="0" x2="200" y2="260" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="8,4" />
                <line x1="50" y1="50" x2="350" y2="210" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="6,4" />
                {/* Markers */}
                <circle cx="180" cy="120" r="8" fill="var(--primary)" opacity="0.2" />
                <circle cx="180" cy="120" r="4" fill="var(--primary)">
                  <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="80" r="6" fill="var(--secondary)" opacity="0.3" />
                <circle cx="300" cy="80" r="3" fill="var(--secondary)" />
                <circle cx="120" cy="200" r="6" fill="#F59E0B" opacity="0.3" />
                <circle cx="120" cy="200" r="3" fill="#F59E0B" />
                <circle cx="340" cy="180" r="6" fill="var(--accent)" opacity="0.3" />
                <circle cx="340" cy="180" r="3" fill="var(--accent)" />
                <circle cx="220" cy="220" r="6" fill="#8B5CF6" opacity="0.3" />
                <circle cx="220" cy="220" r="3" fill="#8B5CF6" />
                {/* Your location pulse */}
                <circle cx="200" cy="130" r="20" fill="var(--primary)" opacity="0.08">
                  <animate attributeName="r" values="20;30;20" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.08;0.02;0.08" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="130" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Real-Time Notification Ticker ─── */}
      <div className="ns-ticker">
        <div className="ns-ticker-icon">
          <Bell size={14} />
        </div>
        <div className="ns-ticker-content">
          <span className="ns-ticker-text" key={activeNotification}>
            {notifications[activeNotification].message}
          </span>
        </div>
        <span className="ns-ticker-time">{notifications[activeNotification].time}</span>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="ns-main-layout">
        {/* ─── Left: Map Panel ─── */}
        <div className={`ns-map-panel ${mapFullscreen ? 'ns-map-fullscreen' : ''}`} ref={mapRef}>
          <div className="ns-map-toolbar">
            <div className="ns-map-toolbar-left">
              <button className="ns-map-tool-btn" onClick={() => setMapZoom(z => Math.min(z + 0.2, 2))} title="Zoom In">
                <ZoomIn size={16} />
              </button>
              <button className="ns-map-tool-btn" onClick={() => setMapZoom(z => Math.max(z - 0.2, 0.6))} title="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <button className="ns-map-tool-btn" title="My Location">
                <Crosshair size={16} />
              </button>
              <button className={`ns-map-tool-btn ${mapTrafficLayer ? 'active' : ''}`} onClick={() => setMapTrafficLayer(!mapTrafficLayer)} title="Traffic Layer">
                <Layers size={16} />
              </button>
              <button className={`ns-map-tool-btn ${mapMarkerCluster ? 'active' : ''}`} onClick={() => setMapMarkerCluster(!mapMarkerCluster)} title="Marker Clustering">
                <MapPinned size={16} />
              </button>
            </div>
            <button className="ns-map-tool-btn" onClick={() => setMapFullscreen(!mapFullscreen)} title="Toggle Fullscreen">
              {mapFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          <div className="ns-map-container" style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center' }}>
            <svg viewBox="0 0 600 450" className="ns-map-svg">
              <defs>
                <pattern id="mapGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="var(--border-light)" strokeWidth="0.3" />
                </pattern>
                <radialGradient id="userPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Background */}
              <rect width="600" height="450" fill="var(--light-surface)" rx="0" />
              <rect width="600" height="450" fill="url(#mapGrid)" />

              {/* Roads */}
              <line x1="0" y1="200" x2="600" y2="200" stroke="var(--text-muted)" strokeWidth="3" opacity="0.3" />
              <line x1="0" y1="220" x2="600" y2="220" stroke="var(--text-muted)" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />
              <line x1="300" y1="0" x2="300" y2="450" stroke="var(--text-muted)" strokeWidth="3" opacity="0.3" />
              <line x1="320" y1="0" x2="320" y2="450" stroke="var(--text-muted)" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />
              <line x1="80" y1="50" x2="520" y2="400" stroke="var(--text-muted)" strokeWidth="2" opacity="0.2" />
              <line x1="100" y1="380" x2="500" y2="70" stroke="var(--text-muted)" strokeWidth="2" opacity="0.15" />

              {/* Traffic Layer */}
              {mapTrafficLayer && (
                <>
                  <line x1="0" y1="200" x2="600" y2="200" stroke="#EF4444" strokeWidth="5" opacity="0.15" strokeDasharray="12,8">
                    <animate attributeName="strokeDashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
                  </line>
                  <line x1="300" y1="0" x2="300" y2="450" stroke="#F59E0B" strokeWidth="5" opacity="0.12" strokeDasharray="12,8">
                    <animate attributeName="strokeDashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite" />
                  </line>
                </>
              )}

              {/* Route Preview (dashed line from user to selected provider) */}
              {selectedProvider && (
                <line
                  x1="290" y1="210"
                  x2={selectedProvider.x} y2={selectedProvider.y}
                  stroke="var(--primary)" strokeWidth="2.5" strokeDasharray="8,6" opacity="0.6"
                >
                  <animate attributeName="strokeDashoffset" values="0;-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}

              {/* Service Markers */}
              {filteredProviders.map(provider => {
                const colors: Record<string, string> = {
                  mechanic: '#2563EB', towing: '#EF4444', fuel: '#F59E0B',
                  battery: '#22C55E', tire: '#8B5CF6', ev: '#06B6D4', lockout: '#EC4899'
                };
                const color = colors[provider.category] || '#2563EB';
                const isHovered = hoveredProvider === provider.id;
                const isSelected = selectedProvider?.id === provider.id;
                return (
                  <g key={provider.id}
                    onMouseEnter={() => setHoveredProvider(provider.id)}
                    onMouseLeave={() => setHoveredProvider(null)}
                    onClick={() => setSelectedProvider(provider)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulse ring */}
                    <circle cx={provider.x} cy={provider.y} r={isHovered || isSelected ? 18 : 12} fill={color} opacity={isHovered || isSelected ? 0.12 : 0.06}>
                      <animate attributeName="r" values={`${isHovered || isSelected ? 18 : 12};${isHovered || isSelected ? 24 : 18};${isHovered || isSelected ? 18 : 12}`} dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    {/* Marker pin */}
                    <circle cx={provider.x} cy={provider.y} r={isHovered || isSelected ? 8 : 6} fill={color} stroke="white" strokeWidth="2" filter="url(#glow)">
                      <animate attributeName="cy" values={`${provider.y};${provider.y - 2};${provider.y}`} dur="3s" repeatCount="indefinite" />
                    </circle>
                    {/* Label */}
                    {(isHovered || isSelected) && (
                      <g>
                        <rect x={provider.x - 50} y={provider.y - 32} width="100" height="20" rx="10" fill="var(--light-bg)" stroke={color} strokeWidth="1" />
                        <text x={provider.x} y={provider.y - 18} textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">
                          {provider.name.length > 16 ? provider.name.slice(0, 16) + '...' : provider.name}
                        </text>
                      </g>
                    )}
                    {/* Availability dot */}
                    <circle cx={provider.x + 6} cy={provider.y - 6} r="3"
                      fill={provider.availability === 'online' ? '#22C55E' : provider.availability === 'busy' ? '#F59E0B' : '#94A3B8'}
                      stroke="white" strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* User Location */}
              <circle cx="290" cy="210" r="35" fill="url(#userPulse)">
                <animate attributeName="r" values="35;50;35" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="290" cy="210" r="8" fill="var(--primary)" stroke="white" strokeWidth="3" filter="url(#glow)" />
              <text x="290" y="240" textAnchor="middle" fill="var(--primary)" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                You are here
              </text>
            </svg>
          </div>

          {/* Mobile toggle */}
          <div className="ns-mobile-view-toggle">
            <button
              className={`ns-view-toggle-btn ${showMobileBottomSheet === 'map' ? 'active' : ''}`}
              onClick={() => setShowMobileBottomSheet('map')}
            >
              <MapPin size={14} /> Map
            </button>
            <button
              className={`ns-view-toggle-btn ${showMobileBottomSheet === 'list' ? 'active' : ''}`}
              onClick={() => setShowMobileBottomSheet('list')}
            >
              <Eye size={14} /> List
            </button>
          </div>
        </div>

        {/* ─── Right: Services List ─── */}
        <div className={`ns-services-panel ${showMobileBottomSheet === 'map' ? 'ns-services-mobile-hidden' : ''}`}>
          {/* Filter Bar */}
          <div className="ns-filter-section">
            <div className="ns-filter-chips">
              {filterCategories.map(cat => (
                <button
                  key={cat.id}
                  className={`ns-filter-chip ${activeFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(cat.id)}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="ns-sort-row">
              <div className="ns-sort-dropdown">
                <ArrowUpDown size={14} />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                  <option value="nearest">Nearest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="eta">Fastest Arrival</option>
                  <option value="price">Lowest Price</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
              <button className="ns-filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={14} />
                <span>Advanced</span>
                <ChevronDown size={14} className={showFilters ? 'rotated' : ''} />
              </button>
              <span className="ns-results-count">{filteredProviders.length} services found</span>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="ns-advanced-filters">
              <div className="ns-adv-filter-row">
                <label>Distance</label>
                <input type="range" min="1" max="10" defaultValue="5" />
                <span>5 mi</span>
              </div>
              <div className="ns-adv-filter-row">
                <label>Min Rating</label>
                <input type="range" min="1" max="5" step="0.1" defaultValue="4" />
                <span>4.0 ★</span>
              </div>
              <div className="ns-adv-filter-row">
                <label>Max Price</label>
                <input type="range" min="20" max="200" defaultValue="100" />
                <span>$100</span>
              </div>
              <div className="ns-adv-filter-toggles">
                <label className="ns-toggle-label">
                  <input type="checkbox" defaultChecked /> Open Now
                </label>
                <label className="ns-toggle-label">
                  <input type="checkbox" defaultChecked /> Verified Only
                </label>
                <label className="ns-toggle-label">
                  <input type="checkbox" /> Emergency Available
                </label>
                <label className="ns-toggle-label">
                  <input type="checkbox" /> EV Support
                </label>
              </div>
            </div>
          )}

          {/* AI Recommendation Card */}
          {showAIRecommendation && (
            <div className="ns-ai-card">
              <div className="ns-ai-header">
                <div className="ns-ai-badge">
                  <Sparkles size={16} />
                  <span>AI Recommended</span>
                </div>
                <button className="ns-ai-close" onClick={() => setShowAIRecommendation(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="ns-ai-body">
                <div className="ns-ai-provider">
                  <div className="ns-ai-provider-avatar">{aiRecommended.logo}</div>
                  <div className="ns-ai-provider-info">
                    <h4>{aiRecommended.name}</h4>
                    <div className="ns-ai-provider-meta">
                      <span><Star size={12} /> {aiRecommended.rating}</span>
                      <span><MapPin size={12} /> {aiRecommended.distance}</span>
                      <span><Clock size={12} /> {aiRecommended.eta} min</span>
                      <span><DollarSign size={12} /> ${aiRecommended.price}</span>
                    </div>
                  </div>
                  <div className="ns-ai-score">
                    <svg viewBox="0 0 48 48" className="ns-ai-score-ring">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-light)" strokeWidth="3" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--primary)" strokeWidth="3"
                        strokeDasharray={`${(aiRecommended.aiScore! / 100) * 125.6} 125.6`}
                        strokeLinecap="round" transform="rotate(-90 24 24)"
                      />
                      <text x="24" y="26" textAnchor="middle" fill="var(--primary)" fontSize="12" fontWeight="700" fontFamily="Inter">{aiRecommended.aiScore}</text>
                    </svg>
                    <span className="ns-ai-score-label">Match</span>
                  </div>
                </div>
                <p className="ns-ai-reason">{aiRecommended.aiReason}</p>
                <div className="ns-ai-tags">
                  {aiRecommended.certifications.map((cert, i) => (
                    <span key={i} className="ns-ai-tag">{cert}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Service Provider Cards */}
          <div className="ns-cards-grid">
            {filteredProviders.map((provider, index) => (
              <div
                key={provider.id}
                className={`ns-service-card ${hoveredProvider === provider.id ? 'hovered' : ''} ${selectedProvider?.id === provider.id ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.08}s` }}
                onMouseEnter={() => setHoveredProvider(provider.id)}
                onMouseLeave={() => setHoveredProvider(null)}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="ns-card-image">
                  <img src={provider.photo} alt={provider.name} loading="lazy" />
                  <div className="ns-card-image-overlay">
                    <span className={`ns-card-availability ns-avail-${provider.availability}`}>
                      <span className="ns-avail-dot" />
                      {provider.availability === 'online' ? 'Available' : provider.availability === 'busy' ? 'Busy' : 'Offline'}
                    </span>
                    {provider.specialOffers && (
                      <span className="ns-card-offer">{provider.specialOffers}</span>
                    )}
                  </div>
                  <button
                    className={`ns-card-fav-btn ${favorites.includes(provider.id) ? 'favorited' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleFavorite(provider.id); }}
                  >
                    {favorites.includes(provider.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>
                <div className="ns-card-body">
                  <div className="ns-card-header">
                    <div className="ns-card-logo">{provider.logo}</div>
                    <div className="ns-card-title">
                      <h3>
                        {provider.name}
                        {provider.verified && <BadgeCheck size={16} className="ns-verified-icon" />}
                      </h3>
                      <span className="ns-card-address">{provider.address}</span>
                    </div>
                  </div>
                  <div className="ns-card-meta">
                    <div className="ns-card-meta-item">
                      <MapPin size={13} />
                      <span>{provider.distance}</span>
                    </div>
                    <div className="ns-card-meta-item">
                      <Clock size={13} />
                      <span>{provider.eta} min</span>
                    </div>
                    <div className="ns-card-meta-item">
                      <Star size={13} className="ns-star-icon" />
                      <span>{provider.rating}</span>
                      <span className="ns-review-count">({provider.reviews})</span>
                    </div>
                    <div className="ns-card-meta-item">
                      <Gauge size={13} />
                      <span>{provider.experience}y exp</span>
                    </div>
                  </div>
                  <div className="ns-card-services">
                    {provider.services.slice(0, 4).map((svc, i) => (
                      <span key={i} className="ns-card-service-tag">{svc}</span>
                    ))}
                    {provider.services.length > 4 && (
                      <span className="ns-card-service-tag ns-more-tag">+{provider.services.length - 4}</span>
                    )}
                  </div>
                  <div className="ns-card-footer">
                    <div className="ns-card-price">
                      <DollarSign size={14} />
                      <span>{provider.priceLabel}</span>
                    </div>
                    <div className="ns-card-actions">
                      <button className="ns-card-action-btn" title="Call" onClick={e => e.stopPropagation()}>
                        <Phone size={14} />
                      </button>
                      <button className="ns-card-action-btn" title="Chat" onClick={e => e.stopPropagation()}>
                        <MessageCircle size={14} />
                      </button>
                      <button className="ns-card-action-btn" title="Navigate" onClick={e => e.stopPropagation()}>
                        <Navigation size={14} />
                      </button>
                      <button className="ns-card-action-btn ns-card-book-btn" title="Book Service" onClick={e => e.stopPropagation()}>
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Comparison Section */}
          <div className="ns-section">
            <div className="ns-section-header">
              <h2><DollarSign size={20} /> Price Comparison</h2>
              <button className="ns-section-toggle" onClick={() => setShowPriceComparison(!showPriceComparison)}>
                {showPriceComparison ? 'Hide' : 'Compare Prices'}
                <ChevronDown size={16} className={showPriceComparison ? 'rotated' : ''} />
              </button>
            </div>
            {showPriceComparison && (
              <div className="ns-price-table-wrapper">
                <table className="ns-price-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Apex Auto</th>
                      <th>QuickFix</th>
                      <th>GreenFuel</th>
                      <th>Metro Towing</th>
                      <th>Volt EV</th>
                      <th>SafeGuard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceComparisonData.map((row, i) => (
                      <tr key={i}>
                        <td className="ns-price-service-name">{row.service}</td>
                        <td className={row.bestValue === 'apex' ? 'ns-best-value' : ''}>{row.apex ? `$${row.apex}` : '—'}</td>
                        <td className={row.bestValue === 'quickfix' ? 'ns-best-value' : ''}>{row.quickfix ? `$${row.quickfix}` : '—'}</td>
                        <td className={row.bestValue === 'greenfuel' ? 'ns-best-value' : ''}>{(row as any).greenfuel ? `$${(row as any).greenfuel}` : '—'}</td>
                        <td className={row.bestValue === 'metro' ? 'ns-best-value' : ''}>{(row as any).metro ? `$${(row as any).metro}` : '—'}</td>
                        <td className={row.bestValue === 'volt' ? 'ns-best-value' : ''}>{(row as any).volt ? `$${(row as any).volt}` : '—'}</td>
                        <td className={row.bestValue === 'safeguard' ? 'ns-best-value' : ''}>{row.safeguard ? `$${row.safeguard}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ns-price-legend">
                  <span className="ns-price-legend-item"><span className="ns-legend-dot ns-best" /> Best Value</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Reviews Section */}
          <div className="ns-section">
            <div className="ns-section-header">
              <h2><Star size={20} /> Customer Reviews</h2>
              <span className="ns-review-total">{reviews.length} reviews</span>
            </div>
            <div className="ns-reviews-carousel">
              {reviews.map((review, i) => (
                <div key={review.id} className={`ns-review-card ${i === selectedReviewIdx ? 'active' : ''}`}>
                  <div className="ns-review-header">
                    <div className="ns-review-avatar">{review.customerPhoto}</div>
                    <div className="ns-review-info">
                      <div className="ns-review-name">
                        {review.customerName}
                        {review.verified && <BadgeCheck size={14} className="ns-verified-icon" />}
                      </div>
                      <div className="ns-review-meta">
                        <span>{review.vehicle}</span>
                        <span>•</span>
                        <span>{review.service}</span>
                        <span>•</span>
                        <span>{review.date}</span>
                      </div>
                    </div>
                    <div className="ns-review-stars">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star key={j} size={14} className={j < review.rating ? 'ns-star-filled' : 'ns-star-empty'} />
                      ))}
                    </div>
                  </div>
                  <p className="ns-review-text">{review.text}</p>
                </div>
              ))}
            </div>
            <div className="ns-review-dots">
              {reviews.map((_, i) => (
                <button key={i} className={`ns-review-dot ${i === selectedReviewIdx ? 'active' : ''}`} onClick={() => setSelectedReviewIdx(i)} />
              ))}
            </div>
          </div>

          {/* Favorites Section */}
          <div className="ns-section">
            <div className="ns-section-header">
              <h2><Heart size={20} /> Your Favorites</h2>
              <span className="ns-fav-count">{favorites.length} saved</span>
            </div>
            <div className="ns-favorites-row">
              {serviceProviders.filter(p => favorites.includes(p.id)).map(provider => (
                <div key={provider.id} className="ns-fav-card" onClick={() => setSelectedProvider(provider)}>
                  <div className="ns-fav-avatar">{provider.logo}</div>
                  <div className="ns-fav-info">
                    <h4>{provider.name}</h4>
                    <div className="ns-fav-meta">
                      <Star size={12} className="ns-star-icon" /> {provider.rating} • {provider.distance}
                    </div>
                  </div>
                  <div className="ns-fav-actions">
                    <button className="ns-fav-action-btn" title="Quick Rebook"><Repeat size={14} /></button>
                    <button className="ns-fav-action-btn" title="Call"><Phone size={14} /></button>
                  </div>
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="ns-empty-state">
                  <Bookmark size={32} />
                  <p>No favorites yet. Save providers for quick access.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recently Contacted */}
          <div className="ns-section">
            <div className="ns-section-header">
              <h2><History size={20} /> Recently Contacted</h2>
            </div>
            <div className="ns-favorites-row">
              {serviceProviders.slice(0, 3).map(provider => (
                <div key={provider.id} className="ns-fav-card" onClick={() => setSelectedProvider(provider)}>
                  <div className="ns-fav-avatar">{provider.logo}</div>
                  <div className="ns-fav-info">
                    <h4>{provider.name}</h4>
                    <div className="ns-fav-meta">
                      Last used: 2 days ago
                    </div>
                  </div>
                  <div className="ns-fav-actions">
                    <button className="ns-fav-action-btn" title="Quick Rebook"><Repeat size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Provider Profile Modal ─── */}
      {selectedProvider && (
        <div className="ns-modal-overlay" onClick={() => setSelectedProvider(null)}>
          <div className="ns-modal" onClick={e => e.stopPropagation()}>
            <button className="ns-modal-close" onClick={() => setSelectedProvider(null)}>
              <X size={20} />
            </button>

            <div className="ns-modal-cover">
              <img src={selectedProvider.photo} alt={selectedProvider.name} />
              <div className="ns-modal-cover-overlay">
                <span className={`ns-card-availability ns-avail-${selectedProvider.availability}`}>
                  <span className="ns-avail-dot" />
                  {selectedProvider.availability === 'online' ? 'Available Now' : selectedProvider.availability === 'busy' ? 'Busy' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="ns-modal-body">
              <div className="ns-modal-header">
                <div className="ns-modal-logo">{selectedProvider.logo}</div>
                <div className="ns-modal-title">
                  <h2>
                    {selectedProvider.name}
                    {selectedProvider.verified && <BadgeCheck size={20} className="ns-verified-icon" />}
                  </h2>
                  <p className="ns-modal-address"><MapPin size={14} /> {selectedProvider.address}</p>
                </div>
                <div className="ns-modal-rating">
                  <Star size={18} className="ns-star-icon" />
                  <span>{selectedProvider.rating}</span>
                  <span className="ns-review-count">({selectedProvider.reviews} reviews)</span>
                </div>
              </div>

              <p className="ns-modal-description">{selectedProvider.description}</p>

              <div className="ns-modal-stats">
                <div className="ns-modal-stat">
                  <MapPin size={16} />
                  <span className="ns-modal-stat-value">{selectedProvider.distance}</span>
                  <span className="ns-modal-stat-label">Distance</span>
                </div>
                <div className="ns-modal-stat">
                  <Clock size={16} />
                  <span className="ns-modal-stat-value">{selectedProvider.eta} min</span>
                  <span className="ns-modal-stat-label">ETA</span>
                </div>
                <div className="ns-modal-stat">
                  <Gauge size={16} />
                  <span className="ns-modal-stat-value">{selectedProvider.experience} yrs</span>
                  <span className="ns-modal-stat-label">Experience</span>
                </div>
                <div className="ns-modal-stat">
                  <DollarSign size={16} />
                  <span className="ns-modal-stat-value">${selectedProvider.price}+</span>
                  <span className="ns-modal-stat-label">Starting</span>
                </div>
              </div>

              <div className="ns-modal-section">
                <h3>Services Offered</h3>
                <div className="ns-modal-services">
                  {selectedProvider.services.map((svc, i) => (
                    <span key={i} className="ns-modal-service-tag">{svc}</span>
                  ))}
                </div>
              </div>

              <div className="ns-modal-section">
                <h3>Certifications</h3>
                <div className="ns-modal-certs">
                  {selectedProvider.certifications.map((cert, i) => (
                    <span key={i} className="ns-modal-cert-badge">
                      <ShieldCheck size={14} /> {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ns-modal-section">
                <h3>Working Hours</h3>
                <p className="ns-modal-hours">{selectedProvider.workingHours}</p>
              </div>

              <div className="ns-modal-section">
                <h3>Payment Methods</h3>
                <div className="ns-modal-payments">
                  {selectedProvider.paymentMethods.map((pm, i) => (
                    <span key={i} className="ns-modal-payment-tag">
                      <CreditCard size={12} /> {pm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ns-modal-section">
                <h3>Contact</h3>
                <div className="ns-modal-contact">
                  <a href={`tel:${selectedProvider.phone}`} className="ns-modal-contact-link">
                    <Phone size={14} /> {selectedProvider.phone}
                  </a>
                </div>
              </div>

              <div className="ns-modal-actions">
                <button className="ns-modal-action-btn ns-modal-book-btn">
                  <Calendar size={16} /> Book Now
                </button>
                <button className="ns-modal-action-btn ns-modal-directions-btn">
                  <Navigation size={16} /> Get Directions
                </button>
                <button className="ns-modal-action-btn ns-modal-save-btn" onClick={() => toggleFavorite(selectedProvider.id)}>
                  {favorites.includes(selectedProvider.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {favorites.includes(selectedProvider.id) ? 'Saved' : 'Save'}
                </button>
                <button className="ns-modal-action-btn ns-modal-share-btn">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
