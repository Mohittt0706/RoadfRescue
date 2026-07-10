import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Plus, 
  Search, 
  LogOut, 
  QrCode, 
  AlertTriangle,
  X,
  Download
} from 'lucide-react';

interface ProfileSettingsPageProps {
  onLogout: () => void;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  fuelType: string;
  insuranceStatus: 'Active' | 'Expired';
  lastService: string;
  warranty: string;
  logo: string;
}

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  locationSharing: boolean;
  autoSms: boolean;
}

interface HistoryItem {
  id: string;
  mechanicName: string;
  vehicle: string;
  issue: string;
  date: string;
  status: 'completed' | 'pending' | 'canceled';
  amount: string;
}

export default function ProfileSettingsPage({ onLogout }: ProfileSettingsPageProps) {
  /* --- Local Sub-Tabs --- */
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'vehicles' | 'billing' | 'security' | 'support'>('overview');

  /* --- QR Code Share Modal state --- */
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  /* --- User Profile data --- */
  const [profileName, setProfileName] = useState('Disha');
  const [profileEmail, setProfileEmail] = useState('disha@roadrescue.ai');
  const [profilePhone, setProfilePhone] = useState('(555) 019-2831');
  const [profilePicture, setProfilePicture] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150');
  
  /* --- Garage Vehicles Array --- */
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'v-1',
      brand: 'Tesla',
      model: 'Model Y (Red)',
      plate: '7XYZ99',
      fuelType: 'EV (Electric)',
      insuranceStatus: 'Active',
      lastService: 'June 15, 2026',
      warranty: 'Under Warranty (2029)',
      logo: '⚡'
    },
    {
      id: 'v-2',
      brand: 'Honda',
      model: 'CR-V (Black)',
      plate: '8ABC12',
      fuelType: 'Petrol',
      insuranceStatus: 'Active',
      lastService: 'Jan 10, 2026',
      warranty: 'Expired (2025)',
      logo: '🚗'
    }
  ]);
  
  const [showAddVehicleCard, setShowAddVehicleCard] = useState(false);
  const [newVehicleBrand, setNewVehicleBrand] = useState('Toyota');
  const [newVehicleModel, setNewVehicleModel] = useState('RAV4');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleFuel, setNewVehicleFuel] = useState('Hybrid');

  /* --- Emergency Contacts State --- */
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 'c-1',
      name: 'Mom',
      relationship: 'Mother',
      phone: '(555) 123-4567',
      email: 'mom@family.com',
      locationSharing: true,
      autoSms: true
    }
  ]);
  
  const [showAddContactCard, setShowAddContactCard] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Spouse');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  /* --- Payment Methods --- */
  const [savedMethods, setSavedMethods] = useState<Array<{ id: string; type: 'visa' | 'mastercard' | 'upi' | 'wallet'; number: string; isDefault: boolean }>>([
    { id: 'pay-1', type: 'visa', number: 'Visa ending in 4920', isDefault: true },
    { id: 'pay-2', type: 'mastercard', number: 'Mastercard ending in 1180', isDefault: false },
    { id: 'pay-3', type: 'upi', number: 'disha@paytm', isDefault: false }
  ]);

  /* --- Service History Timeline --- */
  const [historyItems] = useState<HistoryItem[]>([
    { id: 'RR-629103', mechanicName: 'Apex Auto Recovery', vehicle: 'Tesla Model Y', issue: 'Dead Battery Jumpstart', date: 'July 2, 2026', status: 'completed', amount: '$65.60' },
    { id: 'RR-519280', mechanicName: 'Rescue Mobile Repair', vehicle: 'Tesla Model Y', issue: 'Tire Puncture swap', date: 'June 18, 2026', status: 'completed', amount: '$49.00' },
    { id: 'RR-391829', mechanicName: 'Tow Pro Logistics', vehicle: 'Honda CR-V', issue: 'Radiator Overheating Tow', date: 'May 29, 2026', status: 'completed', amount: '$180.00' }
  ]);
  
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [showLeaveReviewModal, setShowLeaveReviewModal] = useState<string | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewText, setReviewText] = useState('');

  /* --- Security score adjustments --- */
  const [securityPassword, setSecurityPassword] = useState('••••••••••••');
  const [security2FA, setSecurity2FA] = useState(false);
  const [securityBiometrics, setSecurityBiometrics] = useState(true);
  const [securityScore, setSecurityScore] = useState(60);

  useEffect(() => {
    let score = 50;
    if (security2FA) score += 25;
    if (securityBiometrics) score += 25;
    setSecurityScore(score);
  }, [security2FA, securityBiometrics]);

  /* --- Global Preferences --- */
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleThemeLive = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const [language, setLanguage] = useState('English');
  const [distanceUnit, setDistanceUnit] = useState<'Miles' | 'KM'>('Miles');
  const [timezone, setTimezone] = useState('GMT+5:30 (India Standard Time)');
  const [mapProvider, setMapProvider] = useState('Google Maps');

  /* --- Logout Confirmation Modal --- */
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /* --- Profile Picture Upload simulator --- */
  const handlePhotoUpload = () => {
    const newPic = prompt("Enter Image URL for profile avatar:", profilePicture);
    if (newPic && newPic.trim()) {
      setProfilePicture(newPic.trim());
    }
  };

  // Add Vehicle handler
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim()) return;
    
    const v: Vehicle = {
      id: 'v-' + Date.now(),
      brand: newVehicleBrand,
      model: newVehicleModel,
      plate: newVehiclePlate.toUpperCase().trim(),
      fuelType: newVehicleFuel,
      insuranceStatus: 'Active',
      lastService: 'Today',
      warranty: 'Warranty Active',
      logo: newVehicleFuel === 'Electric' || newVehicleBrand.toLowerCase() === 'tesla' ? '⚡' : '🚗'
    };
    
    setVehicles(prev => [...prev, v]);
    setNewVehiclePlate('');
    setShowAddVehicleCard(false);
  };

  // Delete Vehicle
  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  // Add Emergency Contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    
    const c: Contact = {
      id: 'c-' + Date.now(),
      name: newContactName,
      relationship: newContactRelation,
      phone: newContactPhone,
      email: newContactEmail || 'N/A',
      locationSharing: true,
      autoSms: true
    };
    
    setContacts(prev => [...prev, c]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactEmail('');
    setShowAddContactCard(false);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleDefaultPayment = (id: string) => {
    setSavedMethods(prev => prev.map(m => ({
      ...m,
      isDefault: m.id === id
    })));
  };

  const handleDeletePayment = (id: string) => {
    setSavedMethods(prev => prev.filter(m => m.id !== id));
  };

  // Filter Timelines
  const filteredHistory = historyItems.filter(item => 
    item.issue.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    item.mechanicName.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <div className="profile-settings-layout">
      
      {/* 1. LEFT COLUMN: NAVIGATION LIST */}
      <aside className="profile-settings-nav ai-glass-panel">
        <button 
          onClick={() => setActiveSubTab('overview')}
          className={`profile-settings-nav-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
        >
          👤 Overview & Loyalty
        </button>
        <button 
          onClick={() => setActiveSubTab('vehicles')}
          className={`profile-settings-nav-btn ${activeSubTab === 'vehicles' ? 'active' : ''}`}
        >
          🚗 Garage & Contacts
        </button>
        <button 
          onClick={() => setActiveSubTab('billing')}
          className={`profile-settings-nav-btn ${activeSubTab === 'billing' ? 'active' : ''}`}
        >
          💳 Billing & Timeline
        </button>
        <button 
          onClick={() => setActiveSubTab('security')}
          className={`profile-settings-nav-btn ${activeSubTab === 'security' ? 'active' : ''}`}
        >
          🔒 Security & Preferences
        </button>
        <button 
          onClick={() => setActiveSubTab('support')}
          className={`profile-settings-nav-btn ${activeSubTab === 'support' ? 'active' : ''}`}
        >
          🆘 Support & Logout
        </button>
        
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', paddingLeft: '0.5rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>MEMBERSHIP STATUS:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '1rem' }}>🏆</span>
            <strong style={{ fontSize: '0.8rem', color: '#eab308' }}>VIP Gold Driver</strong>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT COLUMN: RENDER SELECTED TAB PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* SUBTAB PANEL 1: OVERVIEW & STATS */}
        {activeSubTab === 'overview' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* HERO PROFILE CARD */}
            <div className="ai-glass-panel" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer' }} onClick={handlePhotoUpload} title="Click to upload profile photo">
                <img src={profilePicture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', textAlign: 'center', padding: '4px 0' }}>Edit</div>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>{profileName}</h2>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(37,99,235,0.15)' }}>
                    ✓ VERIFIED
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(234,179,8,0.08)', color: '#d97706', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(234,179,8,0.2)' }}>
                    ★ GOLD MEMBER
                  </span>
                </div>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>ID: Account-RR-19401 • Joined July 2024</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>✉️ <strong>{profileEmail}</strong></span>
                  <span>📞 <strong>{profilePhone}</strong></span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => setShowQrModal(true)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <QrCode size={14} /> Profile QR Code
                  </button>
                </div>
              </div>
            </div>

            {/* DYNAMIC PROGRESS AND LOYALTY CARD */}
            <div className="ai-glass-panel" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '2rem', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>🏆 Loyalty Rewards Progress</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  You have earned <strong>4,200 points</strong>. Only 800 points remaining to unlock Platinum membership tier for zero platform fees!
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-light)" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#eab308" strokeWidth="3.5" strokeDasharray="100" strokeDashoffset="16" strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>
                    84%
                  </div>
                </div>
                
                <div style={{ fontSize: '0.8rem' }}>
                  <div>Current Level: <strong>Gold Driver</strong></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Next Tier: <strong>Platinum (5,000 pts)</strong></div>
                  <button onClick={() => alert("Redirecting to active referral coupon list...")} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', marginTop: '0.35rem' }}>Refer Friends & Earn</button>
                </div>
              </div>
            </div>

            {/* STATS OVERVIEW CARDS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div className="db-stat-box" style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)' }}>
                <span className="db-stat-num" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>12</span>
                <span className="db-stat-lbl">Completed Services</span>
              </div>
              <div className="db-stat-box" style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)' }}>
                <span className="db-stat-num" style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>9.5m</span>
                <span className="db-stat-lbl">Avg Response speed</span>
              </div>
              <div className="db-stat-box" style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)' }}>
                <span className="db-stat-num" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>$140</span>
                <span className="db-stat-lbl">Money Saved (AI Check)</span>
              </div>
              <div className="db-stat-box" style={{ background: 'var(--light-surface)', border: '1px solid var(--border-light)' }}>
                <span className="db-stat-num" style={{ fontSize: '1.5rem', color: '#8B5CF6' }}>142 mi</span>
                <span className="db-stat-lbl">Assisted Mileage</span>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB PANEL 2: GARAGE & EMERGENCY CONTACTS */}
        {activeSubTab === 'vehicles' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* GARAGE VEHICLE LIST */}
            <div className="ai-glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>🚗 My Garage (Vehicles)</h3>
                <button 
                  onClick={() => setShowAddVehicleCard(!showAddVehicleCard)}
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={14} /> Add Vehicle
                </button>
              </div>

              {/* Add Vehicle Inline Drawer Card */}
              {showAddVehicleCard && (
                <form onSubmit={handleAddVehicle} className="animate-slide-up" style={{ padding: '1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Brand</label>
                      <select value={newVehicleBrand} onChange={e => setNewVehicleBrand(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                        <option>Tesla</option>
                        <option>Toyota</option>
                        <option>Ford</option>
                        <option>Honda</option>
                        <option>BMW</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Model</label>
                      <input type="text" value={newVehicleModel} onChange={e => setNewVehicleModel(e.target.value)} placeholder="e.g. RAV4" className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>License Plate</label>
                      <input type="text" required placeholder="e.g. 7XYZ99" value={newVehiclePlate} onChange={e => setNewVehiclePlate(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Fuel Type</label>
                      <select value={newVehicleFuel} onChange={e => setNewVehicleFuel(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                        <option>Petrol</option>
                        <option>Diesel</option>
                        <option>EV (Electric)</option>
                        <option>Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button type="button" onClick={() => setShowAddVehicleCard(false)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Save Vehicle</button>
                  </div>
                </form>
              )}

              {/* Vehicles Grid list */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {vehicles.map(v => (
                  <div key={v.id} className="garage-vehicle-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="garage-vehicle-logo">{v.logo}</div>
                      <span className={`garage-status-badge ${v.insuranceStatus === 'Active' ? 'active' : 'expired'}`}>
                        🛡️ Insurance: {v.insuranceStatus}
                      </span>
                    </div>
                    
                    <div style={{ margin: '0.75rem 0' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{v.brand} {v.model}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plate: <strong>{v.plate}</strong> • {v.fuelType}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Last Service: {v.lastService} | {v.warranty}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                      <button onClick={() => alert("Telemetry diagnostics synced from vehicle ECU")} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', flexGrow: 1 }}>ECU Sync</button>
                      <button onClick={() => handleDeleteVehicle(v.id)} className="btn btn-secondary" style={{ padding: '4px', color: 'var(--accent)' }} title="Remove vehicle"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EMERGENCY CONTACTS LIST */}
            <div className="ai-glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>🚨 Emergency Contacts</h3>
                <button 
                  onClick={() => setShowAddContactCard(!showAddContactCard)}
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={14} /> Add Contact
                </button>
              </div>

              {/* Add Contact Card inline form */}
              {showAddContactCard && (
                <form onSubmit={handleAddContact} className="animate-slide-up" style={{ padding: '1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
                      <input type="text" required placeholder="e.g. John Doe" value={newContactName} onChange={e => setNewContactName(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Relationship</label>
                      <select value={newContactRelation} onChange={e => setNewContactRelation(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                        <option>Spouse</option>
                        <option>Mother</option>
                        <option>Father</option>
                        <option>Sibling</option>
                        <option>Friend</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mobile Number</label>
                      <input type="text" required placeholder="(555) 000-0000" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Email (Opt.)</label>
                      <input type="email" placeholder="e.g. john@mail.com" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} className="auth-input-field" style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button type="button" onClick={() => setShowAddContactCard(false)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Save Contact</button>
                  </div>
                </form>
              )}

              {/* Contacts Grid list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contacts.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>{c.name} ({c.relationship})</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        📞 {c.phone} • ✉️ {c.email}
                      </span>
                      
                      {/* Safety SMS toggles */}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={c.locationSharing} onChange={(e) => setContacts(prev => prev.map(item => item.id === c.id ? { ...item, locationSharing: e.target.checked } : item))} style={{ width: '12px', height: '12px' }} />
                          <span>📍 Live Location Sharing</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={c.autoSms} onChange={(e) => setContacts(prev => prev.map(item => item.id === c.id ? { ...item, autoSms: e.target.checked } : item))} style={{ width: '12px', height: '12px' }} />
                          <span>💬 Auto SOS SMS notifications</span>
                        </label>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteContact(c.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem', color: 'var(--accent)' }}
                      title="Delete Contact"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB PANEL 3: BILLING, PAYMENTS & SERVICE TIMELINE */}
        {activeSubTab === 'billing' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* SAVED PAYMENT METHODS */}
            <div className="ai-glass-panel">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>💳 Saved Payment Methods</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {savedMethods.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--light-surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>
                        {m.type === 'visa' && '💳'}
                        {m.type === 'mastercard' && '🔴'}
                        {m.type === 'upi' && '📱'}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.82rem' }}>{m.number}</strong>
                        {m.isDefault && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: 'rgba(34,197,94,0.08)', color: 'var(--secondary)', padding: '1px 6px', borderRadius: '3px', fontWeight: 800 }}>Default</span>}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {!m.isDefault && (
                        <button 
                          onClick={() => handleToggleDefaultPayment(m.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          Set Default
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePayment(m.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem', color: 'var(--accent)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  const newMethod = prompt("Enter UPI ID or Card last digits (e.g. UPI disha@ybl or Visa 1234):");
                  if (newMethod && newMethod.trim()) {
                    setSavedMethods(prev => [
                      ...prev,
                      {
                        id: 'pay-' + Date.now(),
                        type: newMethod.toLowerCase().includes('upi') ? 'upi' : 'visa',
                        number: newMethod.trim(),
                        isDefault: false
                      }
                    ]);
                  }
                }}
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%' }}
              >
                + Link New UPI VPA or Credit Card
              </button>
            </div>

            {/* SERVICE HISTORY TIMELINE */}
            <div className="ai-glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>📜 Service Dispatch Timeline</h3>
                
                <div className="ai-history-search" style={{ padding: '0.35rem 0.6rem', width: '200px' }}>
                  <Search size={12} className="text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search past dispatches..." 
                    value={historySearchQuery}
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    style={{ fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div className="profile-timeline">
                {filteredHistory.map(item => (
                  <div key={item.id} className="profile-timeline-item completed">
                    <div className="profile-timeline-dot"></div>
                    <div className="profile-timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.issue}</strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.date} • Vehicle: {item.vehicle} • ID: {item.id}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)' }}>{item.amount}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                        📍 Rescued by: <strong>{item.mechanicName}</strong> • Verified check completed successfully.
                      </div>
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px dashed var(--border-light)', paddingTop: '0.5rem' }}>
                        <button 
                          onClick={() => alert(`GST details verified. Downloading invoice receipt PDF for booking ${item.id}...`)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'flex', gap: '0.25rem' }}
                        >
                          <Download size={10} /> Receipt PDF
                        </button>
                        <button 
                          onClick={() => setShowLeaveReviewModal(item.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          Leave Review
                        </button>
                        <button 
                          onClick={() => alert(`Bypassing setup. Matching ${item.mechanicName} for a new dispatch queue.`)}
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', marginLeft: 'auto' }}
                        >
                          Book Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredHistory.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No matching service dispatches found.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB PANEL 4: SECURITY & APP PREFERENCES */}
        {activeSubTab === 'security' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* SECURITY SCORE PANEL */}
            <div className="ai-glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>🔒 Profile Security score</h3>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: securityScore >= 75 ? 'var(--secondary)' : '#f59e0b' }}>
                  {securityScore}% Strong
                </span>
              </div>
              
              <div className="security-score-bar-wrapper">
                <div 
                  className="security-score-bar" 
                  style={{ 
                    width: `${securityScore}%`, 
                    background: securityScore >= 100 ? 'var(--secondary)' : securityScore >= 75 ? '#22C55E' : '#f59e0b' 
                  }}
                ></div>
              </div>
              
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Enable Two-Factor Authentication and Biometric logins to reach 100% protection grade.
              </span>
            </div>

            {/* PASSWORD AND SECURITY OPTIONS */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>🛡️ Account Protection</h3>
              
              <div className="auth-input-group active" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CHANGE PASSWORD</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="password" value={securityPassword} onChange={e => setSecurityPassword(e.target.value)} className="auth-input-field" style={{ height: '36px', fontSize: '0.85rem', paddingLeft: '1rem' }} />
                  <button onClick={() => { alert("Password updated successfully."); setSecurityPassword('••••••••••••'); }} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0 1rem' }}>Update</button>
                </div>
              </div>

              {/* Toggle Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="toggle-switch-container">
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Two-Factor Authentication (2FA)</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Require SMS code during new logins.</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={security2FA} onChange={(e) => setSecurity2FA(e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-switch-container">
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Biometric Login (Face ID)</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Support immediate authentication scans on mobile.</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={securityBiometrics} onChange={(e) => setSecurityBiometrics(e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Login Activities list */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>ACTIVE LOGGED DEVICES:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>💻 Chrome Browser on Windows (Mumbai)</span>
                    <strong style={{ color: 'var(--secondary)' }}>Active Now</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>📱 Safari Browser on iPhone 15 Pro</span>
                    <span>Logged 2 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SYSTEM PREFERENCES */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>⚙️ System Preferences</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>SYSTEM THEME</label>
                  <button onClick={toggleThemeLive} className="btn btn-secondary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}>
                    {themeMode === 'light' ? '☀️ Light Mode active' : '🌙 Dark Mode active'}
                  </button>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>LANGUAGE</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="auth-input-field" style={{ height: '36px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                    <option>English</option>
                    <option>Español</option>
                    <option>हिंदी (Hindi)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>DISTANCE UNITS</label>
                  <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button type="button" onClick={() => setDistanceUnit('Miles')} className="btn" style={{ flexGrow: 1, padding: '0.4rem', fontSize: '0.8rem', background: distanceUnit === 'Miles' ? 'var(--primary)' : 'transparent', color: distanceUnit === 'Miles' ? 'white' : 'var(--text-secondary)', borderRadius: 0 }}>Miles</button>
                    <button type="button" onClick={() => setDistanceUnit('KM')} className="btn" style={{ flexGrow: 1, padding: '0.4rem', fontSize: '0.8rem', background: distanceUnit === 'KM' ? 'var(--primary)' : 'transparent', color: distanceUnit === 'KM' ? 'white' : 'var(--text-secondary)', borderRadius: 0 }}>Kilometers</button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>MAP PROVIDER</label>
                  <select value={mapProvider} onChange={e => setMapProvider(e.target.value)} className="auth-input-field" style={{ height: '36px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                    <option>Google Maps</option>
                    <option>OpenStreetMap</option>
                    <option>Apple Maps</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>TIME ZONE</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="auth-input-field" style={{ height: '36px', fontSize: '0.8rem', paddingLeft: '0.5rem', background: 'var(--light-bg)' }}>
                    <option>GMT+5:30 (India Standard Time)</option>
                    <option>GMT-8:00 (Pacific Standard Time)</option>
                    <option>GMT+0:00 (Greenwich Mean Time)</option>
                  </select>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* SUBTAB PANEL 5: ASSISTANCE & LOGOUT PANEL */}
        {activeSubTab === 'support' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* CUSTOMER SUPPORT CARDS */}
            <div className="ai-glass-panel">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>🆘 Support & Help Center</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.35rem' }}>💬</span>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>WhatsApp Support</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', margin: '0.25rem 0' }}>Instant support via chat</span>
                  <a href="https://wa.me/1800555SOS" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem', width: '100%', justifyContent: 'center', borderColor: '#22c55e', color: '#16a34a' }}>Start Chat</a>
                </div>

                <div style={{ padding: '1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.35rem' }}>📞</span>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>Call Hotline</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', margin: '0.25rem 0' }}>24/7 dispatcher hotline</span>
                  <a href="tel:+1800555SOS" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem', width: '100%', justifyContent: 'center' }}>Call Dispatch</a>
                </div>

                <div style={{ padding: '1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.35rem' }}>✉️</span>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>Email Support</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', margin: '0.25rem 0' }}>Response in under 4 hours</span>
                  <a href="mailto:support@roadrescue.ai" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem', width: '100%', justifyContent: 'center' }}>Write Email</a>
                </div>
              </div>
            </div>

            {/* LOGOUT CARD */}
            <div className="ai-glass-panel" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text-primary)' }}>Exit Application Session</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log out of this device securely or switch profiles.</span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => alert("Switching accounts process simulated...")}
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  Switch Account
                </button>
                <button 
                  onClick={() => setShowLogoutModal(true)}
                  className="btn btn-emergency animate-pulse" 
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', background: 'var(--accent)' }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ==========================================
          MODAL 1: QR CODE MODAL POPUP
          ========================================== */}
      {showQrModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ width: '320px', textAlign: 'center', padding: '2rem 1.5rem', background: 'var(--light-bg)', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 800 }}>Profile Share QR</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Scan this QR code from another device to share profile telemetry and vehicle details.</p>
            
            {/* QR Code vector shape */}
            <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
              <svg viewBox="0 0 100 100" style={{ width: '130px', height: '130px' }}>
                <rect width="100" height="100" fill="white" />
                <rect x="0" y="0" width="30" height="30" fill="black" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="9" y="9" width="12" height="12" fill="black" />

                <rect x="70" y="0" width="30" height="30" fill="black" />
                <rect x="70" y="5" width="20" height="20" fill="white" />
                <rect x="74" y="9" width="12" height="12" fill="black" />

                <rect x="0" y="70" width="30" height="30" fill="black" />
                <rect x="5" y="70" width="20" height="20" fill="white" />
                <rect x="9" y="74" width="12" height="12" fill="black" />

                {/* center logo box */}
                <rect x="38" y="38" width="24" height="24" fill="black" />
                <text x="42" y="54" fontSize="12" fontWeight="900" fill="white">RR</text>

                {/* random details */}
                <rect x="40" y="10" width="15" height="5" fill="black" />
                <rect x="45" y="20" width="15" height="10" fill="black" />
                <rect x="10" y="40" width="15" height="15" fill="black" />
                <rect x="15" y="45" width="5" height="5" fill="white" />
                <rect x="70" y="40" width="10" height="15" fill="black" />
                <rect x="80" y="55" width="15" height="10" fill="black" />
                <rect x="40" y="70" width="15" height="20" fill="black" />
                <rect x="45" y="75" width="5" height="10" fill="white" />
              </svg>
            </div>
            
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reference Link: dev.roadrescue.ai/share/disha</div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: EDIT PROFILE MODAL POPUP
          ========================================== */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ width: '360px', padding: '2rem 1.5rem', background: 'var(--light-bg)', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Account Info</h3>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowEditProfileModal(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="auth-input-group active">
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="auth-input-field" style={{ height: '36px', paddingLeft: '0.5rem', fontSize: '0.85rem' }} />
              </div>
              <div className="auth-input-group active">
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Email Address</label>
                <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="auth-input-field" style={{ height: '36px', paddingLeft: '0.5rem', fontSize: '0.85rem' }} />
              </div>
              <div className="auth-input-group active">
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="text" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="auth-input-field" style={{ height: '36px', paddingLeft: '0.5rem', fontSize: '0.85rem' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowEditProfileModal(false)} className="btn btn-secondary" style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: CONFIRM LOGOUT MODAL
          ========================================== */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ width: '340px', textAlign: 'center', padding: '2.5rem 2rem', background: 'var(--light-bg)', color: 'var(--text-primary)' }}>
            
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--accent)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1rem' 
            }}>
              <AlertTriangle size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Confirm Log Out?</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Are you sure you want to end your current session? You will need to log back in to access diagnostic profiles and dispatches.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="btn btn-emergency" 
                style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'var(--accent)' }}
              >
                Yes, Log Out
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: LEAVE REVIEW TIMELINE POPUP
          ========================================== */}
      {showLeaveReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ width: '340px', padding: '2rem 1.5rem', background: 'var(--light-bg)', color: 'var(--text-primary)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Rate Dispatch service</h3>
              <button onClick={() => setShowLeaveReviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              How was your assistance service for booking <strong>{showLeaveReviewModal}</strong>?
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  type="button"
                  onClick={() => setReviewStars(star)}
                  style={{ fontSize: '2rem', background: 'transparent', border: 'none', cursor: 'pointer', color: reviewStars >= star ? '#f59e0b' : 'var(--border-light)' }}
                >
                  ★
                </button>
              ))}
            </div>
            
            <textarea 
              placeholder="Tell us about the mechanic's service, speed, and safety..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              className="chatbot-input"
              style={{ minHeight: '60px', padding: '0.5rem', fontSize: '0.8rem', width: '100%', border: '1px solid var(--border-light)', borderRadius: '6px', marginBottom: '1rem', resize: 'none' }}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setShowLeaveReviewModal(null)} className="btn btn-secondary" style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
              <button 
                onClick={() => {
                  alert("Review submitted successfully. Thank you for your feedback!");
                  setReviewText('');
                  setShowLeaveReviewModal(null);
                }} 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 1rem', fontSize: '0.75rem' }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
