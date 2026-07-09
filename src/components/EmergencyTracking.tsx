import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Phone, AlertTriangle, ShieldCheck, Clock, Navigation, XCircle, ArrowLeft, Loader2, IndianRupee, FileText, CreditCard } from 'lucide-react';
import { api } from '../api';

interface EmergencyTrackingProps {
  emergencyId: string;
  onBack: () => void;
}

export default function EmergencyTracking({ emergencyId, onBack }: EmergencyTrackingProps) {
  const [emergency, setEmergency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [etaCountdown, setEtaCountdown] = useState<number | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  
  const socketRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  // Load emergency details
  const fetchDetails = async () => {
    try {
      const data = await api.emergency.get(emergencyId);
      setEmergency(data);
      
      // Initialize countdown if eta_minutes exists
      if (data.eta_minutes && data.eta_minutes > 0 && 
          !['Completed', 'Cancelled'].includes(data.status)) {
        setEtaCountdown(data.eta_minutes * 60); // Convert to seconds
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  // Load invoice
  const fetchInvoice = async () => {
    try {
      const data = await api.emergency.getInvoice(emergencyId);
      setInvoice(data);
      setShowInvoice(true);
    } catch (err: any) {
      console.error('Failed to load invoice:', err);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Initialize Socket.IO connection
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected for tracking emergency:', emergencyId);
      socket.emit('join_emergency', emergencyId);
    });

    // Handle real-time updates
    socket.on('emergency_update', (updatedEmergency: any) => {
      console.log('Received emergency status update via socket:', updatedEmergency);
      setEmergency(updatedEmergency);
      
      // Update countdown if ETA changed
      if (updatedEmergency.eta_minutes && updatedEmergency.eta_minutes > 0 &&
          !['Completed', 'Cancelled'].includes(updatedEmergency.status)) {
        setEtaCountdown(updatedEmergency.eta_minutes * 60);
      } else {
        setEtaCountdown(null);
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [emergencyId]);

  // ETA Countdown timer
  useEffect(() => {
    if (etaCountdown !== null && etaCountdown > 0) {
      countdownRef.current = setInterval(() => {
        setEtaCountdown(prev => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          }
          return null;
        });
      }, 1000);
      
      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [etaCountdown !== null]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this emergency SOS recovery request?')) return;
    
    setCancelling(true);
    try {
      const res = await api.emergency.updateStatus(emergencyId, 'Cancelled');
      if (res.success) {
        setEmergency(res.emergency);
        setEtaCountdown(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', gap: '1rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Locating emergency response fleet logs...</p>
      </div>
    );
  }

  if (errorMsg || !emergency) {
    return (
      <div className="ai-glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
        <AlertTriangle size={36} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Unable to Track Request</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{errorMsg || 'Emergency request details not found.'}</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1.25rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // --- STAGE 1: SUCCESS SCREEN (FIRST VIEW AFTER BOOKING) ---
  if (showSuccess) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="ai-glass-panel" style={{
          width: '100%', maxWidth: '500px', textAlign: 'center', padding: '2.5rem 2rem',
          border: '2px dashed var(--success)', boxShadow: '0 8px 32px rgba(34, 197, 94, 0.1)',
          animation: 'scaleIn 0.3s ease-out'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '2px solid var(--success)', color: 'var(--success)'
          }}>
            <ShieldCheck size={36} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--success)', margin: '0 0 0.5rem' }}>
            ✅ Emergency Request Submitted Successfully
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Our emergency response system is pairing your coordinates with the closest towing vehicle or mechanic dispatcher.
          </p>

          <div style={{
            background: 'var(--light-surface)', border: '1px solid var(--border-light)',
            borderRadius: '12px', padding: '1rem', textAlign: 'left', marginBottom: '2rem',
            display: 'flex', flexDirection: 'column', gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Emergency ID:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>{emergency.id}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Price:</span>
              <strong style={{ color: '#22c55e' }}>₹{(emergency.price || 0).toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Arrival:</span>
              <strong style={{ color: 'var(--primary)' }}>{emergency.eta || 'Calculating...'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Assigned Team:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{emergency.assigned_mechanic || 'Pending Assignment'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Emergency Type:</span>
              <strong style={{ color: 'var(--accent)' }}>{emergency.emergency_type}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{emergency.payment_method}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href={`tel:+919876543210`} className="btn btn-secondary" style={{
              width: '40%', height: '42px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
            }}>
              <Phone size={14} />
              <span>Call Support</span>
            </a>

            <button 
              onClick={() => setShowSuccess(false)}
              className="btn btn-primary" 
              style={{
                width: '60%', height: '42px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
              }}
            >
              <Navigation size={14} />
              <span>Track Booking</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STAGE 2: REAL-TIME TRACKING TIMELINE & MAP ---
  const statuses = ['Pending', 'Accepted', 'Mechanic Assigned', 'Mechanic En Route', 'Arrived', 'Completed'];
  const currentStatusIdx = statuses.indexOf(emergency.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{
          padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem'
        }}>
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Last Synced: <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} /> Just Now
        </span>
      </div>

      {/* Price & Payment Summary */}
      <div className="ai-glass-panel" style={{ 
        borderLeft: '4px solid #22c55e',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <IndianRupee size={16} color="#22c55e" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>PRICE</div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#22c55e' }}>₹{(emergency.price || 0).toLocaleString('en-IN')}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <CreditCard size={16} color="#3b82f6" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>PAYMENT</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: emergency.payment_status === 'Paid' ? '#22c55e' : '#f59e0b' }}>
            {emergency.payment_status || 'Pending'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <FileText size={16} color="#8b5cf6" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>INVOICE</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {emergency.invoice_id || 'Pending'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Clock size={16} color="#f59e0b" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>ETA</div>
          {etaCountdown !== null ? (
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>
              {formatCountdown(etaCountdown)}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {emergency.eta || 'N/A'}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: MAP & DETAILS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Real-time Map iframe */}
          <div className="ai-glass-panel" style={{ padding: '0.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Navigation size={12} className="text-primary animate-pulse" />
              <span>LIVE GPS TELEMETRY MAP</span>
            </div>
            
            {emergency.latitude && emergency.longitude ? (
              <iframe 
                title="GPS Route Tracker"
                width="100%" 
                height="320" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://maps.google.com/maps?q=${emergency.latitude},${emergency.longitude}&hl=en&z=15&output=embed`}
                style={{ borderRadius: '8px', border: '1px solid var(--border-light)' }}
              />
            ) : (
              <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--light-surface)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                GPS coordinates missing for reverse plotting.
              </div>
            )}
            
            <div style={{ padding: '0.75rem 0.5rem 0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <strong>Reported Location:</strong> {emergency.address}
            </div>
          </div>

          {/* Mechanic Card details */}
          <div className="ai-glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>ASSIGNED DISPATCHER TEAM</span>
                <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.15rem' }}>
                  {emergency.assigned_mechanic || 'Selecting Mechanic Dispatcher...'}
                </strong>
                {emergency.assigned_mechanic && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Auto Recovery Specialist • Ref ID: {emergencyId}
                  </span>
                )}
              </div>
              {emergency.assigned_mechanic && (
                <a href={`tel:${emergency.phone}`} className="btn btn-secondary" style={{
                  padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} title="Call dispatcher">
                  <Phone size={16} />
                </a>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TIMELINE & STATUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Status summary */}
          <div className="ai-glass-panel" style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(239,68,68,0.04) 0%, transparent 50%)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>CURRENT RECOVERY STATUS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', 
                    background: emergency.status === 'Cancelled' ? 'var(--accent)' : emergency.status === 'Completed' ? 'var(--success)' : '#f59e0b',
                    display: 'inline-block', animation: emergency.status !== 'Cancelled' && emergency.status !== 'Completed' ? 'pulse 1.2s infinite' : 'none'
                  }} />
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{emergency.status}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>ESTIMATED ETA</span>
                {etaCountdown !== null ? (
                  <strong style={{ fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                    {formatCountdown(etaCountdown)}
                  </strong>
                ) : (
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{emergency.eta || 'Calculating...'}</strong>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {emergency.status !== 'Completed' && emergency.status !== 'Cancelled' && (
                <button 
                  onClick={handleCancelRequest}
                  disabled={cancelling}
                  className="btn btn-secondary" 
                  style={{
                    flex: 1, padding: '0.5rem', fontSize: '0.75rem',
                    color: 'var(--accent)', borderColor: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                  }}
                >
                  {cancelling ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={14} />}
                  <span>Cancel Request</span>
                </button>
              )}
              
              {emergency.payment_status === 'Paid' && (
                <button 
                  onClick={fetchInvoice}
                  className="btn btn-primary" 
                  style={{
                    flex: 1, padding: '0.5rem', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                  }}
                >
                  <FileText size={14} />
                  <span>View Invoice</span>
                </button>
              )}
            </div>
          </div>

          {/* Timeline tracking */}
          <div className="ai-glass-panel">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem' }}>🚩 Emergency Dispatch Stepper</h3>
            
            <div className="timeline-stepper">
              {/* Step 1 */}
              <div className={`timeline-step-item ${currentStatusIdx >= 0 ? 'completed' : ''} ${emergency.status === 'Pending' ? 'active' : ''}`}>
                <div className="timeline-step-dot"></div>
                <strong style={{ fontSize: '0.8rem', color: currentStatusIdx >= 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>SOS Request Submitted</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Emergency ID sequence generated. Broadcasted coordinates.</span>
              </div>

              {/* Step 2 */}
              <div className={`timeline-step-item ${currentStatusIdx >= 1 ? 'completed' : ''} ${emergency.status === 'Accepted' ? 'active' : ''}`}>
                <div className="timeline-step-dot"></div>
                <strong style={{ fontSize: '0.8rem', color: currentStatusIdx >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Request Accepted</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Assistance dispatch center confirmed response routing.</span>
              </div>

              {/* Step 3 */}
              <div className={`timeline-step-item ${currentStatusIdx >= 2 ? 'completed' : ''} ${emergency.status === 'Mechanic Assigned' ? 'active' : ''}`}>
                <div className="timeline-step-dot"></div>
                <strong style={{ fontSize: '0.8rem', color: currentStatusIdx >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Mechanic Assigned</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {emergency.assigned_mechanic ? `${emergency.assigned_mechanic} paired for mobilization.` : 'Pairing with closest vehicle.'}
                </span>
              </div>

              {/* Step 4 */}
              <div className={`timeline-step-item ${currentStatusIdx >= 3 ? 'completed' : ''} ${emergency.status === 'Mechanic En Route' ? 'active' : ''}`}>
                <div className="timeline-step-dot"></div>
                <strong style={{ fontSize: '0.8rem', color: currentStatusIdx >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Mechanic En Route</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Towing / support truck moving. Live ETA is active.</span>
              </div>

              {/* Step 5 */}
              <div className={`timeline-step-item ${currentStatusIdx >= 4 ? 'completed' : ''} ${emergency.status === 'Arrived' ? 'active' : ''}`}>
                <div className="timeline-step-dot"></div>
                <strong style={{ fontSize: '0.8rem', color: currentStatusIdx >= 4 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Mechanic Arrived</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Assistance team reaches target breakdown coordinates.</span>
              </div>

              {/* Step 6 */}
              <div className={`timeline-step-item ${currentStatusIdx >= 5 ? 'completed' : ''} ${emergency.status === 'Completed' ? 'active' : ''}`}>
                <div className="timeline-step-dot"></div>
                <strong style={{ fontSize: '0.8rem', color: currentStatusIdx >= 5 ? 'var(--text-primary)' : 'var(--text-muted)' }}>Recovery Completed</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Vehicle back in motion. Invoice receipt processed.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Invoice Modal */}
      {showInvoice && invoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="ai-glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                <FileText size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Invoice
              </h3>
              <button onClick={() => setShowInvoice(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--light-surface)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoice ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{invoice.invoice_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Emergency ID:</span>
                <strong>{invoice.emergency_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                <strong>{invoice.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Vehicle:</span>
                <strong>{invoice.vehicle} - {invoice.vehicle_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Service:</span>
                <strong>{invoice.emergency_type}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {invoice.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.8rem', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
                  <strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Total Amount</span>
              <strong style={{ fontSize: '1.2rem', color: '#22c55e' }}>₹{invoice.total.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Payment Status: <strong style={{ color: invoice.payment_status === 'Paid' ? '#22c55e' : '#f59e0b' }}>{invoice.payment_status}</strong>
              {' • '}Method: <strong>{invoice.payment_method}</strong>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
