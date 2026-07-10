import { useState, useEffect } from 'react';
import { X, Check, Navigation, AlertCircle } from 'lucide-react';

interface MechanicTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onStatusUpdate?: () => void;
}

const TRACKING_STEPS = [
  { title: 'Mechanic Assigned', desc: 'Rahul Patel is assigned to your request.' },
  { title: 'Mechanic Started', desc: 'On the way to your location.' },
  { title: 'Mechanic Nearby', desc: 'Less than 1 km away. Look out for the vehicle.' },
  { title: 'Arrived', desc: 'Mechanic has arrived at your exact location.' }
];

export default function MechanicTrackerModal({ isOpen, onClose, booking, onStatusUpdate }: MechanicTrackerModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen || !booking) return;

    // Reset step
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next < TRACKING_STEPS.length) {
          // Update status in localStorage
          const bookingsStr = localStorage.getItem('bookings');
          if (bookingsStr) {
            try {
              const list = JSON.parse(bookingsStr);
              const idx = list.findIndex((b: any) => b.id === booking.id);
              if (idx !== -1) {
                // Map tracking step to booking status
                const statusMap = ['Pending', 'In Progress', 'In Progress', 'Completed'];
                list[idx].status = statusMap[next];
                localStorage.setItem('bookings', JSON.stringify(list));
                if (onStatusUpdate) {
                  onStatusUpdate();
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
          return next;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, booking?.id]);

  if (!isOpen || !booking) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card-bg, #0b0f19)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
        borderRadius: '24px',
        width: '90%', maxWidth: '440px',
        padding: '2rem',
        boxShadow: 'var(--shadow-premium, 0 10px 50px rgba(0,0,0,0.5))',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              ⚡ Tracking Mechanic
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
              Booking ID: {booking.id}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Tracker Info */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'var(--primary-glow, rgba(37,99,235,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary, #3b82f6)'
          }}>
            <Navigation size={20} className={currentStep < 3 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary, #3b82f6)', textTransform: 'uppercase' }}>
              Current ETA
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
              {currentStep === 0 ? '15 Mins' : currentStep === 1 ? '10 Mins' : currentStep === 2 ? '3 Mins' : 'Arrived'}
            </div>
          </div>
        </div>

        {/* Timeline Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '1rem' }}>
          {/* Vertical line connector */}
          <div style={{
            position: 'absolute', left: '23px', top: '10px', bottom: '10px', width: '2px',
            background: 'rgba(255,255,255,0.06)', zIndex: 1
          }}>
            <div style={{
              height: `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%`,
              width: '100%',
              background: 'var(--success, #22c55e)',
              transition: 'height 0.4s ease'
            }} />
          </div>

          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isActive = idx === currentStep;

            return (
              <div key={idx} style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
                {/* Step Circle */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isCompleted ? 'var(--success, #22c55e)' : '#1e293b',
                  border: `2px solid ${isActive ? 'var(--success, #22c55e)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isCompleted ? '#fff' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 12px rgba(34,197,94,0.4)' : 'none'
                }}>
                  {isCompleted ? <Check size={14} /> : <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{idx + 1}</span>}
                </div>

                {/* Step Label */}
                <div>
                  <h4 style={{
                    margin: 0, fontSize: '0.9rem', fontWeight: 700,
                    color: isCompleted ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.3s ease'
                  }}>
                    {step.title}
                  </h4>
                  <p style={{
                    margin: '0.15rem 0 0', fontSize: '0.75rem',
                    color: isCompleted ? 'var(--text-secondary, #94a3b8)' : 'rgba(255,255,255,0.2)',
                    transition: 'color 0.3s ease'
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem' }}>
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
