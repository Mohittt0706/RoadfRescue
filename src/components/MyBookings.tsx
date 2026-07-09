import { useState, useEffect } from 'react';
import { Calendar, MapPin, Phone, Download, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../api';

interface MyBookingsProps {
  userId?: string;
  onBack?: () => void;
}

const STATUS_STEPS = ['Pending', 'Accepted', 'Mechanic Assigned', 'Mechanic Arriving', 'Service Started', 'Completed'];

export default function MyBookings({ userId, onBack }: MyBookingsProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.bookings.list(userId ? { userId } : {});
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.bookings.update(bookingId, { status: 'Cancelled', note: 'Cancelled by customer' });
      loadBookings();
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const downloadInvoice = (booking: any) => {
    const invoice = `
═══════════════════════════════════════
         ROADRESCUE AI - INVOICE
═══════════════════════════════════════

Booking ID:    ${booking.id}
Date:          ${new Date(booking.booking_time).toLocaleDateString('en-IN')}

───────────────────────────────────────
CUSTOMER DETAILS
───────────────────────────────────────
Name:          ${booking.customer_name}
Phone:         ${booking.phone}
Email:         ${booking.email || 'N/A'}

───────────────────────────────────────
VEHICLE DETAILS
───────────────────────────────────────
Type:          ${booking.vehicle_type}
Number:        ${booking.vehicle_number}

───────────────────────────────────────
SERVICE DETAILS
───────────────────────────────────────
Service:       ${booking.service_name}
Address:       ${booking.address}
Notes:         ${booking.notes || 'None'}

───────────────────────────────────────
PAYMENT
───────────────────────────────────────
Amount:        ₹${booking.price.toLocaleString('en-IN')}
Method:        ${booking.payment_method}
Status:        ${booking.payment_status || 'Pending'}

═══════════════════════════════════════
         Thank you for choosing RoadRescue AI
═══════════════════════════════════════
    `.trim();

    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${booking.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIndex = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const formatDate = (t: string) => {
    if (!t) return '';
    return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#94a3b8' }}>Loading your bookings...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>My Bookings</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{bookings.length} total bookings</p>
        </div>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '0.5rem 1rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem',
          }}>← Back</button>
        )}
      </div>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <h3 style={{ color: '#fff' }}>No bookings yet</h3>
          <p>Your booking history will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bookings.map(booking => {
            const isExpanded = expandedId === booking.id;
            const statusIdx = getStatusIndex(booking.status);
            const canCancel = booking.status === 'Pending' || booking.status === 'Accepted';

            return (
              <div key={booking.id} style={{
                background: '#1e293b', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
              }}>
                <div onClick={() => setExpandedId(isExpanded ? null : booking.id)} style={{
                  padding: '1rem 1.25rem', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '10px',
                      background: booking.status === 'Completed' ? 'rgba(34,197,94,0.1)' : booking.status === 'Cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    }}>
                      {booking.status === 'Completed' ? '✅' : booking.status === 'Cancelled' ? '❌' : '🔧'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{booking.service_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{booking.id?.slice(0, 18)}</span>
                        <span>•</span>
                        <span>{formatDate(booking.booking_time)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '1rem' }}>₹{booking.price?.toLocaleString('en-IN')}</div>
                      <StatusBadge status={booking.status} />
                    </div>
                    {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* Progress Bar */}
                    <div style={{ margin: '1rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: i <= statusIdx ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', color: i <= statusIdx ? '#fff' : '#64748b', fontWeight: 700,
                          }}>{i <= statusIdx ? '✓' : i + 1}</div>
                        ))}
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, position: 'relative' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, background: '#3b82f6',
                          width: `${(statusIdx / (STATUS_STEPS.length - 1)) * 100}%`, transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                        {STATUS_STEPS.map((step, i) => (
                          <span key={step} style={{ fontSize: '0.55rem', color: i <= statusIdx ? '#3b82f6' : '#64748b', fontWeight: 600, width: `${100 / STATUS_STEPS.length}%`, textAlign: 'center' }}>{step}</span>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
                      <DetailItem icon={Phone} label="Phone" value={booking.phone} />
                      <DetailItem icon={MapPin} label="Address" value={booking.address || 'N/A'} />
                      <DetailItem label="Vehicle" value={`${booking.vehicle_type} - ${booking.vehicle_number}`} />
                      <DetailItem label="Payment" value={`${booking.payment_method} (${booking.payment_status || 'Pending'})`} />
                    </div>

                    {booking.notes && (
                      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Notes:</span>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{booking.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => downloadInvoice(booking)} style={{
                        padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                      }}>
                        <Download size={14} /> Download Invoice
                      </button>
                      {canCancel && (
                        <button onClick={() => handleCancel(booking.id)} style={{
                          padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                        }}>
                          <X size={14} /> Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700, background: c.bg, color: c.text }}>{status}</span>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
      {Icon && <Icon size={14} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />}
      <div>
        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
