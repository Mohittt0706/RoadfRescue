import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Briefcase, MapPin, Clock, Check, X, Phone, MessageCircle, Navigation,
  ChevronRight, Locate, Maximize2, Send, Wrench, Car, Timer, DollarSign,
  Star, AlertTriangle, Zap, Camera, Upload, FileText, Bot, Shield, CheckCircle,
  Image, Truck, TrendingUp, ArrowUpRight, RotateCcw
} from 'lucide-react';
import '../active-jobs.css';
import { BookingStore, NotificationStore } from '../services/store';

interface ActiveJobsPageProps {
  onBack: () => void;
}

type JobStatus = 'accepted' | 'driving' | 'arrived' | 'repairing' | 'completed';

interface Job {
  id: string;
  customer: string;
  initials: string;
  avatarColor: string;
  phone: string;
  vehicle: string;
  vehicleType: string;
  plate: string;
  serviceType: string;
  issue: string;
  description: string;
  address: string;
  distance: string;
  eta: string;
  status: JobStatus;
  earnings: number;
  baseFee: number;
  distanceCharge: number;
  emergencyFee: number;
  bonus: number;
  tip: number;
  progress: number;
  checklist: { label: string; done: boolean }[];
  aiSeverity: string;
  aiRepairTime: string;
  aiTools: string;
  aiParts: string;
  aiConfidence: number;
}

interface TimelineStage {
  label: string;
  time: string;
  status: 'done' | 'active' | 'pending';
}

const initialJobs: Job[] = [
  {
    id: 'j1', customer: 'Sarah Chen', initials: 'SC', avatarColor: '#EC4899', phone: '+1 (415) 555-0123',
    vehicle: 'Honda Civic 2022', vehicleType: 'Sedan', plate: 'ABC-1234',
    serviceType: 'Tire Repair', issue: 'Flat Tire', description: 'Rear left tire completely flat after hitting a pothole on Highway 101.',
    address: 'Main St & 5th Ave, San Francisco', distance: '3.2 km', eta: '8 min', status: 'driving',
    earnings: 45, baseFee: 30, distanceCharge: 8, emergencyFee: 0, bonus: 5, tip: 2, progress: 35,
    checklist: [
      { label: 'Inspect Vehicle', done: false },
      { label: 'Diagnose Problem', done: false },
      { label: 'Repair Vehicle', done: false },
      { label: 'Replace Parts', done: false },
      { label: 'Test Vehicle', done: false },
      { label: 'Confirm Completion', done: false },
    ],
    aiSeverity: 'Medium', aiRepairTime: '20-30 min', aiTools: 'Jack, Lug Wrench, Tire Gauge',
    aiParts: 'Spare Tire or Patch Kit', aiConfidence: 92,
  },
  {
    id: 'j2', customer: 'James Miller', initials: 'JM', avatarColor: '#2563EB', phone: '+1 (415) 555-0789',
    vehicle: 'Toyota Camry 2021', vehicleType: 'Sedan', plate: 'XYZ-5678',
    serviceType: 'Battery Jump', issue: 'Dead Battery', description: 'Car won\'t start after leaving lights on overnight.',
    address: 'Oak Park Dr, San Francisco', distance: '1.5 km', eta: '3 min', status: 'arrived',
    earnings: 35, baseFee: 25, distanceCharge: 5, emergencyFee: 0, bonus: 0, tip: 5, progress: 55,
    checklist: [
      { label: 'Inspect Vehicle', done: true },
      { label: 'Diagnose Problem', done: true },
      { label: 'Repair Vehicle', done: false },
      { label: 'Replace Parts', done: false },
      { label: 'Test Vehicle', done: false },
      { label: 'Confirm Completion', done: false },
    ],
    aiSeverity: 'Low', aiRepairTime: '10-15 min', aiTools: 'Jump Starter, Multimeter',
    aiParts: 'N/A', aiConfidence: 96,
  },
];

const timeline: TimelineStage[] = [
  { label: 'Request Accepted', time: '10:15 AM', status: 'done' },
  { label: 'Driving to Customer', time: '10:16 AM', status: 'active' },
  { label: 'Arrived at Location', time: '', status: 'pending' },
  { label: 'Inspection Started', time: '', status: 'pending' },
  { label: 'Repair in Progress', time: '', status: 'pending' },
  { label: 'Repair Completed', time: '', status: 'pending' },
  { label: 'Payment Received', time: '', status: 'pending' },
];

const quickReplies = [
  "I'm on my way!",
  "Almost there",
  "I've arrived",
  "Starting repair",
  "All done!"
];

export default function ActiveJobsPage({ onBack }: ActiveJobsPageProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedEarnings, setCompletedEarnings] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ text: string; out: boolean }[]>([
    { text: "Hi! I'm heading to your location now.", out: true },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const userStr = localStorage.getItem('user');
    let email = 'rajesh@roadrescue.in';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.email) email = u.email;
      } catch (e) {}
    }

    const list = BookingStore.getAll()
      .filter((b: any) => b.mechanic_email?.toLowerCase() === email.toLowerCase() && ['Accepted', 'Mechanic Accepted', 'Mechanic Started', 'Mechanic Nearby', 'Arrived', 'In Progress', 'Completed'].includes(b.status))
      .map((b: any) => {
        let status: 'accepted' | 'driving' | 'arrived' | 'repairing' | 'completed' = 'accepted';
        let progress = 20;
        if (b.status === 'Mechanic Accepted' || b.status === 'Accepted') {
          status = 'accepted';
          progress = 20;
        } else if (b.status === 'Mechanic Started') {
          status = 'driving';
          progress = 40;
        } else if (b.status === 'Arrived') {
          status = 'arrived';
          progress = 60;
        } else if (b.status === 'In Progress') {
          status = 'repairing';
          progress = 80;
        } else if (b.status === 'Completed') {
          status = 'completed';
          progress = 100;
        }

        return {
          id: b.id,
          customer: b.customer,
          initials: b.customer.split(' ').map((n: any) => n[0]).join(''),
          avatarColor: '#2563EB',
          phone: b.phone,
          vehicle: b.vehicle,
          vehicleType: 'Sedan',
          plate: b.vehicle_number,
          serviceType: b.service,
          issue: b.service,
          description: b.notes || 'Roadside assistance requested.',
          address: b.address,
          distance: '2.5 km',
          eta: b.eta,
          status,
          earnings: Math.floor((b.price || 0) * 0.8),
          baseFee: Math.floor((b.price || 0) * 0.6),
          distanceCharge: Math.floor((b.price || 0) * 0.1),
          emergencyFee: 0,
          bonus: 0,
          tip: 0,
          progress,
          checklist: [
            { label: 'Inspect Vehicle', done: progress >= 60 },
            { label: 'Diagnose Problem', done: progress >= 60 },
            { label: 'Repair Vehicle', done: progress >= 80 },
            { label: 'Replace Parts', done: progress >= 80 },
            { label: 'Test Vehicle', done: progress >= 100 },
            { label: 'Confirm Completion', done: progress >= 100 },
          ],
          aiSeverity: 'Medium',
          aiRepairTime: '20-30 min',
          aiTools: 'Wrench, Jack',
          aiParts: 'N/A',
          aiConfidence: 94
        };
      });

    setJobs(list);
    if (list.length > 0) {
      setSelectedJob((prev: any) => {
        if (!prev) return list[0];
        const updated = list.find((j: any) => j.id === prev.id);
        return updated || list[0];
      });
    } else {
      setSelectedJob(null);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = BookingStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  /* --- Timer --- */
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  /* --- Chat auto-scroll --- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* --- Handlers --- */
  const handleAdvanceStatus = useCallback((id: string) => {
    const b = BookingStore.getById(id);
    if (!b) return;

    let nextStatus = '';
    if (b.status === 'Mechanic Assigned' || b.status === 'Mechanic Accepted' || b.status === 'Accepted') {
      nextStatus = 'Mechanic Started';
    } else if (b.status === 'Mechanic Started') {
      nextStatus = 'Arrived';
    } else if (b.status === 'Arrived') {
      nextStatus = 'In Progress';
    } else if (b.status === 'In Progress') {
      nextStatus = 'Completed';
      setCompletedEarnings(Math.floor((b.price || 0) * 0.8));
      setTimeout(() => setShowSuccess(true), 500);

      // Create completion notifications
      NotificationStore.create({
        title: '🎉 Service Completed',
        message: `Service for ${b.customer} has been completed successfully.`,
        role: 'admin',
        type: 'alert'
      });
      NotificationStore.create({
        title: '💳 Payment Received',
        message: `Payment of ₹${b.price} received for booking ${id}.`,
        role: 'user',
        type: 'payment'
      });
    }

    if (nextStatus) {
      BookingStore.updateStatus(id, nextStatus);
    }
  }, []);

  const handleToggleCheck = useCallback((jobId: string, checkIdx: number) => {
    // Local-only visual toggle or can stay local since checklist state is derived from progress
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((p) => [...p, { text: chatInput, out: true }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((p) => [...p, { text: "Thanks for the update!", out: false }]);
    }, 1000);
  }, [chatInput]);

  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - rect.left - 75}px`;
    ripple.style.top = `${e.clientY - rect.top - 75}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getStatusLabel = (s: JobStatus) => {
    if (s === 'accepted') return 'Accepted';
    if (s === 'driving') return 'Driving';
    if (s === 'arrived') return 'Arrived';
    if (s === 'repairing') return 'Repairing';
    return 'Completed';
  };

  const getTimelineForJob = (status: JobStatus): TimelineStage[] => {
    const order: JobStatus[] = ['driving', 'arrived', 'repairing', 'completed'];
    const idx = order.indexOf(status);
    const stages = [
      { label: 'Request Accepted', time: '10:15 AM' },
      { label: 'Driving to Customer', time: '10:16 AM' },
      { label: 'Arrived at Location', time: idx >= 1 ? '10:24 AM' : '' },
      { label: 'Inspection Started', time: idx >= 2 ? '10:25 AM' : '' },
      { label: 'Repair in Progress', time: idx >= 2 ? '10:28 AM' : '' },
      { label: 'Repair Completed', time: idx >= 3 ? '10:50 AM' : '' },
      { label: 'Payment Received', time: idx >= 3 ? '10:51 AM' : '' },
    ];
    return stages.map((s, i) => ({
      ...s,
      status: i <= idx ? (i < idx ? 'done' : 'active') : 'pending'
    }));
  };

  const activeJobCount = jobs.filter(j => j.status !== 'completed').length;
  const completedToday = 5;
  const estEarnings = jobs.reduce((sum, j) => sum + j.earnings, 0);

  return (
    <div className="aj-page">
      {/* ===== HERO ===== */}
      <div className="aj-hero">
        <div className="aj-hero-content">
          <h1>Active Jobs</h1>
          <p>Manage your ongoing roadside assistance requests, navigate to customers, update job progress, and complete services efficiently.</p>
          <div className="aj-hero-stats">
            <div className="aj-hero-stat">
              <span className="aj-hero-stat-value">{activeJobCount}</span>
              <span className="aj-hero-stat-label">Active Jobs</span>
            </div>
            <div className="aj-hero-stat">
              <span className="aj-hero-stat-value">{completedToday}</span>
              <span className="aj-hero-stat-label">Completed Today</span>
            </div>
            <div className="aj-hero-stat">
              <span className="aj-hero-stat-value">${estEarnings}</span>
              <span className="aj-hero-stat-label">Est. Earnings</span>
            </div>
            <div className="aj-hero-stat">
              <span className="aj-hero-stat-value">28m</span>
              <span className="aj-hero-stat-label">Avg. Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LAYOUT ===== */}
      <div className="aj-layout">
        {/* LEFT COLUMN */}
        <div className="aj-main-col">
          {jobs.length === 0 ? (
            <div className="aj-empty">
              <div className="aj-empty-icon"><Briefcase size={28} /></div>
              <h3>No active jobs</h3>
              <p>Accept a request from Incoming Requests to start a new job.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="aj-job-card" style={{ animationDelay: job.id === 'j1' ? '0.05s' : '0.15s' }}>
                {/* Top: Customer */}
                <div className="aj-job-top">
                  <div className="aj-job-avatar" style={{ background: job.avatarColor }}>
                    {job.initials}
                    <div className={`aj-job-avatar-status ${job.status}`} />
                  </div>
                  <div className="aj-job-customer-info">
                    <div className="aj-job-customer-name">{job.customer}</div>
                    <div className="aj-job-customer-phone"><Phone size={12} /> {job.phone}</div>
                  </div>
                  <span className={`aj-job-status-badge ${job.status}`}>
                    {job.status === 'completed' ? <CheckCircle size={12} /> : <Navigation size={12} />}
                    {getStatusLabel(job.status)}
                  </span>
                </div>

                {/* Vehicle */}
                <div className="aj-job-vehicle">
                  <div className="aj-vehicle-icon">
                    {job.vehicleType === 'Truck' ? <Truck size={22} /> : <Car size={22} />}
                  </div>
                  <div className="aj-vehicle-info">
                    <div className="aj-vehicle-name">{job.vehicle}</div>
                    <div className="aj-vehicle-plate">{job.plate}</div>
                    <span className="aj-vehicle-type">{job.vehicleType} · {job.serviceType}</span>
                  </div>
                </div>

                {/* Issue */}
                <div className="aj-job-issue">
                  <div className="aj-issue-type">
                    <div className="aj-issue-type-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                      <Wrench size={16} />
                    </div>
                    {job.issue}
                  </div>
                  <p className="aj-issue-desc">{job.description}</p>
                </div>

                {/* Stats */}
                <div className="aj-job-stats">
                  <div className="aj-stat">
                    <div className="aj-stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><MapPin size={14} /></div>
                    <div className="aj-stat-value">{job.distance}</div>
                    <div className="aj-stat-label">Distance</div>
                  </div>
                  <div className="aj-stat">
                    <div className="aj-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}><Clock size={14} /></div>
                    <div className="aj-stat-value">{job.eta}</div>
                    <div className="aj-stat-label">ETA</div>
                  </div>
                  <div className="aj-stat">
                    <div className="aj-stat-icon" style={{ background: 'var(--secondary-glow)', color: 'var(--secondary)' }}><DollarSign size={14} /></div>
                    <div className="aj-stat-value">${job.earnings}</div>
                    <div className="aj-stat-label">Earnings</div>
                  </div>
                  <div className="aj-stat">
                    <div className="aj-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}><Timer size={14} /></div>
                    <div className="aj-stat-value">{job.progress}%</div>
                    <div className="aj-stat-label">Progress</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="aj-progress-section">
                  <div className="aj-progress-label">
                    <span style={{ color: 'var(--text-secondary)' }}>Job Progress</span>
                    <span style={{ color: job.progress === 100 ? 'var(--secondary)' : 'var(--primary)', fontWeight: 700 }}>{job.progress}%</span>
                  </div>
                  <div className="aj-progress-bar">
                    <div className={`aj-progress-fill ${job.progress === 100 ? 'complete' : ''}`} style={{ width: `${job.progress}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="aj-job-actions">
                  <button className="aj-btn aj-btn-primary" onClick={(e) => { handleRipple(e); handleAdvanceStatus(job.id); }}>
                    {job.status === 'completed' ? <CheckCircle size={14} /> : <ChevronRight size={14} />}
                    {job.status === 'accepted' ? 'Start Driving' : job.status === 'driving' ? 'Arrived' : job.status === 'arrived' ? 'Start Repair' : job.status === 'repairing' ? 'Complete Job' : 'Done'}
                  </button>
                  <button className="aj-btn aj-btn-outline" onClick={() => setSelectedJob(job)}>
                    <FileText size={14} /> Details
                  </button>
                  <button className="aj-btn aj-btn-outline">
                    <Navigation size={14} /> Navigate
                  </button>
                  <button className="aj-btn aj-btn-outline" onClick={() => setChatOpen(true)}>
                    <MessageCircle size={14} />
                  </button>
                  <button className="aj-btn aj-btn-outline aj-btn-icon">
                    <Phone size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ===== MAP ===== */}
          <div className="aj-map-card">
            <div className="aj-map-header">
              <div className="aj-map-title"><MapPin size={16} /> Live Navigation</div>
              <div className="aj-map-controls">
                <button className="aj-map-ctrl aj-focus"><Locate size={14} /></button>
                <button className="aj-map-ctrl aj-focus"><Navigation size={14} /></button>
                <button className="aj-map-ctrl aj-focus"><Maximize2 size={14} /></button>
              </div>
            </div>
            <div className="aj-map-body">
              <div className="aj-map-grid" />
              <svg className="aj-map-route" viewBox="0 0 500 360" fill="none">
                <path d="M 80,280 Q 150,200 220,240 T 380,120" stroke="rgba(37,99,235,0.3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 6" />
                <path d="M 80,280 Q 150,200 220,240 T 380,120" stroke="rgba(37,99,235,0.15)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 180,60 Q 195,180 175,310" stroke="rgba(37,99,235,0.08)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="aj-map-marker" style={{ top: '65%', left: '20%' }}>
                <div className="aj-map-marker-dot mechanic" />
                <span className="aj-map-marker-label">You</span>
              </div>
              <div className="aj-map-marker" style={{ top: '30%', left: '70%' }}>
                <div className="aj-map-marker-dot customer" />
                <span className="aj-map-marker-label">{selectedJob?.customer?.split(' ')[0] || 'Customer'}</span>
              </div>
              <div className="aj-map-info-bar">
                <div className="aj-map-info-item"><Navigation size={13} /> {selectedJob?.distance || '3.2 km'}</div>
                <div className="aj-map-info-item"><Clock size={13} /> {selectedJob?.eta || '8 min'}</div>
                <div className="aj-map-info-item"><MapPin size={13} /> {selectedJob?.address || 'Main St & 5th Ave'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="aj-side-col">
          {/* Timer */}
          <div className="aj-timer-card">
            <div className="aj-timer-header">
              <Timer size={16} color="var(--primary)" />
              <span className="aj-timer-title">Job Timer</span>
            </div>
            <div className="aj-timer-main">
              <div className="aj-timer-value">{formatTime(elapsed)}</div>
              <div className="aj-timer-label">Total Time Active</div>
            </div>
            <div className="aj-timer-grid">
              <div className="aj-timer-item">
                <div className="aj-timer-item-value">10:16 AM</div>
                <div className="aj-timer-item-label">Started</div>
              </div>
              <div className="aj-timer-item">
                <div className="aj-timer-item-value">{formatTime(Math.floor(elapsed * 0.7))}</div>
                <div className="aj-timer-item-label">Repair Time</div>
              </div>
              <div className="aj-timer-item">
                <div className="aj-timer-item-value">10:50 AM</div>
                <div className="aj-timer-item-label">Expected End</div>
              </div>
              <div className="aj-timer-item">
                <div className="aj-timer-item-value">{formatTime(Math.max(0, 2100 - elapsed))}</div>
                <div className="aj-timer-item-label">Remaining</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="aj-card">
            <div className="aj-card-header">
              <div className="aj-card-title"><CheckCircle size={16} /> Job Progress</div>
            </div>
            <div className="aj-timeline">
              {getTimelineForJob(selectedJob?.status || 'driving').map((stage, i) => (
                <div key={i} className={`aj-timeline-item ${stage.status}`}>
                  <div className={`aj-timeline-dot ${stage.status}`} />
                  <div className="aj-timeline-info">
                    <div className="aj-timeline-title">{stage.label}</div>
                    {stage.time && <div className="aj-timeline-time">{stage.time}</div>}
                    <span className={`aj-timeline-badge ${stage.status}`}>
                      {stage.status === 'done' ? 'Done' : stage.status === 'active' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          {selectedJob && (
            <div className="aj-card">
              <div className="aj-card-header">
                <div className="aj-card-title"><Check size={16} /> Service Checklist</div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {selectedJob.checklist.filter(c => c.done).length}/{selectedJob.checklist.length}
                </span>
              </div>
              <div className="aj-checklist">
                {selectedJob.checklist.map((item, i) => (
                  <div key={i} className={`aj-check-item ${item.done ? 'checked' : ''}`} onClick={() => handleToggleCheck(selectedJob.id, i)}>
                    <div className={`aj-check-box ${item.done ? 'checked' : ''}`}>
                      {item.done && <Check size={13} />}
                    </div>
                    <span className="aj-check-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Assistant */}
          <div className="aj-ai-card">
            <div className="aj-ai-header">
              <span className="aj-ai-badge"><Bot size={11} /> AI Assistant</span>
              <span className="aj-ai-title">Repair Guide</span>
            </div>
            <div className="aj-ai-body">
              <div className="aj-ai-grid">
                <div className="aj-ai-item">
                  <div className="aj-ai-item-label">Severity</div>
                  <div className="aj-ai-item-value" style={{ color: '#F59E0B' }}>{selectedJob?.aiSeverity || 'Medium'}</div>
                </div>
                <div className="aj-ai-item">
                  <div className="aj-ai-item-label">Repair Time</div>
                  <div className="aj-ai-item-value">{selectedJob?.aiRepairTime || '20-30 min'}</div>
                </div>
                <div className="aj-ai-item">
                  <div className="aj-ai-item-label">Tools Needed</div>
                  <div className="aj-ai-item-value">{selectedJob?.aiTools || 'Jack, Lug Wrench'}</div>
                </div>
                <div className="aj-ai-item">
                  <div className="aj-ai-item-label">Parts Required</div>
                  <div className="aj-ai-item-value">{selectedJob?.aiParts || 'Spare Tire'}</div>
                </div>
              </div>
              <div className="aj-ai-confidence">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Confidence</span>
                <div className="aj-ai-conf-bar">
                  <div className="aj-ai-conf-fill" style={{ width: `${selectedJob?.aiConfidence || 92}%` }} />
                </div>
                <span className="aj-ai-conf-text">{selectedJob?.aiConfidence || 92}%</span>
              </div>
            </div>
          </div>

          {/* Earnings */}
          {selectedJob && (
            <div className="aj-earnings-card">
              <div className="aj-earnings-header">
                <div className="aj-earnings-title"><DollarSign size={16} /> Earnings</div>
              </div>
              <div className="aj-earnings-total">${selectedJob.earnings}.00</div>
              <div className="aj-earnings-row">
                <span className="aj-earnings-label"><Wrench size={13} /> Base Service Fee</span>
                <span className="aj-earnings-value">${selectedJob.baseFee}.00</span>
              </div>
              <div className="aj-earnings-row">
                <span className="aj-earnings-label"><MapPin size={13} /> Distance Charge</span>
                <span className="aj-earnings-value">${selectedJob.distanceCharge}.00</span>
              </div>
              {selectedJob.emergencyFee > 0 && (
                <div className="aj-earnings-row">
                  <span className="aj-earnings-label"><AlertTriangle size={13} /> Emergency Fee</span>
                  <span className="aj-earnings-value">${selectedJob.emergencyFee}.00</span>
                </div>
              )}
              {selectedJob.bonus > 0 && (
                <div className="aj-earnings-row">
                  <span className="aj-earnings-label"><Zap size={13} /> Bonus</span>
                  <span className="aj-earnings-value bonus">${selectedJob.bonus}.00</span>
                </div>
              )}
              {selectedJob.tip > 0 && (
                <div className="aj-earnings-row">
                  <span className="aj-earnings-label"><Star size={13} /> Tip</span>
                  <span className="aj-earnings-value tip">${selectedJob.tip}.00</span>
                </div>
              )}
            </div>
          )}

          {/* Photo Upload */}
          <div className="aj-card">
            <div className="aj-card-header">
              <div className="aj-card-title"><Camera size={16} /> Repair Photos</div>
            </div>
            <div className="aj-card-body">
              <div className="aj-upload-area">
                <div className="aj-upload-icon"><Upload size={20} /></div>
                <div className="aj-upload-text">Drag & drop or click to upload</div>
                <div className="aj-upload-hint">Before, during, and after repair photos</div>
              </div>
              <div className="aj-photos-grid">
                <div className="aj-photo-thumb">
                  <Image size={20} />
                  <span className="aj-photo-label">Before</span>
                </div>
                <div className="aj-photo-thumb">
                  <Image size={20} />
                  <span className="aj-photo-label">During</span>
                </div>
                <div className="aj-photo-thumb">
                  <Image size={20} />
                  <span className="aj-photo-label">After</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="aj-card">
            <div className="aj-card-header">
              <div className="aj-card-title"><MessageCircle size={16} /> Customer Chat</div>
              <button className="aj-btn aj-btn-outline aj-btn-icon" style={{ padding: '0.4rem' }}><Phone size={13} /></button>
            </div>
            <div className="aj-chat">
              <div className="aj-chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`aj-chat-msg ${msg.out ? 'out' : 'in'}`}>{msg.text}</div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="aj-quick-replies">
                {quickReplies.map((qr, i) => (
                  <button key={i} className="aj-quick-reply" onClick={() => setChatInput(qr)}>{qr}</button>
                ))}
              </div>
              <div className="aj-chat-input-area">
                <input className="aj-chat-input aj-focus" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." />
                <button className="aj-chat-send aj-focus" onClick={handleSendMessage}><Send size={14} /></button>
              </div>
            </div>
          </div>

          {/* Service Summary */}
          {selectedJob && (
            <div className="aj-card">
              <div className="aj-card-header">
                <div className="aj-card-title"><FileText size={16} /> Service Summary</div>
              </div>
              <div className="aj-card-body">
                <div className="aj-summary-section">
                  <div className="aj-summary-title"><Wrench size={12} /> Work Performed</div>
                  <div className="aj-summary-field">
                    <span className="aj-summary-label">Service</span>
                    <span className="aj-summary-value">{selectedJob.serviceType}</span>
                  </div>
                  <div className="aj-summary-field">
                    <span className="aj-summary-label">Vehicle</span>
                    <span className="aj-summary-value">{selectedJob.vehicle}</span>
                  </div>
                  <div className="aj-summary-field">
                    <span className="aj-summary-label">Issue</span>
                    <span className="aj-summary-value">{selectedJob.issue}</span>
                  </div>
                </div>
                <div className="aj-summary-section">
                  <div className="aj-summary-title"><FileText size={12} /> Repair Notes</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedJob.description}
                  </div>
                </div>
                <div className="aj-summary-section">
                  <div className="aj-summary-title"><DollarSign size={12} /> Total Cost</div>
                  <div className="aj-summary-field">
                    <span className="aj-summary-label">Total</span>
                    <span className="aj-summary-value" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>${selectedJob.earnings}.00</span>
                  </div>
                </div>
                <button className="aj-complete-btn" onClick={() => { handleAdvanceStatus(selectedJob.id); }}>
                  <CheckCircle size={18} /> {selectedJob.status === 'accepted' ? 'Start Driving' : selectedJob.status === 'driving' ? 'Arrived' : selectedJob.status === 'arrived' ? 'Start Repair' : selectedJob.status === 'repairing' ? 'Complete Job' : 'Complete Job'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== SUCCESS OVERLAY ===== */}
      {showSuccess && (
        <div className="aj-success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="aj-success-card" onClick={(e) => e.stopPropagation()}>
            <div className="aj-success-icon"><Check size={36} /></div>
            <h2 className="aj-success-title">Job Completed!</h2>
            <p className="aj-success-desc">Great work! The service has been marked as complete and the customer has been notified.</p>
            <div className="aj-success-earnings">+${completedEarnings}.00</div>
            <div className="aj-success-actions">
              <button className="aj-btn aj-btn-primary" style={{ flex: 1 }} onClick={() => setShowSuccess(false)}>
                <Briefcase size={16} /> Back to Jobs
              </button>
              <button className="aj-btn aj-btn-outline" onClick={() => setShowSuccess(false)}>
                <Star size={14} /> Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
