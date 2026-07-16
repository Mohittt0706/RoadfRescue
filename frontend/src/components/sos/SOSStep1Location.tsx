import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Crosshair, ZoomIn, ZoomOut, Maximize2, CheckCircle, Car, Bike, Truck, Zap, ArrowRight } from 'lucide-react';

interface SOSStep1Props {
  data: {
    address: string;
    vehicleType: string;
    brand: string;
    model: string;
    regNum: string;
  };
  onUpdate: (data: Partial<SOSStep1Props['data']>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const VEHICLE_TYPES = [
  { id: 'car', label: 'Car', icon: Car },
  { id: 'bike', label: 'Bike', icon: Bike },
  { id: 'suv', label: 'SUV', icon: Car },
  { id: 'truck', label: 'Truck', icon: Truck },
  { id: 'ev', label: 'EV', icon: Zap },
];

const SAVED_ADDRESSES = [
  { id: 'work', label: 'Work', value: 'Bandra Kurla Complex, Mumbai' },
  { id: 'home', label: 'Home', value: '450 Federal St, Boston, MA' },
  { id: 'highway', label: 'Highway', value: 'Milestone 42 Expressway, Mumbai' },
];

const SEARCH_SUGGESTIONS = [
  '120 Bandra Kurla Complex, Mumbai',
  '450 Federal St, Boston, MA',
  '742 Evergreen Terrace, Springfield',
  'Times Square, New York, NY',
];

export default function SOSStep1Location({ data, onUpdate, onNext, onCancel }: SOSStep1Props) {
  const [searchVal, setSearchVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSaved, setActiveSaved] = useState('work');
  const svgRef = useRef<SVGSVGElement>(null);
  const [userPos, setUserPos] = useState({ x: 450, y: 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [accuracy] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem('rr-brand') || '';
    const model = localStorage.getItem('rr-model') || '';
    const reg = localStorage.getItem('rr-regnum') || '';
    onUpdate({ brand: saved, model, regNum: reg });
  }, []);

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = Math.max(10, Math.min(490, ((clientX - rect.left) / rect.width) * 500));
    const y = Math.max(10, Math.min(340, ((clientY - rect.top) / rect.height) * 350));
    setUserPos({ x: Math.round(x), y: Math.round(y) });
    onUpdate({ address: `Custom Pin: (${Math.round(x)}, ${Math.round(y)})` });
  };

  const handleStopDrag = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag as any);
      window.addEventListener('mouseup', handleStopDrag);
      window.addEventListener('touchmove', handleDrag as any);
      window.addEventListener('touchend', handleStopDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag as any);
      window.removeEventListener('mouseup', handleStopDrag);
      window.removeEventListener('touchmove', handleDrag as any);
      window.removeEventListener('touchend', handleStopDrag);
    };
  }, [isDragging]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="sos-glass">
        <div className="sos-step-header">
          <h2>Confirm Location & Vehicle</h2>
          <p>Verify your emergency location on the map, then select your vehicle type for accurate dispatch matching.</p>
        </div>

        {/* Search Bar */}
        <div className="sos-search-bar">
          <Search className="sos-search-icon" size={18} />
          <input
            type="text"
            placeholder="Search address, landmark, or intersection..."
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && searchVal && (
            <div className="sos-search-dropdown">
              {SEARCH_SUGGESTIONS.filter(s => s.toLowerCase().includes(searchVal.toLowerCase())).map((s, i) => (
                <div key={i} className="sos-search-dropdown-item" onClick={() => {
                  onUpdate({ address: s });
                  setSearchVal('');
                  setShowSuggestions(false);
                }}>
                  <MapPin size={14} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Map */}
        <div className="sos-map-container">
          <div ref={svgRef as any} style={{ width: '100%', height: '100%' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 500 350">
              <defs>
                <pattern id="sos-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sos-grid)" />
              <path d="M 0,120 L 500,120" stroke="var(--border-light)" strokeWidth="14" fill="none" opacity="0.9" />
              <path d="M 0,120 L 500,120" stroke="white" strokeWidth="1" strokeDasharray="6,6" fill="none" opacity="0.6" />
              <path d="M 250,0 L 250,350" stroke="var(--border-light)" strokeWidth="14" fill="none" opacity="0.9" />
              <path d="M 250,0 L 250,350" stroke="white" strokeWidth="1" strokeDasharray="6,6" fill="none" opacity="0.6" />
              <path d="M 0,250 L 500,250" stroke="var(--border-light)" strokeWidth="14" fill="none" opacity="0.9" />
              <path d="M 0,250 L 500,250" stroke="white" strokeWidth="1" strokeDasharray="6,6" fill="none" opacity="0.6" />
              <path d="M 100,0 L 100,350" stroke="var(--border-light)" strokeWidth="8" fill="none" opacity="0.4" />
              <path d="M 400,0 L 400,350" stroke="var(--border-light)" strokeWidth="8" fill="none" opacity="0.4" />

              {/* Nearby mechanic pins */}
              <g transform="translate(180, 280)">
                <circle cx="0" cy="0" r="14" fill="var(--primary)" opacity="0.15" className="map-pulse-circle" />
                <circle cx="0" cy="0" r="5" fill="var(--primary)" />
                <text x="8" y="4" fontSize="8" fontWeight="800" fill="var(--text-muted)">Tow Node A</text>
              </g>
              <g transform="translate(100, 120)">
                <circle cx="0" cy="0" r="14" fill="var(--secondary)" opacity="0.15" className="map-pulse-circle" />
                <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
                <text x="8" y="4" fontSize="8" fontWeight="800" fill="var(--text-muted)">Apex Service</text>
              </g>
              <g transform="translate(300, 220)">
                <circle cx="0" cy="0" r="14" fill="var(--secondary)" opacity="0.15" className="map-pulse-circle" />
                <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
                <text x="8" y="4" fontSize="8" fontWeight="800" fill="var(--text-muted)">QuickFix Unit</text>
              </g>

              {/* Draggable user pin */}
              <g transform={`translate(${userPos.x}, ${userPos.y})`} onMouseDown={handleStartDrag} onTouchStart={handleStartDrag} style={{ cursor: 'grab' }}>
                <circle cx="0" cy="0" r={accuracy * 6} fill="var(--accent)" opacity="0.12" />
                <circle cx="0" cy="0" r="15" fill="var(--accent)" opacity="0.2" className="map-pulse-circle" />
                <path d="M0,0 C-8,-8 -12,-18 0,-26 C12,-18 8,-8 0,0 Z" fill="var(--accent)" />
                <circle cx="0" cy="-17" r="4.5" fill="white" />
                <rect x="-35" y="-45" width="70" height="15" rx="3" fill="var(--dark-bg)" opacity="0.85" />
                <text x="0" y="-35" fill="white" fontSize="7.5" fontWeight="900" textAnchor="middle">DRAG ME</text>
              </g>
            </svg>
          </div>

          {/* Map Controls */}
          <div className="sos-map-controls">
            <button className="sos-map-control-btn" title="Use Current Location"><Crosshair size={16} /></button>
            <button className="sos-map-control-btn" title="Zoom In"><ZoomIn size={16} /></button>
            <button className="sos-map-control-btn" title="Zoom Out"><ZoomOut size={16} /></button>
            <button className="sos-map-control-btn" title="Fullscreen"><Maximize2 size={16} /></button>
          </div>

          {/* Address Overlay */}
          <div className="sos-map-overlay-card">
            <div className="sos-map-overlay-label">Selected Rescue Address</div>
            <div className="sos-map-overlay-address">{data.address}</div>
            <div className="sos-map-overlay-accuracy">
              <div className="sos-map-accuracy-dot" />
              <span>GPS Lock Accurate to {accuracy}m</span>
            </div>
          </div>
        </div>

        {/* Location Stats */}
        <div className="sos-location-grid">
          <div className="sos-location-stat">
            <span className="sos-location-stat-label">Coordinates</span>
            <span className="sos-location-stat-value">{(userPos.x / 10).toFixed(4)}°N, {(userPos.y / 10).toFixed(4)}°E</span>
          </div>
          <div className="sos-location-stat">
            <span className="sos-location-stat-label">GPS Accuracy</span>
            <span className="sos-location-stat-value success">±{accuracy}m radius</span>
          </div>
          <div className="sos-location-stat">
            <span className="sos-location-stat-label">Nearest Mechanic</span>
            <span className="sos-location-stat-value primary">~8 min ETA</span>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="sos-saved-label">Choose from Saved Addresses</div>
        <div className="sos-saved-grid">
          {SAVED_ADDRESSES.map(addr => (
            <div
              key={addr.id}
              className={`sos-saved-card ${activeSaved === addr.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSaved(addr.id);
                onUpdate({ address: addr.value });
              }}
            >
              <span className="sos-saved-card-title">{addr.label}</span>
              <span className="sos-saved-card-value">{addr.value}</span>
            </div>
          ))}
        </div>

        {/* Safety Banner */}
        <div className="sos-safety-banner">
          <div className="sos-safety-icon"><CheckCircle size={18} /></div>
          <div className="sos-safety-content">
            <span className="sos-safety-title">Safety Reminder</span>
            <div className="sos-safety-grid">
              <span className="sos-safety-item">Turn on hazard lights immediately</span>
              <span className="sos-safety-item">Stay inside with seatbelt fastened</span>
              <span className="sos-safety-item">Move to safe shoulder if possible</span>
              <span className="sos-safety-item">Report any injuries to dispatcher</span>
            </div>
          </div>
        </div>

        {/* Vehicle Type Selection */}
        <div className="sos-step-header" style={{ marginTop: '0.5rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Select Vehicle Type</h2>
          <p>Choose the vehicle that requires roadside assistance.</p>
        </div>

        <div className="sos-vehicle-grid">
          {VEHICLE_TYPES.map(v => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`sos-vehicle-card ${data.vehicleType === v.id ? 'active' : ''}`}
                onClick={() => onUpdate({ vehicleType: v.id })}
              >
                <div className="sos-vehicle-icon"><Icon size={22} /></div>
                <span className="sos-vehicle-label">{v.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Vehicle Details Form */}
        <div className="sos-form-grid">
          <div className="sos-form-group">
            <label className="sos-form-label">Brand / Manufacturer</label>
            <input
              type="text"
              className="sos-form-input"
              placeholder="e.g. Tesla, Toyota, Honda"
              value={data.brand}
              onChange={(e) => onUpdate({ brand: e.target.value })}
            />
          </div>
          <div className="sos-form-group">
            <label className="sos-form-label">Model Name</label>
            <input
              type="text"
              className="sos-form-input"
              placeholder="e.g. Model 3, RAV4, Civic"
              value={data.model}
              onChange={(e) => onUpdate({ model: e.target.value })}
            />
          </div>
          <div className="sos-form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="sos-form-label">Registration Plate Number</label>
            <input
              type="text"
              className="sos-form-input"
              placeholder="e.g. MH-12-RR-7777"
              value={data.regNum}
              onChange={(e) => onUpdate({ regNum: e.target.value.toUpperCase() })}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sos-footer-bar">
          <button className="sos-btn sos-btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="sos-btn sos-btn-primary" onClick={onNext}>
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
