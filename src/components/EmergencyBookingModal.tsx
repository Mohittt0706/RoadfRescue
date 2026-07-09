import { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Phone, User, ShieldAlert, IndianRupee, Clock } from 'lucide-react';
import { api } from '../api';

interface EmergencyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (emergency: any) => void;
}

// Emergency service pricing (Indian Rupees)
const EMERGENCY_PRICES: Record<string, { base: number; range: [number, number] }> = {
  'Flat Tire': { base: 699, range: [500, 1000] },
  'Dead Battery': { base: 999, range: [800, 1500] },
  'Fuel Delivery': { base: 799, range: [700, 1200] },
  'Car Towing': { base: 1999, range: [1500, 3000] },
  'Engine Breakdown': { base: 1499, range: [1000, 2500] },
  'Lockout Assistance': { base: 899, range: [700, 1200] },
  'Accident': { base: 2499, range: [2000, 5000] },
  'Other': { base: 999, range: [800, 1500] }
};

// ETA estimates based on emergency type
const ETA_ESTIMATES: Record<string, { min: number; max: number }> = {
  'Flat Tire': { min: 15, max: 25 },
  'Dead Battery': { min: 10, max: 20 },
  'Fuel Delivery': { min: 20, max: 30 },
  'Car Towing': { min: 25, max: 40 },
  'Engine Breakdown': { min: 20, max: 35 },
  'Lockout Assistance': { min: 10, max: 20 },
  'Accident': { min: 15, max: 30 },
  'Other': { min: 15, max: 30 }
};

// Validate Indian phone number
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  return /^91\d{10}$|^\d{10}$/.test(cleaned);
}

// Validate Indian vehicle number
function isValidVehicleNumber(vn: string): boolean {
  return /^[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}$/i.test(vn);
}

export default function EmergencyBookingModal({ isOpen, onClose, onSuccess }: EmergencyBookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('Car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [emergencyType, setEmergencyType] = useState('Flat Tire');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate price based on emergency type and priority
  const calculatePrice = () => {
    const basePrice = EMERGENCY_PRICES[emergencyType]?.base || 999;
    let multiplier = 1;
    if (priority === 'Urgent') multiplier = 1.25;
    if (priority === 'Critical') multiplier = 1.5;
    return Math.round(basePrice * multiplier);
  };

  // Calculate ETA based on emergency type and priority
  const calculateETA = () => {
    const eta = ETA_ESTIMATES[emergencyType] || { min: 15, max: 30 };
    let min = eta.min;
    let max = eta.max;
    if (priority === 'Critical') { min = Math.max(5, min - 5); max = Math.max(10, max - 10); }
    if (priority === 'Urgent') { min = Math.max(8, min - 3); max = Math.max(12, max - 5); }
    return `${min}-${max} mins`;
  };

  const estimatedPrice = calculatePrice();
  const estimatedETA = calculateETA();

  // Auto detect location when modal opens
  useEffect(() => {
    if (isOpen) {
      detectLocation();
      // Try to pre-fill name/phone from profile settings if saved in localStorage
      const savedProfile = localStorage.getItem('roadrescue-profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          if (profile.name) setCustomerName(profile.name);
          if (profile.phone) setPhone(profile.phone);
          if (profile.email) setEmail(profile.email);
        } catch { }
      }
    }
  }, [isOpen]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      return;
    }

    setLocLoading(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        try {
          // Reverse geocoding using OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (res.ok) {
            const data = await res.json();
            setAddress(data.display_name || `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
          } else {
            setAddress(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
          }
        } catch {
          setAddress(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        console.error('Location error:', error);
        let msg = 'Location permission denied. Please enter address manually.';
        if (error.code === error.TIMEOUT) msg = 'Location request timed out. Please enter address manually.';
        setErrorMsg(msg);
        setLocLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!phone.trim()) {
      errors.phone = 'Mobile number is required';
    } else if (!isValidPhone(phone)) {
      errors.phone = 'Enter valid 10-digit Indian mobile number';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter valid email address';
    }

    if (!vehicleNumber.trim()) {
      errors.vehicleNumber = 'Vehicle number is required';
    } else if (!isValidVehicleNumber(vehicleNumber)) {
      errors.vehicleNumber = 'Enter valid vehicle number (e.g., MH-12-XX-9999)';
    }

    if (!address.trim()) {
      errors.address = 'Address is required';
    }

    if (!latitude || !longitude) {
      errors.address = 'GPS Location missing.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      vehicle,
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      emergency_type: emergencyType,
      latitude,
      longitude,
      address: address.trim(),
      notes: notes.trim(),
      payment_method: paymentMethod,
      priority
    };

    console.log('[Frontend Request] Sending SOS Emergency Payload:', payload);

    try {
      const res = await api.emergency.create(payload);
      console.log('[Frontend Response] Received SOS Response:', res);

      if (res.success) {
        onSuccess(res.booking);
      } else {
        setErrorMsg(res.error || 'Failed to submit request');
      }
    } catch (err: any) {
      console.error('[Frontend Error] Emergency creation failed:', err.stack || err);
      setErrorMsg(err.message || 'Network connection failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      overflowY: 'auto'
    }}>
      <div className="ai-glass-panel" style={{
        width: '100%', maxWidth: '700px', position: 'relative', 
        border: '1.5px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)',
        animation: 'slideUp 0.3s ease-out', maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', zIndex: 10
        }} className="theme-toggle-btn">
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite' }}>🚨</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>Request Emergency SOS Help</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>Get instant roadside recovery dispatches in minutes</p>
          </div>
        </div>

        {/* Price & ETA Summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem',
          background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '12px', padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IndianRupee size={20} color="#22c55e" />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED PRICE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#22c55e' }}>
                ₹{estimatedPrice.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Incl. of all taxes</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED ARRIVAL</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#3b82f6' }}>
                {estimatedETA}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>After mechanic assigned</div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            padding: '0.75rem 1rem', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem',
            fontWeight: 600, marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center'
          }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Customer info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>FULL NAME *</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={e => { setCustomerName(e.target.value); setValidationErrors(prev => ({ ...prev, customerName: '' })); }} 
                  placeholder="Rahul Sharma"
                  className="auth-input-field"
                  style={{ 
                    paddingLeft: '2.25rem', height: '38px', fontSize: '0.85rem',
                    borderColor: validationErrors.customerName ? '#ef4444' : undefined
                  }}
                />
              </div>
              {validationErrors.customerName && (
                <span style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.customerName}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>MOBILE NUMBER *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => { setPhone(e.target.value); setValidationErrors(prev => ({ ...prev, phone: '' })); }} 
                  placeholder="98765 43210"
                  className="auth-input-field"
                  style={{ 
                    paddingLeft: '2.25rem', height: '38px', fontSize: '0.85rem',
                    borderColor: validationErrors.phone ? '#ef4444' : undefined
                  }}
                />
              </div>
              {validationErrors.phone && (
                <span style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.phone}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>EMAIL ADDRESS</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => { setEmail(e.target.value); setValidationErrors(prev => ({ ...prev, email: '' })); }} 
                placeholder="rahul@gmail.com"
                className="auth-input-field"
                style={{ 
                  height: '38px', fontSize: '0.85rem',
                  borderColor: validationErrors.email ? '#ef4444' : undefined
                }}
              />
              {validationErrors.email && (
                <span style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>VEHICLE TYPE *</label>
              <select 
                value={vehicle} 
                onChange={e => setVehicle(e.target.value)}
                className="auth-input-field"
                style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '0.5rem', background: 'var(--light-surface)' }}
              >
                <option value="Car">🚗 Car</option>
                <option value="Bike">🏍️ Bike</option>
                <option value="SUV">🚙 SUV</option>
                <option value="Truck">🚛 Truck</option>
                <option value="Bus">🚌 Bus</option>
                <option value="Other">⚙️ Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>VEHICLE NUMBER *</label>
              <input 
                type="text" 
                value={vehicleNumber} 
                onChange={e => { setVehicleNumber(e.target.value.toUpperCase()); setValidationErrors(prev => ({ ...prev, vehicleNumber: '' })); }} 
                placeholder="MH-12-XX-9999"
                className="auth-input-field"
                style={{ 
                  height: '38px', fontSize: '0.85rem', textTransform: 'uppercase',
                  borderColor: validationErrors.vehicleNumber ? '#ef4444' : undefined
                }}
              />
              {validationErrors.vehicleNumber && (
                <span style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.vehicleNumber}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>EMERGENCY TYPE *</label>
              <select 
                value={emergencyType} 
                onChange={e => setEmergencyType(e.target.value)}
                className="auth-input-field"
                style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '0.5rem', background: 'var(--light-surface)' }}
              >
                <option value="Flat Tire">🔧 Flat Tire</option>
                <option value="Dead Battery">🔋 Dead Battery</option>
                <option value="Fuel Delivery">⛽ Fuel Delivery</option>
                <option value="Car Towing">🚛 Car Towing</option>
                <option value="Engine Breakdown">💨 Engine Breakdown</option>
                <option value="Lockout Assistance">🔓 Lockout Assistance</option>
                <option value="Accident">🚨 Accident</option>
                <option value="Other">🛠️ Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>PRIORITY LEVEL *</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                className="auth-input-field"
                style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '0.5rem', background: 'var(--light-surface)' }}
              >
                <option value="Normal">🟢 Normal</option>
                <option value="Urgent">🟠 Urgent (+25%)</option>
                <option value="Critical">🔴 Critical (+50%)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>PAYMENT METHOD *</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="auth-input-field"
                style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '0.5rem', background: 'var(--light-surface)' }}
              >
                <option value="UPI">📱 UPI</option>
                <option value="Google Pay">💚 Google Pay</option>
                <option value="PhonePe">💜 PhonePe</option>
                <option value="Paytm">💙 Paytm</option>
                <option value="Card">💳 Credit/Debit Card</option>
                <option value="Cash">💵 Cash</option>
              </select>
            </div>
          </div>

          {/* Location field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>GPS LOCATION & ADDRESS *</label>
              <button 
                type="button" 
                onClick={detectLocation}
                disabled={locLoading}
                style={{
                  background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', 
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}
              >
                {locLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                <span>Re-detect Location</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea 
                value={address}
                onChange={e => { 
                  const val = e.target.value;
                  setAddress(val); 
                  setValidationErrors(prev => ({ ...prev, address: '' })); 
                  if (!val.trim()) {
                    setLatitude(null);
                    setLongitude(null);
                  } else if (!latitude || !longitude) {
                    setLatitude(23.0225);
                    setLongitude(72.5714);
                  }
                }}
                placeholder="Locating you..."
                rows={2}
                className="auth-input-field"
                style={{ 
                  padding: '0.5rem', fontSize: '0.85rem', height: 'auto', resize: 'vertical',
                  borderColor: validationErrors.address ? '#ef4444' : undefined
                }}
              />
            </div>
            {validationErrors.address && (
              <span style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                {validationErrors.address}
              </span>
            )}
            {latitude && longitude && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                📍 GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>ADDITIONAL NOTES / LANDMARKS</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="e.g., Near highway mile marker 45, white Honda Nexon car with flat tyre."
              rows={2}
              className="auth-input-field"
              style={{ padding: '0.5rem', fontSize: '0.85rem', height: 'auto', resize: 'vertical' }}
            />
          </div>

          {/* Submit button */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              style={{ width: '30%', height: '42px', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="btn btn-emergency"
              style={{ width: '70%', height: '42px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting SOS...</span>
                </>
              ) : (
                <>
                  <span>Confirm Emergency Request</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>• ₹{estimatedPrice.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
