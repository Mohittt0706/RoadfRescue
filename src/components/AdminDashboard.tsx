import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, Users, Wrench, CreditCard, BarChart3, 
  Bell, Settings, LogOut, TrendingUp, Clock, CheckCircle, AlertCircle,
  Search, Eye, UserPlus, Check, X, Phone,
  ArrowUpRight, DollarSign, MessageSquare, Image as ImageIcon
} from 'lucide-react';
import { api } from '../api';
import { io } from 'socket.io-client';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'bookings' | 'customers' | 'mechanics' | 'payments' | 'analytics' | 'notifications' | 'ai_chats' | 'image_analyses' | 'settings' | 'emergencies';

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
  const [aiConversations, setAiConversations] = useState<any[]>([]);
  const [imageAnalyses, setImageAnalyses] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [dashData, mechData, notifData, convData, imgData, emergencyData] = await Promise.all([
        api.admin.dashboard(),
        api.mechanics.list(),
        api.admin.notifications(),
        api.chat.adminConversations().catch(() => []),
        api.chat.adminImageAnalyses().catch(() => []),
        api.emergency.list().catch(() => []),
      ]);
      setData(dashData);
      setBookings(dashData.recentBookings || []);
      setMechanics(mechData);
      setNotifications(notifData);
      setAiConversations(convData || []);
      setImageAnalyses(imgData || []);
      setEmergencies(emergencyData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Socket.IO listener for real-time SOS alerts
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    const socket = io(socketUrl);

    socket.on('connect', () => {
      socket.emit('join_admin');
    });

    socket.on('new_emergency', (payload: any) => {
      // 1. Play buzzer sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch (err) {
        console.error('Failed to play alert sound:', err);
      }

      // 2. Append new emergency to state
      setEmergencies(prev => [payload.emergency, ...prev]);

      // 3. Show instant warning dialog
      alert(`🚨 NEW EMERGENCY SOS DETECTED!\n\nID: ${payload.emergency.id}\nCustomer: ${payload.emergency.customer_name}\nType: ${payload.emergency.emergency_type}\nPriority: ${payload.emergency.priority}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
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

  const handleBookingAction = async (bookingId: string, action: string, note?: string) => {
    try {
      if (action === 'accept') {
        await api.bookings.update(bookingId, { status: 'Accepted', note: note || 'Booking accepted by admin' });
      } else if (action === 'complete') {
        await api.bookings.update(bookingId, { status: 'Completed', note: note || 'Service completed' });
      } else if (action === 'cancel') {
        await api.bookings.update(bookingId, { status: 'Cancelled', note: note || 'Booking cancelled' });
      } else if (action === 'delete') {
        await api.bookings.delete(bookingId);
      }
      loadData();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleEmergencyAction = async (emergencyId: string, action: string) => {
    try {
      if (action === 'accept') {
        await api.emergency.updateStatus(emergencyId, 'Accepted');
      } else if (action === 'complete') {
        await api.emergency.updateStatus(emergencyId, 'Completed');
      } else if (action === 'cancel') {
        await api.emergency.updateStatus(emergencyId, 'Cancelled');
      } else if (action === 'delete') {
        await api.emergency.delete(emergencyId);
      }
      loadData();
    } catch (err) {
      console.error('Emergency action failed:', err);
    }
  };

  const handleAssignMechanic = async (bookingId: string, mechanicId: string) => {
    try {
      await api.mechanics.assign(bookingId, mechanicId);
      setAssignModalBooking(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignMechanicToEmergency = async (emergencyId: string, mechanicName: string, price: number, eta: string) => {
    try {
      await api.emergency.assign(emergencyId, mechanicName, eta, price);
      setAssignModalEmergency(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const markAllRead = async () => {
    await api.admin.markAllRead();
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
            { id: 'ai_chats', icon: MessageSquare, label: 'AI Chats', badge: 0 },
            { id: 'image_analyses', icon: ImageIcon, label: 'Image Analysis', badge: 0 },
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
                {['all', 'Pending', 'Accepted', 'Mechanic Assigned', 'Completed', 'Cancelled'].map(s => (
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
                        {['SOS ID', 'Customer', 'Phone', 'Emergency', 'Vehicle', 'Price', 'Payment', 'Priority', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 0.6rem', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmergencies.length === 0 ? (
                        <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No emergency requests found</td></tr>
                      ) : filteredEmergencies.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#ef4444', fontWeight: 800 }}>{e.id}</span></td>
                          <td style={tdStyle}>{e.customer_name}</td>
                          <td style={tdStyle}>{e.phone}</td>
                          <td style={tdStyle}>{e.emergency_type}</td>
                          <td style={tdStyle}>{e.vehicle} ({e.vehicle_number})</td>
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
                          <td style={{ ...tdStyle }}>
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap' }}>
                              <ActionBtn icon={Eye} color="#3b82f6" title="View Details" onClick={() => { setSelectedEmergency(e); setShowEmergencyDetail(true); }} />
                              {e.status === 'Pending' && <ActionBtn icon={Check} color="#22c55e" title="Accept Request" onClick={() => handleEmergencyAction(e.id, 'accept')} />}
                              {(e.status === 'Pending' || e.status === 'Accepted') && !e.assigned_mechanic && (
                                <ActionBtn icon={UserPlus} color="#8b5cf6" title="Assign Mechanic" onClick={() => setAssignModalEmergency(e)} />
                              )}
                              {e.status === 'Mechanic Assigned' && <ActionBtn icon={CheckCircle} color="#22c55e" title="Complete Service" onClick={() => handleEmergencyAction(e.id, 'complete')} />}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {mechanics.map(m => (
                <div key={m.id} style={{
                  background: '#1e293b', borderRadius: '14px', padding: '1.25rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: m.status === 'available' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                      }}>👨‍🔧</div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.specialization}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                      background: m.status === 'available' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                      color: m.status === 'available' ? '#22c55e' : '#f59e0b',
                    }}>{m.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>⭐ {m.rating}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Rating</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>{m.experience_years}yr</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Experience</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#22c55e' }}>{m.total_jobs}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Jobs Done</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <Phone size={14} color="#64748b" /> <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.phone}</span>
                  </div>
                </div>
              ))}
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

          {/* Customers, Payments, Analytics, Settings tabs - simplified */}
          {activeTab === 'customers' && (
            <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ color: '#fff' }}>Customer Management</h3>
              <p>Customer database will be populated as bookings are created.</p>
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
            <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
              <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ color: '#fff' }}>Analytics Dashboard</h3>
              <p>Detailed analytics and reports coming soon.</p>
            </div>
          )}

          {activeTab === 'ai_chats' && (
            <div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>AI Chat Conversations ({aiConversations.length})</h3>
              {aiConversations.length === 0 ? (
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
                  <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>No AI conversations yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {aiConversations.map((conv: any) => (
                    <div key={conv.id} style={{
                      background: '#1e293b', borderRadius: '10px', padding: '1rem',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{conv.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {conv.message_count} messages • {new Date(conv.updated_at).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{conv.id?.slice(0, 12)}</span>
                      </div>
                      {conv.last_message && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', maxHeight: '40px', overflow: 'hidden' }}>
                          {conv.last_message.substring(0, 150)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'image_analyses' && (
            <div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Image Analyses ({imageAnalyses.length})</h3>
              {imageAnalyses.length === 0 ? (
                <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
                  <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>No image analyses yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {imageAnalyses.map((img: any) => {
                    let diag = {};
                    try { diag = JSON.parse(img.diagnosis || '{}'); } catch {}
                    return (
                      <div key={img.id} style={{
                        background: '#1e293b', borderRadius: '14px', overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <img src={img.image_url} alt="Analysis" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        <div style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{(diag as any).issue || 'Analysis'}</div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                              {img.confidence}% confidence
                            </span>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                              {img.severity}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                            {(diag as any).estimatedCost && <div>Cost: <span style={{ color: '#22c55e', fontWeight: 700 }}>{(diag as any).estimatedCost}</span></div>}
                            <div>{new Date(img.created_at).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ background: '#1e293b', borderRadius: '14px', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#64748b' }}>
              <Settings size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ color: '#fff' }}>Settings</h3>
              <p>Admin settings and configuration.</p>
            </div>
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
