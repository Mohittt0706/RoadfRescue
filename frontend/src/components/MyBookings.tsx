import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Phone, Download, X, ChevronDown,
  Search, Star, Clock, Car, CreditCard, FileText,
  Share2, MessageCircle, RotateCcw, Award, Wallet,
  Route, ThumbsUp, BarChart3, Wrench,
  IndianRupee, Zap, CheckCircle2, XCircle,
  SlidersHorizontal, ArrowUpDown, CalendarDays, Navigation
} from 'lucide-react';
import { BookingStore } from '../services/store';
import '../booking-history.css';
import MechanicTrackerModal from './MechanicTrackerModal';

interface MyBookingsProps {
  userId?: string;
  onBack?: () => void;
}

const STATUS_STEPS = ['Pending', 'Accepted', 'Mechanic Assigned', 'Mechanic Arriving', 'Service Started', 'Completed'];

const getStatusStepIndex = (status: string) => {
  if (status === 'Pending Approval' || status === 'Pending') return 0;
  if (status === 'Accepted') return 1;
  if (status === 'Mechanic Assigned') return 2;
  if (status === 'Mechanic Started' || status === 'Mechanic On The Way' || status === 'Mechanic Arrived') return 3;
  if (status === 'Arrived' || status === 'In Progress' || status === 'Service Started') return 4;
  if (status === 'Completed') return 5;
  return 0;
};

const MOCK_BOOKINGS = [
  {
    id: 'BK-2026-001',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Flat Tire Repair',
    vehicle_type: 'Sedan',
    vehicle_number: 'MH 02 AB 1234',
    address: 'Mumbai-Pune Expressway, Near Lonavala Toll',
    notes: 'Front left tire completely flat after hitting a pothole',
    price: 699,
    payment_method: 'UPI',
    payment_status: 'Paid',
    status: 'Completed',
    booking_time: '2026-07-08T14:30:00',
    mechanic_name: 'Rajesh Kumar',
    mechanic_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 4.8,
    service_duration: '25 min',
    distance: '3.2 km',
    ai_diagnosis: 'Standard tire puncture detected. Recommended: Spare tire swap or puncture repair.',
    services_performed: ['Tire inspection', 'Puncture repair', 'Pressure check', 'Wheel alignment check'],
    parts_replaced: ['Tire plug kit'],
    before_after: true,
    route: { pickup: '18.9690, 73.3850', breakdown: '18.9520, 73.3620', service: '18.9520, 73.3620' },
  },
  {
    id: 'BK-2026-002',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Battery Jump Start',
    vehicle_type: 'SUV',
    vehicle_number: 'MH 04 CD 5678',
    address: 'Wakad, Pune - Near D-Mart',
    notes: 'Car wouldn\'t start after leaving lights on overnight',
    price: 999,
    payment_method: 'Card',
    payment_status: 'Paid',
    status: 'Completed',
    booking_time: '2026-07-05T08:15:00',
    mechanic_name: 'Amit Sharma',
    mechanic_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 4.9,
    service_duration: '15 min',
    distance: '1.8 km',
    ai_diagnosis: 'Battery voltage critical at 8.2V. Requires immediate jump start. Battery health at 40% - replacement recommended within 3 months.',
    services_performed: ['Battery voltage test', 'Jump start', 'Alternator check', 'Battery terminals cleaning'],
    parts_replaced: [],
    before_after: false,
    route: { pickup: '18.5950, 73.7400', breakdown: '18.5830, 73.7560', service: '18.5830, 73.7560' },
  },
  {
    id: 'BK-2026-003',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Fuel Delivery',
    vehicle_type: 'Sedan',
    vehicle_number: 'MH 01 EF 9012',
    address: 'Mumbai-Bangalore Highway, Near Kolhapur',
    notes: 'Ran out of fuel, need 5L petrol urgently',
    price: 1299,
    payment_method: 'Wallet',
    payment_status: 'Paid',
    status: 'Completed',
    booking_time: '2026-07-02T17:45:00',
    mechanic_name: 'Suresh Patil',
    mechanic_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 4.7,
    service_duration: '20 min',
    distance: '5.1 km',
    ai_diagnosis: 'Fuel level critical. Emergency fuel delivery required. Vehicle compatible with petrol.',
    services_performed: ['Fuel delivery (5L petrol)', 'Fuel cap check', 'Engine start verification'],
    parts_replaced: [],
    before_after: false,
    route: { pickup: '16.7050, 74.2430', breakdown: '16.6890, 74.2190', service: '16.6890, 74.2190' },
  },
  {
    id: 'BK-2026-004',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Engine Breakdown Diagnosis',
    vehicle_type: 'SUV',
    vehicle_number: 'MH 04 CD 5678',
    address: 'Baner, Pune - Near PhonePe Office',
    notes: 'Engine overheating, steam coming from hood',
    price: 1499,
    payment_method: 'UPI',
    payment_status: 'Paid',
    status: 'Completed',
    booking_time: '2026-06-28T11:20:00',
    mechanic_name: 'Vikram Desai',
    mechanic_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 5.0,
    service_duration: '35 min',
    distance: '2.4 km',
    ai_diagnosis: 'Engine temperature critical at 110°C. Coolant leak detected in radiator hose. Immediate shutdown recommended.',
    services_performed: ['Full engine diagnostic', 'Coolant refill', 'Radiator hose repair', 'Thermostat check', 'Cooling fan test'],
    parts_replaced: ['Radiator hose clamp', 'Coolant (2L)'],
    before_after: true,
    route: { pickup: '18.5130, 73.7830', breakdown: '18.5250, 73.7710', service: '18.5250, 73.7710' },
  },
  {
    id: 'BK-2026-005',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Car Towing',
    vehicle_type: 'Sedan',
    vehicle_number: 'MH 02 AB 1234',
    address: 'Nashik-Mumbai Highway, Near Kasara Ghat',
    notes: 'Severe engine failure, need flatbed towing to nearest garage',
    price: 2999,
    payment_method: 'Card',
    payment_status: 'Paid',
    status: 'Completed',
    booking_time: '2026-06-20T09:00:00',
    mechanic_name: 'Prakash Jadhav',
    mechanic_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 4.6,
    service_duration: '50 min',
    distance: '12.3 km',
    ai_diagnosis: 'Critical engine failure detected. Vehicle non-operational. Flatbed tow truck dispatched for safe transport.',
    services_performed: ['Vehicle assessment', 'Flatbed loading', 'Safe transport to garage', 'Handover to service center'],
    parts_replaced: [],
    before_after: false,
    route: { pickup: '19.6900, 73.7800', breakdown: '19.6500, 73.8200', service: '19.5500, 73.8800' },
  },
  {
    id: 'BK-2026-006',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Lockout Assistance',
    vehicle_type: 'SUV',
    vehicle_number: 'MH 04 CD 5678',
    address: 'Hinjewadi Phase 3, Pune',
    notes: 'Keys locked inside car, need urgent help',
    price: 899,
    payment_method: 'UPI',
    payment_status: 'Paid',
    status: 'Completed',
    booking_time: '2026-06-15T22:10:00',
    mechanic_name: 'Rajesh Kumar',
    mechanic_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 4.8,
    service_duration: '12 min',
    distance: '1.5 km',
    ai_diagnosis: 'Lockout situation. Non-destructive entry method recommended. Vehicle lock system compatible with slim jim technique.',
    services_performed: ['Lock assessment', 'Non-destructive entry', 'Key retrieval', 'Lock system check'],
    parts_replaced: [],
    before_after: false,
    route: { pickup: '18.5912, 73.7389', breakdown: '18.5912, 73.7389', service: '18.5912, 73.7389' },
  },
  {
    id: 'BK-2026-007',
    customer_name: 'Disha Patel',
    phone: '+91 98765 43210',
    email: 'disha@example.com',
    service_name: 'Flat Tire Repair',
    vehicle_type: 'Sedan',
    vehicle_number: 'MH 02 AB 1234',
    address: 'Aundh-Baner Link Road, Pune',
    notes: 'Rear tire puncture detected',
    price: 699,
    payment_method: 'UPI',
    payment_status: 'Pending',
    status: 'In Progress',
    booking_time: '2026-07-10T10:00:00',
    mechanic_name: 'Amit Sharma',
    mechanic_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    mechanic_rating: 4.9,
    service_duration: '-',
    distance: '2.1 km',
    ai_diagnosis: 'Puncture detected in rear left tire. Repair in progress.',
    services_performed: [],
    parts_replaced: [],
    before_after: false,
    route: { pickup: '18.5580, 73.7730', breakdown: '18.5500, 73.7800', service: '18.5500, 73.7800' },
  },
];

export default function MyBookings({ userId }: MyBookingsProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Latest');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'analytics' | 'payments' | 'rewards'>('history');
  const [ratingBooking, setRatingBooking] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [showRouteMap, setShowRouteMap] = useState<string | null>(null);
  const [animatedStats, setAnimatedStats] = useState({ total: 0, completed: 0, active: 0, spent: 0, avgTime: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<any | null>(null);

  useEffect(() => {
    loadBookings();
    const unsubscribe = BookingStore.subscribe(loadBookings);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (bookings.length > 0 && !statsAnimated.current) {
      statsAnimated.current = true;
      animateStats();
    }
  }, [bookings]);

  const animateStats = () => {
    const duration = 1800;
    const startTime = performance.now();
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'Completed').length;
    const active = bookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length;
    const spent = bookings.filter(b => b.payment_status === 'Paid').reduce((sum, b) => sum + (b.price || 0), 0);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);

      setAnimatedStats({
        total: Math.floor(ease * total),
        completed: Math.floor(ease * completed),
        active: Math.floor(ease * active),
        spent: Math.floor(ease * spent),
        avgTime: parseFloat((ease * 22.5).toFixed(1)),
      });

      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const loadBookings = () => {
    const list = BookingStore.getAll();
    if (list && list.length > 0) {
      setBookings(list);
    } else {
      setBookings(MOCK_BOOKINGS);
    }
    setLoading(false);
  };

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.id?.toLowerCase().includes(q)) ||
        (b.service_name?.toLowerCase().includes(q)) ||
        (b.mechanic_name?.toLowerCase().includes(q)) ||
        (b.vehicle_number?.toLowerCase().includes(q)) ||
        (b.vehicle_type?.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (dateFilter !== 'All') {
      const now = new Date();
      result = result.filter(b => {
        const d = new Date(b.booking_time);
        switch (dateFilter) {
          case 'Today': return d.toDateString() === now.toDateString();
          case 'This Week': {
            const weekAgo = new Date(now.getTime() - 7 * 86400000);
            return d >= weekAgo;
          }
          case 'This Month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          case 'Last 6 Months': {
            const sixMonths = new Date(now.getTime() - 180 * 86400000);
            return d >= sixMonths;
          }
          case 'This Year': return d.getFullYear() === now.getFullYear();
          default: return true;
        }
      });
    }

    switch (sortBy) {
      case 'Latest': result.sort((a, b) => new Date(b.booking_time).getTime() - new Date(a.booking_time).getTime()); break;
      case 'Oldest': result.sort((a, b) => new Date(a.booking_time).getTime() - new Date(b.booking_time).getTime()); break;
      case 'Highest Cost': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'Lowest Cost': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
    }

    return result;
  }, [bookings, searchQuery, statusFilter, dateFilter, sortBy]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await BookingStore.updateStatus(bookingId, 'Cancelled', 'Cancelled by customer');
      loadBookings();
    } catch { /* handled */ }
  };

  const downloadInvoice = (booking: any) => {
    const html = `<!DOCTYPE html><html><head><style>
      body{font-family:'Inter',sans-serif;padding:40px;color:#0F172A;}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #2563EB;padding-bottom:20px;margin-bottom:30px;}
      .logo{font-size:24px;font-weight:900;color:#2563EB;}
      .badge{background:#22C55E;color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;}
      h2{font-size:18px;margin:0 0 5px;} p{margin:0;color:#64748B;font-size:13px;}
      .section{margin-bottom:24px;}.section h3{font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#94A3B8;margin-bottom:10px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;}
      .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;}
      .row .label{color:#64748B;}.row .value{font-weight:600;}
      .total-row{border-top:2px solid #2563EB;margin-top:10px;padding-top:10px;font-size:18px;font-weight:900;color:#2563EB;}
      .footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #E2E8F0;color:#94A3B8;font-size:12px;}
    </style></head><body>
      <div class="header"><div><div class="logo">🚨 RoadRescue AI</div><p>AI-Powered Roadside Assistance</p></div><div><h2>INVOICE</h2><p>Booking: ${booking.id}</p><span class="badge">PAID</span></div></div>
      <div class="section"><h3>Customer Details</h3><div class="row"><span class="label">Name</span><span class="value">${booking.customer_name}</span></div><div class="row"><span class="label">Phone</span><span class="value">${booking.phone}</span></div><div class="row"><span class="label">Email</span><span class="value">${booking.email || 'N/A'}</span></div></div>
      <div class="section"><h3>Vehicle</h3><div class="row"><span class="label">Type</span><span class="value">${booking.vehicle_type}</span></div><div class="row"><span class="label">Number</span><span class="value">${booking.vehicle_number}</span></div></div>
      <div class="section"><h3>Service</h3><div class="row"><span class="label">Service</span><span class="value">${booking.service_name}</span></div><div class="row"><span class="label">Date</span><span class="value">${new Date(booking.booking_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div><div class="row"><span class="label">Location</span><span class="value">${booking.address}</span></div><div class="row"><span class="label">Mechanic</span><span class="value">${booking.mechanic_name}</span></div></div>
      <div class="section"><h3>Payment</h3><div class="row"><span class="label">Service Charge</span><span class="value">₹${booking.price.toLocaleString('en-IN')}</span></div><div class="row"><span class="label">GST (18%)</span><span class="value">₹${Math.round(booking.price * 0.18).toLocaleString('en-IN')}</span></div><div class="row"><span class="label">Method</span><span class="value">${booking.payment_method}</span></div><div class="total-row"><span>Total Paid</span><span>₹${Math.round(booking.price * 1.18).toLocaleString('en-IN')}</span></div></div>
      <div class="footer"><p>Thank you for choosing RoadRescue AI</p><p>This is a computer-generated invoice. No signature required.</p></div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${booking.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (t: string) => {
    if (!t) return '';
    return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getServiceIcon = (name: string) => {
    if (name?.toLowerCase().includes('tire') || name?.toLowerCase().includes('tyre')) return '🔧';
    if (name?.toLowerCase().includes('battery')) return '🔋';
    if (name?.toLowerCase().includes('fuel')) return '⛽';
    if (name?.toLowerCase().includes('engine') || name?.toLowerCase().includes('overheat')) return '💨';
    if (name?.toLowerCase().includes('tow')) return '🚛';
    if (name?.toLowerCase().includes('lock')) return '🔓';
    if (name?.toLowerCase().includes('accident')) return '🚨';
    return '🔧';
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any; glow: string }> = {
      Completed: { bg: 'rgba(34,197,94,0.08)', text: '#16a34a', icon: CheckCircle2, glow: '0 0 20px rgba(34,197,94,0.15)' },
      'In Progress': { bg: 'rgba(37,99,235,0.08)', text: '#2563eb', icon: Zap, glow: '0 0 20px rgba(37,99,235,0.15)' },
      Pending: { bg: 'rgba(245,158,11,0.08)', text: '#d97706', icon: Clock, glow: '0 0 20px rgba(245,158,11,0.15)' },
      Cancelled: { bg: 'rgba(239,68,68,0.08)', text: '#dc2626', icon: XCircle, glow: '0 0 20px rgba(239,68,68,0.15)' },
      Scheduled: { bg: 'rgba(139,92,246,0.08)', text: '#7c3aed', icon: CalendarDays, glow: '0 0 20px rgba(139,92,246,0.15)' },
    };
    return configs[status] || configs.Pending;
  };

  if (loading) {
    return (
      <div className="bh-loading-screen">
        <div className="bh-loading-spinner" />
        <p>Loading your booking history...</p>
      </div>
    );
  }

  return (
    <div className="bh-wrapper">
      {/* Hero Section */}
      <div className="bh-hero">
        <div className="bh-hero-content">
          <div className="bh-hero-badge">
            <FileText size={14} /> Booking History
          </div>
          <h2 className="bh-hero-title">My Booking History</h2>
          <p className="bh-hero-subtitle">
            View your complete roadside assistance history, invoices, payments, mechanics, and service details in one place.
          </p>
        </div>

        <div className="bh-stats-row" ref={statsRef}>
          <div className="bh-stat-card">
            <div className="bh-stat-icon bh-stat-icon-blue"><Car size={20} /></div>
            <div className="bh-stat-value">{animatedStats.total}</div>
            <div className="bh-stat-label">Total Bookings</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-icon bh-stat-icon-green"><CheckCircle2 size={20} /></div>
            <div className="bh-stat-value">{animatedStats.completed}</div>
            <div className="bh-stat-label">Completed</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-icon bh-stat-icon-amber"><Zap size={20} /></div>
            <div className="bh-stat-value">{animatedStats.active}</div>
            <div className="bh-stat-label">Active Requests</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-icon bh-stat-icon-purple"><IndianRupee size={20} /></div>
            <div className="bh-stat-value">₹{animatedStats.spent.toLocaleString('en-IN')}</div>
            <div className="bh-stat-label">Total Spent</div>
          </div>
          <div className="bh-stat-card">
            <div className="bh-stat-icon bh-stat-icon-teal"><Clock size={20} /></div>
            <div className="bh-stat-value">{animatedStats.avgTime}m</div>
            <div className="bh-stat-label">Avg Response</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bh-tab-nav">
        {[
          { id: 'history', label: 'Booking History', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'rewards', label: 'Rewards', icon: Award },
        ].map(tab => (
          <button
            key={tab.id}
            className={`bh-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="bh-content">
        {activeTab === 'history' && (
          <>
            {/* Search & Filters */}
            <div className="bh-search-bar">
              <div className="bh-search-input-wrap">
                <Search size={18} className="bh-search-icon" />
                <input
                  type="text"
                  placeholder="Search by Booking ID, Mechanic, Vehicle, Service..."
                  className="bh-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="bh-search-clear" onClick={() => setSearchQuery('')}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <button className="bh-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {(statusFilter !== 'All' || dateFilter !== 'All' || sortBy !== 'Latest') && (
                  <span className="bh-filter-badge">!</span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bh-filter-panel">
                <div className="bh-filter-group">
                  <label className="bh-filter-label">Status</label>
                  <div className="bh-filter-chips">
                    {['All', 'Completed', 'In Progress', 'Pending', 'Cancelled', 'Scheduled'].map(s => (
                      <button
                        key={s}
                        className={`bh-chip ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bh-filter-group">
                  <label className="bh-filter-label">Date Range</label>
                  <div className="bh-filter-chips">
                    {['All', 'Today', 'This Week', 'This Month', 'Last 6 Months', 'This Year'].map(d => (
                      <button
                        key={d}
                        className={`bh-chip ${dateFilter === d ? 'active' : ''}`}
                        onClick={() => setDateFilter(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bh-filter-group">
                  <label className="bh-filter-label">Sort By</label>
                  <div className="bh-filter-chips">
                    {['Latest', 'Oldest', 'Highest Cost', 'Lowest Cost'].map(s => (
                      <button
                        key={s}
                        className={`bh-chip ${sortBy === s ? 'active' : ''}`}
                        onClick={() => setSortBy(s)}
                      >
                        <ArrowUpDown size={12} /> {s}
                      </button>
                    ))}
                  </div>
                </div>
                {(statusFilter !== 'All' || dateFilter !== 'All' || sortBy !== 'Latest') && (
                  <button className="bh-clear-filters" onClick={() => { setStatusFilter('All'); setDateFilter('All'); setSortBy('Latest'); }}>
                    <X size={14} /> Clear All Filters
                  </button>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="bh-results-count">
              <span>{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found</span>
              {(statusFilter !== 'All' || dateFilter !== 'All') && (
                <span className="bh-results-filtered">Filtered</span>
              )}
            </div>

            {/* Booking Cards */}
            {filteredBookings.length === 0 ? (
              <div className="bh-empty-state">
                <div className="bh-empty-icon">📋</div>
                <h3>No bookings found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
                <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setStatusFilter('All'); setDateFilter('All'); }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="bh-cards-grid">
                {filteredBookings.map((booking, idx) => {
                  const statusCfg = getStatusConfig(booking.status);
                  const StatusIcon = statusCfg.icon;
                  const isExpanded = expandedId === booking.id;

                  return (
                    <div
                      key={booking.id}
                      className={`bh-booking-card ${isExpanded ? 'expanded' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {/* Card Header */}
                      <div className="bh-card-header" onClick={() => setExpandedId(isExpanded ? null : booking.id)}>
                        <div className="bh-card-left">
                          <div className="bh-card-service-icon">{getServiceIcon(booking.service_name)}</div>
                          <div className="bh-card-info">
                            <div className="bh-card-title">{booking.service_name}</div>
                            <div className="bh-card-meta">
                              <span className="bh-card-id">{booking.id}</span>
                              <span className="bh-card-dot">•</span>
                              <span>{formatDate(booking.booking_time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bh-card-right">
                          <div className="bh-card-price">₹{booking.price?.toLocaleString('en-IN')}</div>
                          <div className="bh-card-status" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                            <StatusIcon size={12} /> {booking.status}
                          </div>
                          <div className={`bh-card-chevron ${isExpanded ? 'rotated' : ''}`}>
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>

                      {/* Card Quick Info */}
                      <div className="bh-card-quick-info">
                        <div className="bh-card-quick-item">
                          <Car size={14} />
                          <span>{booking.vehicle_type} • {booking.vehicle_number}</span>
                        </div>
                        <div className="bh-card-quick-item">
                          <MapPin size={14} />
                          <span>{booking.address?.substring(0, 40)}...</span>
                        </div>
                        <div className="bh-card-quick-item">
                          <img src={booking.mechanic_photo} alt="" className="bh-mech-mini-avatar" />
                          <span>{booking.mechanic_name}</span>
                          <span className="bh-mech-rating">
                            <Star size={10} fill="#F59E0B" color="#F59E0B" /> {booking.mechanic_rating}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="bh-card-expanded">
                          {/* Progress Timeline */}
                          <div className="bh-timeline">
                            <div className="bh-timeline-track">
                              <div
                                className="bh-timeline-fill"
                                style={{ width: `${(getStatusStepIndex(booking.status) / (STATUS_STEPS.length - 1)) * 100}%` }}
                              />
                            </div>
                            <div className="bh-timeline-steps">
                              {STATUS_STEPS.map((step, i) => {
                                const statusIdx = getStatusStepIndex(booking.status);
                                const isCompleted = i <= statusIdx;
                                const isCurrent = i === statusIdx;
                                return (
                                  <div key={step} className={`bh-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div className="bh-timeline-dot">
                                      {isCompleted ? <CheckCircle2 size={10} /> : <span>{i + 1}</span>}
                                    </div>
                                    <span className="bh-timeline-step-label">{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="bh-details-grid">
                            <div className="bh-detail-card">
                              <div className="bh-detail-icon"><Car size={16} /></div>
                              <div className="bh-detail-label">Vehicle</div>
                              <div className="bh-detail-value">{booking.vehicle_type} • {booking.vehicle_number}</div>
                            </div>
                            <div className="bh-detail-card">
                              <div className="bh-detail-icon"><MapPin size={16} /></div>
                              <div className="bh-detail-label">Location</div>
                              <div className="bh-detail-value">{booking.address}</div>
                            </div>
                            <div className="bh-detail-card">
                              <div className="bh-detail-icon"><Phone size={16} /></div>
                              <div className="bh-detail-label">Phone</div>
                              <div className="bh-detail-value">{booking.phone}</div>
                            </div>
                            <div className="bh-detail-card">
                              <div className="bh-detail-icon"><CreditCard size={16} /></div>
                              <div className="bh-detail-label">Payment</div>
                              <div className="bh-detail-value">{booking.payment_method} • {booking.payment_status || 'Pending'}</div>
                            </div>
                            <div className="bh-detail-card">
                              <div className="bh-detail-icon"><Clock size={16} /></div>
                              <div className="bh-detail-label">Duration</div>
                              <div className="bh-detail-value">{booking.service_duration}</div>
                            </div>
                            <div className="bh-detail-card">
                              <div className="bh-detail-icon"><Navigation size={16} /></div>
                              <div className="bh-detail-label">Distance</div>
                              <div className="bh-detail-value">{booking.distance}</div>
                            </div>
                          </div>

                          {/* AI Diagnosis */}
                          {booking.ai_diagnosis && (
                            <div className="bh-ai-diagnosis">
                              <div className="bh-ai-header">
                                <Zap size={16} />
                                <span>AI Diagnosis</span>
                              </div>
                              <p>{booking.ai_diagnosis}</p>
                            </div>
                          )}

                          {/* Services Performed */}
                          {booking.services_performed?.length > 0 && (
                            <div className="bh-services-list">
                              <h4>Services Performed</h4>
                              <div className="bh-services-tags">
                                {booking.services_performed.map((s: string, i: number) => (
                                  <span key={i} className="bh-service-tag">
                                    <CheckCircle2 size={12} /> {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Parts Replaced */}
                          {booking.parts_replaced?.length > 0 && (
                            <div className="bh-parts-list">
                              <h4>Parts Replaced</h4>
                              <div className="bh-services-tags">
                                {booking.parts_replaced.map((p: string, i: number) => (
                                  <span key={i} className="bh-part-tag">{p}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cost Breakdown */}
                          <div className="bh-cost-breakdown">
                            <h4>Cost Breakdown</h4>
                            <div className="bh-cost-row">
                              <span>Service Charge</span>
                              <span>₹{booking.price?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bh-cost-row">
                              <span>GST (18%)</span>
                              <span>₹{Math.round((booking.price || 0) * 0.18).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bh-cost-row bh-cost-total">
                              <span>Total</span>
                              <span>₹{Math.round((booking.price || 0) * 1.18).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {/* Mechanic Card */}
                          <div className="bh-mech-card-detail">
                            <img src={booking.mechanic_photo} alt={booking.mechanic_name} className="bh-mech-avatar-lg" />
                            <div className="bh-mech-info-lg">
                              <div className="bh-mech-name-lg">{booking.mechanic_name}</div>
                              <div className="bh-mech-rating-lg">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={14} fill={s <= Math.round(booking.mechanic_rating) ? '#F59E0B' : 'none'} color={s <= Math.round(booking.mechanic_rating) ? '#F59E0B' : '#CBD5E1'} />
                                ))}
                                <span>{booking.mechanic_rating} rating</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="bh-actions-row">
                            <button className="bh-action-btn bh-action-primary" onClick={() => downloadInvoice(booking)}>
                              <Download size={14} /> Invoice
                            </button>
                            <button className="bh-action-btn bh-action-secondary">
                              <RotateCcw size={14} /> Book Again
                            </button>
                            <button className="bh-action-btn bh-action-secondary">
                              <Phone size={14} /> Call
                            </button>
                            <button className="bh-action-btn bh-action-secondary">
                              <MessageCircle size={14} /> Chat
                            </button>
                            <button className="bh-action-btn bh-action-secondary" onClick={() => setShowRouteMap(booking.id)}>
                              <Route size={14} /> Route
                            </button>
                            <button className="bh-action-btn bh-action-secondary">
                              <Share2 size={14} /> Share
                            </button>
                            {booking.status === 'Completed' && (
                              <button className="bh-action-btn bh-action-accent" onClick={() => { setRatingBooking(booking.id); setRatingValue(0); setRatingText(''); }}>
                                <Star size={14} /> Rate
                              </button>
                            )}
                            {booking.status !== 'Completed' && booking.status !== 'Cancelled' && (
                              <button className="bh-action-btn bh-action-primary" onClick={() => setActiveTrackingBooking(booking)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Navigation size={14} /> Track
                              </button>
                            )}
                            {(booking.status === 'Pending' || booking.status === 'In Progress') && (
                              <button className="bh-action-btn bh-action-danger" onClick={() => handleCancel(booking.id)}>
                                <X size={14} /> Cancel
                              </button>
                            )}
                          </div>

                          {/* Route Map Modal */}
                          {showRouteMap === booking.id && (
                            <div className="bh-route-map">
                              <div className="bh-route-header">
                                <h4><Route size={16} /> Route History</h4>
                                <button onClick={() => setShowRouteMap(null)}><X size={16} /></button>
                              </div>
                              <svg viewBox="0 0 400 200" className="bh-route-svg">
                                <defs>
                                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#2563EB" />
                                    <stop offset="100%" stopColor="#22C55E" />
                                  </linearGradient>
                                </defs>
                                <rect width="400" height="200" fill="var(--light-surface)" rx="12" />
                                {/* Grid */}
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <line key={`h${i}`} x1="0" y1={i * 10} x2="400" y2={i * 10} stroke="var(--border-light)" strokeWidth="0.5" />
                                ))}
                                {Array.from({ length: 40 }).map((_, i) => (
                                  <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="200" stroke="var(--border-light)" strokeWidth="0.5" />
                                ))}
                                {/* Roads */}
                                <path d="M 20,100 L 380,100" stroke="var(--border-light)" strokeWidth="20" strokeLinecap="round" />
                                <path d="M 20,100 L 380,100" stroke="white" strokeWidth="1" strokeDasharray="8" opacity="0.4" />
                                <path d="M 200,20 L 200,180" stroke="var(--border-light)" strokeWidth="14" strokeLinecap="round" />
                                {/* Route path */}
                                <path d="M 60,100 Q 130,60 200,100 Q 270,140 340,100" fill="none" stroke="url(#routeGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="0" className="bh-route-anim" />
                                {/* Pickup marker */}
                                <circle cx="60" cy="100" r="8" fill="#2563EB" />
                                <circle cx="60" cy="100" r="12" fill="#2563EB" opacity="0.2" className="bh-pulse" />
                                <text x="60" y="88" textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="700">PICKUP</text>
                                {/* Service location */}
                                <circle cx="340" cy="100" r="8" fill="#22C55E" />
                                <circle cx="340" cy="100" r="12" fill="#22C55E" opacity="0.2" className="bh-pulse" />
                                <text x="340" y="88" textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="700">SERVICE</text>
                                {/* Mechanic marker */}
                                <g className="bh-mech-marker">
                                  <rect x="185" y="85" width="30" height="30" fill="#F59E0B" rx="6" />
                                  <text x="200" y="105" textAnchor="middle" fill="white" fontSize="14">🔧</text>
                                </g>
                              </svg>
                              <div className="bh-route-legend">
                                <span><span className="bh-legend-dot" style={{ background: '#2563EB' }} /> Pickup</span>
                                <span><span className="bh-legend-dot" style={{ background: '#F59E0B' }} /> Mechanic</span>
                                <span><span className="bh-legend-dot" style={{ background: '#22C55E' }} /> Service Point</span>
                                <span className="bh-route-distance">📍 {booking.distance}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="bh-analytics">
            <h3 className="bh-section-title"><BarChart3 size={20} /> Booking Analytics</h3>
            <div className="bh-analytics-grid">
              <div className="bh-analytics-card bh-analytics-blue">
                <div className="bh-analytics-icon"><Wrench size={24} /></div>
                <div className="bh-analytics-value">{bookings.length}</div>
                <div className="bh-analytics-label">Total Services Used</div>
                <div className="bh-analytics-bar">
                  <div className="bh-analytics-bar-fill" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="bh-analytics-card bh-analytics-green">
                <div className="bh-analytics-icon"><Car size={24} /></div>
                <div className="bh-analytics-value">SUV</div>
                <div className="bh-analytics-label">Most Frequent Vehicle</div>
                <div className="bh-analytics-bar">
                  <div className="bh-analytics-bar-fill" style={{ width: '60%', background: '#22C55E' }} />
                </div>
              </div>
              <div className="bh-analytics-card bh-analytics-purple">
                <div className="bh-analytics-icon"><Star size={24} /></div>
                <div className="bh-analytics-value">Flat Tire</div>
                <div className="bh-analytics-label">Most Booked Service</div>
                <div className="bh-analytics-bar">
                  <div className="bh-analytics-bar-fill" style={{ width: '40%', background: '#8B5CF6' }} />
                </div>
              </div>
              <div className="bh-analytics-card bh-analytics-amber">
                <div className="bh-analytics-icon"><Wallet size={24} /></div>
                <div className="bh-analytics-value">₹14,000</div>
                <div className="bh-analytics-label">Money Saved (AI Diagnostics)</div>
                <div className="bh-analytics-bar">
                  <div className="bh-analytics-bar-fill" style={{ width: '75%', background: '#F59E0B' }} />
                </div>
              </div>
              <div className="bh-analytics-card bh-analytics-teal">
                <div className="bh-analytics-icon"><Clock size={24} /></div>
                <div className="bh-analytics-value">18.5 min</div>
                <div className="bh-analytics-label">Average Arrival Time</div>
                <div className="bh-analytics-bar">
                  <div className="bh-analytics-bar-fill" style={{ width: '65%', background: '#14B8A6' }} />
                </div>
              </div>
              <div className="bh-analytics-card bh-analytics-rose">
                <div className="bh-analytics-icon"><ThumbsUp size={24} /></div>
                <div className="bh-analytics-value">Rajesh K.</div>
                <div className="bh-analytics-label">Favorite Mechanic</div>
                <div className="bh-analytics-bar">
                  <div className="bh-analytics-bar-fill" style={{ width: '85%', background: '#F43F5E' }} />
                </div>
              </div>
            </div>

            {/* Services Breakdown Chart */}
            <div className="bh-chart-card">
              <h4>Services Breakdown</h4>
              <div className="bh-bar-chart">
                {[
                  { name: 'Flat Tire', count: 2, color: '#2563EB' },
                  { name: 'Battery', count: 1, color: '#22C55E' },
                  { name: 'Fuel', count: 1, color: '#F59E0B' },
                  { name: 'Engine', count: 1, color: '#EF4444' },
                  { name: 'Towing', count: 1, color: '#8B5CF6' },
                  { name: 'Lockout', count: 1, color: '#14B8A6' },
                ].map((item, i) => (
                  <div key={i} className="bh-bar-row">
                    <span className="bh-bar-label">{item.name}</span>
                    <div className="bh-bar-track">
                      <div className="bh-bar-fill" style={{ width: `${(item.count / 2) * 100}%`, background: item.color, animationDelay: `${i * 0.1}s` }} />
                    </div>
                    <span className="bh-bar-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bh-payments">
            <h3 className="bh-section-title"><CreditCard size={20} /> Payment History</h3>
            <div className="bh-payments-summary">
              <div className="bh-payment-summary-card">
                <div className="bh-payment-summary-icon"><IndianRupee size={20} /></div>
                <div className="bh-payment-summary-value">₹{bookings.filter(b => b.payment_status === 'Paid').reduce((s, b) => s + (b.price || 0), 0).toLocaleString('en-IN')}</div>
                <div className="bh-payment-summary-label">Total Paid</div>
              </div>
              <div className="bh-payment-summary-card">
                <div className="bh-payment-summary-icon bh-pending"><Clock size={20} /></div>
                <div className="bh-payment-summary-value">₹{bookings.filter(b => b.payment_status === 'Pending').reduce((s, b) => s + (b.price || 0), 0).toLocaleString('en-IN')}</div>
                <div className="bh-payment-summary-label">Pending</div>
              </div>
              <div className="bh-payment-summary-card">
                <div className="bh-payment-summary-icon bh-saved"><Wallet size={20} /></div>
                <div className="bh-payment-summary-value">₹2,450</div>
                <div className="bh-payment-summary-label">Cashback Earned</div>
              </div>
            </div>

            <div className="bh-payment-list">
              {bookings.filter(b => b.payment_status === 'Paid').map((b, i) => (
                <div key={b.id} className="bh-payment-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="bh-payment-left">
                    <div className="bh-payment-method-icon">
                      {b.payment_method === 'UPI' ? '📱' : b.payment_method === 'Card' ? '💳' : '👛'}
                    </div>
                    <div>
                      <div className="bh-payment-title">{b.service_name}</div>
                      <div className="bh-payment-meta">
                        <span>{b.id}</span>
                        <span>•</span>
                        <span>{formatDate(b.booking_time)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bh-payment-right">
                    <div className="bh-payment-amount">₹{b.price?.toLocaleString('en-IN')}</div>
                    <div className="bh-payment-method-label">{b.payment_method}</div>
                    <button className="bh-payment-download" onClick={() => downloadInvoice(b)}>
                      <Download size={12} /> Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="bh-rewards">
            <h3 className="bh-section-title"><Award size={20} /> Rewards & Membership</h3>

            <div className="bh-rewards-hero-card">
              <div className="bh-rewards-circle-container">
                <div className="bh-rewards-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#22C55E" strokeWidth="8" strokeDasharray="264" strokeDashoffset="79" strokeLinecap="round" className="bh-rewards-progress" />
                  </svg>
                  <div className="bh-rewards-circle-text">
                    <span className="bh-rewards-points">4,200</span>
                    <span className="bh-rewards-pts-label">Points</span>
                  </div>
                </div>
                <div className="bh-rewards-info">
                  <div className="bh-rewards-tier">🏆 Gold Tier Driver</div>
                  <p>You have <strong>2 emergency credits</strong> remaining. Refer friends to earn more credits!</p>
                  <div className="bh-rewards-progress-info">
                    <span>4,200 / 6,000 points to Platinum</span>
                    <div className="bh-rewards-progress-bar">
                      <div className="bh-rewards-progress-fill" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bh-rewards-grid">
              <div className="bh-reward-card">
                <div className="bh-reward-icon">💰</div>
                <div className="bh-reward-value">₹2,450</div>
                <div className="bh-reward-label">Cashback Received</div>
              </div>
              <div className="bh-reward-card">
                <div className="bh-reward-icon">🎫</div>
                <div className="bh-reward-value">5</div>
                <div className="bh-reward-label">Coupons Used</div>
              </div>
              <div className="bh-reward-card">
                <div className="bh-reward-icon">⭐</div>
                <div className="bh-reward-value">4.8</div>
                <div className="bh-reward-label">Avg Rating Given</div>
              </div>
              <div className="bh-reward-card">
                <div className="bh-reward-icon">🎁</div>
                <div className="bh-reward-value">3</div>
                <div className="bh-reward-label">Free Services</div>
              </div>
            </div>

            <div className="bh-membership-card">
              <h4>Membership Benefits</h4>
              <div className="bh-benefits-list">
                <div className="bh-benefit-item"><CheckCircle2 size={16} /> Priority dispatch (avg 8 min response)</div>
                <div className="bh-benefit-item"><CheckCircle2 size={16} /> 10% discount on all services</div>
                <div className="bh-benefit-item"><CheckCircle2 size={16} /> 2 free emergency credits per month</div>
                <div className="bh-benefit-item"><CheckCircle2 size={16} /> Free annual vehicle health checkup</div>
                <div className="bh-benefit-item"><CheckCircle2 size={16} /> 24/7 dedicated support hotline</div>
                <div className="bh-benefit-item"><CheckCircle2 size={16} /> Exclusive partner discounts</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingBooking && (
        <div className="bh-modal-overlay" onClick={() => setRatingBooking(null)}>
          <div className="bh-modal-card" onClick={e => e.stopPropagation()}>
            <div className="bh-modal-header">
              <h3>Rate Your Experience</h3>
              <button onClick={() => setRatingBooking(null)}><X size={20} /></button>
            </div>
            <div className="bh-rating-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className={`bh-rating-star ${s <= ratingValue ? 'active' : ''}`}
                  onClick={() => setRatingValue(s)}
                >
                  <Star size={32} fill={s <= ratingValue ? '#F59E0B' : 'none'} color={s <= ratingValue ? '#F59E0B' : '#CBD5E1'} />
                </button>
              ))}
            </div>
            <textarea
              className="bh-rating-textarea"
              placeholder="Share your experience with the mechanic..."
              value={ratingText}
              onChange={e => setRatingText(e.target.value)}
              rows={4}
            />
            <div className="bh-rating-actions">
              <button className="bh-action-btn bh-action-secondary" onClick={() => setRatingBooking(null)}>Cancel</button>
              <button
                className="bh-action-btn bh-action-primary"
                disabled={ratingValue === 0}
                onClick={() => {
                  alert(`Thank you! You rated ${ratingValue}/5 stars.`);
                  setRatingBooking(null);
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Book Again Button (Mobile) */}
      <button className="bh-float-book" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <Zap size={20} /> Quick Book
      </button>

      {/* Mechanic Tracker Modal */}
      <MechanicTrackerModal
        isOpen={!!activeTrackingBooking}
        onClose={() => setActiveTrackingBooking(null)}
        booking={activeTrackingBooking}
        onStatusUpdate={loadBookings}
      />
    </div>
  );
}
