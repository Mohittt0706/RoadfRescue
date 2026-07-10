import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Wrench, Shield, Key, Sliders, CreditCard, Brain, Bell, Settings, Lock,
  Database, Search, Plus, Trash2, Edit3, Eye, EyeOff, Check, X, ChevronDown,
  ChevronRight, Save, Download, Upload, RefreshCw, AlertTriangle, ToggleLeft,
  ToggleRight, Phone, Mail, MapPin, Star, UserPlus, Clock, Globe, DollarSign,
  Zap, Radio, Volume2, Smartphone, BarChart3,
  Send, ArrowUpRight, ArrowDownRight, Copy, LogOut, User, Briefcase, Car, Truck,
  Battery, Fuel, FileText, Hash, Building, Map
} from 'lucide-react';

/* ────────────────────────────────────────────
   localStorage helpers
   ──────────────────────────────────────────── */
const LS = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key: string, value: any) { localStorage.setItem(key, JSON.stringify(value)); },
};

/* ────────────────────────────────────────────
   Default seed data
   ──────────────────────────────────────────── */
const DEFAULT_USERS = [
  { id: 'u1', name: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya@email.com', vehicles: 2, bookings: 12, sosCount: 1, status: 'active' as const },
  { id: 'u2', name: 'Amit Patel', phone: '+91 87654 32109', email: 'amit@email.com', vehicles: 1, bookings: 5, sosCount: 0, status: 'active' as const },
  { id: 'u3', name: 'Neha Gupta', phone: '+91 76543 21098', email: 'neha@email.com', vehicles: 3, bookings: 18, sosCount: 2, status: 'suspended' as const },
  { id: 'u4', name: 'Ravi Singh', phone: '+91 65432 10987', email: 'ravi@email.com', vehicles: 1, bookings: 3, sosCount: 0, status: 'active' as const },
];

const DEFAULT_MECHANICS = [
  { id: 'm1', name: 'Rajesh Kumar', phone: '+91 98711 22334', email: 'rajesh@roadrescue.in', experience: 8, skills: 'Engine, AC, Electrical', workshop: 'Kumar Auto Works', rating: 4.8, completedJobs: 234, pendingJobs: 2, online: true, status: 'active' as const, verified: true },
  { id: 'm2', name: 'Amit Sharma', phone: '+91 98722 33445', email: 'amit@roadrescue.in', experience: 5, skills: 'Battery, Tyre, Towing', workshop: 'Sharma Garage', rating: 4.5, completedJobs: 156, pendingJobs: 0, online: true, status: 'active' as const, verified: true },
  { id: 'm3', name: 'Suresh Patil', phone: '+91 98733 44556', email: 'suresh@roadrescue.in', experience: 3, skills: 'Fuel, Lockout, Jump Start', workshop: 'Patil Motors', rating: 4.2, completedJobs: 89, pendingJobs: 1, online: false, status: 'pending' as const, verified: false },
];

const DEFAULT_ADMINS = [
  { id: 'a1', name: 'Admin User', email: 'admin@roadrescue.in', role: 'Super Admin', status: 'active' as const },
];

const DEFAULT_SERVICES = [
  { id: 's1', name: 'Flat Tyre', icon: 'Car', price: 299, eta: '15-20 min', enabled: true, category: 'Basic' },
  { id: 's2', name: 'Battery Jump Start', icon: 'Battery', price: 399, eta: '10-15 min', enabled: true, category: 'Basic' },
  { id: 's3', name: 'Fuel Delivery', icon: 'Fuel', price: 499, eta: '20-30 min', enabled: true, category: 'Basic' },
  { id: 's4', name: 'Lockout Service', icon: 'Lock', price: 599, eta: '15-25 min', enabled: true, category: 'Security' },
  { id: 's5', name: 'Towing', icon: 'Truck', price: 999, eta: '30-45 min', enabled: true, category: 'Heavy' },
  { id: 's6', name: 'Engine Diagnosis', icon: 'Wrench', price: 799, eta: '20-30 min', enabled: true, category: 'Diagnostic' },
];

const DEFAULT_ROLES = [
  { id: 'r1', name: 'Super Admin', permissions: ['dashboard', 'bookings', 'sos', 'customers', 'mechanics', 'payments', 'analytics', 'notifications', 'settings'] },
  { id: 'r2', name: 'Operations Admin', permissions: ['dashboard', 'bookings', 'sos', 'customers', 'mechanics', 'notifications'] },
  { id: 'r3', name: 'Finance Admin', permissions: ['dashboard', 'bookings', 'payments', 'analytics'] },
  { id: 'r4', name: 'Support Admin', permissions: ['dashboard', 'bookings', 'customers', 'notifications'] },
  { id: 'r5', name: 'Read Only Admin', permissions: ['dashboard'] },
];

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'sos', label: 'SOS' },
  { key: 'customers', label: 'Customers' },
  { key: 'mechanics', label: 'Mechanics' },
  { key: 'payments', label: 'Payments' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'settings', label: 'Settings' },
];

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */
type SettingsTab = 'users' | 'mechanics' | 'admins' | 'roles' | 'services' | 'sos' | 'payments' | 'ai' | 'notifications' | 'general' | 'system' | 'security';

interface User { id: string; name: string; phone: string; email: string; vehicles: number; bookings: number; sosCount: number; status: 'active' | 'suspended'; }
interface Mechanic { id: string; name: string; phone: string; email: string; experience: number; skills: string; workshop: string; rating: number; completedJobs: number; pendingJobs: number; online: boolean; status: 'active' | 'suspended' | 'pending'; verified: boolean; }
interface Admin { id: string; name: string; email: string; role: string; status: 'active' | 'disabled'; }
interface Service { id: string; name: string; icon: string; price: number; eta: string; enabled: boolean; category: string; }
interface Role { id: string; name: string; permissions: string[]; }

/* ────────────────────────────────────────────
   Tiny reusable UI bits (inline-styled)
   ──────────────────────────────────────────── */
const C = {
  card: { background: '#1e293b', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem' },
  cardTitle: { color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 },
  label: { color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 },
  value: { color: '#fff', fontSize: '0.9rem' },
  input: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.55rem 0.75rem', color: '#fff', fontSize: '0.85rem', width: '100%', outline: 'none', transition: 'border 0.2s' },
  btn: (color: string): React.CSSProperties => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity 0.2s' }),
  btnGhost: { background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  badge: (color: string): React.CSSProperties => ({ background: `${color}22`, color, padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  divider: { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  th: { color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '0.5rem 0.75rem', textAlign: 'left' as const },
  td: { color: '#e2e8f0', fontSize: '0.82rem', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' },
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ cursor: 'pointer', width: 44, height: 24, borderRadius: 12, background: value ? '#3b82f6' : '#334155', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

function SectionHeading({ icon: Icon, title, color = '#3b82f6' }: { icon: any; title: string; color?: string }) {
  return <div style={{ ...C.cardTitle }}><Icon size={18} color={color} />{title}</div>;
}

/* ────────────────────────────────────────────
   Modal
   ──────────────────────────────────────────── */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem', width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function AdminSettings() {
  const [subTab, setSubTab] = useState<SettingsTab>('users');
  const [search, setSearch] = useState('');

  /* ── Section 1: Users ── */
  const [users, setUsers] = useState<User[]>(() => LS.get('admin_users', DEFAULT_USERS));
  const [userModal, setUserModal] = useState<{ open: boolean; edit?: User }>({ open: false });
  const [userForm, setUserForm] = useState({ name: '', phone: '', email: '', vehicles: 0, bookings: 0, sosCount: 0 });
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [resetPwUser, setResetPwUser] = useState<string | null>(null);

  /* ── Section 2: Mechanics ── */
  const [mechanics, setMechanics] = useState<Mechanic[]>(() => LS.get('admin_mechanics', DEFAULT_MECHANICS));
  const [mechModal, setMechModal] = useState<{ open: boolean; edit?: Mechanic }>({ open: false });
  const [mechForm, setMechForm] = useState({ name: '', phone: '', email: '', experience: 0, skills: '', workshop: '', rating: 0, completedJobs: 0, pendingJobs: 0 });
  const [viewMech, setViewMech] = useState<Mechanic | null>(null);
  const [confirmDeleteMech, setConfirmDeleteMech] = useState<string | null>(null);
  const [resetPwMech, setResetPwMech] = useState<string | null>(null);

  /* ── Section 3: Admins ── */
  const [admins, setAdmins] = useState<Admin[]>(() => LS.get('admin_admins', DEFAULT_ADMINS));
  const [adminModal, setAdminModal] = useState<{ open: boolean; edit?: Admin }>({ open: false });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', role: 'Read Only Admin' });
  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState<string | null>(null);

  /* ── Section 4: Roles ── */
  const [roles, setRoles] = useState<Role[]>(() => LS.get('admin_roles', DEFAULT_ROLES));
  const [roleModal, setRoleModal] = useState<{ open: boolean; edit?: Role }>({ open: false });
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as string[] });
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<string | null>(null);

  /* ── Section 5: Services ── */
  const [services, setServices] = useState<Service[]>(() => LS.get('admin_services', DEFAULT_SERVICES));
  const [svcModal, setSvcModal] = useState<{ open: boolean; edit?: Service }>({ open: false });
  const [svcForm, setSvcForm] = useState({ name: '', icon: 'Wrench', price: 0, eta: '', enabled: true, category: 'Basic' });
  const [confirmDeleteSvc, setConfirmDeleteSvc] = useState<string | null>(null);

  /* ── Section 6: SOS Settings ── */
  const [sosSettings, setSosSettings] = useState(() => LS.get('admin_sos', { enabled: true, hotline: '112', autoAssign: true, priorityRules: true, maxResponse: 15 }));

  /* ── Section 7: Payment Settings ── */
  const [paySettings, setPaySettings] = useState(() => LS.get('admin_payments', { cash: true, upi: true, googlePay: true, phonePe: true, paytm: true, creditCard: true }));

  /* ── Section 8: AI Settings ── */
  const [aiSettings, setAiSettings] = useState(() => LS.get('admin_ai', { enabled: true, voiceChat: false, telemetry: true, confidence: 85 }));

  /* ── Section 9: Notification Settings ── */
  const [notifSettings, setNotifSettings] = useState(() => LS.get('admin_notif', { email: true, sms: true, push: true, browser: true, sound: true }));

  /* ── Section 10: General Settings ── */
  const [genSettings, setGenSettings] = useState(() => LS.get('admin_general', { company: 'RoadRescue AI', supportPhone: '+91 1800-123-456', supportEmail: 'support@roadrescue.in', gst: '27AABCU9603R1ZM', address: 'Mumbai, Maharashtra, India', timezone: 'Asia/Kolkata', language: 'English', currency: 'INR' }));

  /* ── Section 11: System Settings ── */
  const [sysSettings, setSysSettings] = useState(() => LS.get('admin_system', { darkMode: true, maintenance: false }));

  /* ── Section 12: Security ── */
  const [secSettings, setSecSettings] = useState(() => LS.get('admin_security', { minPassword: 8, twoFactor: false, sessionTimeout: 30, maxLoginAttempts: 5 }));

  /* ── Toast ── */
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string, color = '#22c55e') => {
    setToast({ msg, color });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  /* ── Persist all on change ── */
  useEffect(() => { LS.set('admin_users', users); }, [users]);
  useEffect(() => { LS.set('admin_mechanics', mechanics); }, [mechanics]);
  useEffect(() => { LS.set('admin_admins', admins); }, [admins]);
  useEffect(() => { LS.set('admin_roles', roles); }, [roles]);
  useEffect(() => { LS.set('admin_services', services); }, [services]);
  useEffect(() => { LS.set('admin_sos', sosSettings); }, [sosSettings]);
  useEffect(() => { LS.set('admin_payments', paySettings); }, [paySettings]);
  useEffect(() => { LS.set('admin_ai', aiSettings); }, [aiSettings]);
  useEffect(() => { LS.set('admin_notif', notifSettings); }, [notifSettings]);
  useEffect(() => { LS.set('admin_general', genSettings); }, [genSettings]);
  useEffect(() => { LS.set('admin_system', sysSettings); }, [sysSettings]);
  useEffect(() => { LS.set('admin_security', secSettings); }, [secSettings]);

  /* ── Utility ── */
  const uid = () => Math.random().toString(36).slice(2, 10);
  const matchesSearch = (text: string) => !search || text.toLowerCase().includes(search.toLowerCase());

  /* ── System actions ── */
  const handleExport = () => {
    const all: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('admin_')) all[k] = LS.get(k, null);
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `roadrescue-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Data exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          Object.entries(data).forEach(([k, v]) => LS.set(k, v));
          showToast('Data imported — reloading...');
          setTimeout(() => location.reload(), 800);
        } catch { showToast('Invalid JSON file', '#ef4444'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleBackup = handleExport;

  const handleRestore = () => {
    if (!confirm('This will overwrite all current settings. Continue?')) return;
    handleImport();
  };

  const handleClearCache = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('admin_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    showToast('Cache cleared — reloading...');
    setTimeout(() => location.reload(), 800);
  };

  const handleResetDemo = () => {
    if (!confirm('Reset all settings to demo defaults? This cannot be undone.')) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('admin_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    showToast('Demo data reset — reloading...');
    setTimeout(() => location.reload(), 800);
  };

  /* ════════════════════════════════════════════
     SUB-TAB NAV ITEMS
     ════════════════════════════════════════════ */
  const tabs: { key: SettingsTab; label: string; icon: any; color: string }[] = [
    { key: 'users', label: 'User Management', icon: Users, color: '#3b82f6' },
    { key: 'mechanics', label: 'Mechanic Mgmt', icon: Wrench, color: '#f59e0b' },
    { key: 'admins', label: 'Admin Mgmt', icon: Shield, color: '#8b5cf6' },
    { key: 'roles', label: 'Role Permissions', icon: Key, color: '#ec4899' },
    { key: 'services', label: 'Services', icon: Sliders, color: '#14b8a6' },
    { key: 'sos', label: 'SOS Settings', icon: AlertTriangle, color: '#ef4444' },
    { key: 'payments', label: 'Payments', icon: CreditCard, color: '#22c55e' },
    { key: 'ai', label: 'AI Settings', icon: Brain, color: '#6366f1' },
    { key: 'notifications', label: 'Notifications', icon: Bell, color: '#f97316' },
    { key: 'general', label: 'General', icon: Settings, color: '#64748b' },
    { key: 'system', label: 'System', icon: Database, color: '#06b6d4' },
    { key: 'security', label: 'Security', icon: Lock, color: '#ef4444' },
  ];

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', gap: '1.25rem', minHeight: 'calc(100vh - 120px)' }}>
      {/* ── LEFT: Sub-nav ── */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setSubTab(t.key); setSearch(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.75rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: subTab === t.key ? 700 : 500, color: subTab === t.key ? t.color : '#94a3b8', background: subTab === t.key ? `${t.color}15` : 'transparent', transition: 'all 0.15s', textAlign: 'left', width: '100%' }}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RIGHT: Content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Search bar (for list views) */}
        {['users', 'mechanics', 'admins', 'services'].includes(subTab) && (
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input placeholder={`Search ${subTab}...`} value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...C.input, paddingLeft: 36, maxWidth: 360 }} />
          </div>
        )}

        {/* ═══════════════════════════════════════
           1. USER MANAGEMENT
           ═══════════════════════════════════════ */}
        {subTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>User Management</h3>
              <button style={C.btn('#3b82f6')} onClick={() => { setUserForm({ name: '', phone: '', email: '', vehicles: 0, bookings: 0, sosCount: 0 }); setUserModal({ open: true }); }}>
                <UserPlus size={14} /> Add User
              </button>
            </div>
            <div style={{ ...C.card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={C.th}>Name</th><th style={C.th}>Phone</th><th style={C.th}>Email</th>
                    <th style={{ ...C.th, textAlign: 'center' }}>Vehicles</th><th style={{ ...C.th, textAlign: 'center' }}>Bookings</th>
                    <th style={{ ...C.th, textAlign: 'center' }}>SOS</th><th style={C.th}>Status</th><th style={{ ...C.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => matchesSearch(u.name + u.email + u.phone)).map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={C.td}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{u.name.split(' ').map(n => n[0]).join('')}</div><span style={{ color: '#fff', fontWeight: 600 }}>{u.name}</span></div></td>
                      <td style={C.td}>{u.phone}</td><td style={C.td}>{u.email}</td>
                      <td style={{ ...C.td, textAlign: 'center' }}>{u.vehicles}</td><td style={{ ...C.td, textAlign: 'center' }}>{u.bookings}</td>
                      <td style={{ ...C.td, textAlign: 'center' }}>{u.sosCount}</td>
                      <td style={C.td}><span style={C.badge(u.status === 'active' ? '#22c55e' : '#ef4444')}>{u.status}</span></td>
                      <td style={{ ...C.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button title="View" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem' }} onClick={() => setViewUser(u)}><Eye size={13} /></button>
                          <button title="Edit" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem' }} onClick={() => { setUserForm({ name: u.name, phone: u.phone, email: u.email, vehicles: u.vehicles, bookings: u.bookings, sosCount: u.sosCount }); setUserModal({ open: true, edit: u }); }}><Edit3 size={13} /></button>
                          <button title={u.status === 'active' ? 'Suspend' : 'Activate'} style={{ ...C.btnGhost, padding: '0.3rem 0.5rem', color: u.status === 'active' ? '#f59e0b' : '#22c55e' }} onClick={() => { setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' } : x)); showToast(u.status === 'active' ? 'User suspended' : 'User activated', u.status === 'active' ? '#f59e0b' : '#22c55e'); }}>{u.status === 'active' ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}</button>
                          <button title="Reset Password" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem', color: '#8b5cf6' }} onClick={() => setResetPwUser(u.id)}><Key size={13} /></button>
                          <button title="Delete" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem', color: '#ef4444' }} onClick={() => setConfirmDeleteUser(u.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => matchesSearch(u.name + u.email + u.phone)).length === 0 && (
                    <tr><td colSpan={8} style={{ ...C.td, textAlign: 'center', color: '#64748b', padding: '2rem' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* View User Modal */}
            <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details">
              {viewUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[['Name', viewUser.name], ['Phone', viewUser.phone], ['Email', viewUser.email], ['Vehicles', String(viewUser.vehicles)], ['Total Bookings', String(viewUser.bookings)], ['SOS Count', String(viewUser.sosCount)], ['Status', viewUser.status]].map(([l, v]) => (
                    <div key={l} style={C.row}><span style={C.label}>{l}</span><span style={C.value}>{v}</span></div>
                  ))}
                </div>
              )}
            </Modal>

            {/* Add / Edit User Modal */}
            <Modal open={userModal.open} onClose={() => setUserModal({ open: false })} title={userModal.edit ? 'Edit User' : 'Add New User'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {([['name', 'Full Name'], ['phone', 'Phone'], ['email', 'Email']] as const).map(([k, l]) => (
                  <div key={k}><label style={C.label}>{l}</label><input style={C.input} value={(userForm as any)[k]} onChange={e => setUserForm(f => ({ ...f, [k]: e.target.value }))} /></div>
                ))}
                <div style={C.grid3}>
                  {([['vehicles', 'Vehicles'], ['bookings', 'Bookings'], ['sosCount', 'SOS Count']] as const).map(([k, l]) => (
                    <div key={k}><label style={C.label}>{l}</label><input type="number" style={C.input} value={(userForm as any)[k]} onChange={e => setUserForm(f => ({ ...f, [k]: Number(e.target.value) }))} /></div>
                  ))}
                </div>
                <button style={C.btn('#3b82f6')} onClick={() => {
                  if (!userForm.name || !userForm.email) { showToast('Name and email required', '#ef4444'); return; }
                  if (userModal.edit) {
                    setUsers(prev => prev.map(u => u.id === userModal.edit!.id ? { ...u, ...userForm } : u));
                    showToast('User updated');
                  } else {
                    setUsers(prev => [...prev, { id: uid(), ...userForm, status: 'active' }]);
                    showToast('User added');
                  }
                  setUserModal({ open: false });
                }}><Save size={14} /> {userModal.edit ? 'Update' : 'Add User'}</button>
              </div>
            </Modal>

            {/* Reset Password Modal */}
            <Modal open={!!resetPwUser} onClose={() => setResetPwUser(null)} title="Reset Password">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Password reset link will be sent to the user's email (simulated).</p>
              <button style={C.btn('#8b5cf6')} onClick={() => { showToast('Password reset email sent (simulated)'); setResetPwUser(null); }}><Send size={14} /> Send Reset Link</button>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!confirmDeleteUser} onClose={() => setConfirmDeleteUser(null)} title="Delete User">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Are you sure you want to delete this user? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={C.btn('#ef4444')} onClick={() => { setUsers(prev => prev.filter(u => u.id !== confirmDeleteUser)); setConfirmDeleteUser(null); showToast('User deleted', '#ef4444'); }}><Trash2 size={14} /> Delete</button>
                <button style={C.btnGhost} onClick={() => setConfirmDeleteUser(null)}>Cancel</button>
              </div>
            </Modal>
          </div>
        )}

        {/* ═══════════════════════════════════════
           2. MECHANIC MANAGEMENT
           ═══════════════════════════════════════ */}
        {subTab === 'mechanics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Mechanic Management</h3>
              <button style={C.btn('#f59e0b')} onClick={() => { setMechForm({ name: '', phone: '', email: '', experience: 0, skills: '', workshop: '', rating: 0, completedJobs: 0, pendingJobs: 0 }); setMechModal({ open: true }); }}>
                <Wrench size={14} /> Add Mechanic
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {mechanics.filter(m => matchesSearch(m.name + m.email + m.workshop)).map(m => (
                <div key={m.id} style={{ ...C.card, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                    <button title="View" style={{ ...C.btnGhost, padding: '0.25rem 0.4rem' }} onClick={() => setViewMech(m)}><Eye size={12} /></button>
                    <button title="Edit" style={{ ...C.btnGhost, padding: '0.25rem 0.4rem' }} onClick={() => { setMechForm({ name: m.name, phone: m.phone, email: m.email, experience: m.experience, skills: m.skills, workshop: m.workshop, rating: m.rating, completedJobs: m.completedJobs, pendingJobs: m.pendingJobs }); setMechModal({ open: true, edit: m }); }}><Edit3 size={12} /></button>
                    <button title="Delete" style={{ ...C.btnGhost, padding: '0.25rem 0.4rem', color: '#ef4444' }} onClick={() => setConfirmDeleteMech(m.id)}><Trash2 size={12} /></button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>{m.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{m.workshop}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {[
                      ['Experience', m.experience + ' yrs', '#3b82f6'],
                      ['Rating', m.rating + ' *', '#f59e0b'],
                      ['Completed', String(m.completedJobs), '#22c55e'],
                      ['Pending', String(m.pendingJobs), '#f97316'],
                    ].map(([l, v, color]) => (
                      <div key={l} style={{ background: '#0f172a', borderRadius: 8, padding: '0.4rem 0.6rem' }}>
                        <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Skills: {m.skills}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={C.badge(m.status === 'active' ? '#22c55e' : m.status === 'pending' ? '#f59e0b' : '#ef4444')}>{m.status}</span>
                    <span style={C.badge(m.online ? '#22c55e' : '#64748b')}>{m.online ? 'Online' : 'Offline'}</span>
                    {m.verified && <span style={C.badge('#3b82f6')}>Verified</span>}
                    {!m.verified && <span style={C.badge('#f59e0b')}>Unverified</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {!m.verified && <button style={{ ...C.btn('#22c55e'), padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => { setMechanics(prev => prev.map(x => x.id === m.id ? { ...x, verified: true } : x)); showToast('Mechanic verified'); }}><Check size={11} /> Verify</button>}
                    {m.status === 'pending' && <>
                      <button style={{ ...C.btn('#22c55e'), padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => { setMechanics(prev => prev.map(x => x.id === m.id ? { ...x, status: 'active' } : x)); showToast('Registration approved'); }}><Check size={11} /> Approve</button>
                      <button style={{ ...C.btn('#ef4444'), padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => { setMechanics(prev => prev.map(x => x.id === m.id ? { ...x, status: 'suspended' } : x)); showToast('Registration rejected', '#ef4444'); }}><X size={11} /> Reject</button>
                    </>}
                    <button style={{ ...C.btnGhost, padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#8b5cf6' }} onClick={() => setResetPwMech(m.id)}><Key size={11} /> Reset PW</button>
                  </div>
                </div>
              ))}
            </div>

            {/* View Mechanic Modal */}
            <Modal open={!!viewMech} onClose={() => setViewMech(null)} title="Mechanic Details">
              {viewMech && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[['Name', viewMech.name], ['Phone', viewMech.phone], ['Email', viewMech.email], ['Experience', viewMech.experience + ' years'], ['Skills', viewMech.skills], ['Workshop', viewMech.workshop], ['Rating', viewMech.rating + ' *'], ['Completed Jobs', String(viewMech.completedJobs)], ['Pending Jobs', String(viewMech.pendingJobs)], ['Online', viewMech.online ? 'Yes' : 'No'], ['Status', viewMech.status], ['Verified', viewMech.verified ? 'Yes' : 'No']].map(([l, v]) => (
                    <div key={l} style={C.row}><span style={C.label}>{l}</span><span style={C.value}>{v}</span></div>
                  ))}
                </div>
              )}
            </Modal>

            {/* Add / Edit Mechanic Modal */}
            <Modal open={mechModal.open} onClose={() => setMechModal({ open: false })} title={mechModal.edit ? 'Edit Mechanic' : 'Add New Mechanic'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {([['name', 'Full Name'], ['phone', 'Phone'], ['email', 'Email'], ['workshop', 'Workshop'], ['skills', 'Skills (comma separated)']] as const).map(([k, l]) => (
                  <div key={k}><label style={C.label}>{l}</label><input style={C.input} value={(mechForm as any)[k]} onChange={e => setMechForm(f => ({ ...f, [k]: e.target.value }))} /></div>
                ))}
                <div style={C.grid3}>
                  <div><label style={C.label}>Experience (yrs)</label><input type="number" style={C.input} value={mechForm.experience} onChange={e => setMechForm(f => ({ ...f, experience: Number(e.target.value) }))} /></div>
                  <div><label style={C.label}>Rating</label><input type="number" step="0.1" style={C.input} value={mechForm.rating} onChange={e => setMechForm(f => ({ ...f, rating: Number(e.target.value) }))} /></div>
                  <div><label style={C.label}>Completed Jobs</label><input type="number" style={C.input} value={mechForm.completedJobs} onChange={e => setMechForm(f => ({ ...f, completedJobs: Number(e.target.value) }))} /></div>
                </div>
                <button style={C.btn('#f59e0b')} onClick={() => {
                  if (!mechForm.name || !mechForm.email) { showToast('Name and email required', '#ef4444'); return; }
                  if (mechModal.edit) {
                    setMechanics(prev => prev.map(m => m.id === mechModal.edit!.id ? { ...m, ...mechForm } : m));
                    showToast('Mechanic updated');
                  } else {
                    setMechanics(prev => [...prev, { id: uid(), ...mechForm, online: false, status: 'pending', verified: false, pendingJobs: 0 }]);
                    showToast('Mechanic added');
                  }
                  setMechModal({ open: false });
                }}><Save size={14} /> {mechModal.edit ? 'Update' : 'Add Mechanic'}</button>
              </div>
            </Modal>

            {/* Reset Password Mechanic */}
            <Modal open={!!resetPwMech} onClose={() => setResetPwMech(null)} title="Reset Mechanic Password">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Password reset link will be sent to the mechanic's email (simulated).</p>
              <button style={C.btn('#8b5cf6')} onClick={() => { showToast('Password reset email sent (simulated)'); setResetPwMech(null); }}><Send size={14} /> Send Reset Link</button>
            </Modal>

            {/* Delete Mechanic */}
            <Modal open={!!confirmDeleteMech} onClose={() => setConfirmDeleteMech(null)} title="Remove Mechanic">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Are you sure you want to remove this mechanic?</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={C.btn('#ef4444')} onClick={() => { setMechanics(prev => prev.filter(m => m.id !== confirmDeleteMech)); setConfirmDeleteMech(null); showToast('Mechanic removed', '#ef4444'); }}><Trash2 size={14} /> Remove</button>
                <button style={C.btnGhost} onClick={() => setConfirmDeleteMech(null)}>Cancel</button>
              </div>
            </Modal>
          </div>
        )}

        {/* ═══════════════════════════════════════
           3. ADMIN MANAGEMENT
           ═══════════════════════════════════════ */}
        {subTab === 'admins' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Admin Management</h3>
              <button style={C.btn('#8b5cf6')} onClick={() => { setAdminForm({ name: '', email: '', role: 'Read Only Admin' }); setAdminModal({ open: true }); }}>
                <Shield size={14} /> Add Sub Admin
              </button>
            </div>
            <div style={{ ...C.card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={C.th}>Name</th><th style={C.th}>Email</th><th style={C.th}>Role</th><th style={C.th}>Status</th><th style={{ ...C.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.filter(a => matchesSearch(a.name + a.email)).map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={C.td}><span style={{ color: '#fff', fontWeight: 600 }}>{a.name}</span></td>
                      <td style={C.td}>{a.email}</td>
                      <td style={C.td}><span style={C.badge('#8b5cf6')}>{a.role}</span></td>
                      <td style={C.td}><span style={C.badge(a.status === 'active' ? '#22c55e' : '#ef4444')}>{a.status}</span></td>
                      <td style={{ ...C.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button title="Edit" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem' }} onClick={() => { setAdminForm({ name: a.name, email: a.email, role: a.role }); setAdminModal({ open: true, edit: a }); }}><Edit3 size={13} /></button>
                          <button title="Toggle Status" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem', color: a.status === 'active' ? '#f59e0b' : '#22c55e' }} onClick={() => { setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)); showToast(a.status === 'active' ? 'Admin disabled' : 'Admin enabled'); }}>{a.status === 'active' ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}</button>
                          <button title="Delete" style={{ ...C.btnGhost, padding: '0.3rem 0.5rem', color: '#ef4444' }} onClick={() => setConfirmDeleteAdmin(a.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add / Edit Admin Modal */}
            <Modal open={adminModal.open} onClose={() => setAdminModal({ open: false })} title={adminModal.edit ? 'Edit Admin' : 'Add Sub Admin'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div><label style={C.label}>Name</label><input style={C.input} value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label style={C.label}>Email</label><input style={C.input} value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><label style={C.label}>Role</label>
                  <select style={{ ...C.input, cursor: 'pointer' }} value={adminForm.role} onChange={e => setAdminForm(f => ({ ...f, role: e.target.value }))}>
                    {roles.map(r => <option key={r.id} value={r.name} style={{ background: '#0f172a', color: '#fff' }}>{r.name}</option>)}
                  </select>
                </div>
                <button style={C.btn('#8b5cf6')} onClick={() => {
                  if (!adminForm.name || !adminForm.email) { showToast('Name and email required', '#ef4444'); return; }
                  if (adminModal.edit) {
                    setAdmins(prev => prev.map(a => a.id === adminModal.edit!.id ? { ...a, ...adminForm } : a));
                    showToast('Admin updated');
                  } else {
                    setAdmins(prev => [...prev, { id: uid(), ...adminForm, status: 'active' }]);
                    showToast('Admin added');
                  }
                  setAdminModal({ open: false });
                }}><Save size={14} /> {adminModal.edit ? 'Update' : 'Add Admin'}</button>
              </div>
            </Modal>

            {/* Delete Admin */}
            <Modal open={!!confirmDeleteAdmin} onClose={() => setConfirmDeleteAdmin(null)} title="Remove Admin">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Are you sure you want to remove this admin?</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={C.btn('#ef4444')} onClick={() => { setAdmins(prev => prev.filter(a => a.id !== confirmDeleteAdmin)); setConfirmDeleteAdmin(null); showToast('Admin removed', '#ef4444'); }}><Trash2 size={14} /> Remove</button>
                <button style={C.btnGhost} onClick={() => setConfirmDeleteAdmin(null)}>Cancel</button>
              </div>
            </Modal>
          </div>
        )}

        {/* ═══════════════════════════════════════
           4. ROLE PERMISSIONS
           ═══════════════════════════════════════ */}
        {subTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Role Permissions</h3>
              <button style={C.btn('#ec4899')} onClick={() => { setRoleForm({ name: '', permissions: [] }); setRoleModal({ open: true }); }}>
                <Key size={14} /> Add Role
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {roles.map(r => (
                <div key={r.id} style={{ ...C.card }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(236,72,153,0.12)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={16} /></div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{r.permissions.length} permissions</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ ...C.btnGhost, padding: '0.3rem 0.5rem' }} onClick={() => { setRoleForm({ name: r.name, permissions: [...r.permissions] }); setRoleModal({ open: true, edit: r }); }}><Edit3 size={12} /></button>
                      <button style={{ ...C.btnGhost, padding: '0.3rem 0.5rem', color: '#ef4444' }} onClick={() => setConfirmDeleteRole(r.id)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {r.permissions.map(p => (
                      <span key={p} style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600 }}>{ALL_PERMISSIONS.find(x => x.key === p)?.label || p}</span>
                    ))}
                    {r.permissions.length === 0 && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>No permissions assigned</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Role Modal */}
            <Modal open={roleModal.open} onClose={() => setRoleModal({ open: false })} title={roleModal.edit ? 'Edit Role' : 'Add New Role'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div><label style={C.label}>Role Name</label><input style={C.input} value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label style={C.label}>Permissions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#e2e8f0', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={roleForm.permissions.includes(p.key)}
                          onChange={e => setRoleForm(f => ({
                            ...f,
                            permissions: e.target.checked ? [...f.permissions, p.key] : f.permissions.filter(x => x !== p.key)
                          }))}
                          style={{ accentColor: '#ec4899' }} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <button style={C.btn('#ec4899')} onClick={() => {
                  if (!roleForm.name) { showToast('Role name required', '#ef4444'); return; }
                  if (roleModal.edit) {
                    setRoles(prev => prev.map(r => r.id === roleModal.edit!.id ? { ...r, name: roleForm.name, permissions: roleForm.permissions } : r));
                    showToast('Role updated');
                  } else {
                    setRoles(prev => [...prev, { id: uid(), name: roleForm.name, permissions: roleForm.permissions }]);
                    showToast('Role added');
                  }
                  setRoleModal({ open: false });
                }}><Save size={14} /> {roleModal.edit ? 'Update' : 'Add Role'}</button>
              </div>
            </Modal>

            {/* Delete Role */}
            <Modal open={!!confirmDeleteRole} onClose={() => setConfirmDeleteRole(null)} title="Delete Role">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Are you sure you want to delete this role?</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={C.btn('#ef4444')} onClick={() => { setRoles(prev => prev.filter(r => r.id !== confirmDeleteRole)); setConfirmDeleteRole(null); showToast('Role deleted', '#ef4444'); }}><Trash2 size={14} /> Delete</button>
                <button style={C.btnGhost} onClick={() => setConfirmDeleteRole(null)}>Cancel</button>
              </div>
            </Modal>
          </div>
        )}

        {/* ═══════════════════════════════════════
           5. SERVICE MANAGEMENT
           ═══════════════════════════════════════ */}
        {subTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Service Management</h3>
              <button style={C.btn('#14b8a6')} onClick={() => { setSvcForm({ name: '', icon: 'Wrench', price: 0, eta: '', enabled: true, category: 'Basic' }); setSvcModal({ open: true }); }}>
                <Plus size={14} /> Add Service
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {services.filter(s => matchesSearch(s.name + s.category)).map(s => {
                const IconMap: Record<string, any> = { Car, Battery, Fuel, Lock, Truck, Wrench };
                const SIcon = IconMap[s.icon] || Wrench;
                return (
                  <div key={s.id} style={{ ...C.card, opacity: s.enabled ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(20,184,166,0.12)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SIcon size={18} /></div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{s.category}</div>
                        </div>
                      </div>
                      <Toggle value={s.enabled} onChange={v => { setServices(prev => prev.map(x => x.id === s.id ? { ...x, enabled: v } : x)); showToast(`${s.name} ${v ? 'enabled' : 'disabled'}`); }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div><span style={C.label}>Price</span><div style={{ color: '#22c55e', fontWeight: 700 }}>₹{s.price}</div></div>
                      <div><span style={C.label}>ETA</span><div style={{ color: '#f59e0b', fontWeight: 700 }}>{s.eta}</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button style={{ ...C.btnGhost, padding: '0.3rem 0.6rem', fontSize: '0.7rem' }} onClick={() => { setSvcForm({ name: s.name, icon: s.icon, price: s.price, eta: s.eta, enabled: s.enabled, category: s.category }); setSvcModal({ open: true, edit: s }); }}><Edit3 size={11} /> Edit</button>
                      <button style={{ ...C.btnGhost, padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#ef4444' }} onClick={() => setConfirmDeleteSvc(s.id)}><Trash2 size={11} /> Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add / Edit Service Modal */}
            <Modal open={svcModal.open} onClose={() => setSvcModal({ open: false })} title={svcModal.edit ? 'Edit Service' : 'Add New Service'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div><label style={C.label}>Service Name</label><input style={C.input} value={svcForm.name} onChange={e => setSvcForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div style={C.grid2}>
                  <div><label style={C.label}>Icon</label>
                    <select style={{ ...C.input, cursor: 'pointer' }} value={svcForm.icon} onChange={e => setSvcForm(f => ({ ...f, icon: e.target.value }))}>
                      {['Car', 'Battery', 'Fuel', 'Lock', 'Truck', 'Wrench'].map(i => <option key={i} value={i} style={{ background: '#0f172a', color: '#fff' }}>{i}</option>)}
                    </select>
                  </div>
                  <div><label style={C.label}>Category</label>
                    <select style={{ ...C.input, cursor: 'pointer' }} value={svcForm.category} onChange={e => setSvcForm(f => ({ ...f, category: e.target.value }))}>
                      {['Basic', 'Security', 'Heavy', 'Diagnostic'].map(c => <option key={c} value={c} style={{ background: '#0f172a', color: '#fff' }}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={C.grid2}>
                  <div><label style={C.label}>Price (₹)</label><input type="number" style={C.input} value={svcForm.price} onChange={e => setSvcForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
                  <div><label style={C.label}>ETA</label><input style={C.input} value={svcForm.eta} onChange={e => setSvcForm(f => ({ ...f, eta: e.target.value }))} placeholder="e.g. 15-20 min" /></div>
                </div>
                <button style={C.btn('#14b8a6')} onClick={() => {
                  if (!svcForm.name) { showToast('Service name required', '#ef4444'); return; }
                  if (svcModal.edit) {
                    setServices(prev => prev.map(s => s.id === svcModal.edit!.id ? { ...s, ...svcForm } : s));
                    showToast('Service updated');
                  } else {
                    setServices(prev => [...prev, { id: uid(), ...svcForm }]);
                    showToast('Service added');
                  }
                  setSvcModal({ open: false });
                }}><Save size={14} /> {svcModal.edit ? 'Update' : 'Add Service'}</button>
              </div>
            </Modal>

            {/* Delete Service */}
            <Modal open={!!confirmDeleteSvc} onClose={() => setConfirmDeleteSvc(null)} title="Delete Service">
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Are you sure you want to delete this service?</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={C.btn('#ef4444')} onClick={() => { setServices(prev => prev.filter(s => s.id !== confirmDeleteSvc)); setConfirmDeleteSvc(null); showToast('Service deleted', '#ef4444'); }}><Trash2 size={14} /> Delete</button>
                <button style={C.btnGhost} onClick={() => setConfirmDeleteSvc(null)}>Cancel</button>
              </div>
            </Modal>
          </div>
        )}

        {/* ═══════════════════════════════════════
           6. SOS SETTINGS
           ═══════════════════════════════════════ */}
        {subTab === 'sos' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>SOS Settings</h3>
            <div style={{ ...C.card }}>
              <SectionHeading icon={AlertTriangle} title="Emergency Configuration" color="#ef4444" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Enable SOS System</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Allow customers to trigger emergency SOS requests</div></div>
                  <Toggle value={sosSettings.enabled} onChange={v => setSosSettings((s: any) => ({ ...s, enabled: v }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Emergency Hotline</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Number displayed for direct emergency calls</div></div>
                  <input style={{ ...C.input, width: 200, textAlign: 'right' }} value={sosSettings.hotline} onChange={e => setSosSettings((s: any) => ({ ...s, hotline: e.target.value }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Auto-Assign Mechanic</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Automatically assign nearest available mechanic to SOS</div></div>
                  <Toggle value={sosSettings.autoAssign} onChange={v => setSosSettings((s: any) => ({ ...s, autoAssign: v }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Priority Rules</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Enable priority-based routing for critical emergencies</div></div>
                  <Toggle value={sosSettings.priorityRules} onChange={v => setSosSettings((s: any) => ({ ...s, priorityRules: v }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Max Response Time (min)</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Maximum allowed response time before escalation</div></div>
                  <input type="number" style={{ ...C.input, width: 120, textAlign: 'right' }} value={sosSettings.maxResponse} onChange={e => setSosSettings((s: any) => ({ ...s, maxResponse: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           7. PAYMENT SETTINGS
           ═══════════════════════════════════════ */}
        {subTab === 'payments' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>Payment Settings</h3>
            <div style={{ ...C.card }}>
              <SectionHeading icon={CreditCard} title="Payment Methods" color="#22c55e" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {([
                  ['cash', 'Cash', 'Accept cash payments on delivery'],
                  ['upi', 'UPI', 'Unified Payments Interface'],
                  ['googlePay', 'Google Pay', 'Google Pay integration'],
                  ['phonePe', 'PhonePe', 'PhonePe integration'],
                  ['paytm', 'Paytm', 'Paytm wallet and UPI'],
                  ['creditCard', 'Credit Card', 'Credit/Debit card payments'],
                ] as const).map(([key, label, desc]) => (
                  <div key={key}>
                    <div style={C.row}>
                      <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{label}</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{desc}</div></div>
                      <Toggle value={(paySettings as any)[key]} onChange={v => setPaySettings((s: any) => ({ ...s, [key]: v }))} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           8. AI SETTINGS
           ═══════════════════════════════════════ */}
        {subTab === 'ai' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>AI Settings</h3>
            <div style={{ ...C.card }}>
              <SectionHeading icon={Brain} title="AI Configuration" color="#6366f1" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {([
                  ['enabled', 'Enable AI', 'Power chatbot, recommendations, and diagnostics'],
                  ['voiceChat', 'Enable Voice Chat', 'Voice-based AI assistant interaction'],
                  ['telemetry', 'Enable Telemetry', 'Collect anonymized usage data for AI improvement'],
                ] as const).map(([key, label, desc]) => (
                  <div key={key} style={C.row}>
                    <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{label}</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{desc}</div></div>
                    <Toggle value={(aiSettings as any)[key]} onChange={v => setAiSettings((s: any) => ({ ...s, [key]: v }))} />
                  </div>
                ))}
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>AI Confidence Threshold (%)</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Minimum confidence level for AI recommendations</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min={50} max={100} value={aiSettings.confidence} onChange={e => setAiSettings((s: any) => ({ ...s, confidence: Number(e.target.value) }))} style={{ width: 140, accentColor: '#6366f1' }} />
                    <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.9rem', minWidth: 40, textAlign: 'right' }}>{aiSettings.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           9. NOTIFICATION SETTINGS
           ═══════════════════════════════════════ */}
        {subTab === 'notifications' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>Notification Settings</h3>
            <div style={{ ...C.card }}>
              <SectionHeading icon={Bell} title="Notification Channels" color="#f97316" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {([
                  ['email', 'Email Notifications', 'Send alerts and updates via email', Mail],
                  ['sms', 'SMS Notifications', 'Send critical alerts via SMS', Smartphone],
                  ['push', 'Push Notifications', 'In-app push notifications', Bell],
                  ['browser', 'Browser Notifications', 'Desktop browser push notifications', Globe],
                  ['sound', 'Sound Alerts', 'Audio alerts for urgent events', Volume2],
                ] as const).map(([key, label, desc, Icon]) => (
                  <div key={key} style={C.row}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(249,115,22,0.12)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} /></div>
                      <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{label}</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>{desc}</div></div>
                    </div>
                    <Toggle value={(notifSettings as any)[key]} onChange={v => setNotifSettings((s: any) => ({ ...s, [key]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           10. GENERAL SETTINGS
           ═══════════════════════════════════════ */}
        {subTab === 'general' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>General Settings</h3>
            <div style={{ ...C.card }}>
              <SectionHeading icon={Settings} title="Company Information" color="#64748b" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {([
                  ['company', 'Company Name', 'text'],
                  ['supportPhone', 'Support Number', 'text'],
                  ['supportEmail', 'Support Email', 'email'],
                  ['gst', 'GST Number', 'text'],
                ] as const).map(([key, label, type]) => (
                  <div key={key}><label style={C.label}>{label}</label><input type={type} style={C.input} value={(genSettings as any)[key]} onChange={e => setGenSettings((s: any) => ({ ...s, [key]: e.target.value }))} /></div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}><label style={C.label}>Office Address</label><input style={C.input} value={genSettings.address} onChange={e => setGenSettings((s: any) => ({ ...s, address: e.target.value }))} /></div>
              </div>
              <div style={{ ...C.divider }} />
              <SectionHeading icon={Globe} title="Localization" color="#64748b" />
              <div style={C.grid3}>
                <div><label style={C.label}>Timezone</label>
                  <select style={{ ...C.input, cursor: 'pointer' }} value={genSettings.timezone} onChange={e => setGenSettings((s: any) => ({ ...s, timezone: e.target.value }))}>
                    {['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Europe/London', 'Asia/Singapore'].map(tz => <option key={tz} value={tz} style={{ background: '#0f172a', color: '#fff' }}>{tz}</option>)}
                  </select>
                </div>
                <div><label style={C.label}>Language</label>
                  <select style={{ ...C.input, cursor: 'pointer' }} value={genSettings.language} onChange={e => setGenSettings((s: any) => ({ ...s, language: e.target.value }))}>
                    {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada'].map(l => <option key={l} value={l} style={{ background: '#0f172a', color: '#fff' }}>{l}</option>)}
                  </select>
                </div>
                <div><label style={C.label}>Currency</label>
                  <select style={{ ...C.input, cursor: 'pointer' }} value={genSettings.currency} onChange={e => setGenSettings((s: any) => ({ ...s, currency: e.target.value }))}>
                    {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c} value={c} style={{ background: '#0f172a', color: '#fff' }}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           11. SYSTEM SETTINGS
           ═══════════════════════════════════════ */}
        {subTab === 'system' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>System Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Display */}
              <div style={{ ...C.card }}>
                <SectionHeading icon={Eye} title="Display" color="#06b6d4" />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Dark Mode</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Enable dark theme globally</div></div>
                  <Toggle value={sysSettings.darkMode} onChange={v => setSysSettings((s: any) => ({ ...s, darkMode: v }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Maintenance Mode</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Put the system in maintenance mode</div></div>
                  <Toggle value={sysSettings.maintenance} onChange={v => setSysSettings((s: any) => ({ ...s, maintenance: v }))} />
                </div>
              </div>

              {/* Data Management */}
              <div style={{ ...C.card }}>
                <SectionHeading icon={Database} title="Data Management" color="#06b6d4" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button style={{ ...C.btn('#22c55e'), width: '100%', justifyContent: 'center' }} onClick={handleBackup}><Download size={14} /> Backup Data</button>
                  <button style={{ ...C.btn('#f59e0b'), width: '100%', justifyContent: 'center' }} onClick={handleRestore}><Upload size={14} /> Restore Data</button>
                  <button style={{ ...C.btn('#3b82f6'), width: '100%', justifyContent: 'center' }} onClick={handleExport}><Download size={14} /> Export JSON</button>
                  <button style={{ ...C.btn('#8b5cf6'), width: '100%', justifyContent: 'center' }} onClick={handleImport}><Upload size={14} /> Import JSON</button>
                </div>
              </div>

              {/* Maintenance */}
              <div style={{ ...C.card }}>
                <SectionHeading icon={RefreshCw} title="Maintenance" color="#06b6d4" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button style={{ ...C.btn('#ef4444'), width: '100%', justifyContent: 'center' }} onClick={handleClearCache}><Trash2 size={14} /> Clear Cache</button>
                  <button style={{ ...C.btn('#dc2626'), width: '100%', justifyContent: 'center' }} onClick={handleResetDemo}><RefreshCw size={14} /> Reset Demo Data</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           12. SECURITY
           ═══════════════════════════════════════ */}
        {subTab === 'security' && (
          <div>
            <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>Security Settings</h3>
            <div style={{ ...C.card }}>
              <SectionHeading icon={Lock} title="Authentication & Access" color="#ef4444" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Minimum Password Length</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Minimum characters required for passwords</div></div>
                  <input type="number" min={4} max={32} style={{ ...C.input, width: 100, textAlign: 'right' }} value={secSettings.minPassword} onChange={e => setSecSettings((s: any) => ({ ...s, minPassword: Number(e.target.value) }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Two-Factor Authentication</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Require 2FA for all admin accounts</div></div>
                  <Toggle value={secSettings.twoFactor} onChange={v => setSecSettings((s: any) => ({ ...s, twoFactor: v }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Session Timeout (min)</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Auto-logout after inactivity period</div></div>
                  <input type="number" min={5} max={480} style={{ ...C.input, width: 100, textAlign: 'right' }} value={secSettings.sessionTimeout} onChange={e => setSecSettings((s: any) => ({ ...s, sessionTimeout: Number(e.target.value) }))} />
                </div>
                <div style={{ ...C.divider }} />
                <div style={C.row}>
                  <div><div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Max Login Attempts</div><div style={{ color: '#64748b', fontSize: '0.75rem' }}>Lock account after failed attempts</div></div>
                  <input type="number" min={1} max={20} style={{ ...C.input, width: 100, textAlign: 'right' }} value={secSettings.maxLoginAttempts} onChange={e => setSecSettings((s: any) => ({ ...s, maxLoginAttempts: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000, background: '#1e293b', border: `1px solid ${toast.color}44`, borderRadius: 12, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 24px ${toast.color}33`, animation: 'slideIn 0.3s ease' }}>
          <Check size={16} color={toast.color} />
          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
