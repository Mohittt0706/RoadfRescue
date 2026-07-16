import { motion } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface SOSStep3Props {
  data: {
    problem: string;
    address: string;
    selectedMechanic: any;
    paymentMethod: string;
    aiReport: any;
  };
  onUpdate: (data: Partial<SOSStep3Props['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MECHANICS = [
  { id: 1, name: 'Apex Auto Recovery', rating: 4.9, reviews: 42, distance: '1.2 mi', eta: 8, fee: 49, desc: 'EV & Hybrid specialist, hydraulic jacks', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100' },
  { id: 2, name: 'QuickFix Mobile Repair', rating: 4.8, reviews: 85, distance: '2.0 mi', eta: 12, fee: 59, desc: 'Fast battery jumps and flat tyres', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100' },
  { id: 3, name: 'Metro Heavy Towing', rating: 4.7, reviews: 104, distance: '3.4 mi', eta: 15, fee: 89, desc: 'Flatbed towing, winch, lockouts', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100' },
];

const PAYMENT_METHODS = [
  { id: 'upi', icon: '📱', label: 'UPI' },
  { id: 'card', icon: '💳', label: 'Card' },
  { id: 'wallet', icon: '👛', label: 'Wallet' },
  { id: 'cash', icon: '💵', label: 'Cash' },
];

export default function SOSStep3Mechanics({ data, onUpdate, onNext, onBack }: SOSStep3Props) {
  const selected = data.selectedMechanic || MECHANICS[0];

  const getPriceBreakdown = () => {
    const distanceKm = parseFloat(selected.distance.split(' ')[0]) * 1.609;
    const distanceFee = Math.round(distanceKm * 35);
    const taxes = Math.round((selected.fee + distanceFee) * 0.18);
    const total = selected.fee + distanceFee + taxes;
    return {
      base: selected.fee.toLocaleString('en-IN'),
      dist: distanceFee.toLocaleString('en-IN'),
      tax: taxes.toLocaleString('en-IN'),
      total: total.toLocaleString('en-IN'),
    };
  };

  const prices = getPriceBreakdown();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="sos-glass">
        <div className="sos-step-header">
          <h2>Nearby Mechanics</h2>
          <p>Choose the closest verified mechanic team. Review pricing and confirm your emergency dispatch request.</p>
        </div>

        {/* Simulated Map */}
        <div className="sos-map-container" style={{ height: 220, marginBottom: '1.5rem' }}>
          <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 500 200">
            <defs>
              <pattern id="mech-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mech-grid)" />
            <path d="M 0,80 L 500,80" stroke="var(--border-light)" strokeWidth="12" fill="none" opacity="0.9" />
            <path d="M 200,0 L 200,200" stroke="var(--border-light)" strokeWidth="12" fill="none" opacity="0.9" />
            <path d="M 0,160 L 500,160" stroke="var(--border-light)" strokeWidth="8" fill="none" opacity="0.5" />

            {/* User pin */}
            <g transform="translate(450, 160)">
              <circle cx="0" cy="0" r="12" fill="var(--accent)" opacity="0.2" className="map-pulse-circle" />
              <circle cx="0" cy="0" r="5" fill="var(--accent)" />
              <text x="-20" y="-10" fontSize="8" fontWeight="900" fill="var(--text-primary)">You</text>
            </g>

            {/* Mechanic pins */}
            {MECHANICS.map((m, i) => {
              const positions = [{ x: 100, y: 80 }, { x: 200, y: 160 }, { x: 350, y: 80 }];
              const pos = positions[i];
              const isSelected = selected.id === m.id;
              return (
                <g key={m.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle cx="0" cy="0" r={isSelected ? 16 : 12} fill={isSelected ? 'var(--primary)' : 'var(--secondary)'} opacity={isSelected ? 0.2 : 0.15} className="map-pulse-circle" />
                  <circle cx="0" cy="0" r={isSelected ? 7 : 5} fill={isSelected ? 'var(--primary)' : 'var(--secondary)'} />
                  <text x="10" y="4" fontSize="7.5" fontWeight="800" fill="var(--text-muted)">{m.name.split(' ')[0]}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Mechanics Grid */}
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Matched Verified Mechanics Nearby
        </div>
        <div className="sos-mechanics-grid">
          {MECHANICS.map(m => (
            <motion.div
              key={m.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`sos-mechanic-card ${selected.id === m.id ? 'active' : ''}`}
              onClick={() => onUpdate({ selectedMechanic: m })}
            >
              <div className="sos-mechanic-header">
                <img src={m.avatar} alt={m.name} className="sos-mechanic-avatar" />
                <div className="sos-mechanic-info">
                  <div className="sos-mechanic-name">{m.name}</div>
                  <div className="sos-mechanic-desc">{m.desc}</div>
                </div>
                <div className="sos-mechanic-badge"><Check size={8} strokeWidth={4} /> Verified</div>
              </div>
              <div className="sos-mechanic-meta">
                <div className="sos-mechanic-meta-item">
                  <span className="sos-mechanic-meta-label">Rating</span>
                  <span className="sos-mechanic-meta-value">⭐ {m.rating} ({m.reviews})</span>
                </div>
                <div className="sos-mechanic-meta-item" style={{ alignItems: 'flex-end' }}>
                  <span className="sos-mechanic-meta-label">ETA / Distance</span>
                  <span className="sos-mechanic-meta-value primary">{m.eta}m ({m.distance})</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment + Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Payment Methods */}
          <div>
            <div className="sos-saved-label">Secure Payment Method</div>
            <div className="sos-payment-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {PAYMENT_METHODS.map(pm => (
                <div
                  key={pm.id}
                  className={`sos-payment-btn ${data.paymentMethod === pm.id ? 'active' : ''}`}
                  onClick={() => onUpdate({ paymentMethod: pm.id })}
                >
                  <span className="sos-payment-icon">{pm.icon}</span>
                  <span>{pm.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div>
            <div className="sos-saved-label">Estimated Pricing Bill</div>
            <div className="sos-price-breakdown">
              <div className="sos-price-row"><span>Base Service Charge</span><span>₹{prices.base}</span></div>
              <div className="sos-price-row"><span>Distance ({selected.distance} @ ₹35/km)</span><span>₹{prices.dist}</span></div>
              <div className="sos-price-row"><span>GST (18%)</span><span>₹{prices.tax}</span></div>
              <div className="sos-price-total"><span>Total Estimated</span><span>₹{prices.total}</span></div>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.75rem', textAlign: 'center' }}>
              🔒 Secure transaction encrypted via Stripe Protocol. Payments held in escrow.
            </p>
          </div>
        </div>

        {/* Request Summary */}
        <div className="sos-summary-card">
          <div className="sos-summary-title">SOS Request Summary</div>
          <div className="sos-summary-row"><span className="label">Location</span><span className="value">{data.address}</span></div>
          <div className="sos-summary-row"><span className="label">Problem</span><span className="value accent">🚨 {data.problem}</span></div>
          <div className="sos-summary-row"><span className="label">Mechanic</span><span className="value">{selected.name}</span></div>
          <div className="sos-summary-row"><span className="label">Estimated Cost</span><span className="value">₹{prices.total}</span></div>
        </div>

        {/* Footer Actions */}
        <div className="sos-footer-bar">
          <button className="sos-btn sos-btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="sos-btn sos-btn-danger" onClick={onNext} style={{ boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)' }}>
            Confirm & Request Assistance <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
