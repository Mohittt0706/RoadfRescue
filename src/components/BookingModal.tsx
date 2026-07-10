import { useState, useEffect } from 'react';
import { X, MapPin, Clock, CreditCard, Check, AlertTriangle } from 'lucide-react';
import MechanicTrackerModal from './MechanicTrackerModal';
import { BookingStore } from '../services/store';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  price: number;
  onBookingConfirmed: (booking: any) => void;
}

const SERVICES = {
  'Flat Tire Repair': { price: 699, icon: '🔧', eta: '15-20 min' },
  'Battery Jump Start': { price: 999, icon: '🔋', eta: '10-15 min' },
  'Fuel Delivery': { price: 799, icon: '⛽', eta: '20-25 min' },
  'Engine Diagnosis': { price: 1499, icon: '🔍', eta: '20-30 min' },
  'Engine Breakdown Diagnosis': { price: 1499, icon: '🔍', eta: '20-30 min' },
  'Car Towing': { price: 1999, icon: '🚛', eta: '25-35 min' },
  'Lockout Assistance': { price: 899, icon: '🔓', eta: '10-15 min' },
};

export default function BookingModal({ isOpen, onClose, serviceName, price, onBookingConfirmed }: BookingModalProps) {
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    vehicleType: 'Sedan',
    vehicleNumber: '',
    address: '',
    notes: '',
    paymentMethod: 'Cash',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding nearby mechanic...');
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 23.0225, lng: 72.5714 })
      );
      // Pre-fill fields if user is already logged in
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setForm(prev => ({
            ...prev,
            customerName: user.name || '',
            email: user.email || '',
          }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const service = SERVICES[serviceName as keyof typeof SERVICES] || { price: price || 999, icon: '🔧', eta: '15 mins' };
  const displayPrice = price || service.price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!form.customerName.trim()) return setError('Full name is required');
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) {
      return setError('Mobile number must be exactly 10 digits');
    }
    if (!form.vehicleNumber.trim()) return setError('Vehicle number is required');
    if (!form.address.trim()) return setError('Address is required');

    setLoading(true);
    setLoadingMessage('Finding nearby mechanic...');

    // Progress text simulation
    setTimeout(() => {
      setLoadingMessage('Mechanic matched...');
    }, 600);

    setTimeout(() => {
      setLoadingMessage('Booking Confirmed!');
    }, 1200);

    setTimeout(() => {
      const newBooking = BookingStore.create({
        customer: form.customerName,
        phone: form.phone,
        vehicle: form.vehicleType,
        vehicle_number: form.vehicleNumber,
        address: form.address,
        service: serviceName,
        price: displayPrice,
        eta: '15 mins',
        paymentMethod: form.paymentMethod,
        notes: form.notes
      });

      // Add display fallback fields for local Success overlay compatibility
      const compatibleBooking = {
        ...newBooking,
        date: new Date().toLocaleDateString('en-IN'),
        mechanic: 'Rahul Patel',
        mechanic_name: 'Rahul Patel',
        rating: '4.9★',
        mechanic_rating: 4.9,
        vehicle_type: form.vehicleType,
        payment_status: 'Pending',
      };

      setSuccessBooking(compatibleBooking);
      setLoading(false);
      onBookingConfirmed(compatibleBooking);
    }, 1800);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Success view overlay
  if (successBooking) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      }} onClick={() => { setSuccessBooking(null); onClose(); }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: 'var(--card-bg, #0b0f19)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          borderRadius: '24px',
          width: '90%', maxWidth: '440px',
          padding: '2rem',
          boxShadow: 'var(--shadow-premium, 0 10px 50px rgba(0,0,0,0.5))',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <Check size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#fff' }}>
            Booking Confirmed
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)', margin: '0 0 1.5rem 0' }}>
            Your service request has been secured.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Booking ID</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{successBooking.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Mechanic Name</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{successBooking.mechanic}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Vehicle Service</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{successBooking.service}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>ETA</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{successBooking.eta}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Price</span>
              <span style={{ fontWeight: 800, color: '#22c55e' }}>₹{successBooking.price.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => setShowTracker(true)} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 800 }}>
              Track Mechanic
            </button>
            <button onClick={() => { setSuccessBooking(null); onClose(); }} className="btn btn-secondary" style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 800 }}>
              Done
            </button>
          </div>

          {/* Mechanic Tracker Modal */}
          <MechanicTrackerModal
            isOpen={showTracker}
            onClose={() => {
              setShowTracker(false);
              setSuccessBooking(null);
              onClose();
            }}
            booking={successBooking}
          />
        </div>
      </div>
    );
  }

  // Loading view overlay
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          background: 'var(--card-bg, #0b0f19)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          borderRadius: '24px',
          width: '90%', maxWidth: '400px',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-premium, 0 10px 50px rgba(0,0,0,0.5))',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div className="spinner" style={{
            width: 48, height: 48,
            border: '3px solid rgba(59,130,246,0.1)',
            borderTopColor: 'var(--primary, #3b82f6)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {loadingMessage}
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
              Dispatching nearest assistance vehicle...
            </p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card-bg, #0b0f19)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
        borderRadius: '20px',
        width: '95%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto',
        padding: '0',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.08))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              {service.icon} Book Service
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
              Complete the form to confirm your booking
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary, #fff)',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Service Summary */}
        <div style={{
          margin: '1rem 1.5rem', padding: '1rem',
          background: 'rgba(59,130,246,0.08)', borderRadius: '12px',
          border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{serviceName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Clock size={14} color="#3b82f6" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>ETA: {service.eta}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e' }}>₹{displayPrice.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>Incl. all taxes</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: '#ef4444', fontSize: '0.85rem',
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input value={form.customerName} onChange={e => updateField('customerName', e.target.value)}
                placeholder="Rahul Sharma" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Mobile Number *</label>
                <input value={form.phone} onChange={e => updateField('phone', e.target.value)}
                  placeholder="9876543210" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={form.email} onChange={e => updateField('email', e.target.value)}
                  placeholder="rahul@email.com" type="email" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Vehicle Type</label>
                <select value={form.vehicleType} onChange={e => updateField('vehicleType', e.target.value)} style={inputStyle}>
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Hatchback</option>
                  <option>MUV</option>
                  <option>Truck</option>
                  <option>Two-Wheeler</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Vehicle Number *</label>
                <input value={form.vehicleNumber} onChange={e => updateField('vehicleNumber', e.target.value)}
                  placeholder="GJ 05 AB 1234" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                Address / Location *
              </label>
              <input value={form.address} onChange={e => updateField('address', e.target.value)}
                placeholder="Baner Road, Pune, Maharashtra" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Additional Notes</label>
              <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)}
                placeholder="Any additional details about your issue..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }} />
            </div>

            <div>
              <label style={labelStyle}>
                <CreditCard size={14} style={{ display: 'inline', marginRight: 4 }} />
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {['Cash', 'UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Credit Card'].map(method => (
                  <button key={method} type="button"
                    onClick={() => updateField('paymentMethod', method)}
                    style={{
                      padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                      border: form.paymentMethod === method ? '2px solid #3b82f6' : '1px solid var(--border-light, rgba(255,255,255,0.1))',
                      background: form.paymentMethod === method ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                      color: form.paymentMethod === method ? '#3b82f6' : 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: '1.25rem', padding: '0.9rem',
            background: loading ? '#555' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            <Check size={18} /> Confirm Booking — ₹{displayPrice.toLocaleString('en-IN')}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.75rem' }}>
            By confirming, you agree to our Terms of Service. Free cancellation within 3 minutes.
          </p>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem',
  color: 'var(--text-primary, #fff)', letterSpacing: '0.02em',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
  border: '1px solid var(--border-light, rgba(255,255,255,0.1))',
  background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};
