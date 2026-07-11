import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Bell, 
  ShieldAlert, 
  Check, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Lock, 
  Copy, 
  Download, 
  Mail, 
  Share2, 
  ChevronRight, 
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

interface CheckoutPageProps {
  checkoutData: {
    requestId: string;
    vehicleType: string;
    vehicleNum: string;
    vehicleModel: string;
    serviceType: string;
    mechanicName: string;
    mechanicRating: number;
    mechanicReviews: number;
    mechanicAvatar: string;
    location: string;
    eta: number;
    distance: string;
    pricing: {
      base: string;
      distance: string;
      tax: string;
      total: string;
    }
  } | null;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export default function CheckoutPage({ checkoutData, onPaymentSuccess, onBack }: CheckoutPageProps) {
  // If no checkout data is passed, provide realistic mock fallback details
  const data = checkoutData || {
    requestId: 'RR-629103',
    vehicleType: 'ev',
    vehicleNum: 'MH-12-RR-2026',
    vehicleModel: 'Tesla Model Y (Red)',
    serviceType: 'Dead Battery Jumpstart',
    mechanicName: 'Apex Auto Recovery',
    mechanicRating: 4.9,
    mechanicReviews: 142,
    mechanicAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100',
    location: 'Bandra Kurla Complex, Mumbai',
    eta: 8,
    distance: '1.2 mi',
    pricing: {
      base: '49.00',
      distance: '6.60',
      tax: '10.00',
      total: '65.60'
    }
  };

  /* --- Coupon & Offers state --- */
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0); // in dollars
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');

  const couponsList = [
    { code: 'FIRSTRESCUE', discount: 10, label: '10% First Time User Discount' },
    { code: 'VIPGOLD', discount: 15, label: '15% Gold Member Discount' },
    { code: 'SAFETYFIRST', discount: 5, label: '$5.00 Flat Road Safety Discount' }
  ];

  /* --- Checkout Step status states --- */
  const [paymentStatus, setPaymentStatus] = useState<'checkout' | 'processing' | 'success' | 'failed'>('checkout');
  const [processingLog, setProcessingLog] = useState('Establishing connection...');
  const [processingProgress, setProcessingProgress] = useState(0);

  /* --- Selected Method --- */
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'wallet' | 'applepay' | 'cash'>('card');

  /* --- Credit Card Inputs --- */
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'generic'>('generic');

  /* --- UPI Timer state --- */
  const [upiTimer, setUpiTimer] = useState(300); // 5 mins in seconds
  const [copiedUpi, setCopiedUpi] = useState(false);

  /* --- Quick Feedback stars --- */
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  /* --- Smart Notification list --- */
  const [checkoutNotifications, setCheckoutNotifications] = useState<string[]>([]);

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    
    // Group in 4s
    for (let i = 0; i < rawValue.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formattedValue += ' ';
      formattedValue += rawValue[i];
    }
    setCardNumber(formattedValue);

    // Detect card brand
    if (rawValue.startsWith('4')) {
      setCardBrand('visa');
    } else if (rawValue.startsWith('5')) {
      setCardBrand('mastercard');
    } else if (rawValue.startsWith('3')) {
      setCardBrand('amex');
    } else {
      setCardBrand('generic');
    }
  };

  // Format Card Expiry (MM/YY)
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    
    if (rawValue.length > 0) {
      formattedValue += rawValue.slice(0, 2);
      if (rawValue.length > 2) {
        formattedValue += '/' + rawValue.slice(2, 4);
      }
    }
    setCardExpiry(formattedValue);
  };

  // Apply Promo Codes
  const handleApplyCoupon = (code: string) => {
    const matched = couponsList.find(c => c.code === code.toUpperCase().trim());
    if (matched) {
      const baseTotal = parseFloat(data.pricing.total);
      let calculatedDiscount = 0;
      
      if (matched.code === 'SAFETYFIRST') {
        calculatedDiscount = 5.00;
      } else {
        calculatedDiscount = parseFloat((baseTotal * (matched.discount / 100)).toFixed(2));
      }
      
      setCouponDiscount(calculatedDiscount);
      setAppliedCoupon(matched.code);
      setCouponMessage(`✓ Coupon '${matched.code}' applied: saved $${calculatedDiscount.toFixed(2)}`);
      setCouponError('');
      addSmartNotification(`Coupon code ${matched.code} applied successfully! Saved $${calculatedDiscount.toFixed(2)}`);
    } else {
      setCouponError("Invalid promo code. Please check spelling.");
      setCouponMessage('');
    }
  };

  // Calculate pricing values
  const getPayableTotal = () => {
    const originalTotal = parseFloat(data.pricing.total);
    const final = Math.max(0, originalTotal - couponDiscount);
    return final.toFixed(2);
  };

  // UPI Countdown Timer
  useEffect(() => {
    if (selectedMethod !== 'upi' || paymentStatus !== 'checkout') return;
    
    const interval = setInterval(() => {
      setUpiTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedMethod, paymentStatus]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("roadrescue@yesbank");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
    addSmartNotification("UPI VPA copied to clipboard");
  };

  // Trigger loading screen and simulate secure payment clear
  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing');
    setProcessingProgress(0);
    
    const logs = [
      "Establishing 256-bit SSL secure socket handshake...",
      "Verifying 3D-Secure authentication protocols...",
      "Requesting authorization from issuing card banks...",
      "Clearing escrow reserve clearing house gates...",
      "Verifying transaction signatures via PCI-DSS node...",
      "Payment captured successfully! Initializing dispatches..."
    ];
    
    let currentLogIdx = 0;
    setProcessingLog(logs[0]);
    
    const timer = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          // 85% success chance, 15% fail chance to satisfy "Failed screen" requirement
          const isSuccess = Math.random() > 0.15;
          setTimeout(() => {
            if (isSuccess) {
              setPaymentStatus('success');
              addSmartNotification("Payment Successful! Invoice generated.");
              addSmartNotification(`Technician ${data.mechanicName} dispatched.`);
            } else {
              setPaymentStatus('failed');
              addSmartNotification("Transaction aborted by bank authorization system.");
            }
          }, 400);
          return 100;
        }
        
        const nextProgress = prev + 5;
        // Cycle logs based on progress intervals
        const logIndex = Math.floor((nextProgress / 100) * logs.length);
        if (logIndex < logs.length && logIndex !== currentLogIdx) {
          currentLogIdx = logIndex;
          setProcessingLog(logs[logIndex]);
        }
        
        return nextProgress;
      });
    }, 120);
  };

  // Smart notification banners creator
  const addSmartNotification = (text: string) => {
    setCheckoutNotifications(prev => [text, ...prev].slice(0, 3));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--light-bg)', paddingBottom: '3rem', position: 'relative' }}>
      
      {/* SMART ALERT NOTIFICATION DRAWER */}
      <div style={{ position: 'fixed', top: '90px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '300px', pointerEvents: 'none' }}>
        {checkoutNotifications.map((note, index) => (
          <div 
            key={index}
            className="animate-slide-up"
            style={{ 
              background: 'var(--glass-bg)', 
              backdropFilter: 'var(--glass-blur)', 
              border: '1px solid var(--glass-border)', 
              padding: '0.6rem 0.85rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              boxShadow: 'var(--shadow-md)',
              borderLeft: '4px solid var(--secondary)',
              color: 'var(--text-primary)',
              fontWeight: 700
            }}
          >
            🔔 {note}
          </div>
        ))}
      </div>

      {/* 1. TOP STICKY NAVIGATION BAR */}
      <header className="navbar-header scrolled" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container navbar-container">
          
          <button 
            onClick={onBack} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          
          <div className="navbar-logo">
            <span style={{ fontSize: '1.4rem', marginRight: '0.25rem' }}>🚨</span>
            <span style={{ color: 'var(--primary)' }}>Road</span>
            <span>Rescue AI</span>
            
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              background: 'rgba(34, 197, 94, 0.08)', 
              border: '1px solid rgba(34, 197, 94, 0.2)',
              color: 'var(--secondary)', 
              fontSize: '0.65rem', 
              padding: '2px 8px', 
              borderRadius: '99px',
              fontWeight: 800,
              marginLeft: '0.75rem'
            }}>
              <ShieldCheck size={10} /> Secure SSL checkout
            </div>
          </div>

          <div className="navbar-actions">
            <button className="theme-toggle-btn" title="Emergency Help Line">
              <Bell size={18} />
            </button>
            <button 
              onClick={() => alert("SOS dispatch coordinates relayed directly to local highway patrol.")}
              className="btn btn-emergency"
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              🚨 SOS
            </button>
          </div>

        </div>
      </header>

      {/* ==========================================================================
          STATE 1: STANDARD CHECKOUT INTERFACE
          ========================================================================== */}
      {paymentStatus === 'checkout' && (
        <main className="container" style={{ marginTop: '2rem' }}>
          
          {/* HERO BANNER SECTION */}
          <div className="db-welcome-banner" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', background: 'radial-gradient(circle at 100% 0%, rgba(37,99,235,0.06) 0%, transparent 40%)' }}>
            <div style={{ maxWidth: '650px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.25rem', textAlign: 'left' }}>Complete Your Booking Securely</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Review booking telemetry details, select a verified payment provider, and clear payments to trigger dispatches.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {['🔒 PCI DSS Compliant', '🛡️ SSL 256-bit Encrypted', '💳 Instant Clearing', '🤝 Escrow Escrow Protection'].map((badge) => (
                <div key={badge} style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--light-surface)', border: '1px solid var(--border-light)', padding: '4px 10px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CHECKOUT GRID CONTENT */}
          <div className="checkout-main-grid">
            
            {/* LEFT COLUMN: PAYMENT METHOD SELECTORS & FORMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Payment Methods selector tabs */}
              <div className="ai-glass-panel">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  💳 Choose Payment Method
                </h3>
                
                <div className="payment-selector-grid" style={{ marginBottom: '1.5rem' }}>
                  <div 
                    className={`payment-method-selector-btn ${selectedMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('card')}
                  >
                    <CreditCard size={20} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Card Payment</span>
                  </div>
                  
                  <div 
                    className={`payment-method-selector-btn ${selectedMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('upi')}
                  >
                    <Smartphone size={20} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>UPI Apps</span>
                  </div>
                  
                  <div 
                    className={`payment-method-selector-btn ${selectedMethod === 'applepay' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('applepay')}
                  >
                    <Wallet size={20} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Apple Pay</span>
                  </div>
                  
                  <div 
                    className={`payment-method-selector-btn ${selectedMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setSelectedMethod('cash')}
                  >
                    <Smartphone size={20} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Cash after rescue</span>
                  </div>
                </div>

                {/* TAB OPTION 1: CREDIT CARD FORM WITH DYNAMIC PREVIEW */}
                {selectedMethod === 'card' && (
                  <form onSubmit={handlePay} className="animate-slide-up">
                    
                    {/* Visual 3D Credit Card Graphics */}
                    <div className={`checkout-card-wrapper ${isCardFlipped ? 'flipped' : ''}`}>
                      <div className="checkout-card-body">
                        
                        {/* Front Face */}
                        <div className="checkout-card-face checkout-card-front">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="checkout-card-chip"></div>
                            <span className="checkout-card-logo">
                              {cardBrand === 'visa' && '🔵 VISA'}
                              {cardBrand === 'mastercard' && '🔴 MASTERCARD'}
                              {cardBrand === 'amex' && '⭐ AMEX'}
                              {cardBrand === 'generic' && '💳 SECURE'}
                            </span>
                          </div>
                          
                          <div className="checkout-card-number">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <div className="checkout-card-label">Card Holder</div>
                              <div className="checkout-card-val" style={{ textTransform: 'uppercase' }}>
                                {cardHolder || 'DISHA'}
                              </div>
                            </div>
                            <div>
                              <div className="checkout-card-label">Expires</div>
                              <div className="checkout-card-val">
                                {cardExpiry || 'MM/YY'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Back Face (flipped) */}
                        <div className="checkout-card-face checkout-card-back">
                          <div className="checkout-card-strip"></div>
                          <div>
                            <div className="checkout-card-label" style={{ textAlign: 'right', paddingRight: '1rem' }}>CCV Signature</div>
                            <div className="checkout-card-signature">
                              <span>Disha Signature</span>
                              <span className="checkout-card-cvv-box">{cardCvv || '•••'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748b' }}>
                            <span>Authorised Signature • Not Transferable</span>
                            <span>PCI DSS Secure</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Form Input fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="auth-input-group active">
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CARDHOLDER NAME</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Disha" 
                          className="auth-input-field"
                          style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '1rem' }}
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                        />
                      </div>

                      <div className="auth-input-group active">
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CREDIT CARD NUMBER</label>
                        <input 
                          type="text" 
                          required
                          maxLength={19}
                          placeholder="e.g. 4111 2222 3333 4444" 
                          className="auth-input-field"
                          style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '1rem' }}
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="auth-input-group active">
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>EXPIRY DATE</label>
                          <input 
                            type="text" 
                            required
                            maxLength={5}
                            placeholder="MM/YY" 
                            className="auth-input-field"
                            style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '1rem' }}
                            value={cardExpiry}
                            onChange={handleCardExpiryChange}
                          />
                        </div>

                        <div className="auth-input-group active">
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CVV CODE</label>
                          <input 
                            type="password" 
                            required
                            maxLength={4}
                            placeholder="•••" 
                            className="auth-input-field"
                            style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '1rem' }}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            onFocus={() => setIsCardFlipped(true)}
                            onBlur={() => setIsCardFlipped(false)}
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ padding: '0.85rem', width: '100%', fontSize: '0.95rem', fontWeight: 900, borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}
                      >
                        🔒 Pay Securely ${getPayableTotal()}
                      </button>
                    </div>

                  </form>
                )}

                {/* TAB OPTION 2: UPI PAYMENT APP VIEW */}
                {selectedMethod === 'upi' && (
                  <div className="animate-slide-up" style={{ textAlign: 'center' }}>
                    <div style={{ margin: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan QR code from any banking app</span>
                    </div>

                    {/* QR Code Container */}
                    <div className="upi-qr-box" style={{ marginBottom: '1.25rem' }}>
                      <div className="upi-qr-border">
                        <svg viewBox="0 0 100 100" style={{ width: '110px', height: '110px' }}>
                          {/* Standard QR Code Vector graphic layout */}
                          <rect width="100" height="100" fill="transparent" />
                          <rect x="0" y="0" width="25" height="25" fill="var(--text-primary)" />
                          <rect x="5" y="5" width="15" height="15" fill="white" />
                          <rect x="8" y="8" width="9" height="9" fill="var(--text-primary)" />

                          <rect x="75" y="0" width="25" height="25" fill="var(--text-primary)" />
                          <rect x="75" y="5" width="15" height="15" fill="white" />
                          <rect x="78" y="8" width="9" height="9" fill="var(--text-primary)" />

                          <rect x="0" y="75" width="25" height="25" fill="var(--text-primary)" />
                          <rect x="5" y="75" width="15" height="15" fill="white" />
                          <rect x="8" y="78" width="9" height="9" fill="var(--text-primary)" />

                          {/* Scatter random dots representing key hashes */}
                          <rect x="35" y="5" width="10" height="5" fill="var(--text-primary)" />
                          <rect x="40" y="15" width="15" height="10" fill="var(--text-primary)" />
                          <rect x="60" y="5" width="5" height="15" fill="var(--text-primary)" />
                          
                          <rect x="30" y="30" width="40" height="40" fill="var(--text-primary)" />
                          <rect x="35" y="35" width="15" height="15" fill="white" />
                          <rect x="55" y="50" width="10" height="15" fill="white" />
                          <rect x="40" y="55" width="10" height="5" fill="white" />
                          
                          <rect x="75" y="35" width="15" height="5" fill="var(--text-primary)" />
                          <rect x="85" y="45" width="10" height="15" fill="var(--text-primary)" />
                          <rect x="80" y="70" width="15" height="10" fill="var(--text-primary)" />
                          <rect x="35" y="80" width="20" height="15" fill="var(--text-primary)" />
                        </svg>
                      </div>
                      
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, marginTop: '0.75rem', color: 'var(--primary)' }}>
                        ORDER TOTAL: ${getPayableTotal()}
                      </span>
                    </div>

                    {/* Timer Countdown */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Session expires in:</span>
                      <strong style={{ color: upiTimer < 60 ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'monospace' }}>
                        ⏱️ {formatTimer(upiTimer)}
                      </strong>
                    </div>

                    {/* VPA address copy */}
                    <div style={{ border: '1px solid var(--border-light)', padding: '0.6rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '280px', margin: '0 auto 1.5rem auto', fontSize: '0.8rem', background: 'var(--light-surface)' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', textAlign: 'left' }}>UPI ID</span>
                        <strong style={{ color: 'var(--text-primary)' }}>roadrescue@yesbank</strong>
                      </div>
                      <button 
                        onClick={handleCopyUpi}
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'flex', gap: '0.25rem' }}
                      >
                        <Copy size={12} /> {copiedUpi ? "Copied" : "Copy"}
                      </button>
                    </div>

                    {/* Fake Trigger payment success from UPI */}
                    <button 
                      onClick={handlePay}
                      className="btn btn-primary"
                      style={{ padding: '0.85rem 2rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      Simulate Secure Payment Complete
                    </button>
                  </div>
                )}

                {/* TAB OPTION 3: APPLE PAY */}
                {selectedMethod === 'applepay' && (
                  <div className="animate-slide-up" style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ display: 'flex', justifySelf: 'center', width: '220px', height: '48px', background: 'black', color: 'white', borderRadius: '6px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }} onClick={handlePay}>
                      <span>🍏 Pay with Apple Pay</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '1rem' }}>
                      Instantly pay using cards saved on your Apple ID account securely.
                    </span>
                  </div>
                )}

                {/* TAB OPTION 4: CASH AFTER SERVICE */}
                {selectedMethod === 'cash' && (
                  <div className="animate-slide-up" style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.04)', border: '1.5px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', color: '#d97706', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                      <AlertTriangle size={18} />
                      <span>Note on Cash payments:</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      Selecting Cash will dispatch the mechanic immediately. However, an offline booking processing convenience charge of <strong>$5.00</strong> will be added to the final invoice, collected by the driver.
                    </p>
                    <button 
                      onClick={handlePay}
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
                    >
                      Confirm Booking (Pay Cash to Mechanic)
                    </button>
                  </div>
                )}

              </div>

              {/* OFFERS & INTERACTIVE COUPON CODE APPLY */}
              <div className="ai-glass-panel">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  🎁 Coupons & Cashback Offers
                </h3>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Promo Code (e.g. VIPGOLD)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="auth-input-field"
                    style={{ height: '36px', fontSize: '0.85rem', paddingLeft: '0.75rem', textTransform: 'uppercase' }}
                  />
                  <button 
                    onClick={() => handleApplyCoupon(couponCode)}
                    className="btn btn-primary"
                    style={{ padding: '0 1rem', fontSize: '0.8rem' }}
                  >
                    Apply
                  </button>
                </div>

                {/* Feedback notices */}
                {couponMessage && <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.75rem' }}>{couponMessage}</div>}
                {couponError && <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.75rem' }}>{couponError}</div>}

                {/* Available lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {couponsList.map(c => (
                    <div 
                      key={c.code}
                      onClick={() => { setCouponCode(c.code); handleApplyCoupon(c.code); }}
                      style={{ border: '1px dashed var(--border-light)', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', cursor: 'pointer', background: appliedCoupon === c.code ? 'rgba(34,197,94,0.04)' : 'transparent' }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{c.code}</span>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.label}</span>
                      </div>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Apply →</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRUST SECURITY SECTION */}
              <div style={{ display: 'flex', justifySelf: 'center', alignItems: 'center', gap: '0.75rem', opacity: 0.6, fontSize: '0.75rem', margin: '0.5rem 0' }}>
                <Lock size={12} />
                <span>256-bit SSL Escrow Encrypted and Certified by PCI security councils.</span>
              </div>

            </div>

            {/* RIGHT COLUMN: BOOKING SUMMARY & transparent BILL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* BOOKING SUMMARY CARD */}
              <div className="ai-glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>📋 Booking Details</h3>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>ID: {data.requestId}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Mechanic details block */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <img 
                      src={data.mechanicAvatar} 
                      alt={data.mechanicName} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)' }}>{data.mechanicName}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⭐ {data.mechanicRating} ({data.mechanicReviews} reviews)</span>
                    </div>
                  </div>

                  {/* Summary details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vehicle Type:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{data.vehicleType} ({data.vehicleNum})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Model:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{data.vehicleModel}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Service Requested:</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>🚨 {data.serviceType}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Destination ETA:</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>⚡ {data.eta} mins ({data.distance})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>GPS Coordinates:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '170px' }}>{data.location}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* PRICING BREAKDOWN CARD */}
              <div className="ai-glass-panel">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>💰 Invoice Billing</h3>
                
                <div className="checkout-invoice-box">
                  <div className="checkout-invoice-line">
                    <span>Base Mobilization Charge</span>
                    <span>${data.pricing.base}</span>
                  </div>
                  
                  <div className="checkout-invoice-line">
                    <span>Distance dispatch fee ({data.distance})</span>
                    <span>${data.pricing.distance}</span>
                  </div>
                  
                  <div className="checkout-invoice-line">
                    <span>GST & Regional Taxes</span>
                    <span>${data.pricing.tax}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="checkout-invoice-line" style={{ color: 'var(--secondary)' }}>
                      <span>Promo Discount ({appliedCoupon})</span>
                      <span>-${couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="checkout-invoice-line total">
                    <span>Payable Amount</span>
                    <span style={{ color: 'var(--primary)' }}>${getPayableTotal()}</span>
                  </div>
                </div>
              </div>

              {/* INVOICE PREVIEW & EXPORTS */}
              <div className="ai-glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  📄 Invoice Exports
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <button 
                    onClick={() => {
                      alert("Invoice PDF downloaded successfully.");
                      addSmartNotification("Invoice PDF saved to downloads");
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Download size={12} /> Save PDF
                  </button>
                  
                  <button 
                    onClick={() => {
                      alert(`Billing invoice receipt emailed to disha@roadrescue.ai`);
                      addSmartNotification("Billing invoice sent to email");
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Mail size={12} /> Email Invoice
                  </button>
                </div>
              </div>

            </div>

          </div>
          
          {/* Mobile Bottom sticky button */}
          <div className="checkout-mobile-drawer">
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textAlign: 'left' }}>AMOUNT DUE</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>${getPayableTotal()}</strong>
            </div>
            <button 
              onClick={handlePay}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-pill)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}
            >
              <span>Secure checkout</span> <ChevronRight size={14} />
            </button>
          </div>

        </main>
      )}

      {/* ==========================================================================
          STATE 2: SECURE LOADING VERIFICATION PROGRESS MODAL
          ========================================================================== */}
      {paymentStatus === 'processing' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div className="glass-card" style={{ width: '380px', padding: '2.5rem 2rem', textAlign: 'center', background: 'var(--light-bg)' }}>
            
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem auto' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-light)" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - processingProgress} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="var(--primary)" className="animate-pulse" />
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Secure Processing</h3>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', minHeight: '38px', lineHeight: 1.4 }}>
              {processingLog}
            </div>
            
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Do not close window or refresh page
            </span>

          </div>
        </div>
      )}

      {/* ==========================================================================
          STATE 3: PAYMENT SUCCESS CONFIRMATION OVERLAY SCREEN
          ========================================================================== */}
      {paymentStatus === 'success' && (
        <main className="container animate-slide-up" style={{ marginTop: '3rem', maxWidth: '580px' }}>
          
          <div className="ai-glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.06) 0%, transparent 70%)' }}>
            
            {/* Pulsing Green checkmark */}
            <div className="success-checkmark-wrapper">
              <Check className="success-check-scale" size={40} strokeWidth={3} />
            </div>
            
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Payment Successful!</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your booking has been secured. Jumper kit dispatches have been triggered to your GPS coordinates.
            </p>

            {/* Receipt Summary Card */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', background: 'var(--light-surface)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction Reference ID:</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>TXN-RR-{Math.floor(10000000 + Math.random() * 90000000)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Amount Paid:</span>
                <strong style={{ color: 'var(--secondary)' }}>${getPayableTotal()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Mechanic:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{data.mechanicName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Time of Arrival:</span>
                <strong style={{ color: 'var(--primary)' }}>⚡ {data.eta} minutes ({data.distance})</strong>
              </div>
            </div>

            {/* QUICK STAR FEEDBACK RATING */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              {feedbackSubmitted ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>
                  ✓ Feedback submitted. Thank you for helping us stay safe!
                </div>
              ) : (
                <div className="animate-slide-up">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>
                    How was your checkout experience?
                  </span>
                  
                  <div className="feedback-stars-row" style={{ marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`feedback-star-btn ${feedbackRating >= star ? 'active' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea 
                    placeholder="Tell us what we did well, or where we can improve..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="chatbot-input"
                    style={{ minHeight: '60px', padding: '0.5rem', fontSize: '0.8rem', width: '100%', border: '1px solid var(--border-light)', borderRadius: '6px', marginBottom: '0.75rem', resize: 'none' }}
                  />

                  <button 
                    onClick={() => {
                      setFeedbackSubmitted(true);
                      addSmartNotification("Feedback response logged");
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 1rem' }}
                  >
                    Submit Feedback
                  </button>
                </div>
              )}
            </div>

            {/* Redirect / Share Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={onPaymentSuccess}
                className="btn btn-primary"
                style={{ padding: '0.85rem', fontWeight: 900, fontSize: '0.95rem', width: '100%', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                🗺️ Track My Mechanic Live
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button 
                  onClick={() => alert("Invoice PDF downloaded successfully.")}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem', fontSize: '0.8rem', gap: '0.25rem', justifyContent: 'center' }}
                >
                  <Download size={14} /> Download Receipt
                </button>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`RoadRescue AI Booking: Assigned ${data.mechanicName}. ETA ${data.eta} min.`);
                    alert("Share link copied to clipboard");
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem', fontSize: '0.8rem', gap: '0.25rem', justifyContent: 'center' }}
                >
                  <Share2 size={14} /> Share Booking
                </button>
              </div>
            </div>

          </div>

        </main>
      )}

      {/* ==========================================================================
          STATE 4: PAYMENT FAILED SCREEN
          ========================================================================== */}
      {paymentStatus === 'failed' && (
        <main className="container animate-slide-up" style={{ marginTop: '4rem', maxWidth: '480px' }}>
          
          <div className="ai-glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.06) 0%, transparent 70%)' }}>
            
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--accent)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1.25rem' 
            }}>
              <ShieldAlert size={36} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Payment Failed</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your bank declined card verification or authentication failed. The escrow deposit could not clear.
            </p>

            {/* Error reason details */}
            <div style={{ border: '1px solid var(--border-light)', background: 'var(--light-surface)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', textAlign: 'left' }}>
              <AlertCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <strong>Error Reason:</strong> Insufficient balance or bank network timed out. No amount was charged.
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => setPaymentStatus('checkout')}
                className="btn btn-primary"
                style={{ padding: '0.75rem', width: '100%', fontSize: '0.85rem' }}
              >
                🔄 Retry Payment
              </button>
              
              <button 
                onClick={() => { setSelectedMethod('upi'); setPaymentStatus('checkout'); }}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', width: '100%', fontSize: '0.85rem' }}
              >
                📱 Change to UPI Method
              </button>
              
              <a href="tel:+1800555SOSAI" className="btn btn-secondary" style={{ padding: '0.75rem', width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}>
                📞 Contact Support Hotline
              </a>
            </div>

          </div>

        </main>
      )}

    </div>
  );
}
