import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  Bell,
  Sun,
  Moon,
  AlertTriangle,
  BadgeCheck,
  Star,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Heart,
  Share2,
  CheckCircle2,
  Shield,
  Zap,
  Award,
  Timer,
  Wrench,
  Car,
  Sparkles,
  ThumbsUp,
  Filter,
  Image,
  X,
  DollarSign,
  CalendarDays,
  Camera
} from 'lucide-react';

/* ─── Types ─── */
interface MechanicProfileData {
  id: number;
  name: string;
  photo: string;
  banner: string;
  verified: boolean;
  serviceCenter: string;
  experience: number;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  availability: 'online' | 'busy' | 'offline';
  eta: number;
  distance: string;
  responseTime: string;
  serviceRadius: string;
  satisfaction: number;
  vehicleTypes: string[];
  phone: string;
  address: string;
  description: string;
  certifications: string[];
  skills: string[];
  workingHours: { day: string; hours: string }[];
  isEmergency24x7: boolean;
  nextAvailable: string;
  inspectionFee: number;
  serviceCharge: number;
  emergencyCharge: number;
  distanceFee: number;
  discount: string;
  membershipBenefits: string[];
  aiConfidence: number;
  aiReasons: string[];
  services: {
    icon: string;
    name: string;
    description: string;
    price: string;
    time: string;
  }[];
  gallery: { url: string; caption: string }[];
  reviews: {
    id: number;
    name: string;
    photo: string;
    vehicle: string;
    date: string;
    rating: number;
    text: string;
    verified: boolean;
  }[];
}

/* ─── Mock Data ─── */
const mechanicData: MechanicProfileData = {
  id: 1,
  name: "Alex Thompson",
  photo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=300",
  banner: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&q=80&w=1200",
  verified: true,
  serviceCenter: "Apex Auto Recovery Center",
  experience: 12,
  rating: 4.9,
  totalReviews: 142,
  totalJobs: 2847,
  availability: 'online',
  eta: 6,
  distance: "0.8 mi",
  responseTime: "8 min",
  serviceRadius: "25 mi",
  satisfaction: 98,
  vehicleTypes: ["Sedan", "SUV", "Truck", "EV", "Hybrid"],
  phone: "+1 (555) 234-5678",
  address: "142 Oak Street, Downtown, San Francisco, CA 94102",
  description: "Award-winning mobile mechanic team with 12+ years of experience. Specializing in emergency roadside repairs, EV diagnostics, and complex engine troubleshooting. Available 24/7 for emergencies.",
  certifications: ["ASE Certified", "AAA Approved", "EPA Certified", "EV Specialist", "First Aid Certified", "Emergency Rescue Certified"],
  skills: ["Engine Expert", "Tire Specialist", "Battery Expert", "Electrical Systems", "EV Charging", "Hybrid Diagnostics"],
  workingHours: [
    { day: "Monday", hours: "6:00 AM - 10:00 PM" },
    { day: "Tuesday", hours: "6:00 AM - 10:00 PM" },
    { day: "Wednesday", hours: "6:00 AM - 10:00 PM" },
    { day: "Thursday", hours: "6:00 AM - 10:00 PM" },
    { day: "Friday", hours: "6:00 AM - 10:00 PM" },
    { day: "Saturday", hours: "8:00 AM - 8:00 PM" },
    { day: "Sunday", hours: "9:00 AM - 6:00 PM" }
  ],
  isEmergency24x7: true,
  nextAvailable: "Today, 2:30 PM",
  inspectionFee: 25,
  serviceCharge: 49,
  emergencyCharge: 75,
  distanceFee: 5.5,
  discount: "10% off first booking",
  membershipBenefits: ["Free inspection", "Priority dispatch", "Extended warranty", "24/7 hotline"],
  aiConfidence: 96,
  aiReasons: ["Closest to your location", "Excellent 4.9 rating", "Fastest response time", "12+ years experience", "Specialized for your issue"],
  services: [
    { icon: "🛞", name: "Flat Tire Repair", description: "Professional tire patching, replacement, and balancing services", price: "From $49", time: "15-30 min" },
    { icon: "🔋", name: "Battery Jump Start", description: "Emergency battery jump start and replacement for all vehicle types", price: "From $59", time: "10-20 min" },
    { icon: "⛽", name: "Fuel Delivery", description: "Quick fuel delivery to get you back on the road", price: "From $39", time: "15-25 min" },
    { icon: "⚙️", name: "Engine Repair", description: "Complete engine diagnostics and repair services", price: "From $89", time: "30-60 min" },
    { icon: "🛑", name: "Brake Repair", description: "Brake pad replacement, rotor resurfacing, and fluid service", price: "From $79", time: "20-45 min" },
    { icon: "⚡", name: "Electrical Repair", description: "Electrical system diagnostics and repair", price: "From $69", time: "20-40 min" },
    { icon: "🔓", name: "Lockout Assistance", description: "Damage-free vehicle lockout service", price: "From $55", time: "10-15 min" },
    { icon: "💥", name: "Accident Recovery", description: "Professional accident scene cleanup and vehicle recovery", price: "From $99", time: "20-45 min" },
    { icon: "🚛", name: "Towing", description: "Flatbed and wheel-lift towing services", price: "From $89", time: "15-30 min" },
    { icon: "🔌", name: "EV Charging", description: "Mobile Level 2 and Level 3 EV charging", price: "From $79", time: "20-40 min" },
    { icon: "🚨", name: "Emergency Repairs", description: "24/7 emergency roadside repair services", price: "From $99", time: "10-30 min" }
  ],
  gallery: [
    { url: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=300&fit=crop", caption: "Our Modern Workshop" },
    { url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", caption: "Professional Repair Work" },
    { url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop", caption: "Our Tow Truck Fleet" },
    { url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop", caption: "Advanced Equipment" },
    { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop", caption: "Before Repair" },
    { url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&h=300&fit=crop", caption: "After Repair" },
    { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop", caption: "Our Team" },
    { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", caption: "Customer Interaction" }
  ],
  reviews: [
    { id: 1, name: "Sarah M.", photo: "👩", vehicle: "Toyota Camry 2023", date: "2 hours ago", rating: 5, text: "Incredibly fast response! Alex arrived in under 8 minutes and had my flat tire patched perfectly. Very professional and friendly. Highly recommended!", verified: true },
    { id: 2, name: "James K.", photo: "👨", vehicle: "Honda CR-V 2022", date: "5 hours ago", rating: 5, text: "My car died in a parking lot at night. Alex was there with a smile and got me going in minutes. Lifesaver! The AI diagnostic was spot-on.", verified: true },
    { id: 3, name: "Maria L.", photo: "👩‍🦱", vehicle: "Ford F-150 2024", date: "1 day ago", rating: 4, text: "Ran out of gas on the highway. Fuel was delivered quickly and the pricing was fair. The app tracking made it easy to know when help was arriving.", verified: true },
    { id: 4, name: "David R.", photo: "👨‍🦳", vehicle: "Tesla Model 3", date: "2 days ago", rating: 5, text: "As an EV owner, finding mobile charging used to be impossible. Alex's service is a game-changer. Professional, equipped, and knowledgeable about EVs.", verified: true },
    { id: 5, name: "Priya S.", photo: "👩‍🔬", vehicle: "BMW X5 2023", date: "3 days ago", rating: 5, text: "Locked my keys in the car during a grocery run. Alex was there in 10 minutes, no damage at all. Amazing service and very reasonably priced!", verified: false },
    { id: 6, name: "Tom W.", photo: "🧑", vehicle: "Jeep Wrangler 2022", date: "4 days ago", rating: 4, text: "Needed a tow after an accident. The tow truck arrived quickly and handled everything professionally. Insurance billing was seamless.", verified: true }
  ]
};

const liveStatusUpdates = [
  "Currently Available",
  "Finishing another job nearby",
  "Arriving in 12 minutes",
  "New review received",
  "Service completed nearby"
];

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration: number = 2000, trigger: boolean = true) {
  const [count, setCount] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (!trigger || animated.current) return;
    animated.current = true;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [trigger, target, duration]);

  return count;
}

/* ─── Main Component ─── */
interface MechanicProfileProps {
  onBack: () => void;
}

export default function MechanicProfile({ onBack }: MechanicProfileProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('roadrescue-theme');
    return (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  });
  const [activeStatus, setActiveStatus] = useState(0);
  const [reviewSort, setReviewSort] = useState<'latest' | 'highest' | 'helpful'>('latest');
  const [showGalleryLightbox, setShowGalleryLightbox] = useState<number | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Animated counters */
  const animatedRating = useAnimatedCounter(49, 2000);
  const animatedJobs = useAnimatedCounter(2847, 2500);
  const animatedSatisfaction = useAnimatedCounter(98, 2000);

  /* Intersection Observer for fade-in animations */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  /* Auto-rotate live status */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStatus(prev => (prev + 1) % liveStatusUpdates.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getTodayHours = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const schedule = mechanicData.workingHours.find(h => h.day === today);
    return schedule?.hours || 'Closed';
  };

  const getCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const sortedReviews = [...mechanicData.reviews].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'helpful') return b.verified ? 1 : -1;
    return 0;
  });

  const refCallback = useCallback((id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  return (
    <div className="mp-page">
      {/* ─── Top Navigation ─── */}
      <nav className="mp-navbar">
        <div className="mp-navbar-inner">
          <div className="mp-navbar-left">
            <button className="mp-back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="mp-logo">
              <span className="mp-logo-icon">🚨</span>
              <span className="mp-logo-text"><span style={{ color: 'var(--primary)' }}>Road</span>Rescue AI</span>
            </div>
          </div>
          <div className="mp-navbar-center">
            <div className="mp-search-bar">
              <Search size={16} />
              <input type="text" placeholder="Search mechanics, services..." />
            </div>
          </div>
          <div className="mp-navbar-right">
            <button className="mp-nav-btn" title="Notifications">
              <Bell size={20} />
              <span className="mp-nav-badge">3</span>
            </button>
            <button className="mp-nav-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="mp-avatar">D</div>
            <button className="mp-sos-btn">
              <AlertTriangle size={16} />
              <span>SOS</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Profile Card ─── */}
      <section className="mp-hero" id="hero">
        <div className="mp-hero-banner">
          <img src={mechanicData.banner} alt="Workshop" className="mp-hero-banner-img" />
          <div className="mp-hero-banner-overlay" />
        </div>
        <div className="mp-hero-content">
          <div className="mp-hero-photo-wrapper">
            <img src={mechanicData.photo} alt={mechanicData.name} className="mp-hero-photo" />
            <div className={`mp-availability-dot mp-avail-${mechanicData.availability}`}>
              <span className="mp-dot-pulse" />
            </div>
          </div>
          <div className="mp-hero-info">
            <div className="mp-hero-name-row">
              <h1 className="mp-hero-name">{mechanicData.name}</h1>
              {mechanicData.verified && (
                <span className="mp-verified-badge">
                  <BadgeCheck size={20} />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="mp-hero-center">{mechanicData.serviceCenter}</p>
            <div className="mp-hero-meta">
              <span className="mp-hero-meta-item">
                <Clock size={14} />
                {mechanicData.experience}+ Years Experience
              </span>
              <span className="mp-hero-meta-item">
                <Star size={14} className="mp-star-gold" />
                {mechanicData.rating} ({mechanicData.totalReviews} reviews)
              </span>
              <span className="mp-hero-meta-item">
                <CheckCircle2 size={14} />
                {mechanicData.totalJobs.toLocaleString()} Jobs Completed
              </span>
            </div>
            <div className="mp-hero-status-row">
              <span className={`mp-availability-pill mp-avail-${mechanicData.availability}`}>
                <span className="mp-dot-pulse" />
                {mechanicData.availability === 'online' ? 'Available Now' : mechanicData.availability === 'busy' ? 'Busy' : 'Offline'}
              </span>
              <span className="mp-hero-meta-item">
                <Timer size={14} />
                ETA: {mechanicData.eta} min
              </span>
              <span className="mp-hero-meta-item">
                <MapPin size={14} />
                {mechanicData.distance} away
              </span>
            </div>
          </div>
          <div className="mp-hero-actions">
            <button className="mp-action-btn mp-action-primary">
              <Car size={18} />
              Book Now
            </button>
            <button className="mp-action-btn mp-action-secondary">
              <Phone size={18} />
              Call
            </button>
            <button className="mp-action-btn mp-action-secondary">
              <MessageCircle size={18} />
              Chat
            </button>
            <button className="mp-action-btn mp-action-secondary">
              <Navigation size={18} />
              Directions
            </button>
            <button
              className={`mp-action-btn ${isFavorited ? 'mp-action-fav-active' : 'mp-action-secondary'}`}
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
              {isFavorited ? 'Saved' : 'Save'}
            </button>
            <button className="mp-action-btn mp-action-secondary">
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </section>

      {/* ─── Live Status Ticker ─── */}
      <div className="mp-ticker">
        <div className="mp-ticker-dot" />
        <span className="mp-ticker-text" key={activeStatus}>
          {liveStatusUpdates[activeStatus]}
        </span>
      </div>

      {/* ─── Main Content Grid ─── */}
      <main className="mp-main">
        <div className="mp-content-grid">
          {/* Left Column */}
          <div className="mp-left-column">

            {/* Performance Overview */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('performance') ? 'visible' : ''}`}
              ref={refCallback('performance')} id="performance">
              <h2 className="mp-section-title">
                <Award size={20} />
                Performance Overview
              </h2>
              <div className="mp-stats-grid">
                <div className="mp-stat-card">
                  <div className="mp-stat-icon mp-stat-icon-star">⭐</div>
                  <div className="mp-stat-value">{(animatedRating / 10).toFixed(1)}</div>
                  <div className="mp-stat-label">Average Rating</div>
                </div>
                <div className="mp-stat-card">
                  <div className="mp-stat-icon mp-stat-icon-wrench">🔧</div>
                  <div className="mp-stat-value">{animatedJobs.toLocaleString()}</div>
                  <div className="mp-stat-label">Jobs Completed</div>
                </div>
                <div className="mp-stat-card">
                  <div className="mp-stat-icon mp-stat-icon-car">🚗</div>
                  <div className="mp-stat-value">5</div>
                  <div className="mp-stat-label">Vehicle Types</div>
                </div>
                <div className="mp-stat-card">
                  <div className="mp-stat-icon mp-stat-icon-zap">⚡</div>
                  <div className="mp-stat-value">{mechanicData.responseTime}</div>
                  <div className="mp-stat-label">Avg Response</div>
                </div>
                <div className="mp-stat-card">
                  <div className="mp-stat-icon mp-stat-icon-map">📍</div>
                  <div className="mp-stat-value">{mechanicData.serviceRadius}</div>
                  <div className="mp-stat-label">Service Radius</div>
                </div>
                <div className="mp-stat-card">
                  <div className="mp-stat-icon mp-stat-icon-smile">😊</div>
                  <div className="mp-stat-value">{animatedSatisfaction}%</div>
                  <div className="mp-stat-label">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('services') ? 'visible' : ''}`}
              ref={refCallback('services')} id="services">
              <h2 className="mp-section-title">
                <Wrench size={20} />
                Services Offered
              </h2>
              <div className="mp-services-grid">
                {mechanicData.services.map((service, idx) => (
                  <div key={idx} className="mp-service-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="mp-service-icon">{service.icon}</div>
                    <h3 className="mp-service-name">{service.name}</h3>
                    <p className="mp-service-desc">{service.description}</p>
                    <div className="mp-service-meta">
                      <span className="mp-service-price">{service.price}</span>
                      <span className="mp-service-time"><Timer size={12} /> {service.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Gallery */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('gallery') ? 'visible' : ''}`}
              ref={refCallback('gallery')} id="gallery">
              <h2 className="mp-section-title">
                <Camera size={20} />
                Portfolio Gallery
              </h2>
              <div className="mp-gallery-grid">
                {mechanicData.gallery.map((item, idx) => (
                  <div key={idx} className="mp-gallery-item" onClick={() => setShowGalleryLightbox(idx)}>
                    <img src={item.url} alt={item.caption} loading="lazy" />
                    <div className="mp-gallery-overlay">
                      <span>{item.caption}</span>
                      <Image size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('reviews') ? 'visible' : ''}`}
              ref={refCallback('reviews')} id="reviews">
              <div className="mp-section-header">
                <h2 className="mp-section-title">
                  <Star size={20} />
                  Customer Reviews
                </h2>
                <div className="mp-review-sort">
                  <Filter size={14} />
                  <select value={reviewSort} onChange={e => setReviewSort(e.target.value as any)}>
                    <option value="latest">Latest</option>
                    <option value="highest">Highest Rated</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                </div>
              </div>
              <div className="mp-reviews-list">
                {sortedReviews.map(review => (
                  <div key={review.id} className="mp-review-card">
                    <div className="mp-review-header">
                      <div className="mp-review-avatar">{review.photo}</div>
                      <div className="mp-review-info">
                        <div className="mp-review-name">
                          {review.name}
                          {review.verified && <BadgeCheck size={14} className="mp-verified-icon" />}
                        </div>
                        <div className="mp-review-meta">
                          <span>{review.vehicle}</span>
                          <span>•</span>
                          <span>{review.date}</span>
                        </div>
                      </div>
                      <div className="mp-review-stars">
                        {Array.from({ length: 5 }, (_, j) => (
                          <Star key={j} size={14} fill={j < review.rating ? '#FBBF24' : 'none'} color={j < review.rating ? '#FBBF24' : 'var(--text-muted)'} />
                        ))}
                      </div>
                    </div>
                    <p className="mp-review-text">{review.text}</p>
                    <div className="mp-review-actions">
                      <button className="mp-review-action-btn">
                        <ThumbsUp size={12} />
                        Helpful
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="mp-right-column">

            {/* AI Recommendation */}
            <div className={`mp-section mp-ai-card mp-fade-in ${visibleSections.has('ai') ? 'visible' : ''}`}
              ref={refCallback('ai')} id="ai">
              <div className="mp-ai-header">
                <div className="mp-ai-badge">
                  <Sparkles size={16} />
                  <span>AI Recommended</span>
                </div>
                <div className="mp-ai-score-ring">
                  <svg viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-light)" strokeWidth="3" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--secondary)" strokeWidth="3"
                      strokeDasharray={`${(mechanicData.aiConfidence / 100) * 125.6} 125.6`}
                      strokeLinecap="round" transform="rotate(-90 24 24)"
                    />
                    <text x="24" y="26" textAnchor="middle" fill="var(--secondary)" fontSize="12" fontWeight="700" fontFamily="Inter">{mechanicData.aiConfidence}</text>
                  </svg>
                  <span className="mp-ai-score-label">Match</span>
                </div>
              </div>
              <h3 className="mp-ai-title">Why We Recommend This Mechanic</h3>
              <div className="mp-ai-reasons">
                {mechanicData.aiReasons.map((reason, idx) => (
                  <div key={idx} className="mp-ai-reason">
                    <CheckCircle2 size={14} />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications & Skills */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('certs') ? 'visible' : ''}`}
              ref={refCallback('certs')} id="certs">
              <h2 className="mp-section-title">
                <Shield size={20} />
                Certifications & Skills
              </h2>
              <div className="mp-cert-grid">
                {mechanicData.certifications.map((cert, idx) => (
                  <div key={idx} className="mp-cert-badge" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <Award size={14} />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
              <div className="mp-skills-grid">
                {mechanicData.skills.map((skill, idx) => (
                  <div key={idx} className="mp-skill-tag">
                    <Zap size={12} />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('availability') ? 'visible' : ''}`}
              ref={refCallback('availability')} id="availability">
              <h2 className="mp-section-title">
                <CalendarDays size={20} />
                Availability
              </h2>
              <div className="mp-availability-info">
                <div className="mp-avail-status">
                  <span className="mp-avail-label">Status:</span>
                  <span className={`mp-availability-pill mp-avail-${mechanicData.availability}`}>
                    <span className="mp-dot-pulse" />
                    {mechanicData.availability === 'online' ? 'Open Now' : mechanicData.availability === 'busy' ? 'Busy' : 'Closed'}
                  </span>
                </div>
                <div className="mp-avail-hours">
                  <span className="mp-avail-label">Today:</span>
                  <span className="mp-avail-value">{getTodayHours()}</span>
                </div>
                <div className="mp-avail-next">
                  <span className="mp-avail-label">Next Available:</span>
                  <span className="mp-avail-value">{mechanicData.nextAvailable}</span>
                </div>
                {mechanicData.isEmergency24x7 && (
                  <div className="mp-emergency-badge">
                    <AlertTriangle size={14} />
                    <span>Emergency 24/7 Service Available</span>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className="mp-hours-list">
                {mechanicData.workingHours.map((schedule, idx) => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const isToday = days[new Date().getDay()] === schedule.day;
                  return (
                    <div key={idx} className={`mp-hours-row ${isToday ? 'mp-hours-today' : ''}`}>
                      <span className="mp-hours-day">{schedule.day}</span>
                      <span className="mp-hours-time">{schedule.hours}</span>
                      {isToday && <span className="mp-today-badge">Today</span>}
                    </div>
                  );
                })}
              </div>

              {/* Calendar */}
              <div className="mp-calendar">
                <div className="mp-calendar-header">
                  <button onClick={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                    else setCalendarMonth(m => m - 1);
                  }}>&lt;</button>
                  <span>{monthNames[calendarMonth]} {calendarYear}</span>
                  <button onClick={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                    else setCalendarMonth(m => m + 1);
                  }}>&gt;</button>
                </div>
                <div className="mp-calendar-weekdays">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="mp-calendar-days">
                  {getCalendarDays().map((day, idx) => (
                    <button
                      key={idx}
                      className={`mp-calendar-day ${day === null ? 'mp-calendar-empty' : ''} ${day === selectedDate ? 'mp-calendar-selected' : ''} ${day && day === new Date().getDate() ? 'mp-calendar-today' : ''}`}
                      onClick={() => day && setSelectedDate(day)}
                      disabled={!day}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('pricing') ? 'visible' : ''}`}
              ref={refCallback('pricing')} id="pricing">
              <h2 className="mp-section-title">
                <DollarSign size={20} />
                Transparent Pricing
              </h2>
              <div className="mp-pricing-card">
                <div className="mp-pricing-row">
                  <span>Inspection Fee</span>
                  <span className="mp-pricing-val">${mechanicData.inspectionFee}</span>
                </div>
                <div className="mp-pricing-row">
                  <span>Base Service Charge</span>
                  <span className="mp-pricing-val">${mechanicData.serviceCharge}</span>
                </div>
                <div className="mp-pricing-row">
                  <span>Emergency Fee</span>
                  <span className="mp-pricing-val">${mechanicData.emergencyCharge}</span>
                </div>
                <div className="mp-pricing-row">
                  <span>Distance Fee</span>
                  <span className="mp-pricing-val">${mechanicData.distanceFee}/mi</span>
                </div>
                {mechanicData.discount && (
                  <div className="mp-pricing-discount">
                    <span>Discount</span>
                    <span className="mp-pricing-discount-val">{mechanicData.discount}</span>
                  </div>
                )}
                <div className="mp-pricing-divider" />
                <div className="mp-pricing-membership">
                  <h4>Membership Benefits</h4>
                  {mechanicData.membershipBenefits.map((benefit, idx) => (
                    <div key={idx} className="mp-pricing-benefit">
                      <CheckCircle2 size={14} />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Coverage Map */}
            <div className={`mp-section mp-fade-in ${visibleSections.has('map') ? 'visible' : ''}`}
              ref={refCallback('map')} id="map">
              <h2 className="mp-section-title">
                <MapPin size={20} />
                Service Coverage
              </h2>
              <div className="mp-map-container">
                <svg viewBox="0 0 400 280" className="mp-map-svg">
                  <defs>
                    <pattern id="mpGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-light)" strokeWidth="0.5" />
                    </pattern>
                    <radialGradient id="mpRadius" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
                    </radialGradient>
                  </defs>
                  <rect width="400" height="280" fill="var(--light-surface)" rx="8" />
                  <rect width="400" height="280" fill="url(#mpGrid)" />
                  {/* Roads */}
                  <line x1="0" y1="140" x2="400" y2="140" stroke="var(--text-muted)" strokeWidth="2" opacity="0.2" strokeDasharray="6,4" />
                  <line x1="200" y1="0" x2="200" y2="280" stroke="var(--text-muted)" strokeWidth="2" opacity="0.2" strokeDasharray="6,4" />
                  {/* Service radius circle */}
                  <circle cx="180" cy="130" r="90" fill="url(#mpRadius)" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                  {/* Nearby customers */}
                  <circle cx="120" cy="100" r="4" fill="var(--secondary)" opacity="0.6" />
                  <circle cx="250" cy="90" r="4" fill="var(--secondary)" opacity="0.6" />
                  <circle cx="140" cy="200" r="4" fill="var(--secondary)" opacity="0.6" />
                  <circle cx="230" cy="180" r="4" fill="var(--secondary)" opacity="0.6" />
                  {/* Workshop marker */}
                  <circle cx="180" cy="130" r="12" fill="var(--primary)" opacity="0.15">
                    <animate attributeName="r" values="12;18;12" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="180" cy="130" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                  <text x="180" y="155" textAnchor="middle" fill="var(--primary)" fontSize="9" fontWeight="700" fontFamily="Inter">Workshop</text>
                  {/* User location */}
                  <circle cx="300" cy="200" r="8" fill="var(--accent)" opacity="0.15">
                    <animate attributeName="r" values="8;14;8" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="300" cy="200" r="4" fill="var(--accent)" stroke="white" strokeWidth="2" />
                  <text x="300" y="220" textAnchor="middle" fill="var(--accent)" fontSize="8" fontWeight="700" fontFamily="Inter">You</text>
                  {/* Route line */}
                  <line x1="180" y1="130" x2="300" y2="200" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6,4" opacity="0.6">
                    <animate attributeName="strokeDashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
                  </line>
                </svg>
              </div>
              <div className="mp-map-info">
                <span><MapPin size={14} /> {mechanicData.address}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Mobile Sticky Bottom Action Bar ─── */}
      <div className="mp-mobile-action-bar">
        <button className="mp-mobile-action-btn mp-mobile-call">
          <Phone size={18} />
          <span>Call</span>
        </button>
        <button className="mp-mobile-action-btn mp-mobile-chat">
          <MessageCircle size={18} />
          <span>Chat</span>
        </button>
        <button className="mp-mobile-action-btn mp-mobile-book">
          <Car size={18} />
          <span>Book Now</span>
        </button>
        <button className="mp-mobile-action-btn mp-mobile-directions">
          <Navigation size={18} />
          <span>Directions</span>
        </button>
      </div>

      {/* ─── Gallery Lightbox ─── */}
      {showGalleryLightbox !== null && (
        <div className="mp-lightbox" onClick={() => setShowGalleryLightbox(null)}>
          <div className="mp-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="mp-lightbox-close" onClick={() => setShowGalleryLightbox(null)}>
              <X size={24} />
            </button>
            <img src={mechanicData.gallery[showGalleryLightbox].url} alt={mechanicData.gallery[showGalleryLightbox].caption} />
            <p className="mp-lightbox-caption">{mechanicData.gallery[showGalleryLightbox].caption}</p>
            <div className="mp-lightbox-nav">
              <button onClick={(e) => {
                e.stopPropagation();
                setShowGalleryLightbox(prev => prev === 0 ? mechanicData.gallery.length - 1 : (prev || 0) - 1);
              }}>&lt;</button>
              <span>{showGalleryLightbox + 1} / {mechanicData.gallery.length}</span>
              <button onClick={(e) => {
                e.stopPropagation();
                setShowGalleryLightbox(prev => prev === mechanicData.gallery.length - 1 ? 0 : (prev || 0) + 1);
              }}>&gt;</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
