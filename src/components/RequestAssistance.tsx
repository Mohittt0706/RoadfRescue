import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Upload, 
  Mic, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  AlertTriangle, 
  Phone,
  MessageSquare,
  Search,
  CheckCircle,
  Wifi,
  Trash2,
  Compass
} from 'lucide-react';

interface RequestAssistanceProps {
  startSimulation: () => void;
  setMapStatus: (status: 'Searching' | 'Accepted' | 'On The Way' | 'Arriving' | 'Completed') => void;
  setMapEta: (eta: number) => void;
  setMapDist: (dist: number) => void;
  setSelectedIssue: (issue: string | null) => void;
  setActiveDashboardTab: (tab: 'home' | 'dispatch' | 'chat' | 'profile' | 'nearby') => void;
  onTriggerCheckout: (checkoutPayload: any) => void;
}

export default function RequestAssistance({
  startSimulation,
  setMapStatus,
  setMapEta,
  setMapDist,
  setSelectedIssue,
  setActiveDashboardTab,
  onTriggerCheckout
}: RequestAssistanceProps) {
  // Stepper State: 1: Location, 2: Vehicle, 3: Problem/Details, 4: AI Diagnosis, 5: Mechanics/Payment, 6: Success
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<'EN' | 'ES' | 'HI'>('EN');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Auto-offline checks
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Step 1: Location State ---
  const svgRef = useRef<SVGSVGElement>(null);
  const [userPos, setUserPos] = useState({ x: 450, y: 250 }); // Initial coords mapping to Disha in SVG map
  const [isDragging, setIsDragging] = useState(false);
  const [address, setAddress] = useState('120 Bandra Kurla Complex, Mumbai');
  const [accuracy, setAccuracy] = useState(5);
  const [searchVal, setSearchVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedAddressActive, setSavedAddressActive] = useState('work');

  const suggestions = [
    { name: '120 Bandra Kurla Complex, Mumbai', x: 450, y: 250 },
    { name: '450 Federal St, Boston, MA', x: 250, y: 120 },
    { name: '742 Evergreen Terrace, Springfield', x: 300, y: 220 },
    { name: 'Times Square, New York, NY', x: 180, y: 280 }
  ];

  // Draggable SVG marker pin handlers
  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 500;
    const y = ((clientY - rect.top) / rect.height) * 350;

    const clampedX = Math.max(10, Math.min(490, x));
    const clampedY = Math.max(10, Math.min(340, y));

    setUserPos({ x: Math.round(clampedX), y: Math.round(clampedY) });
    setAddress(`Custom Pin Coordinates: (${Math.round(clampedX)}, ${Math.round(clampedY)})`);
    setAccuracy(Math.floor(Math.random() * 4) + 2);
    setSavedAddressActive('');
  };

  const handleStopDrag = () => {
    setIsDragging(false);
  };

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

  const selectSuggestion = (s: { name: string; x: number; y: number }) => {
    setUserPos({ x: s.x, y: s.y });
    setAddress(s.name);
    setSearchVal('');
    setShowSuggestions(false);
    setAccuracy(4);
  };

  const handleUseCurrentLocation = () => {
    setUserPos({ x: 450, y: 250 });
    setAddress('120 Bandra Kurla Complex, Mumbai (GPS Current Location)');
    setAccuracy(3);
    setSavedAddressActive('work');
  };

  // --- Step 2: Vehicle Details State (Auto-saved) ---
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'suv' | 'truck' | 'ev'>('car');
  const [brand, setBrand] = useState(() => localStorage.getItem('rr-brand') || '');
  const [model, setModel] = useState(() => localStorage.getItem('rr-model') || '');
  const [regNum, setRegNum] = useState(() => localStorage.getItem('rr-regnum') || '');
  const [fuelType, setFuelType] = useState(() => localStorage.getItem('rr-fueltype') || 'Petrol');
  const [autoSavedMsg, setAutoSavedMsg] = useState(false);

  useEffect(() => {
    localStorage.setItem('rr-brand', brand);
    localStorage.setItem('rr-model', model);
    localStorage.setItem('rr-regnum', regNum);
    localStorage.setItem('rr-fueltype', fuelType);
    
    if (brand || model || regNum) {
      setAutoSavedMsg(true);
      const timer = setTimeout(() => setAutoSavedMsg(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [brand, model, regNum, fuelType]);

  // --- Step 3: Select Problem & Description ---
  const [problem, setProblem] = useState<string>('Flat Tire');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const problemTemplates: Record<string, string> = {
    'Flat Tire': 'I have a flat tire on the rear right side. I ran over a metallic screw on the expressway. I have a spare tire in my trunk but no mechanic jack to lift the chassis.',
    'Battery Dead': 'My battery is completely dead. I left the headlights on for 6 hours. The engine clicked once and refused to turn over. Need emergency jump start cables.',
    'Fuel Empty': 'I ran out of fuel about 2 miles before the toll bridge. The fuel gauge was reading empty for a while. I need 5 liters of fuel delivered so I can reach the station.',
    'Engine Failure': 'My vehicle lost all power suddenly on the highway. There is a clicking noise when trying to crank the engine, and the check engine light is flashing.',
    'Overheating': 'Smoke and white steam are venting from beneath the hood. The dashboard temperature gauge is in the red zone. I pulled over to the side of the road.',
    'Brake Issue': 'Brake pedal feels extremely soft and has lost stopping power. There is a metallic grinding sound when depressing the pedal.',
    'Locked Out': 'I accidentally locked my keys inside the car. The spare keys are at home. I need an unlock specialist with an airbag lock wedge and slim-jim toolkit.',
    'Accident': 'Minor bumper crash with another vehicle on the junction. No human injuries, but the front bumper is rubbing against the front tire, preventing driving.',
    'Towing Required': 'Gearbox jammed and vehicle is locked in park. I need a flatbed tow truck to transport my car to the authorized dealership repair center.',
    'Electrical Problem': 'Power window motors and cluster dashboard lights are malfunctioning. Tail lights are completely unresponsive. Suspect blown master fuse.',
    'Other': 'Stuck in mud near the roadside shoulder. Need assistance pull out winches.'
  };

  const handleProblemSelect = (p: string) => {
    setProblem(p);
    setSelectedIssue(p);
    // Autofill description templates to save user stress
    setDescription(problemTemplates[p] || '');
  };

  const startVoiceRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    // Simulate speech-to-text typing
    setTimeout(() => {
      setDescription(prev => {
        const text = " Stood on Mumbai bypass route. Sudden tire blowout. Suspect sidewall rupture. Vehicle hazard warning lights are on.";
        return prev ? prev + text : text.trim();
      });
      setIsRecording(false);
    }, 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- Step 4: AI Diagnosis State ---
  const [aiLoading, setAiLoading] = useState(true);
  const [aiReport, setAiReport] = useState<any>(null);

  useEffect(() => {
    if (step === 4) {
      setAiLoading(true);
      const timer = setTimeout(() => {
        setAiReport({
          issue: `${problem} - AI Diagnostic Analysis`,
          cost: problem === 'Flat Tire' ? '₹699' : problem === 'Battery Dead' ? '₹999' : problem === 'Fuel Empty' ? '₹799 + fuel cost' : problem === 'Locked Out' ? '₹899' : '₹1,499',
          time: problem === 'Flat Tire' ? '15 mins' : '10 mins',
          safety: [
            'Turn off the engine immediately and engage the parking brake.',
            'Activate your vehicle hazard hazard warning lights.',
            'Step out of the vehicle and stand behind the highway guardrails.'
          ],
          confidence: 96
        });
        setAiLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, problem]);

  // --- Step 5: Mechanics Match & Cost Checkout ---
  const mechanics = [
    { id: 1, name: "Apex Auto Recovery", rating: 4.9, reviews: 42, distance: "1.2 mi", eta: 8, fee: 49, desc: "EV & Hybrid specialist, carrying hydraulic jacks.", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100" },
    { id: 2, name: "QuickFix Mobile Repair", rating: 4.8, reviews: 85, distance: "2.0 mi", eta: 12, fee: 59, desc: "Fast battery jumps and flat tires. Light towing.", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" },
    { id: 3, name: "Metro Heavy Towing", rating: 4.7, reviews: 104, distance: "3.4 mi", eta: 15, fee: 89, desc: "Flatbed towing, winch services, lockouts.", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100" }
  ];

  const [selectedMechanic, setSelectedMechanic] = useState(mechanics[0]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'cash'>('upi');

  const getCalculatedPrice = () => {
    const serviceFee = selectedMechanic.fee;
    const distanceKm = parseFloat(selectedMechanic.distance.split(' ')[0]) * 1.609;
    const distanceFee = Math.round(distanceKm * 35);
    const taxes = Math.round((serviceFee + distanceFee) * 0.18);
    const total = serviceFee + distanceFee + taxes;
    return {
      service: serviceFee.toLocaleString('en-IN'),
      dist: distanceFee.toLocaleString('en-IN'),
      tax: taxes.toLocaleString('en-IN'),
      total: total.toLocaleString('en-IN')
    };
  };

  const priceBreakdown = getCalculatedPrice();

  // Trigger submission to secure checkout page
  const handleConfirmRequest = () => {
    const payload = {
      requestId: `RR-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleType: vehicleType,
      vehicleNum: regNum || "MH-12-XX-9999",
      vehicleModel: `${brand} ${model}`.trim() || "Tesla Model Y",
      serviceType: problem,
      mechanicName: selectedMechanic.name,
      mechanicRating: selectedMechanic.rating,
      mechanicReviews: selectedMechanic.reviews,
      mechanicAvatar: selectedMechanic.avatar,
      location: address,
      eta: selectedMechanic.eta,
      distance: selectedMechanic.distance,
      pricing: {
        base: priceBreakdown.service,
        distance: priceBreakdown.dist,
        tax: priceBreakdown.tax,
        total: priceBreakdown.total
      }
    };
    onTriggerCheckout(payload);
  };

  const handleCloseSuccess = () => {
    // Closes success view, sets parent states, and triggers simulation
    setStep(1);
    setMapStatus('Searching');
    setMapEta(selectedMechanic.eta);
    setMapDist(parseFloat(selectedMechanic.distance.split(' ')[0]));
    setSelectedIssue(problem);
    setActiveDashboardTab('dispatch');
    startSimulation();
  };

  return (
    <div className="request-wizard-container">
      {/* Smart Features Header Row (Offline status + language + auto-save indicators) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        {isOffline ? (
          <div className="offline-banner">
            <Wifi size={14} className="animate-pulse" />
            <span>Offline Mode: Requests will queue and submit when connection returns.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 800 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></span>
            <span>Network Secure Connected</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {autoSavedMsg && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              ✓ Auto-saved profile details
            </span>
          )}
          <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
            {(['EN', 'ES', 'HI'] as const).map(lang => (
              <button 
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  border: 'none',
                  background: language === lang ? 'var(--primary)' : 'var(--light-surface)',
                  color: language === lang ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stepper Node Header (Steps 1 to 5) */}
      {step < 6 && (
        <div className="stepper-header">
          <div className="stepper-progress-bar" style={{ width: `${(step / 5) * 100}%` }}></div>
          
          <div className={`step-node ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'active' : ''}`}>
            <div className="step-circle">{step > 1 ? <Check size={16} /> : '1'}</div>
            <span className="step-label">Location</span>
          </div>
          <div className={`step-node ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'active' : ''}`}>
            <div className="step-circle">{step > 2 ? <Check size={16} /> : '2'}</div>
            <span className="step-label">Vehicle</span>
          </div>
          <div className={`step-node ${step >= 3 ? 'completed' : ''} ${step === 3 ? 'active' : ''}`}>
            <div className="step-circle">{step > 3 ? <Check size={16} /> : '3'}</div>
            <span className="step-label">Details</span>
          </div>
          <div className={`step-node ${step >= 4 ? 'completed' : ''} ${step === 4 ? 'active' : ''}`}>
            <div className="step-circle">{step > 4 ? <Check size={16} /> : '4'}</div>
            <span className="step-label">AI Diagnosis</span>
          </div>
          <div className={`step-node ${step >= 5 ? 'completed' : ''} ${step === 5 ? 'active' : ''}`}>
            <div className="step-circle">{step > 5 ? <Check size={16} /> : '5'}</div>
            <span className="step-label">Booking</span>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 1: LOCATION CONFIRMATION
          ========================================== */}
      {step === 1 && (
        <div className="wizard-card animate-slide-up">
          <div className="wizard-card-header">
            <h2 className="wizard-card-title" style={{ textAlign: 'left', margin: 0 }}>
              📍 Confirm Your Emergency Location
            </h2>
            <p className="wizard-card-subtitle">
              Verify your coordinates. Drag the marker pin on the vector street grid to lock down the location where help is needed.
            </p>
          </div>

          {/* Search bar */}
          <div className="location-search-container">
            <Search className="location-search-icon" size={18} />
            <input 
              type="text"
              placeholder="Search address manually..."
              className="location-search-input"
              value={searchVal}
              onChange={(e) => { setSearchVal(e.target.value); setShowSuggestions(true); }}
            />
            {showSuggestions && searchVal && (
              <div className="search-results-dropdown">
                {suggestions.filter(s => s.name.toLowerCase().includes(searchVal.toLowerCase())).map((s, idx) => (
                  <div key={idx} className="search-result-item" onClick={() => selectSuggestion(s)}>
                    <MapPin size={12} />
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Draggable Vector Map Mockup */}
          <div className="vector-map-wrapper" ref={svgRef as any}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 500 350">
              <defs>
                <pattern id="wizard-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#wizard-grid)" />
              
              {/* Road Network Grid Layout */}
              <path d="M 0,120 L 500,120" stroke="var(--border-light)" strokeWidth="14" fill="none" opacity="0.9" />
              <path d="M 0,120 L 500,120" stroke="white" strokeWidth="1" strokeDasharray="6,6" fill="none" opacity="0.6" />

              <path d="M 250,0 L 250,350" stroke="var(--border-light)" strokeWidth="14" fill="none" opacity="0.9" />
              <path d="M 250,0 L 250,350" stroke="white" strokeWidth="1" strokeDasharray="6,6" fill="none" opacity="0.6" />

              <path d="M 0,250 L 500,250" stroke="var(--border-light)" strokeWidth="14" fill="none" opacity="0.9" />
              <path d="M 0,250 L 500,250" stroke="white" strokeWidth="1" strokeDasharray="6,6" fill="none" opacity="0.6" />

              <path d="M 100,0 L 100,350" stroke="var(--border-light)" strokeWidth="8" fill="none" opacity="0.4" />
              <path d="M 400,0 L 400,350" stroke="var(--border-light)" strokeWidth="8" fill="none" opacity="0.4" />

              {/* Nearby Tow Truck Visual Pin */}
              <g transform="translate(180, 280)">
                <circle cx="0" cy="0" r="14" fill="var(--primary)" opacity="0.15" className="map-pulse-circle" />
                <circle cx="0" cy="0" r="5" fill="var(--primary)" />
                <text x="8" y="4" fontSize="8" fontWeight="800" fill="var(--text-muted)">🚛 Tow Node A</text>
              </g>

              {/* Nearby Mechanics Visual Pins */}
              <g transform="translate(100, 120)">
                <circle cx="0" cy="0" r="14" fill="var(--secondary)" opacity="0.15" className="map-pulse-circle" />
                <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
                <text x="8" y="4" fontSize="8" fontWeight="800" fill="var(--text-muted)">🔧 Apex Service</text>
              </g>

              <g transform="translate(300, 220)">
                <circle cx="0" cy="0" r="14" fill="var(--secondary)" opacity="0.15" className="map-pulse-circle" />
                <circle cx="0" cy="0" r="5" fill="var(--secondary)" />
                <text x="8" y="4" fontSize="8" fontWeight="800" fill="var(--text-muted)">🔧 QuickFix Unit</text>
              </g>

              {/* Draggable User Pin */}
              <g transform={`translate(${userPos.x}, ${userPos.y})`} onMouseDown={handleStartDrag} onTouchStart={handleStartDrag} className="map-draggable-pin">
                {/* Accuracy Radar Circle */}
                <circle cx="0" cy="0" r={accuracy * 6} fill="var(--accent)" opacity="0.12" className="map-accuracy-radar" />
                
                {/* Ping shadow */}
                <circle cx="0" cy="0" r="15" fill="var(--accent)" opacity="0.2" className="map-pulse-circle" />
                
                {/* Location Marker Needle Pin */}
                <path d="M0,0 C-8,-8 -12,-18 0,-26 C12,-18 8,-8 0,0 Z" fill="var(--accent)" />
                <circle cx="0" cy="-17" r="4.5" fill="white" />
                
                {/* Label indicator */}
                <rect x="-35" y="-45" width="70" height="15" rx="3" fill="var(--dark-bg)" opacity="0.85" />
                <text x="0" y="-35" fill="white" fontSize="7.5" fontWeight="900" textAnchor="middle">DRAG ME</text>
              </g>
            </svg>

            {/* Recenter Location Button */}
            <button className="map-location-reset-btn" onClick={handleUseCurrentLocation}>
              <Compass size={14} className="animate-spin-slow" />
              <span>Use GPS Current Location</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SELECTED RESCUE ADDRESS:</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{address}</span>
            </div>
            <div className="accuracy-indicator">
              <div className="accuracy-dot"></div>
              <span>GPS Lock Accurate to {accuracy} meters</span>
            </div>
          </div>

          {/* Saved Addresses Panel */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              CHOOSE FROM SAVED ADRESSES:
            </span>
            <div className="saved-addresses-grid">
              <div 
                className={`saved-address-card ${savedAddressActive === 'work' ? 'active' : ''}`}
                onClick={() => {
                  setSavedAddressActive('work');
                  setUserPos({ x: 450, y: 250 });
                  setAddress('120 Bandra Kurla Complex, Mumbai (Office)');
                  setAccuracy(3);
                }}
              >
                <span className="saved-address-title">🏢 Work</span>
                <span className="saved-address-value">Bandra Kurla Complex</span>
              </div>
              <div 
                className={`saved-address-card ${savedAddressActive === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setSavedAddressActive('home');
                  setUserPos({ x: 250, y: 120 });
                  setAddress('450 Federal St, Boston, MA (Home)');
                  setAccuracy(4);
                }}
              >
                <span className="saved-address-title">🏠 Home</span>
                <span className="saved-address-value">Federal St, Boston</span>
              </div>
              <div 
                className={`saved-address-card ${savedAddressActive === 'highway' ? 'active' : ''}`}
                onClick={() => {
                  setSavedAddressActive('highway');
                  setUserPos({ x: 300, y: 220 });
                  setAddress('Milestone 42 Expressway, Mumbai (Highway)');
                  setAccuracy(5);
                }}
              >
                <span className="saved-address-title">🛣️ Highway Route</span>
                <span className="saved-address-value">Mumbai Express Highway</span>
              </div>
            </div>
          </div>

          {/* Stepper Footer Buttons */}
          <div className="wizard-footer-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveDashboardTab('home')}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setStep(2)}
              style={{ padding: '0.75rem 2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Next: Vehicle Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 2: VEHICLE DETAILS
          ========================================== */}
      {step === 2 && (
        <div className="wizard-card animate-slide-up">
          <div className="wizard-card-header">
            <h2 className="wizard-card-title" style={{ textAlign: 'left', margin: 0 }}>
              🚗 Select Vehicle Specifications
            </h2>
            <p className="wizard-card-subtitle">
              Verify your model details. This matches the correct mechanical dispatchers carrying correct replacement components.
            </p>
          </div>

          {/* Selection Grid */}
          <div className="vehicle-types-grid">
            {(['car', 'bike', 'suv', 'truck', 'ev'] as const).map(type => (
              <div 
                key={type}
                className={`vehicle-type-card ${vehicleType === type ? 'active' : ''}`}
                onClick={() => setVehicleType(type)}
              >
                <div className="vehicle-icon-wrapper">
                  {type === 'car' && '🚗'}
                  {type === 'bike' && '🏍️'}
                  {type === 'suv' && '🚙'}
                  {type === 'truck' && '🚛'}
                  {type === 'ev' && '⚡'}
                </div>
                <span className="vehicle-type-label">
                  {type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Form details */}
          <div className="vehicle-form-grid">
            <div className="form-group">
              <label className="form-label">Brand / Manufacturer</label>
              <input 
                type="text"
                placeholder="e.g. Tesla, Toyota, Honda"
                className="form-input"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model Name</label>
              <input 
                type="text"
                placeholder="e.g. Model 3, RAV4, Civic"
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Plate Number</label>
              <input 
                type="text"
                placeholder="e.g. MH-12-RR-7777"
                className="form-input"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fuel System Type</label>
              <select 
                className="form-input"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
              >
                <option value="Petrol">Petrol / Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG / LPG Gas</option>
                <option value="Electric">Electric Vehicle Battery</option>
                <option value="Hybrid">Hybrid Engine</option>
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="wizard-footer-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button 
              className="btn btn-primary"
              disabled={!brand || !model || !regNum}
              onClick={() => setStep(3)}
              style={{ padding: '0.75rem 2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Next: Issue Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 3: SELECT PROBLEM & DESCRIPTION
          ========================================== */}
      {step === 3 && (
        <div className="wizard-card animate-slide-up">
          <div className="wizard-card-header">
            <h2 className="wizard-card-title" style={{ textAlign: 'left', margin: 0 }}>
              🔧 What Issue are you Experiencing?
            </h2>
            <p className="wizard-card-subtitle">
              Select the primary fault. Snap images or describe the situation for AI diagnostic estimation.
            </p>
          </div>

          {/* Problem Cards Grid */}
          <div className="problems-grid">
            {[
              { name: 'Flat Tire', icon: '🛞' },
              { name: 'Battery Dead', icon: '🔋' },
              { name: 'Fuel Empty', icon: '⛽' },
              { name: 'Engine Failure', icon: '⚙️' },
              { name: 'Overheating', icon: '🌡️' },
              { name: 'Brake Issue', icon: '🛑' },
              { name: 'Locked Out', icon: '🔑' },
              { name: 'Accident', icon: '💥' },
              { name: 'Towing Required', icon: '🪝' },
              { name: 'Electrical Problem', icon: '⚡' },
              { name: 'Other', icon: '❓' }
            ].map(prob => (
              <div 
                key={prob.name}
                className={`problem-card ${problem === prob.name ? 'active' : ''}`}
                onClick={() => handleProblemSelect(prob.name)}
              >
                <div className="problem-icon-wrapper">
                  <span style={{ fontSize: '1.4rem' }}>{prob.icon}</span>
                </div>
                <span className="problem-label">{prob.name}</span>
              </div>
            ))}
          </div>

          {/* Description Textarea with simulated voice assistant */}
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Describe what happened...</label>
              <span className="character-counter">{description.length} / 500 characters</span>
            </div>
            
            <textarea 
              rows={4}
              maxLength={500}
              placeholder="Provide context (e.g. noise occurred, vehicle position)..."
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            
            {/* Simulated Voice to Text Bar */}
            <div className="voice-assistant-bar" onClick={startVoiceRecording}>
              <div className={`voice-btn-mic ${isRecording ? 'recording' : ''}`}>
                <Mic size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                  {isRecording ? 'Listening & transcribing...' : 'One-Tap Voice Assistant'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {isRecording ? 'Speak clearly into your microphone' : 'Tap to dictate issue automatically using speech AI'}
                </span>
              </div>
              {isRecording && (
                <div className="voice-waveform-animation" style={{ marginLeft: 'auto' }}>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                  <div className="voice-wave-bar"></div>
                </div>
              )}
            </div>
          </div>

          {/* Drag and Drop Image Uploader */}
          <div className="form-group">
            <label className="form-label">Upload Fault Images (Optional)</label>
            <div className="image-uploader-zone" onClick={() => document.getElementById('wizard-file-input')?.click()}>
              <input 
                type="file" 
                id="wizard-file-input"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <div className="image-uploader-icon">
                <Upload size={22} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Drag & drop images here or browse files</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Support PNG, JPG, JPEG up to 10MB</span>
            </div>

            {/* AI Diagnostics Info alert */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              background: 'var(--primary-glow)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--primary-glow)',
              fontSize: '0.8rem',
              color: 'var(--primary)',
              fontWeight: 700
            }}>
              <Sparkles size={18} className="animate-pulse" />
              <span>AI Engine: Uploading images triggers diagnostic fault calculations automatically.</span>
            </div>

            {/* Upload Previews */}
            {uploadedImages.length > 0 && (
              <div className="image-previews-row">
                {uploadedImages.map((src, index) => (
                  <div key={index} className="image-preview-card">
                    <img src={src} className="image-preview-img" alt="Upload preview" />
                    <button className="image-preview-remove" onClick={(e) => { e.stopPropagation(); removeUploadedImage(index); }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="wizard-footer-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setStep(2)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button 
              className="btn btn-primary"
              disabled={!description.trim()}
              onClick={() => setStep(4)}
              style={{ padding: '0.75rem 2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Next: AI Diagnostics</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 4: AI SMART DIAGNOSIS
          ========================================== */}
      {step === 4 && (
        <div className="wizard-card ai-diagnosis-card animate-slide-up">
          {aiLoading && <div className="ai-scanner-glow"></div>}

          <div className="wizard-card-header">
            <h2 className="wizard-card-title" style={{ textAlign: 'left', margin: 0, color: 'var(--primary)' }}>
              🤖 AI Diagnostic Diagnosis & Safety Protocols
            </h2>
            <p className="wizard-card-subtitle">
              Analyzing text descriptions and metadata to prepare mechanic dispatch parameters...
            </p>
          </div>

          {aiLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '3rem 1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid var(--primary-glow)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'block', color: 'var(--primary)' }}>
                  ROADRESCUE NEURAL CORE SCANNING...
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Mapping fault patterns against 48,000 manufacturer manuals
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Main Info Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--light-bg)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="ai-stat-label">AI Suspected Issue</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{aiReport.issue}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="ai-stat-label">AI MATCH CONFIDENCE</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 900, fontSize: '1.2rem' }}>{aiReport.confidence}% Accurate</span>
                </div>
              </div>

              {/* Stats Card grid */}
              <div className="ai-stat-row">
                <div className="ai-stat-card">
                  <span className="ai-stat-label">Estimated Price</span>
                  <span className="ai-stat-val" style={{ color: 'var(--success)' }}>{aiReport.cost}</span>
                </div>
                <div className="ai-stat-card">
                  <span className="ai-stat-label">Repair/Diagnostic Duration</span>
                  <span className="ai-stat-val">{aiReport.time}</span>
                </div>
                <div className="ai-stat-card">
                  <span className="ai-stat-label">Recommended Service Node</span>
                  <span className="ai-stat-val">Verified Mobile</span>
                </div>
              </div>

              {/* Safety Instructions Card */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1.5px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: '0.9rem' }}>
                  <AlertTriangle size={18} />
                  <span>CRITICAL EMERGENCY SAFETY ADVICE:</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {aiReport.safety.map((item: string, idx: number) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>
                      <strong>{item}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirmation SMS check */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <CheckCircle size={14} style={{ color: 'var(--secondary)' }} />
                <span>AI diagnostic parameters successfully attached to emergency dispatch payload.</span>
              </div>

            </div>
          )}

          {/* Footer buttons */}
          <div className="wizard-footer-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setStep(3)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button 
              className="btn btn-primary"
              disabled={aiLoading}
              onClick={() => setStep(5)}
              style={{ padding: '0.75rem 2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Next: Match Mechanic</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 5: MECHANICS MATCH & PAYMENT SUMMARY
          ========================================== */}
      {step === 5 && (
        <div className="wizard-card animate-slide-up">
          <div className="wizard-card-header">
            <h2 className="wizard-card-title" style={{ textAlign: 'left', margin: 0 }}>
              💳 Verify Matches & Secure Checkout
            </h2>
            <p className="wizard-card-subtitle">
              Choose the closest mechanic team. Verify pricing and confirm the emergency SOS request dispatch.
            </p>
          </div>

          {/* Mechanics Grid List */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
              MATCHED VERIFIED MECHANICS NEARBY:
            </span>
            <div className="mechanics-carousel-container">
              <div className="mechanics-carousel">
                {mechanics.map(m => (
                  <div 
                    key={m.id}
                    className={`mechanic-match-card ${selectedMechanic.id === m.id ? 'active' : ''}`}
                    onClick={() => setSelectedMechanic(m)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <img src={m.avatar} className="mechanic-avatar-img" alt={m.name} />
                      <div className="verified-badge">
                        <Check size={8} strokeWidth={4} />
                        <span>Verified</span>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.name}</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{m.desc}</p>
                    </div>
                    <div className="mechanic-meta-row">
                      <div className="mechanic-meta-item">
                        <span className="mechanic-meta-lbl">RATING</span>
                        <span className="mechanic-meta-val">⭐ {m.rating} ({m.reviews})</span>
                      </div>
                      <div className="mechanic-meta-item" style={{ alignItems: 'flex-end' }}>
                        <span className="mechanic-meta-lbl">ETA / DISTANCE</span>
                        <span className="mechanic-meta-val" style={{ color: 'var(--primary)' }}>{m.eta}m ({m.distance})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
            {/* Left: Payment Method Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                  SECURE PAYMENT METHOD (STRIPE INVOICING):
                </span>
                <div className="payment-methods-grid">
                  <div 
                    className={`payment-method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                    <span>BHIM UPI</span>
                  </div>
                  <div 
                    className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <span style={{ fontSize: '1.2rem' }}>💳</span>
                    <span>Card</span>
                  </div>
                  <div 
                    className={`payment-method-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('wallet')}
                  >
                    <span style={{ fontSize: '1.2rem' }}>👛</span>
                    <span>Wallet</span>
                  </div>
                  <div 
                    className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                    <span>Cash</span>
                  </div>
                </div>
              </div>

              {/* Short Summary Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--light-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>SOS REQUEST SUMMARY:</span>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textAnchor: 'end', textOverflow: 'ellipsis', maxWidth: '170px' }}>{address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{brand} {model} ({fuelType})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Problem:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>🚨 {problem}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Mechanic:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedMechanic.name}</span>
                </div>
              </div>
            </div>

            {/* Right: Detailed pricing invoice card */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                ESTIMATED PRICING BILL:
              </span>
              <div className="pricing-breakdown-card">
                <div className="pricing-line">
                  <span>Base Service Charge</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{priceBreakdown.service}</span>
                </div>
                <div className="pricing-line">
                  <span>Distance Charge ({selectedMechanic.distance} @ ₹35/km)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{priceBreakdown.dist}</span>
                </div>
                <div className="pricing-line">
                  <span>GST (18%)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{priceBreakdown.tax}</span>
                </div>
                <div className="pricing-line total">
                  <span>Total Estimated Price</span>
                  <span style={{ color: 'var(--primary)' }}>₹{priceBreakdown.total}</span>
                </div>
                
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '1rem', textAlign: 'center' }}>
                  🔒 Secure transaction encrypted via Stripe Protocol. Payments are held in escrow and released only upon verified repair completion.
                </p>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="wizard-footer-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setStep(4)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button 
              className="btn btn-emergency animate-pulse"
              onClick={handleConfirmRequest}
              style={{ padding: '0.75rem 2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)' }}
            >
              <span>🚨 Confirm & Request Assistance</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          SUCCESS OVERLAY MODAL SCREEN
          ========================================== */}
      {step === 6 && (
        <div className="success-screen-overlay">
          {/* Confetti Animation wrapper */}
          <div className="confetti-canvas-container">
            {Array.from({ length: 30 }).map((_, idx) => (
              <div 
                key={idx}
                className="confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#10B981'][Math.floor(Math.random() * 5)],
                  width: `${Math.random() * 8 + 6}px`,
                  height: `${Math.random() * 8 + 6}px`,
                  position: 'absolute',
                  top: '-10px',
                  borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                  animation: `confetti-fall ${Math.random() * 3 + 2}s linear infinite`
                }}
              />
            ))}
          </div>

          <div className="success-badge-animation">
            <div className="success-badge-circle">
              <Check size={48} strokeWidth={3} className="animate-pulse" />
            </div>
          </div>

          <div>
            <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Emergency Rescue Active!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
              Your roadside dispatch request has been successfully broadcast. Assigned responder is locking down coordinates.
            </p>
          </div>

          {/* Details Card */}
          <div className="success-detail-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.75rem' }}>REQUEST TRANSACTION ID</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.8rem' }}>#RR-5928-AI</span>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', textAlign: 'left', marginBottom: '1.25rem' }}>
              <img src={selectedMechanic.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt={selectedMechanic.name} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedMechanic.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedMechanic.desc}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--light-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>RESPONDER ETA</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>{selectedMechanic.eta} Mins</span>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>ESTIMATED COST</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--success)' }}>₹{priceBreakdown.total}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href={`tel:+919876543210`} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.6rem' }}>
                <Phone size={14} />
                <span>Call Mechanic</span>
              </a>
              <button onClick={() => { setActiveDashboardTab('chat'); setStep(1); }} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.6rem' }}>
                <MessageSquare size={14} />
                <span>Secure Chat</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
            <button 
              className="btn btn-primary"
              onClick={handleCloseSuccess}
              style={{ padding: '0.85rem 2rem', fontWeight: 900, fontSize: '0.95rem', borderRadius: 'var(--radius-pill)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <span>🧭 Track Assistance Real-Time</span>
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancel SOS Dispatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
