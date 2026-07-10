import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Briefcase, Star,
  Clock, Wallet, CreditCard, Download, FileText, Gift, Zap, Award,
  Calendar, ChevronLeft, ChevronRight, Bell, Bot, BarChart3, PieChart,
  CheckCircle, AlertCircle, ArrowRight, Smartphone, Banknote, PiggyBank,
  TrendingDown, Eye, Send, X, Phone, MapPin, Car, Wrench, Fuel, Truck,
  Lock, Battery
} from 'lucide-react';
import '../earnings-dashboard.css';

interface EarningsDashboardProps {
  onBack: () => void;
}

interface Transaction {
  id: string;
  customer: string;
  initials: string;
  color: string;
  service: string;
  bookingId: string;
  date: string;
  time: string;
  method: string;
  status: 'paid' | 'pending' | 'failed';
  amount: number;
}

interface ServiceRevenue {
  name: string;
  icon: React.ReactNode;
  jobs: number;
  revenue: number;
  growth: number;
  color: string;
}

const transactions: Transaction[] = [
  { id: 'TXN-2847', customer: 'Sarah Chen', initials: 'SC', color: '#EC4899', service: 'Tire Repair', bookingId: 'BK-1042', date: 'Jul 10, 2026', time: '10:30 AM', method: 'Credit Card', status: 'paid', amount: 45 },
  { id: 'TXN-2846', customer: 'James Miller', initials: 'JM', color: '#2563EB', service: 'Battery Jump', bookingId: 'BK-1041', date: 'Jul 10, 2026', time: '9:15 AM', method: 'Apple Pay', status: 'paid', amount: 35 },
  { id: 'TXN-2845', customer: 'Lisa Park', initials: 'LP', color: '#22C55E', service: 'Fuel Delivery', bookingId: 'BK-1040', date: 'Jul 9, 2026', time: '4:45 PM', method: 'Google Pay', status: 'pending', amount: 55 },
  { id: 'TXN-2844', customer: 'David Lee', initials: 'DL', color: '#F59E0B', service: 'Lockout', bookingId: 'BK-1039', date: 'Jul 9, 2026', time: '2:20 PM', method: 'Credit Card', status: 'paid', amount: 60 },
  { id: 'TXN-2843', customer: 'Emma Wilson', initials: 'EW', color: '#8B5CF6', service: 'Engine Repair', bookingId: 'BK-1038', date: 'Jul 9, 2026', time: '11:00 AM', method: 'Cash', status: 'paid', amount: 120 },
  { id: 'TXN-2842', customer: 'Mike Brown', initials: 'MB', color: '#06B6D4', service: 'Towing', bookingId: 'BK-1037', date: 'Jul 8, 2026', time: '3:30 PM', method: 'Credit Card', status: 'failed', amount: 95 },
  { id: 'TXN-2841', customer: 'Anna Kim', initials: 'AK', color: '#EC4899', service: 'Tire Repair', bookingId: 'BK-1036', date: 'Jul 8, 2026', time: '1:15 PM', method: 'UPI', status: 'paid', amount: 40 },
  { id: 'TXN-2840', customer: 'Robert Davis', initials: 'RD', color: '#22C55E', service: 'EV Charging', bookingId: 'BK-1035', date: 'Jul 8, 2026', time: '10:00 AM', method: 'Credit Card', status: 'paid', amount: 50 },
];

const serviceRevenues: ServiceRevenue[] = [
  { name: 'Tire Repair', icon: <Car size={14} />, jobs: 124, revenue: 5580, growth: 12, color: '#2563EB' },
  { name: 'Battery Jump', icon: <Battery size={14} />, jobs: 98, revenue: 3430, growth: 8, color: '#F59E0B' },
  { name: 'Fuel Delivery', icon: <Fuel size={14} />, jobs: 67, revenue: 3685, growth: -3, color: '#22C55E' },
  { name: 'Towing', icon: <Truck size={14} />, jobs: 45, revenue: 4275, growth: 15, color: '#8B5CF6' },
  { name: 'Engine Repair', icon: <Wrench size={14} />, jobs: 38, revenue: 4560, growth: 22, color: '#EC4899' },
  { name: 'Lockout', icon: <Lock size={14} />, jobs: 52, revenue: 2860, growth: 5, color: '#06B6D4' },
  { name: 'EV Charging', icon: <Zap size={14} />, jobs: 29, revenue: 1450, growth: 35, color: '#10B981' },
];

const weeklyData = [
  { day: 'Mon', value: 180 },
  { day: 'Tue', value: 245 },
  { day: 'Wed', value: 120 },
  { day: 'Thu', value: 310 },
  { day: 'Fri', value: 275 },
  { day: 'Sat', value: 380 },
  { day: 'Sun', value: 290 },
];

const monthlyData = [
  { day: 'W1', value: 1200 },
  { day: 'W2', value: 1580 },
  { day: 'W3', value: 1350 },
  { day: 'W4', value: 1890 },
];

const earningsNotifications = [
  { type: 'green' as const, text: 'Payment received: $45.00 from Sarah Chen', time: '10 min ago', icon: <DollarSign size={14} /> },
  { type: 'amber' as const, text: 'Weekly bonus earned: $50.00', time: '2 hours ago', icon: <Gift size={14} /> },
  { type: 'blue' as const, text: 'Withdrawal of $200 successful', time: 'Yesterday', icon: <Banknote size={14} /> },
  { type: 'purple' as const, text: 'New incentive: Peak Hour Bonus available', time: 'Yesterday', icon: <Zap size={14} /> },
  { type: 'green' as const, text: 'Monthly report ready for download', time: 'Jul 1', icon: <FileText size={14} /> },
];

const calendarHighlights: Record<number, string> = {
  1: 'payout', 5: 'high', 8: 'payout', 10: 'high', 12: 'holiday',
  15: 'payout', 18: 'high', 20: 'payout', 22: 'high', 25: 'payout', 28: 'high', 30: 'payout'
};

const aiInsights = [
  { icon: <Clock size={14} />, text: 'Your best earning hours are <strong>2 PM - 6 PM</strong>. Consider extending your shift during these peak hours.' },
  { icon: <Wrench size={14} />, text: 'Engine Repair services generate <strong>$120 avg</strong> per job — your highest-earning service type.' },
  { icon: <MapPin size={14} />, text: 'High-demand location: <strong>Highway 101 corridor</strong> has 3x more requests during rush hour.' },
  { icon: <TrendingUp size={14} />, text: 'Weekly performance: You earned <strong>15% more</strong> than last week. Keep up the momentum!' },
  { icon: <Calendar size={14} />, text: 'Suggested schedule: <strong>Mon-Fri 10AM-7PM</strong> maximizes your earning potential based on demand patterns.' },
];

export default function EarningsDashboard({ onBack }: EarningsDashboardProps) {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [filterPeriod, setFilterPeriod] = useState('thisMonth');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(6); // July (0-indexed)
  const [calendarYear] = useState(2026);

  /* --- Animated counters --- */
  const [counters, setCounters] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countersAnimated.current) {
        countersAnimated.current = true;
        const duration = 2000;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = progress * (2 - progress);
          setCounters({
            today: Math.floor(ease * 347),
            week: Math.floor(ease * 1895),
            month: Math.floor(ease * 7420),
            total: Math.floor(ease * 48250),
          });
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.2 });
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  /* --- Chart max --- */
  const chartData = chartPeriod === 'weekly' ? weeklyData : monthlyData;
  const maxVal = Math.max(...chartData.map(d => d.value));

  /* --- Calendar days --- */
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDay = getFirstDay(calendarMonth, calendarYear);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* --- Performance metrics (animated) --- */
  const [perf, setPerf] = useState({ rating: 0, acceptance: 0, completion: 0, onTime: 0, satisfaction: 0, reviews: 0 });
  const perfRef = useRef<HTMLDivElement>(null);
  const perfAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !perfAnimated.current) {
        perfAnimated.current = true;
        const duration = 1800;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = progress * (2 - progress);
          setPerf({
            rating: parseFloat((ease * 4.9).toFixed(1)),
            acceptance: Math.floor(ease * 96),
            completion: Math.floor(ease * 98),
            onTime: Math.floor(ease * 92),
            satisfaction: Math.floor(ease * 97),
            reviews: Math.floor(ease * 247),
          });
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.2 });
    if (perfRef.current) observer.observe(perfRef.current);
    return () => observer.disconnect();
  }, []);

  const circleR = 28;
  const circleC = 2 * Math.PI * circleR;

  return (
    <div className="earn-page">
      {/* ===== HERO ===== */}
      <div className="earn-hero" ref={heroRef}>
        <div className="earn-hero-content">
          <h1>Earnings Dashboard</h1>
          <p>Track your income, payouts, bonuses, completed jobs, and financial performance in one place.</p>
          <div className="earn-hero-cards">
            <div className="earn-hero-stat">
              <div className="earn-hero-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)' }}><DollarSign size={18} color="#34D399" /></div>
              <div className="earn-hero-stat-value">${counters.today}</div>
              <div className="earn-hero-stat-label">Today's Earnings</div>
            </div>
            <div className="earn-hero-stat">
              <div className="earn-hero-stat-icon" style={{ background: 'rgba(96, 165, 250, 0.2)' }}><TrendingUp size={18} color="#60A5FA" /></div>
              <div className="earn-hero-stat-value">${counters.week.toLocaleString()}</div>
              <div className="earn-hero-stat-label">Weekly Earnings</div>
            </div>
            <div className="earn-hero-stat">
              <div className="earn-hero-stat-icon" style={{ background: 'rgba(251, 191, 36, 0.2)' }}><BarChart3 size={18} color="#FBBF24" /></div>
              <div className="earn-hero-stat-value">${counters.month.toLocaleString()}</div>
              <div className="earn-hero-stat-label">Monthly Earnings</div>
            </div>
            <div className="earn-hero-stat">
              <div className="earn-hero-stat-icon" style={{ background: 'rgba(167, 139, 250, 0.2)' }}><PiggyBank size={18} color="#A78BFA" /></div>
              <div className="earn-hero-stat-value">${counters.total.toLocaleString()}</div>
              <div className="earn-hero-stat-label">Lifetime Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== OVERVIEW CARDS ===== */}
      <div className="earn-card" style={{ animationDelay: '0.1s' }}>
        <div className="earn-card-header">
          <div className="earn-card-title"><Wallet size={16} /> Earnings Overview</div>
          <div className="earn-filters">
            <div className="earn-filter-pills">
              {['Today', 'Week', 'Month', 'Year'].map((p) => (
                <button key={p} className={`earn-filter-pill ${filterPeriod === p.toLowerCase() || (p === 'Month' && filterPeriod === 'thisMonth') ? 'active' : ''}`}
                  onClick={() => setFilterPeriod(p === 'Month' ? 'thisMonth' : p.toLowerCase())}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="earn-card-body">
          <div className="earn-overview-grid">
            <div className="earn-overview-item">
              <div className="earn-overview-icon" style={{ background: 'var(--secondary-glow)', color: 'var(--secondary)' }}><DollarSign size={20} /></div>
              <div className="earn-overview-value">$7,420</div>
              <div className="earn-overview-label">Total Earnings</div>
              <div className="earn-overview-change up"><ArrowUpRight size={10} /> +12% vs last month</div>
            </div>
            <div className="earn-overview-item">
              <div className="earn-overview-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}><Clock size={20} /></div>
              <div className="earn-overview-value">$320</div>
              <div className="earn-overview-label">Pending Payments</div>
            </div>
            <div className="earn-overview-item">
              <div className="earn-overview-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Wallet size={20} /></div>
              <div className="earn-overview-value">$7,100</div>
              <div className="earn-overview-label">Withdrawable Balance</div>
            </div>
            <div className="earn-overview-item">
              <div className="earn-overview-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}><Briefcase size={20} /></div>
              <div className="earn-overview-value">247</div>
              <div className="earn-overview-label">Completed Jobs</div>
              <div className="earn-overview-change up"><ArrowUpRight size={10} /> +18 this week</div>
            </div>
            <div className="earn-overview-item">
              <div className="earn-overview-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4' }}><BarChart3 size={20} /></div>
              <div className="earn-overview-value">$30.04</div>
              <div className="earn-overview-label">Avg. Per Job</div>
              <div className="earn-overview-change up"><ArrowUpRight size={10} /> +$2.50</div>
            </div>
            <div className="earn-overview-item">
              <div className="earn-overview-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899' }}><Star size={20} /></div>
              <div className="earn-overview-value">$485</div>
              <div className="earn-overview-label">Tips Received</div>
              <div className="earn-overview-change up"><ArrowUpRight size={10} /> +8% vs avg</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="earn-grid">
        {/* LEFT */}
        <div className="earn-main-col">
          {/* Chart */}
          <div className="earn-card" style={{ animationDelay: '0.15s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><BarChart3 size={16} /> Earnings Analytics</div>
              <div className="earn-chart-tabs">
                <button className={`earn-chart-tab ${chartPeriod === 'daily' ? 'active' : ''}`} onClick={() => setChartPeriod('daily')}>Daily</button>
                <button className={`earn-chart-tab ${chartPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setChartPeriod('weekly')}>Weekly</button>
                <button className={`earn-chart-tab ${chartPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setChartPeriod('monthly')}>Monthly</button>
              </div>
            </div>
            <div className="earn-card-body">
              <div className="earn-chart-area">
                <div className="earn-chart-y-axis">
                  {[100, 75, 50, 25, 0].map((v) => (
                    <span key={v} className="earn-chart-y-label">${Math.round(maxVal * v / 100)}</span>
                  ))}
                </div>
                <div className="earn-chart-bars">
                  {chartData.map((d, i) => (
                    <div key={i} className="earn-chart-bar-group">
                      <div className="earn-chart-bar primary" style={{ height: `${(d.value / maxVal) * 160}px` }} />
                      <span className="earn-chart-bar-label">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Service Revenue */}
          <div className="earn-card" style={{ animationDelay: '0.2s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><PieChart size={16} /> Service Revenue Breakdown</div>
            </div>
            <div className="earn-card-body">
              <div className="earn-service-grid">
                {serviceRevenues.map((s, i) => (
                  <div key={i} className="earn-service-card">
                    <div className="earn-service-header">
                      <div className="earn-service-name">
                        <div className="earn-service-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                        {s.name}
                      </div>
                      <span className={`earn-service-growth ${s.growth >= 0 ? 'up' : 'down'}`}>
                        {s.growth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(s.growth)}%
                      </span>
                    </div>
                    <div className="earn-service-stats">
                      <span className="earn-service-jobs">{s.jobs} jobs</span>
                      <span className="earn-service-revenue">${s.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="earn-card" style={{ animationDelay: '0.25s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><FileText size={16} /> Transaction History</div>
              <button className="earn-table-btn"><Download size={11} /> Export</button>
            </div>
            <div className="earn-card-body" style={{ padding: 0 }}>
              <div className="earn-table-wrapper">
                <table className="earn-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td><span className="earn-table-id">{t.id}</span></td>
                        <td>
                          <div className="earn-table-customer">
                            <div className="earn-table-avatar" style={{ background: t.color }}>{t.initials}</div>
                            {t.customer}
                          </div>
                        </td>
                        <td>{t.service}</td>
                        <td>{t.date}<br /><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.time}</span></td>
                        <td>{t.method}</td>
                        <td>
                          <span className={`earn-status-badge ${t.status}`}>
                            {t.status === 'paid' && <CheckCircle size={10} />}
                            {t.status === 'pending' && <Clock size={10} />}
                            {t.status === 'failed' && <AlertCircle size={10} />}
                            {t.status}
                          </span>
                        </td>
                        <td><span className="earn-table-amount">${t.amount}</span></td>
                        <td>
                          <div className="earn-table-actions">
                            <button className="earn-table-btn"><Eye size={10} /></button>
                            <button className="earn-table-btn"><Download size={10} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="earn-side-col">
          {/* Withdraw */}
          <div className="earn-withdraw">
            <div className="earn-withdraw-header">
              <div className="earn-withdraw-title"><Wallet size={16} /> Withdraw Earnings</div>
            </div>
            <div className="earn-withdraw-body">
              <div className="earn-withdraw-balance">$7,100.00</div>
              <div className="earn-withdraw-info">
                <div className="earn-withdraw-row"><span>Bank Account</span><span>****4521</span></div>
                <div className="earn-withdraw-row"><span>UPI ID</span><span>john@upi</span></div>
                <div className="earn-withdraw-row"><span>Next Payout</span><span>Jul 15, 2026</span></div>
              </div>
              <div className="earn-withdraw-actions">
                <button className="earn-withdraw-btn primary" onClick={() => setShowWithdrawModal(true)}>
                  <Banknote size={16} /> Withdraw Now
                </button>
                <button className="earn-withdraw-btn ghost"><CreditCard size={16} /> Update</button>
              </div>
            </div>
          </div>

          {/* Bonuses */}
          <div className="earn-card" style={{ animationDelay: '0.3s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><Gift size={16} /> Bonuses & Incentives</div>
            </div>
            <div className="earn-card-body">
              <div className="earn-bonus-grid">
                {[
                  { icon: <Zap size={18} />, value: '$25', label: 'Daily Bonus', bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', badge: 'Active' },
                  { icon: <Award size={18} />, value: '$50', label: 'Weekly Bonus', bg: 'var(--primary-glow)', color: 'var(--primary)', badge: 'Earned' },
                  { icon: <TrendingUp size={18} />, value: '$150', label: 'Monthly Incentive', bg: 'var(--secondary-glow)', color: 'var(--secondary)', badge: '' },
                  { icon: <Clock size={18} />, value: '$15', label: 'Peak Hour Bonus', bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', badge: 'Active' },
                  { icon: <Star size={18} />, value: '$35', label: 'Referral Bonus', bg: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', badge: '' },
                  { icon: <Heart size={18} />, value: '$485', label: 'Customer Tips', bg: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', badge: '' },
                ].map((b, i) => (
                  <div key={i} className="earn-bonus-card">
                    {b.badge && <span className="earn-bonus-badge">{b.badge}</span>}
                    <div className="earn-bonus-icon" style={{ background: b.bg, color: b.color }}>{b.icon}</div>
                    <div className="earn-bonus-value">{b.value}</div>
                    <div className="earn-bonus-label">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="earn-card" style={{ animationDelay: '0.35s' }} ref={perfRef}>
            <div className="earn-card-header">
              <div className="earn-card-title"><Star size={16} /> Performance Metrics</div>
            </div>
            <div className="earn-card-body">
              <div className="earn-perf-grid">
                {[
                  { label: 'Rating', value: perf.rating, raw: `${perf.rating}★`, color: '#F59E0B' },
                  { label: 'Acceptance', value: perf.acceptance, raw: `${perf.acceptance}%`, color: '#2563EB' },
                  { label: 'Completion', value: perf.completion, raw: `${perf.completion}%`, color: '#22C55E' },
                  { label: 'On-Time', value: perf.onTime, raw: `${perf.onTime}%`, color: '#8B5CF6' },
                  { label: 'Satisfaction', value: perf.satisfaction, raw: `${perf.satisfaction}%`, color: '#EC4899' },
                  { label: 'Reviews', value: Math.min(perf.reviews, 100), raw: `${perf.reviews}`, color: '#06B6D4' },
                ].map((m) => {
                  const offset = circleC - (m.value / 100) * circleC;
                  return (
                    <div key={m.label} className="earn-perf-item">
                      <div className="earn-perf-circle">
                        <svg viewBox="0 0 64 64">
                          <circle className="earn-perf-circle-bg" cx="32" cy="32" r={circleR} />
                          <circle className="earn-perf-circle-fill" cx="32" cy="32" r={circleR} stroke={m.color} strokeDasharray={circleC} strokeDashoffset={offset} />
                        </svg>
                        <div className="earn-perf-circle-text">{m.raw}</div>
                      </div>
                      <div className="earn-perf-label">{m.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="earn-card" style={{ animationDelay: '0.4s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><Calendar size={16} /> Earnings Calendar</div>
            </div>
            <div className="earn-card-body">
              <div className="earn-calendar-header">
                <span className="earn-calendar-month">{monthNames[calendarMonth]} {calendarYear}</span>
                <div className="earn-calendar-nav">
                  <button onClick={() => setCalendarMonth((m) => Math.max(0, m - 1))}><ChevronLeft size={14} /></button>
                  <button onClick={() => setCalendarMonth((m) => Math.min(11, m + 1))}><ChevronRight size={14} /></button>
                </div>
              </div>
              <div className="earn-calendar-grid">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="earn-calendar-day-label">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="earn-calendar-day empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const hl = calendarHighlights[day];
                  const isToday = day === 10 && calendarMonth === 6;
                  return (
                    <div key={day} className={`earn-calendar-day ${isToday ? 'today' : hl || ''}`}>{day}</div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: 'var(--primary)', display: 'inline-block' }} /> Today
                </span>
                <span style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: 'var(--secondary-glow)', border: '1px solid var(--secondary)', display: 'inline-block' }} /> High Earnings
                </span>
                <span style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: 'rgba(245,158,11,0.12)', border: '1px solid #F59E0B', display: 'inline-block' }} /> Payout
                </span>
              </div>
            </div>
          </div>

          {/* Tax & Invoice */}
          <div className="earn-card" style={{ animationDelay: '0.45s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><FileText size={16} /> Tax & Invoice</div>
            </div>
            <div className="earn-card-body">
              <div className="earn-tax-grid">
                {[
                  { icon: <Download size={16} />, name: 'Monthly Statement', desc: 'Download PDF', bg: 'var(--primary-glow)', color: 'var(--primary)' },
                  { icon: <BarChart3 size={16} />, name: 'Annual Report', desc: 'Full year summary', bg: 'var(--secondary-glow)', color: 'var(--secondary)' },
                  { icon: <FileText size={16} />, name: 'GST Summary', desc: 'Tax breakdown', bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' },
                  { icon: <Send size={16} />, name: 'Email Report', desc: 'Send to email', bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' },
                ].map((item, i) => (
                  <div key={i} className="earn-tax-card">
                    <div className="earn-tax-icon" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                    <div className="earn-tax-info">
                      <div className="earn-tax-name">{item.name}</div>
                      <div className="earn-tax-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="earn-ai-card">
            <div className="earn-ai-header">
              <span className="earn-ai-badge"><Bot size={11} /> AI Insights</span>
              <span className="earn-ai-title">Financial Recommendations</span>
            </div>
            <div className="earn-ai-body">
              {aiInsights.map((insight, i) => (
                <div key={i} className="earn-ai-insight">
                  <div className="earn-ai-insight-icon">{insight.icon}</div>
                  <div className="earn-ai-insight-text" dangerouslySetInnerHTML={{ __html: insight.text }} />
                </div>
              ))}
              <div className="earn-ai-confidence">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Confidence</span>
                <div className="earn-ai-conf-bar">
                  <div className="earn-ai-conf-fill" style={{ width: '91%' }} />
                </div>
                <span className="earn-ai-conf-text">91%</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="earn-card" style={{ animationDelay: '0.5s' }}>
            <div className="earn-card-header">
              <div className="earn-card-title"><Bell size={16} /> Recent Activity</div>
            </div>
            <div className="earn-card-body" style={{ padding: 0 }}>
              {earningsNotifications.map((n, i) => (
                <div key={i} className="earn-notif-item">
                  <div className={`earn-notif-icon ${n.type}`}>{n.icon}</div>
                  <div>
                    <div className="earn-notif-text">{n.text}</div>
                    <div className="earn-notif-time">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== WITHDRAW MODAL ===== */}
      {showWithdrawModal && (
        <div className="earn-modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="earn-modal" onClick={(e) => e.stopPropagation()}>
            <div className="earn-modal-header">
              <h3 className="earn-modal-title">Withdraw Earnings</h3>
              <button className="earn-modal-close" onClick={() => setShowWithdrawModal(false)}><X size={16} /></button>
            </div>
            <div className="earn-modal-body">
              <div className="earn-modal-amount">$7,100.00</div>
              <div className="earn-modal-field">
                <div className="earn-modal-label">Withdrawal Amount</div>
                <input className="earn-modal-input" type="text" defaultValue="$500.00" />
              </div>
              <div className="earn-modal-field">
                <div className="earn-modal-label">Bank Account</div>
                <input className="earn-modal-input" type="text" defaultValue="****4521 - Chase Bank" readOnly />
              </div>
              <div className="earn-modal-field">
                <div className="earn-modal-label">UPI ID (Optional)</div>
                <input className="earn-modal-input" type="text" defaultValue="john@upi" />
              </div>
            </div>
            <div className="earn-modal-footer">
              <button className="earn-btn earn-btn-outline" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
              <button className="earn-btn earn-btn-primary" onClick={() => { setShowWithdrawModal(false); alert('Withdrawal initiated!'); }}>
                <Banknote size={16} /> Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Heart(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
