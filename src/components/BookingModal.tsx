import { useState, useEffect } from 'react';
import { X, MapPin, Clock, CreditCard, Check, AlertTriangle } from 'lucide-react';
import { api } from '../api';

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
  const [error, setError] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 23.0225, lng: 72.5714 })
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const service = SERVICES[serviceName as keyof typeof SERVICES] || { price: price || 999, icon: '🔧', eta: '15-20 min' };
  const displayPrice = price || service.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.customerName.trim()) return setError('Full name is required');
    if (!form.phone.trim() || form.phone.length < 10) return setError('Valid phone number is required');
    if (!form.vehicleNumber.trim()) return setError('Vehicle number is required');

    setLoading(true);
    try {
      const result = await api.bookings.create({
        customerName: form.customerName,
        phone: form.phone,
        email: form.email,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
        serviceName,
        latitude: coords?.lat || 23.0225,
        longitude: coords?.lng || 72.5714,
        address: form.address || 'Anand, Gujarat',
        notes: form.notes,
        paymentMethod: form.paymentMethod,
      });

      onBookingConfirmed(result.booking);
      setForm({ customerName: '', phone: '', email: '', vehicleType: 'Sedan', vehicleNumber: '', address: '', notes: '', paymentMethod: 'Cash' });
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card-bg, #1a1a2e)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
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
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
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
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{serviceName}</div>
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
                  placeholder="+91 98765 43210" style={inputStyle} />
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
                Address / Location
              </label>
              <input value={form.address} onChange={e => updateField('address', e.target.value)}
                placeholder="Anand, Gujarat, India" style={inputStyle} />
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
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{
                  width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Processing...
              </span>
            ) : (
              <>
                <Check size={18} /> Confirm Booking — ₹{displayPrice.toLocaleString('en-IN')}
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.75rem' }}>
            By confirming, you agree to our Terms of Service. Free cancellation within 3 minutes.
          </p>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
