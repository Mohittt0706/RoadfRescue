import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, Users, Wrench, CreditCard, BarChart3, 
  Bell, Settings, LogOut, TrendingUp, Clock, CheckCircle, AlertCircle,
  Search, Eye, UserPlus, Check, X, Phone, Mail, MapPin, Navigation,
  ArrowUpRight, DollarSign,
  AlertTriangle, ArrowDown, Trash2, Edit3, SlidersHorizontal,
  ChevronLeft, ChevronRight, Star, ToggleLeft, ToggleRight
} from 'lucide-react';
import { BookingStore, NotificationStore, MechanicStore, CustomerStore, DashboardStore, AnalyticsStore, EmergencyStore } from '../services/store';
import AdminSettings from './AdminSettings';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'bookings' | 'customers' | 'mechanics' | 'payments' | 'analytics' | 'notifications' | 'settings' | 'emergencies';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [data, setData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [assignModalBooking, setAssignModalBooking] = useState<any>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);
  const [showEmergencyDetail, setShowEmergencyDetail] = useState(false);
  const [assignModalEmergency, setAssignModalEmergency] = useState<any>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSortField, setCustomerSortField] = useState('registrationDate');
  const [customerSortDir, setCustomerSortDir] = useState<'asc' | 'desc'>('desc');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState<any>(null);

  const [mechanicSearch, setMechanicSearch] = useState('');
  const [mechanicStatusFilter, setMechanicStatusFilter] = useState('all');
  const [mechanicSortField, setMechanicSortField] = useState('name');
  const [mechanicSortDir, setMechanicSortDir] = useState<'asc' | 'desc'>('asc');
  const [mechanicPage, setMechanicPage] = useState(1);
  const [mechanicPageSize] = useState(10);
  const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
  const [showMechanicDetail, setShowMechanicDetail] = useState(false);
  const [confirmDeleteMechanic, setConfirmDeleteMechanic] = useState<any>(null);

  const loadData = () => {
    const list = BookingStore.getAll();
    const stats = DashboardStore.getAdminStats();
    const mechs = MechanicStore.getAll();
    const notifs = NotificationStore.getAll().filter((n: any) => n.role === 'admin');
    const chartData = AnalyticsStore.getChartData();
    const emergencyList = EmergencyStore.getAll();
    const sosStats = EmergencyStore.getStats();
    const sosAnalytics = EmergencyStore.getAnalytics();
    const custList = CustomerStore.getAll();

    setData({
      stats,
      sosStats,
      sosAnalytics,
      recentBookings: list,
      charts: chartData,
      customers: custList
    });
    setBookings(list);
    setMechanics(mechs);
    setNotifications(notifs);
    setEmergencies(emergencyList);
    setCustomers(custList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to stores for reactive updates across components and tabs
    const unsubscribeBookings = BookingStore.subscribe(loadData);
    const unsubscribeNotifications = NotificationStore.subscribe(loadData);
    const unsubscribeMechanics = MechanicStore.subscribe(loadData);
    const unsubscribeEmergencies = EmergencyStore.subscribe(loadData);
    const unsubscribeCustomers = CustomerStore.subscribe(loadData);

    return () => {
      unsubscribeBookings();
      unsubscribeNotifications();
      unsubscribeMechanics();
      unsubscribeEmergencies();
      unsubscribeCustomers();
    };
  }, []);

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = !searchQuery || 
      b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone?.includes(searchQuery) ||
      b.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEmergencies = emergencies.filter(e => {
    const matchesSearch = !searchQuery || 
      e.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone?.includes(searchQuery) ||
      e.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBookingAction = (bookingId: string, action: string, note?: string) => {
    if (action === 'accept') {
      BookingStore.updateStatus(bookingId, 'Accepted', note || 'Booking accepted by admin');
    } else if (action === 'complete') {
      BookingStore.updateStatus(bookingId, 'Completed', note || 'Service completed');
    } else if (action === 'cancel') {
      BookingStore.updateStatus(bookingId, 'Cancelled', note || 'Booking cancelled');
    } else if (action === 'delete') {
      BookingStore.delete(bookingId);
    }
    loadData();
  };

  const handleEmergencyAction = (emergencyId: string, action: string) => {
    if (action === 'accept') {
      EmergencyStore.updateStatus(emergencyId, 'Accepted', 'Accepted by admin');
    } else if (action === 'Mechanic En Route') {
      EmergencyStore.updateStatus(emergencyId, 'Mechanic En Route', 'Mechanic is en route');
    } else if (action === 'Arrived') {
      EmergencyStore.updateStatus(emergencyId, 'Arrived', 'Mechanic has arrived');
    } else if (action === 'completed') {
      EmergencyStore.updateStatus(emergencyId, 'Completed', 'Service completed');
    } else if (action === 'cancel') {
      EmergencyStore.updateStatus(emergencyId, 'Cancelled', 'Cancelled by admin');
    } else if (action === 'delete') {
      EmergencyStore.delete(emergencyId);
    }
    loadData();
  };

  const handleAssignMechanic = (bookingId: string, mechanicId: string) => {
    BookingStore.assignMechanic(bookingId, mechanicId);
    setAssignModalBooking(null);
    loadData();
  };

  const handleAssignMechanicToEmergency = (emergencyId: string, mechanicName: string, price: number, eta: string) => {
    EmergencyStore.assign(emergencyId, mechanicName, eta, price);
    setAssignModalEmergency(null);
    loadData();
  };

  const markAllRead = () => {
    NotificationStore.markAllRead('admin');
    loadData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading Admin Dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fff' }}>RoadRescue</div>
              <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 700, letterSpacing: '0.1em' }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {([
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: 0 },
            { id: 'emergencies', icon: AlertCircle, label: '🚨 SOS Emergencies', badge: emergencies.filter(e => e.status === 'Pending').length },
            { id: 'bookings', icon: Calendar, label: 'Bookings', badge: 0 },
            { id: 'customers', icon: Users, label: 'Customers', badge: 0 },
            { id: 'mechanics', icon: Wrench, label: 'Mechanics', badge: 0 },
            { id: 'payments', icon: CreditCard, label: 'Payments', badge: 0 },
            { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: 0 },
            { id: 'notifications', icon: Bell, label: 'Notifications', badge: stats?.unreadNotifications || 0 },
            { id: 'settings', icon: Settings, label: 'Settings', badge: 0 },
          ] as const).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem',
              borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              background: activeTab === item.id ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeTab === item.id ? '#3b82f6' : '#94a3b8',
              fontSize: '0.85rem', fontWeight: activeTab === item.id ? 700 : 500,
              transition: 'all 0.15s',
            }}>
              <item.icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? (
                <span style={{
                  background: '#ef4444', color: '#fff', borderRadius: '50%', width: 20, height: 20,
                  fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem',
            borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%',
            background: 'transparent', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600,
          }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top Bar */}
        <header style={{
          padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>
            {activeTab}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem 0.75rem',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Search size={14} color="#94a3b8" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..." style={{
                  background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: 200,
                }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Bell size={20} color="#94a3b8" style={{ cursor: 'pointer' }} />
              {stats.unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{stats.unreadNotifications}</span>
              )}
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
            }}>A</div>
          </div>
        </header>

        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: '#3b82f6', change: '+12%' },
                  { label: "Today's Bookings", value: stats.todayBookings, icon: Clock, color: '#8b5cf6', change: '+5%' },
                  { label: 'Pending Jobs', value: stats.pendingJobs, icon: AlertCircle, color: '#f59e0b', change: '' },
                  { label: 'Completed Jobs', value: stats.completedJobs, icon: CheckCircle, color: '#22c55e', change: '+8%' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: '#1e293b', borderRadius: '14px', padding: '1.25rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{stat.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem' }}>{stat.value}</div>
                      </div>
                      <div style={{ background: `${stat.color}15`, borderRadius: '10px', padding: '0.5rem' }}>
                        <stat.icon size={20} color={stat.color} />
                      </div>
                    </div>
                    {stat.change && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <ArrowUpRight size={14} color="#22c55e" />
                        <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>{stat.change}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>vs yesterday</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SOS Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'SOS Today', value: data?.sosStats?.sosToday || 0, icon: AlertCircle, color: '#ef4444' },
                  { label: 'Pending SOS', value: data?.sosStats?.pendingSOS || 0, icon: Clock, color: '#f59e0b' },
                  { label: 'Critical SOS', value: data?.sosStats?.criticalSOS || 0, icon: AlertTriangle, color: '#dc2626' },
                  { label: 'Completed SOS', value: data?.sosStats?.completedSOS || 0, icon: CheckCircle, color: '#22c55e' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: '#1e293b', borderRadius: '14px', padding: '1.25rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{stat.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem' }}>{stat.value}</div>
                      </div>
                      <div style={{ background: `${stat.color}15`, borderRadius: '10px', padding: '0.5rem' }}>
                        <stat.icon size={20} color={stat.color} />
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{
                  background: '#1e293b', borderRadius: '14px', padding: '1.25rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Avg Response Time</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem' }}>
                        {data?.sosStats?.avgResponseTime || 0}<span style={{ fontSize: '0.9rem' }}> min</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '10px', padding: '0.5rem' }}>
                      <Clock size={20} color="#8b5cf6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <DollarSign size={18} color="#22c55e" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Revenue Today</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>₹{(stats.revenueToday || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <TrendingUp size={18} color="#3b82f6" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Revenue This Month</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>₹{(stats.revenueMonth || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Mechanics Status + Recent */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Mechanic Status</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>{stats.availableMechanics}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Available</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{stats.busyMechanics}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Busy</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Service Distribution</h3>
                  {(data?.charts?.serviceDistribution || []).slice(0, 5).map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{s.service}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.count} jobs</span>
                        <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>₹{(s.revenue || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Bookings */}
              <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>View All →</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['ID', 'Customer', 'Service', 'Price', 'Status', 'Time'].map(h => (
                          <th key={h} style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentBookings || []).slice(0, 5).map((b: any) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{b.id?.slice(0, 16)}</span></td>
                          <td style={tdStyle}>{b.customer_name}</td>
                          <td style={tdStyle}>{b.service_name}</td>
                          <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 700 }}>₹{b.price?.toLocaleString('en-IN')}</td>
                          <td style={tdStyle}><StatusBadge status={b.status} /></td>
                          <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.75rem' }}>{formatTime(b.booking_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent SOS */}
              <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(239,68,68,0.15)', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>🚨 Recent SOS Emergencies</h3>
                  <button onClick={() => setActiveTab('emergencies')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>View All →</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['SOS ID', 'Customer', 'Emergency', 'Priority', 'Status'].map(h => (
                          <th key={h} style={{ padding: '0.6rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {emergencies.slice(0, 5).map((e: any) => (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}>{e.id}</span></td>
                          <td style={tdStyle}>{e.customer_name}</td>
                          <td style={tdStyle}>{e.emergency_type}</td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800,
                              background: e.priority === 'Critical' ? 'rgba(239,68,68,0.15)' : e.priority === 'Urgent' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                              color: e.priority === 'Critical' ? '#ef4444' : e.priority === 'Urgent' ? '#f59e0b' : '#22c55e',
                            }}>{e.priority || 'Normal'}</span>
                          </td>
                          <td style={tdStyle}><StatusBadge status={e.status} /></td>
                        </tr>
                      ))}
                      {emergencies.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No SOS emergencies yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', 'Pending', 'Accepted', 'Mechanic Assigned', 'Completed', 'Cancelled'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                    border: statusFilter === s ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                    background: statusFilter === s ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                    color: statusFilter === s ? '#3b82f6' : '#94a3b8', cursor: 'pointer',
                  }}>{s === 'all' ? 'All' : s}</button>
                ))}
              </div>

              <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Booking ID', 'Customer', 'Phone', 'Service', 'Vehicle', 'Price', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 0.6rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length === 0 ? (
                        <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No bookings found</td></tr>
                      ) : filteredBookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{b.id?.slice(0, 18)}</span></td>
                          <td style={tdStyle}>{b.customer_name}</td>
                          <td style={tdStyle}>{b.phone}</td>
                          <td style={tdStyle}>{b.service_name}</td>
                          <td style={tdStyle}>{b.vehicle_number}</td>
                          <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 700 }}>₹{b.price?.toLocaleString('en-IN')}</td>
                          <td style={tdStyle}><StatusBadge status={b.status} /></td>
                          <td style={{ ...tdStyle }}>
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap' }}>
                              <ActionBtn icon={Eye} color="#3b82f6" title="View" onClick={() => { setSelectedBooking(b); setShowBookingDetail(true); }} />
                              {b.status === 'Pending' && <ActionBtn icon={Check} color="#22c55e" title="Accept" onClick={() => handleBookingAction(b.id, 'accept')} />}
                              {(b.status === 'Pending' || b.status === 'Accepted') && !b.assigned_mechanic_id && (
                                <ActionBtn icon={UserPlus} color="#8b5cf6" title="Assign" onClick={() => setAssignModalBooking(b)} />
                              )}
                              {b.status === 'Accepted' && <ActionBtn icon={CheckCircle} color="#22c55e" title="Complete" onClick={() => handleBookingAction(b.id, 'complete')} />}
                              {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                                <ActionBtn icon={X} color="#ef4444" title="Cancel" onClick={() => handleBookingAction(b.id, 'cancel')} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SOS Emergencies Tab */}
          {activeTab === 'emergencies' && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', 'Pending', 'Accepted', 'Mechanic Assigned', 'Mechanic En Route', 'Arrived', 'Completed', 'Cancelled'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                    border: statusFilter === s ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                    background: statusFilter === s ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                    color: statusFilter === s ? '#ef4444' : '#94a3b8', cursor: 'pointer',
                  }}>{s === 'all' ? 'All' : s}</button>
                ))}
              </div>

              <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['SOS ID', 'Customer', 'Phone', 'Emergency', 'Vehicle', 'Price', 'Payment', 'Priority', 'Status', 'Assigned Mechanic', 'Created Time', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 0.6rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmergencies.length === 0 && emergencies.length === 0 ? (
                        <tr><td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No emergency requests found</td></tr>
                      ) : filteredEmergencies.length === 0 && emergencies.length > 0 ? (
                        <tr><td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No SOS emergencies match the current filter</td></tr>
                      ) : filteredEmergencies.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#ef4444', fontWeight: 800 }}>{e.id}</span></td>
                          <td style={tdStyle}>{e.customer_name}</td>
                          <td style={tdStyle}>{e.phone}</td>
                          <td style={tdStyle}>{e.emergency_type}</td>
                          <td style={tdStyle}>{e.vehicle_type || e.vehicle} ({e.vehicle_number})</td>
                          <td style={tdStyle}><span style={{ color: '#22c55e', fontWeight: 700 }}>₹{(e.price || 0).toLocaleString('en-IN')}</span></td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800,
                              background: e.payment_status === 'Paid' ? 'rgba(34,197,94,0.15)' : e.payment_status === 'Failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: e.payment_status === 'Paid' ? '#22c55e' : e.payment_status === 'Failed' ? '#ef4444' : '#f59e0b',
                            }}>{e.payment_status || 'Pending'}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800,
                              background: e.priority === 'Critical' ? 'rgba(239,68,68,0.15)' : e.priority === 'Urgent' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                              color: e.priority === 'Critical' ? '#ef4444' : e.priority === 'Urgent' ? '#f59e0b' : '#22c55e',
                            }}>{e.priority}</span>
                          </td>
                          <td style={tdStyle}><StatusBadge status={e.status} /></td>
                          <td style={tdStyle}>
                            {e.assigned_mechanic || (
                              <span style={{ color: '#64748b', fontStyle: 'italic' }}>Not assigned</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.75rem' }}>
                            {formatTime(e.created_time || e.booking_time)}
                          </td>
                          <td style={{ ...tdStyle }}>
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap' }}>
                              <ActionBtn icon={Eye} color="#3b82f6" title="View Details" onClick={() => { setSelectedEmergency(e); setShowEmergencyDetail(true); }} />
                              {e.status === 'Pending' && <ActionBtn icon={Check} color="#22c55e" title="Accept Request" onClick={() => handleEmergencyAction(e.id, 'accept')} />}
                              {(e.status === 'Pending' || e.status === 'Accepted') && !e.assigned_mechanic && (
                                <ActionBtn icon={UserPlus} color="#8b5cf6" title="Assign Mechanic" onClick={() => setAssignModalEmergency(e)} />
                              )}
                              {e.status === 'Mechanic Assigned' && <ActionBtn icon={Navigation} color="#3b82f6" title="Mark En Route" onClick={() => handleEmergencyAction(e.id, 'Mechanic En Route')} />}
                              {e.status === 'Mechanic En Route' && <ActionBtn icon={MapPin} color="#8b5cf6" title="Mark Arrived" onClick={() => handleEmergencyAction(e.id, 'Arrived')} />}
                              {e.status === 'Arrived' && <ActionBtn icon={CheckCircle} color="#22c55e" title="Mark Completed" onClick={() => handleEmergencyAction(e.id, 'completed')} />}
                              {e.status !== 'Cancelled' && e.status !== 'Completed' && (
                                <ActionBtn icon={X} color="#ef4444" title="Cancel Request" onClick={() => handleEmergencyAction(e.id, 'cancel')} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Mechanics Tab */}
          {activeTab === 'mechanics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.4rem 0.75rem',
                    border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <Search size={14} color="#94a3b8" />
                    <input value={mechanicSearch} onChange={e => { setMechanicSearch(e.target.value); setMechanicPage(1); }}
                      placeholder="Search mechanics..." style={{
                        background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: 200,
                      }} />
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{mechanics.length} mechanics</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Status:</span>
                  <select value={mechanicStatusFilter} onChange={e => { setMechanicStatusFilter(e.target.value); setMechanicPage(1); }} style={{
                    padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.8rem',
                  }}>
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                  </select>
                  <button onClick={() => setMechanicSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#94a3b8', display: 'flex',
                  }}>
                    <ArrowDown size={14} style={{ transform: mechanicSortDir === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>
              </div>

              {mechanics.length === 0 ? (
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
                  <Wrench size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#fff' }}>No Mechanics Yet</h3>
                  <p>Mechanics will appear when they register.</p>
                </div>
              ) : (
                <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Mechanic ID', 'Name', 'Phone', 'Email', 'Workshop', 'Experience', 'Skills', 'Rating', 'Jobs Done', 'Pending', 'Today', 'Availability', 'Online', 'Revenue', 'Location', 'Assigned Job', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(mechanics
                          .filter((m: any) => {
                            if (mechanicStatusFilter !== 'all' && m.status !== mechanicStatusFilter) return false;
                            return !mechanicSearch || m.name?.toLowerCase().includes(mechanicSearch.toLowerCase()) || m.phone?.includes(mechanicSearch) || m.email?.toLowerCase().includes(mechanicSearch.toLowerCase()) || m.id?.toLowerCase().includes(mechanicSearch.toLowerCase()) || m.workshopName?.toLowerCase().includes(mechanicSearch.toLowerCase());
                          })
                          .sort((a: any, b: any) => {
                            let cmp = 0;
                            const field = mechanicSortField;
                            if (field === 'name') cmp = (a.name || '').localeCompare(b.name || '');
                            else if (field === 'rating') cmp = (a.rating || 0) - (b.rating || 0);
                            else if (field === 'total_jobs') cmp = (a.total_jobs || 0) - (b.total_jobs || 0);
                            else if (field === 'revenue') cmp = (a.revenue || 0) - (b.revenue || 0);
                            return mechanicSortDir === 'asc' ? cmp : -cmp;
                          })
                          .slice((mechanicPage - 1) * mechanicPageSize, mechanicPage * mechanicPageSize)
                        ).map((m: any) => (
                          <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{m.id}</span></td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: m.online !== false ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                                }}>🔧</div>
                                <span>{m.name}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>{m.phone}</td>
                            <td style={tdStyle}>{m.email || <span style={{ color: '#64748b', fontStyle: 'italic' }}>N/A</span>}</td>
                            <td style={tdStyle}>{m.workshopName || m.specialization || '-'}</td>
                            <td style={tdStyle}>
                              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{m.experience_years || 0}yr</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {(m.skills || []).slice(0, 2).join(', ')}{(m.skills || []).length > 2 ? '...' : ''}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {(m.rating || 5).toFixed(1)}</span>
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: '#22c55e' }}>{m.total_jobs || m.jobsCompleted || 0}</td>
                            <td style={{ ...tdStyle, color: '#f59e0b' }}>{m.pendingJobs || 0}</td>
                            <td style={{ ...tdStyle, color: '#3b82f6' }}>{m.todayJobs || 0}</td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                background: m.status === 'available' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                                color: m.status === 'available' ? '#22c55e' : '#f59e0b',
                              }}>{m.status || 'available'}</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                background: m.online !== false ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)',
                                color: m.online !== false ? '#22c55e' : '#94a3b8',
                              }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.online !== false ? '#22c55e' : '#94a3b8' }} />
                                {m.online !== false ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 700 }}>₹{(m.revenue || 0).toLocaleString('en-IN')}</td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={12} color="#64748b" />
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.location || 'N/A'}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontSize: '0.75rem', color: m.assignedJob ? '#3b82f6' : '#64748b' }}>
                                {m.assignedJob || (m.status === 'busy' ? 'On a job' : 'None')}
                              </span>
                            </td>
                            <td style={{ ...tdStyle }}>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <ActionBtn icon={Eye} color="#3b82f6" title="View" onClick={() => { setSelectedMechanic(m); setShowMechanicDetail(true); }} />
                                <ActionBtn icon={Edit3} color="#8b5cf6" title="Edit" onClick={() => {
                                  MechanicStore.update(m.id, { name: prompt('Name:', m.name) || m.name });
                                  loadData();
                                }} />
                                <ActionBtn icon={Trash2} color="#ef4444" title="Delete" onClick={() => setConfirmDeleteMechanic(m)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Showing {Math.min((mechanicPage - 1) * mechanicPageSize + 1, mechanics.length)}-{Math.min(mechanicPage * mechanicPageSize, mechanics.length)} of {mechanics.length}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button disabled={mechanicPage <= 1} onClick={() => setMechanicPage(p => Math.max(1, p - 1))} style={{
                        padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: mechanicPage > 1 ? 'pointer' : 'not-allowed', color: mechanicPage > 1 ? '#94a3b8' : '#475569',
                      }}><ChevronLeft size={14} /></button>
                      <span style={{ padding: '0.35rem 0.6rem', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{mechanicPage}</span>
                      <button disabled={mechanicPage * mechanicPageSize >= mechanics.length} onClick={() => setMechanicPage(p => p + 1)} style={{
                        padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: mechanicPage * mechanicPageSize < mechanics.length ? 'pointer' : 'not-allowed',
                        color: mechanicPage * mechanicPageSize < mechanics.length ? '#94a3b8' : '#475569',
                      }}><ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{notifications.length} notifications</span>
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mark all read</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    background: n.read ? '#1e293b' : 'rgba(59,130,246,0.06)',
                    borderRadius: '10px', padding: '1rem',
                    border: `1px solid ${n.read ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.15)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{n.title}</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatTime(n.created_at)}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'pre-line' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.4rem 0.75rem',
                    border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <Search size={14} color="#94a3b8" />
                    <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setCustomerPage(1); }}
                      placeholder="Search customers..." style={{
                        background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: 200,
                      }} />
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{customers.length} customers</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Sort:</span>
                  <select value={customerSortField} onChange={e => setCustomerSortField(e.target.value)} style={{
                    padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.8rem',
                  }}>
                    <option value="registrationDate">Registration Date</option>
                    <option value="name">Name</option>
                    <option value="totalBookings">Bookings</option>
                    <option value="totalSpent">Total Spent</option>
                    <option value="sosCount">SOS Count</option>
                  </select>
                  <button onClick={() => setCustomerSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#94a3b8', display: 'flex',
                  }}>
                    <ArrowDown size={14} style={{ transform: customerSortDir === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>
              </div>

              {customers.length === 0 ? (
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
                  <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#fff' }}>No Customers Yet</h3>
                  <p>Customers will appear as they register or create bookings.</p>
                </div>
              ) : (
                <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Customer ID', 'Name', 'Phone', 'Email', 'Vehicles', 'Bookings', 'SOS', 'Completed', 'Cancelled', 'Spent', 'Last Booking', 'Registered', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(customers
                          .filter((c: any) => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch) || c.email?.toLowerCase().includes(customerSearch.toLowerCase()) || c.id?.toLowerCase().includes(customerSearch.toLowerCase()))
                          .sort((a: any, b: any) => {
                            let cmp = 0;
                            if (customerSortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
                            else if (customerSortField === 'totalBookings') cmp = (a.totalBookings || 0) - (b.totalBookings || 0);
                            else if (customerSortField === 'totalSpent') cmp = (a.totalSpent || 0) - (b.totalSpent || 0);
                            else if (customerSortField === 'sosCount') cmp = (a.sosCount || 0) - (b.sosCount || 0);
                            else cmp = new Date(a.registrationDate || 0).getTime() - new Date(b.registrationDate || 0).getTime();
                            return customerSortDir === 'asc' ? cmp : -cmp;
                          })
                          .slice((customerPage - 1) * customerPageSize, customerPage * customerPageSize)
                        ).map((c: any) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{c.id}</span></td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: c.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.7rem', fontWeight: 800, color: c.status === 'active' ? '#22c55e' : '#94a3b8',
                                }}>{c.avatar || (c.name || 'G').charAt(0).toUpperCase()}</div>
                                <span>{c.name}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>{c.phone || <span style={{ color: '#64748b', fontStyle: 'italic' }}>N/A</span>}</td>
                            <td style={tdStyle}>{c.email || <span style={{ color: '#64748b', fontStyle: 'italic' }}>N/A</span>}</td>
                            <td style={tdStyle}>
                              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{c.vehicleCount || 0}</span>
                              {c.vehicleNumbers?.length > 0 && (
                                <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.25rem' }}>
                                  ({c.vehicleNumbers.slice(0, 2).join(', ')}{c.vehicleNumbers.length > 2 ? '...' : ''})
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>{c.totalBookings || 0}</td>
                            <td style={{ ...tdStyle, color: '#ef4444', fontWeight: 700 }}>{c.sosCount || 0}</td>
                            <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 600 }}>{c.completedJobs || 0}</td>
                            <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 600 }}>{c.cancelledJobs || 0}</td>
                            <td style={{ ...tdStyle, color: '#22c55e', fontWeight: 700 }}>₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                            <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.75rem' }}>{c.lastBooking ? formatTime(c.lastBooking) : '-'}</td>
                            <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.75rem' }}>{c.registrationDate ? new Date(c.registrationDate).toLocaleDateString('en-IN') : '-'}</td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                                background: c.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)',
                                color: c.status === 'active' ? '#22c55e' : '#94a3b8',
                              }}>{c.status === 'active' ? 'Active' : 'Disabled'}</span>
                            </td>
                            <td style={{ ...tdStyle }}>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <ActionBtn icon={Eye} color="#3b82f6" title="View" onClick={() => { setSelectedCustomer(c); setShowCustomerDetail(true); }} />
                                <ActionBtn icon={c.status === 'active' ? ToggleLeft : ToggleRight} color={c.status === 'active' ? '#f59e0b' : '#22c55e'} title={c.status === 'active' ? 'Disable' : 'Enable'} onClick={() => {
                                  CustomerStore.update(c.id, { status: c.status === 'active' ? 'disabled' : 'active' });
                                  loadData();
                                }} />
                                <ActionBtn icon={Trash2} color="#ef4444" title="Delete" onClick={() => setConfirmDeleteCustomer(c)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Showing {Math.min((customerPage - 1) * customerPageSize + 1, customers.length)}-{Math.min(customerPage * customerPageSize, customers.length)} of {customers.length}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button disabled={customerPage <= 1} onClick={() => setCustomerPage(p => Math.max(1, p - 1))} style={{
                        padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: customerPage > 1 ? 'pointer' : 'not-allowed', color: customerPage > 1 ? '#94a3b8' : '#475569',
                      }}><ChevronLeft size={14} /></button>
                      <span style={{ padding: '0.35rem 0.6rem', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{customerPage}</span>
                      <button disabled={customerPage * customerPageSize >= customers.length} onClick={() => setCustomerPage(p => p + 1)} style={{
                        padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: customerPage * customerPageSize < customers.length ? 'pointer' : 'not-allowed',
                        color: customerPage * customerPageSize < customers.length ? '#94a3b8' : '#475569',
                      }}><ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
              <CreditCard size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ color: '#fff' }}>Payment Analytics</h3>
              <p>Payment tracking and analytics will appear here.</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              {/* SOS Analytics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>🚨 SOS by Type</h3>
                  {(data?.sosAnalytics?.sosByType || []).length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No SOS data yet</p>
                  ) : (data?.sosAnalytics?.sosByType || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{s.type}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{s.count} requests</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>🚨 SOS by Priority</h3>
                  {(data?.sosAnalytics?.sosByPriority || []).length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No SOS data yet</p>
                  ) : (data?.sosAnalytics?.sosByPriority || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{
                        fontSize: '0.8rem', color: '#cbd5e1',
                        fontWeight: s.priority === 'Critical' ? 800 : s.priority === 'Urgent' ? 700 : 500
                      }}>{s.priority}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{s.count} requests</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>📅 Daily SOS (Last 7 Days)</h3>
                  {(data?.sosAnalytics?.dailySOS || []).length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No SOS data yet</p>
                  ) : (data?.sosAnalytics?.dailySOS || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 800 }}>{s.count}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>📊 Weekly SOS</h3>
                  {(data?.sosAnalytics?.weeklySOS || []).length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No SOS data yet</p>
                  ) : (data?.sosAnalytics?.weeklySOS || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{s.week}</span>
                      <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 800 }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#22c55e' }}>{data?.sosAnalytics?.completedPercent || 0}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Completion Rate</div>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>{data?.sosAnalytics?.avgEta || 0} <span style={{ fontSize: '1rem' }}>min</span></div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Average ETA</div>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6' }}>{(data?.sosAnalytics?.sosByType || []).length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Service Types</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <AdminSettings />
          )}
        </div>
      </main>

      {/* Booking Detail Modal */}
      {showBookingDetail && selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setShowBookingDetail(false)} />
      )}

      {/* Assign Mechanic Modal */}
      {assignModalBooking && (
        <AssignMechanicModal
          booking={assignModalBooking}
          mechanics={mechanics.filter(m => m.status === 'available')}
          onAssign={(mechanicId) => handleAssignMechanic(assignModalBooking.id, mechanicId)}
          onClose={() => setAssignModalBooking(null)}
        />
      )}

      {/* Emergency Detail Modal */}
      {showEmergencyDetail && selectedEmergency && (
        <EmergencyDetailModal emergency={selectedEmergency} onClose={() => setShowEmergencyDetail(false)} />
      )}

      {/* Assign Mechanic to Emergency Modal */}
      {assignModalEmergency && (
        <AssignMechanicToEmergencyModal
          emergency={assignModalEmergency}
          mechanics={mechanics.filter(m => m.status === 'available')}
          onAssign={(mechanicName, price, eta) => handleAssignMechanicToEmergency(assignModalEmergency.id, mechanicName, price, eta)}
          onClose={() => setAssignModalEmergency(null)}
        />
      )}

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <CustomerDetailModal customer={selectedCustomer} onClose={() => setShowCustomerDetail(false)} />
      )}

      {/* Delete Customer Confirmation */}
      {confirmDeleteCustomer && (
        <ConfirmDeleteModal
          title="Delete Customer"
          message={`Are you sure you want to delete ${confirmDeleteCustomer.name}? This cannot be undone.`}
          onConfirm={() => { CustomerStore.delete(confirmDeleteCustomer.id); setConfirmDeleteCustomer(null); loadData(); }}
          onCancel={() => setConfirmDeleteCustomer(null)}
        />
      )}

      {/* Mechanic Detail Modal */}
      {showMechanicDetail && selectedMechanic && (
        <MechanicDetailModal mechanic={selectedMechanic} onClose={() => setShowMechanicDetail(false)} />
      )}

      {/* Delete Mechanic Confirmation */}
      {confirmDeleteMechanic && (
        <ConfirmDeleteModal
          title="Delete Mechanic"
          message={`Are you sure you want to delete ${confirmDeleteMechanic.name}? This cannot be undone.`}
          onConfirm={() => { MechanicStore.delete(confirmDeleteMechanic.id); setConfirmDeleteMechanic(null); loadData(); }}
          onCancel={() => setConfirmDeleteMechanic(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
    Accepted: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
    'Mechanic Assigned': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6' },
    'Mechanic Arriving': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6' },
    Completed: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
    Cancelled: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
  };
  const c = colors[status] || { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' };
  return (
    <span style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{status}</span>
  );
}

function ActionBtn({ icon: Icon, color, title, onClick }: { icon: any; color: string; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: `${color}15`, border: 'none', borderRadius: '6px', padding: '0.35rem',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={14} color={color} />
    </button>
  );
}

function BookingDetailModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Booking Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <DetailRow label="Booking ID" value={booking.id} />
          <DetailRow label="Customer" value={booking.customer_name} />
          <DetailRow label="Phone" value={booking.phone} />
          <DetailRow label="Email" value={booking.email || 'N/A'} />
          <DetailRow label="Vehicle" value={`${booking.vehicle_type} - ${booking.vehicle_number}`} />
          <DetailRow label="Service" value={booking.service_name} />
          <DetailRow label="Price" value={`₹${booking.price?.toLocaleString('en-IN')}`} highlight />
          <DetailRow label="Address" value={booking.address} />
          <DetailRow label="Payment" value={booking.payment_method} />
          <DetailRow label="Status" value={booking.status} />
          <DetailRow label="Notes" value={booking.notes || 'None'} />
          <DetailRow label="Booked At" value={booking.booking_time} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, valueColor }: { label: string; value: string; highlight?: boolean; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: valueColor || (highlight ? '#22c55e' : '#e2e8f0'), fontWeight: highlight ? 800 : 500 }}>{value}</span>
    </div>
  );
}

function AssignMechanicModal({ booking, mechanics, onAssign, onClose }: { booking: any; mechanics: any[]; onAssign: (id: string) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '450px', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Assign Mechanic</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>For booking: {booking.customer_name} - {booking.service_name}</p>
        {mechanics.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No mechanics available</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {mechanics.map(m => (
              <button key={m.id} onClick={() => onAssign(m.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', color: '#fff', textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>⭐ {m.rating} • {m.experience_years}yr exp</div>
                </div>
                <UserPlus size={18} color="#3b82f6" />
              </button>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
      </div>
    </div>
  );
}

function formatTime(t: string) {
  if (!t) return '';
  try { return new Date(t).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return t; }
}

const tdStyle: React.CSSProperties = { padding: '0.6rem', fontSize: '0.8rem', color: '#e2e8f0' };

function EmergencyDetailModal({ emergency, onClose }: { emergency: any; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#ef4444' }}>🚨 SOS Emergency Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <DetailRow label="Emergency ID" value={emergency.id} />
          <DetailRow label="Customer" value={emergency.customer_name} />
          <DetailRow label="Phone" value={emergency.phone} />
          <DetailRow label="Email" value={emergency.email || 'N/A'} />
          <DetailRow label="Vehicle" value={`${emergency.vehicle} - ${emergency.vehicle_number}`} />
          <DetailRow label="Emergency Type" value={emergency.emergency_type} />
          <DetailRow label="Price" value={`₹${(emergency.price || 0).toLocaleString('en-IN')}`} valueColor="#22c55e" />
          <DetailRow label="Payment Method" value={emergency.payment_method} />
          <DetailRow label="Payment Status" value={emergency.payment_status || 'Pending'} valueColor={emergency.payment_status === 'Paid' ? '#22c55e' : '#f59e0b'} />
          {emergency.invoice_id && <DetailRow label="Invoice ID" value={emergency.invoice_id} />}
          <DetailRow label="Priority" value={emergency.priority} />
          <DetailRow label="Status" value={emergency.status} />
          <DetailRow label="Address" value={emergency.address} />
          {emergency.latitude && emergency.longitude && (
            <DetailRow label="Coordinates" value={`${emergency.latitude}, ${emergency.longitude}`} />
          )}
          <DetailRow label="Notes" value={emergency.notes || 'None'} />
          <DetailRow label="Assigned Mechanic" value={emergency.assigned_mechanic || 'None'} />
          <DetailRow label="ETA" value={emergency.eta || 'N/A'} />
          <DetailRow label="Created At" value={formatTime(emergency.created_time)} />
        </div>
      </div>
    </div>
  );
}

function CustomerDetailModal({ customer, onClose }: { customer: any; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Customer Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: customer.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 800, color: customer.status === 'active' ? '#22c55e' : '#94a3b8',
          }}>{customer.avatar || (customer.name || 'G').charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{customer.name}</div>
            <div style={{ fontSize: '0.8rem', color: customer.status === 'active' ? '#22c55e' : '#94a3b8' }}>{customer.status === 'active' ? 'Active' : 'Disabled'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <DetailRow label="Customer ID" value={customer.id} />
          <DetailRow label="Phone" value={customer.phone || 'N/A'} />
          <DetailRow label="Email" value={customer.email || 'N/A'} />
          <DetailRow label="Vehicles" value={`${customer.vehicleCount || 0} (${(customer.vehicleNumbers || []).join(', ') || 'None'})`} />
          <DetailRow label="City" value={customer.city || 'N/A'} />
          <DetailRow label="Total Bookings" value={String(customer.totalBookings || 0)} />
          <DetailRow label="SOS Requests" value={String(customer.sosCount || 0)} />
          <DetailRow label="Completed Jobs" value={String(customer.completedJobs || 0)} valueColor="#22c55e" />
          <DetailRow label="Cancelled Jobs" value={String(customer.cancelledJobs || 0)} valueColor="#f59e0b" />
          <DetailRow label="Total Spent" value={`₹${(customer.totalSpent || 0).toLocaleString('en-IN')}`} highlight />
          <DetailRow label="Last Booking" value={customer.lastBooking ? formatTime(customer.lastBooking) : 'None'} />
          <DetailRow label="Registered" value={customer.registrationDate ? new Date(customer.registrationDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} />
        </div>
      </div>
    </div>
  );
}

function MechanicDetailModal({ mechanic, onClose }: { mechanic: any; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Mechanic Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: mechanic.online !== false ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>🔧</div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{mechanic.name}</div>
            <div style={{ fontSize: '0.8rem', color: mechanic.online !== false ? '#22c55e' : '#94a3b8' }}>
              {mechanic.online !== false ? 'Online' : 'Offline'} • {mechanic.status}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <DetailRow label="Mechanic ID" value={mechanic.id} />
          <DetailRow label="Phone" value={mechanic.phone} />
          <DetailRow label="Email" value={mechanic.email || 'N/A'} />
          <DetailRow label="Workshop" value={mechanic.workshopName || mechanic.specialization || 'N/A'} />
          <DetailRow label="Experience" value={`${mechanic.experience_years || 0} years`} />
          <DetailRow label="Skills" value={(mechanic.skills || []).join(', ') || 'N/A'} />
          <DetailRow label="Rating" value={`⭐ ${(mechanic.rating || 5).toFixed(1)}`} valueColor="#f59e0b" />
          <DetailRow label="Jobs Completed" value={String(mechanic.total_jobs || mechanic.jobsCompleted || 0)} />
          <DetailRow label="Pending Jobs" value={String(mechanic.pendingJobs || 0)} />
          <DetailRow label="Today's Jobs" value={String(mechanic.todayJobs || 0)} />
          <DetailRow label="Availability" value={mechanic.status === 'available' ? 'Available' : 'Busy'} valueColor={mechanic.status === 'available' ? '#22c55e' : '#f59e0b'} />
          <DetailRow label="Location" value={mechanic.location || 'N/A'} />
          <DetailRow label="Revenue" value={`₹${(mechanic.revenue || 0).toLocaleString('en-IN')}`} highlight />
          <DetailRow label="Assigned Job" value={mechanic.assignedJob || (mechanic.status === 'busy' ? 'On a job' : 'None')} />
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>{title}</h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)',
            border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#ef4444',
            border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function AssignMechanicToEmergencyModal({ emergency, mechanics, onAssign, onClose }: { emergency: any; mechanics: any[]; onAssign: (name: string, price: number, eta: string) => void; onClose: () => void }) {
  const [selectedMechanic, setSelectedMechanic] = useState<string>('');
  const [price, setPrice] = useState<number>(emergency.price || 0);
  const [eta, setEta] = useState<string>(emergency.eta || '15-20 mins');

  const handleAssign = () => {
    if (selectedMechanic) {
      onAssign(selectedMechanic, price, eta);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: '#fff' }}>Assign Mechanic to SOS Request</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>For emergency: {emergency.customer_name} - {emergency.emergency_type}</p>
        
        {/* Price & ETA Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>PRICE (₹)</label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>ETA</label>
            <select 
              value={eta} 
              onChange={e => setEta(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="5-10 mins">5-10 mins</option>
              <option value="10-15 mins">10-15 mins</option>
              <option value="15-20 mins">15-20 mins</option>
              <option value="20-25 mins">20-25 mins</option>
              <option value="25-30 mins">25-30 mins</option>
              <option value="30-40 mins">30-40 mins</option>
            </select>
          </div>
        </div>

        {/* Mechanics List */}
        {mechanics.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No mechanics available</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {mechanics.map(m => (
              <button key={m.id} onClick={() => setSelectedMechanic(m.name)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', borderRadius: '10px',
                background: selectedMechanic === m.name ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', 
                border: selectedMechanic === m.name ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', color: '#fff', textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>⭐ {m.rating} • {m.experience_years}yr exp</div>
                </div>
                {selectedMechanic === m.name && <Check size={18} color="#22c55e" />}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button 
            onClick={handleAssign} 
            disabled={!selectedMechanic}
            style={{ 
              flex: 2, padding: '0.75rem', borderRadius: '8px', 
              background: selectedMechanic ? '#3b82f6' : 'rgba(255,255,255,0.06)', 
              border: 'none', color: '#fff', cursor: selectedMechanic ? 'pointer' : 'not-allowed', 
              fontWeight: 700 
            }}
          >
            Assign Mechanic • ₹{price.toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}
