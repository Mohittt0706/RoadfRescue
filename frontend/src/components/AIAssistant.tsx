import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Upload, Send, Search, Trash2, Edit2, Plus, Volume2,
  RefreshCw, Camera, Info, CheckCircle, Square, Copy,
  MessageSquare, Paperclip
} from 'lucide-react';
import { streamChat, analyzeImage } from '../services/chatService';
import BookingModal from './BookingModal';

interface AIAssistantProps {
  onBookService?: (serviceName: string, price: number) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  imageSrc?: string;
  imageFileName?: string;
  isDiagnostic?: boolean;
  diagnosisData?: {
    issue: string;
    confidence: number;
    cost: string;
    time: string;
    advice: string;
  };
  recommendedService?: { name: string; price: number; eta: string };
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

const SERVICES_MAP: Record<string, { price: number; icon: string; eta: string }> = {
  'Flat Tire Repair': { price: 700, icon: '🔧', eta: '15-20 min' },
  'Battery Jump Start': { price: 1000, icon: '🔋', eta: '10-15 min' },
  'Fuel Delivery': { price: 800, icon: '⛽', eta: '20-25 min' },
  'Car Towing': { price: 2000, icon: '🚛', eta: '25-35 min' },
  'Engine Diagnosis': { price: 1500, icon: '🔍', eta: '20-30 min' },
  'Lockout Assistance': { price: 900, icon: '🔓', eta: '10-15 min' },
};

const SUGGESTED_PROMPTS = [
  { text: 'My car battery is dead', icon: '🔋' },
  { text: 'I have a flat tyre', icon: '🔧' },
  { text: 'Engine is overheating and smoking', icon: '💨' },
  { text: 'I need emergency towing', icon: '🚛' },
  { text: 'I locked my keys in the car', icon: '🔓' },
  { text: 'My car ran out of fuel', icon: '⛽' },
];

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed: React.ReactNode = line;
    if (line.match(/^\s*[-*]\s/)) {
      processed = <li key={i} style={{ marginLeft: '1rem', marginBottom: '2px' }}>{line.replace(/^\s*[-*]\s/, '')}</li>;
    } else if (line.match(/^#{1,3}\s/)) {
      processed = <strong key={i} style={{ fontSize: '1.05em' }}>{line.replace(/^#{1,3}\s/, '')}</strong>;
    }
    if (typeof processed === 'string') {
      const boldParts = processed.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        processed = <span key={i}>{boldParts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</span>;
      }
    }
    return <React.Fragment key={i}>{processed}{i < lines.length - 1 ? <br /> : null}</React.Fragment>;
  });
}

function parseServiceRecommendation(text: string): { cleanText: string; service?: { name: string; price: number; eta: string } } {
  const pattern = /\[RECOMMEND_SERVICE:(.*?)\|(\d+)\|?(.*?)\]/;
  const match = text.match(pattern);
  if (match) {
    const name = match[1].trim();
    const price = parseInt(match[2], 10);
    const eta = match[3] || SERVICES_MAP[name]?.eta || '15 min';
    const cleanText = text.replace(pattern, '').trim();
    return { cleanText, service: { name, price, eta } };
  }
  return { cleanText: text };
}

const now = () => new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const WELCOME_MESSAGE: Message = {
  id: 'welcome-1',
  text: "Hello! I am your **RoadRescue AI Assistant** powered by GPT-4. I can help diagnose vehicle issues, recommend services, and connect you with nearby mechanics.\n\nYou can type your issue, upload a photo, or use voice commands. How can I help you today?",
  sender: 'ai',
  time: now(),
  status: 'read',
};

export default function AIAssistant({ onBookService }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'vision' | 'telemetry' | 'safety'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [visionResult, setVisionResult] = useState<{ issue: string; confidence: number; cost: string; time: string; advice: string } | null>(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingService, setBookingService] = useState({ name: '', price: 0 });

  const [healthMetrics, setHealthMetrics] = useState({ battery: 88, tire: 92, engine: 98, oil: 74, brake: 85, coolant: 90 });
  const [isHealthScanning, setIsHealthScanning] = useState(false);

  const [estimatorBrand, setEstimatorBrand] = useState('Tata');
  const [estimatorModel, setEstimatorModel] = useState('Nexon');
  const [estimatorProblem, setEstimatorProblem] = useState('Battery Dead');
  const [estimatorCity, setEstimatorCity] = useState('Ahmedabad');
  const [estimationData, setEstimationData] = useState({ parts: 0, labor: 0, duration: '30-45 mins', range: '₹800 - ₹1,200' });

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  useEffect(() => {
    const saved = localStorage.getItem('roadrescue-conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Conversation[];
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConvId(parsed[0].id);
          return;
        }
      } catch { }
    }
    const id = 'conv-' + Date.now();
    const initial: Conversation = {
      id,
      title: 'New Diagnostic Chat',
      timestamp: 'Today',
      messages: [WELCOME_MESSAGE],
    };
    setConversations([initial]);
    setActiveConvId(id);
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('roadrescue-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId, isAiTyping, streamingText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let t = 0;
    const particles: Array<{ x: number; y: number; r: number; speed: number; angle: number; color: string }> = [];
    for (let i = 0; i < 18; i++) {
      particles.push({
        x: 80 + (Math.random() - 0.5) * 40,
        y: 80 + (Math.random() - 0.5) * 40,
        r: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        angle: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? '#8B5CF6' : '#2563EB',
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, 160, 160);
      t += 0.02;
      const cx = 80, cy = 80;
      const pulse = 1 + Math.sin(t * 3) * 0.05 * (isVoiceListening ? 2.5 : 1);
      const glow = ctx.createRadialGradient(cx, cy, 15, cx, cy, 60 * pulse);
      glow.addColorStop(0, 'rgba(139,92,246,0.4)');
      glow.addColorStop(0.4, 'rgba(37,99,235,0.25)');
      glow.addColorStop(0.8, 'rgba(139,92,246,0.05)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 70 * pulse, 0, Math.PI * 2);
      ctx.fill();
      const core = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, 35);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.3, '#93c5fd');
      core.addColorStop(0.7, '#2563eb');
      core.addColorStop(1, '#6d28d9');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(139,92,246,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 48 + Math.sin(t) * 4, 0, Math.PI * 2);
      ctx.stroke();
      particles.forEach(p => {
        p.angle += 0.015;
        p.x = cx + Math.cos(p.angle) * (30 + Math.sin(t + p.speed) * 10);
        p.y = cy + Math.sin(p.angle) * (30 + Math.cos(t + p.speed) * 10);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (isVoiceListening) {
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          const wh = Math.sin(a * 4 + t * 15) * 6;
          const rx = cx + Math.cos(a) * (42 + wh);
          const ry = cy + Math.sin(a) * (42 + wh);
          if (a === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.stroke();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [isVoiceListening]);

  useEffect(() => {
    let parts = 100, labor = 60, dur = '30-45 mins';
    const p = estimatorProblem.toLowerCase(), b = estimatorBrand.toLowerCase();
    if (p.includes('battery')) { parts = 90; dur = '20-30 min'; }
    else if (p.includes('tire') || p.includes('flat')) { parts = 50; dur = '15-25 min'; }
    else if (p.includes('smoke') || p.includes('overheat') || p.includes('engine')) { parts = 220; labor = 95; dur = '1.5-3 hours'; }
    else if (p.includes('brake')) { parts = 130; labor = 80; dur = '45-60 min'; }
    else if (p.includes('leak') || p.includes('oil')) { parts = 40; labor = 70; dur = '30-50 min'; }
    if (b.includes('bmw') || b.includes('mercedes')) { parts = Math.round(parts * 1.35); labor = Math.round(labor * 1.25); }
    const total = parts + labor;
    setEstimationData({ parts, labor, duration: dur, range: '\u20B9' + Math.round(total * 0.9).toLocaleString('en-IN') + ' - \u20B9' + Math.round(total * 1.1).toLocaleString('en-IN') });
  }, [estimatorBrand, estimatorModel, estimatorProblem, estimatorCity]);

  const updateConversation = useCallback((convId: string, updater: (conv: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => c.id === convId ? updater(c) : c));
  }, []);

  const createNewChat = () => {
    const id = 'conv-' + Date.now();
    const conv: Conversation = {
      id,
      title: 'New Diagnostic Chat',
      timestamp: 'Today',
      messages: [WELCOME_MESSAGE],
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeConvId === id && filtered.length > 0) setActiveConvId(filtered[0].id);
      return filtered;
    });
  };

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingConvId(id);
    setRenameValue(currentTitle);
  };

  const confirmRename = () => {
    if (renamingConvId && renameValue.trim()) {
      updateConversation(renamingConvId, c => ({ ...c, title: renameValue.trim() }));
    }
    setRenamingConvId(null);
    setRenameValue('');
  };

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speechSynthesisActive) {
      window.speechSynthesis.cancel();
      setSpeechSynthesisActive(false);
      return;
    }
    const clean = text.replace(/\[RECOMMEND_SERVICE:.*?\]/g, '').replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').replace(/[-*]\s/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeechSynthesisActive(false);
    utterance.onerror = () => setSpeechSynthesisActive(false);
    setSpeechSynthesisActive(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsVoiceListening(false);
  };

  const toggleVoiceAssistant = () => {
    if (isVoiceListening) {
      stopVoice();
      if (voiceTranscript.trim()) {
        const text = voiceTranscript;
        setVoiceTranscript('');
        sendMessage(text);
      }
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const samples = selectedLanguage === 'hi'
        ? ['मेरी गाड़ी का टायर पंचर हो गया है', 'कार की बैटरी काम नहीं कर रही', 'इंजन से धुआं निकल रहा है']
        : ['My car has a flat tyre', 'The battery is dead, car won\'t start', 'Engine is smoking and overheating'];
      const picked = samples[Math.floor(Math.random() * samples.length)];
      let cur = '';
      let idx = 0;
      setIsVoiceListening(true);
      const timer = setInterval(() => {
        if (idx < picked.length) {
          cur += picked[idx];
          setVoiceTranscript(cur);
          idx++;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            setIsVoiceListening(false);
            sendMessage(picked);
          }, 800);
        }
      }, 45);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      setVoiceTranscript(event.results[0][0].transcript);
    };
    recognition.onerror = () => { setIsVoiceListening(false); };
    recognition.onend = () => {
      setIsVoiceListening(false);
      if (voiceTranscript.trim()) {
        const text = voiceTranscript;
        setVoiceTranscript('');
        sendMessage(text);
      }
    };
    recognitionRef.current = recognition;
    setIsVoiceListening(true);
    setVoiceTranscript('');
    recognition.start();
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isAiTyping) return;
    const convId = activeConvId;
    const userMsg: Message = {
      id: 'msg-' + Date.now() + '-user',
      text: text.trim(),
      sender: 'user',
      time: now(),
      status: 'sent',
    };
    updateConversation(convId, c => ({
      ...c,
      messages: [...c.messages, userMsg],
      title: c.messages.length <= 1 ? text.trim().slice(0, 40) : c.title,
    }));
    setChatInput('');
    setIsAiTyping(true);
    setStreamingText('');
    const controller = new AbortController();
    setAbortController(controller);
    const apiMessages = [
      ...((conversations.find(c => c.id === convId)?.messages || []).filter(m => m.id !== 'welcome-1').map(m => ({
        sender: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }))),
      { sender: 'user', text: text.trim() },
    ];
    let accumulated = '';
    try {
      await streamChat(
        apiMessages,
        convId,
        (chunk: string) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        (full: string) => {
          const { cleanText, service } = parseServiceRecommendation(full);
          const aiMsg: Message = {
            id: 'msg-' + Date.now() + '-ai',
            text: cleanText,
            sender: 'ai',
            time: now(),
            status: 'read',
            recommendedService: service,
          };
          updateConversation(convId, c => ({ ...c, messages: [...c.messages, aiMsg] }));
          setStreamingText('');
          setIsAiTyping(false);
          setAbortController(null);
        },
        (err: string) => {
          const errMsg: Message = {
            id: 'msg-' + Date.now() + '-err',
            text: `Sorry, I encountered an error: ${err}. Please try again.`,
            sender: 'ai',
            time: now(),
            status: 'read',
          };
          updateConversation(convId, c => ({ ...c, messages: [...c.messages, errMsg] }));
          setStreamingText('');
          setIsAiTyping(false);
          setAbortController(null);
        }
      );
    } catch {
      setIsAiTyping(false);
      setStreamingText('');
      setAbortController(null);
    }
  }, [activeConvId, conversations, isAiTyping, updateConversation]);

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      if (streamingText) {
        const { cleanText, service } = parseServiceRecommendation(streamingText);
        const aiMsg: Message = {
          id: 'msg-' + Date.now() + '-stopped',
          text: cleanText + '\n\n*[Generation stopped]*',
          sender: 'ai',
          time: now(),
          status: 'read',
          recommendedService: service,
        };
        updateConversation(activeConvId, c => ({ ...c, messages: [...c.messages, aiMsg] }));
      }
      setStreamingText('');
      setIsAiTyping(false);
      setAbortController(null);
    }
  };

  const regenerateLastResponse = () => {
    if (!currentConv || currentConv.messages.length < 2) return;
    const lastUserMsg = [...currentConv.messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      updateConversation(currentConv.id, c => ({
        ...c,
        messages: c.messages.filter(m => m.id !== lastUserMsg.id),
      }));
      setTimeout(() => sendMessage(lastUserMsg.text), 100);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = URL.createObjectURL(file);
    setUploadedImage(dataUrl);
    setUploadedFileName(file.name);
    setIsScanning(true);
    setVisionResult(null);
    try {
      const result = await analyzeImage(dataUrl, activeConvId);
      setVisionResult({
        issue: result.issue || result.diagnosis || 'Issue detected in uploaded image',
        confidence: result.confidence || result.score || 85,
        cost: result.cost || result.estimatedCost || '₹800 - ₹1,500',
        time: result.time || result.eta || '15-20 min',
        advice: result.advice || result.recommendation || 'Please consult a certified mechanic for detailed inspection.',
      });
    } catch {
      setVisionResult({
        issue: 'Unable to analyze image via Vision AI. Please try again or describe the issue.',
        confidence: 0,
        cost: '₹500 - ₹2,000',
        time: '15-30 min',
        advice: 'Try uploading a clearer photo or describe your vehicle issue in the chat.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const sendVisionDiagnosis = () => {
    if (!visionResult) return;
    const text = `📸 Vision AI Diagnosis:\n\n**Issue:** ${visionResult.issue}\n**Confidence:** ${visionResult.confidence}%\n**Est. Cost:** ${visionResult.cost}\n**Advice:** ${visionResult.advice}\n\nPlease provide more details about this issue.`;
    sendMessage(text);
    setUploadedImage(null);
    setVisionResult(null);
    setActiveTab('chat');
  };

  const openBooking = (name: string, price: number) => {
    if (onBookService) {
      onBookService(name, price);
    } else {
      setBookingService({ name, price });
      setShowBookingModal(true);
    }
  };

  const triggerHealthScan = () => {
    setIsHealthScanning(true);
    setHealthMetrics({ battery: 0, tire: 0, engine: 0, oil: 0, brake: 0, coolant: 0 });
    setTimeout(() => {
      setHealthMetrics({
        battery: Math.floor(Math.random() * 20) + 75,
        tire: Math.floor(Math.random() * 15) + 82,
        engine: Math.floor(Math.random() * 8) + 91,
        oil: Math.floor(Math.random() * 30) + 60,
        brake: Math.floor(Math.random() * 18) + 78,
        coolant: Math.floor(Math.random() * 12) + 85,
      });
      setIsHealthScanning(false);
    }, 2200);
  };

  const filteredHistory = conversations.filter(c =>
    c.title.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  const warningLights = [
    { name: 'Check Engine', icon: '🔧', severity: 'High' as const, meaning: 'Engine management computer detected a fault in emissions, ignition, or fuel systems.', drivable: 'Yes, but avoid heavy acceleration. If blinking, stop immediately.', action: 'Check gas cap. Scan OBD-II fault codes at nearest shop.' },
    { name: 'Battery', icon: '🔋', severity: 'Emergency' as const, meaning: 'Charging system voltage failure. Alternator not providing power.', drivable: 'No. Car will shut down in minutes.', action: 'Turn off all loads. Pull off into safe zone immediately.' },
    { name: 'Oil Pressure', icon: '🛢️', severity: 'Emergency' as const, meaning: 'Engine oil pressure below minimum safety threshold.', drivable: 'NO. Can destroy engine in 30 seconds.', action: 'Turn off ignition instantly. Check dipstick. Call towing.' },
    { name: 'ABS', icon: '🛑', severity: 'Medium' as const, meaning: 'Anti-lock Brake System malfunction detected.', drivable: 'Yes, but tires can lock during emergency stops.', action: 'Drive carefully. Schedule ABS sensor diagnostic.' },
    { name: 'Airbag', icon: '🎈', severity: 'Medium' as const, meaning: 'SRS fault. Airbags may not deploy correctly.', drivable: 'Yes, but safety airbags may fail.', action: 'Get checking ASAP. Avoid front-end bumps.' },
    { name: 'Tire Pressure', icon: '💨', severity: 'Medium' as const, meaning: 'TPMS detected a tire at least 25% below recommended PSI.', drivable: 'Yes, drive slowly under 60 km/h.', action: 'Inspect for nails. Inflate to 32-35 PSI. Reset TPMS.' },
    { name: 'Brake Warning', icon: '⛔', severity: 'High' as const, meaning: 'Brake fluid critically low or parking brake engaged.', drivable: 'Extremely high risk. Brakes may fail.', action: 'Release parking brake. Check fluid. Do not drive if spongy.' },
    { name: 'Coolant Temp', icon: '🌡️', severity: 'Emergency' as const, meaning: 'Engine coolant at boiling threshold (>110°C).', drivable: 'No. Will warp cylinder heads.', action: 'Turn heater to MAX. Do NOT open radiator cap when hot.' },
  ];
  const [activeWarningLight, setActiveWarningLight] = useState<string | null>(null);

  const severityColor = (s: string) => {
    if (s === 'Emergency') return '#dc2626';
    if (s === 'High') return '#d97706';
    return '#2563eb';
  };

  const S = (base: Record<string, string | number>): React.CSSProperties => base as React.CSSProperties;

  const style = {
    wrapper: S({ display: 'flex', height: 'calc(100vh - 140px)', minHeight: '600px', gap: '1rem' }),
    sidebar: S({ width: '280px', minWidth: '280px', background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }),
    sidebarHeader: S({ padding: '1rem', borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
    searchBox: S({ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid var(--border-light, rgba(255,255,255,0.08))' }),
    convList: S({ flex: 1, overflowY: 'auto', padding: '0.25rem' }),
    convItem: (active: boolean) => S({ padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', background: active ? 'rgba(59,130,246,0.12)' : 'transparent', border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent', marginBottom: '2px', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }),
    main: S({ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }),
    tabBar: S({ display: 'flex', gap: '0.5rem', background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '0.5rem', flexWrap: 'wrap' }),
    tabBtn: (active: boolean) => S({ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 800 : 600, background: active ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.04)', color: active ? '#fff' : 'var(--text-secondary, #94a3b8)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.35rem' }),
    chatArea: S({ flex: 1, background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }),
    chatMessages: S({ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }),
    inputBar: S({ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))', display: 'flex', alignItems: 'center', gap: '0.5rem' }),
    textInput: S({ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: '0.9rem', outline: 'none' }),
    actionBtn: (active?: boolean) => S({ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', color: active ? '#3b82f6' : 'var(--text-secondary, #94a3b8)', transition: 'all 0.15s' }),
    sendBtn: S({ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }),
    msgBubble: (sender: string) => S({ maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.06)', color: 'var(--text-primary, #fff)', fontSize: '0.88rem', lineHeight: '1.55', alignSelf: sender === 'user' ? 'flex-end' : 'flex-start', position: 'relative' }),
    suggestedPrompt: S({ padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.5rem' }),
    card: S({ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '16px', padding: '1.25rem' }),
    badge: (color: string) => S({ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', background: color + '22', color, textTransform: 'uppercase' }),
  };

  return (
    <div style={style.wrapper}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      {/* ── SIDEBAR ── */}
      <aside style={style.sidebar}>
        <div style={style.sidebarHeader}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>Conversations</span>
          <button onClick={createNewChat} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Plus size={12} /> New
          </button>
        </div>
        <div style={style.searchBox}>
          <Search size={14} color="var(--text-muted, #64748b)" />
          <input
            type="text"
            placeholder="Search..."
            value={searchHistoryQuery}
            onChange={e => setSearchHistoryQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary, #fff)', fontSize: '0.8rem' }}
          />
        </div>
        <div style={style.convList}>
          {filteredHistory.map(c => (
            <div key={c.id} style={style.convItem(activeConvId === c.id)} onClick={() => setActiveConvId(c.id)}>
              {renamingConvId === c.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenamingConvId(null); }}
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '4px', padding: '2px 6px', color: 'var(--text-primary, #fff)', fontSize: '0.8rem', outline: 'none' }}
                />
              ) : (
                <>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontSize: '0.82rem', flex: 1, color: 'var(--text-primary, #fff)' }}>
                    <MessageSquare size={12} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                    {c.title}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', opacity: activeConvId === c.id ? 1 : 0, transition: 'opacity 0.15s' }}>
                    <button onClick={e => startRename(c.id, c.title, e)} style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted, #64748b)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Rename">
                      <Edit2 size={10} />
                    </button>
                    <button onClick={e => deleteConversation(c.id, e)} style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          AI Engine Online
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={style.main}>
        {/* Tab Bar */}
        <div style={style.tabBar}>
          <button style={style.tabBtn(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
            <MessageSquare size={14} /> Chat & Voice
          </button>
          <button style={style.tabBtn(activeTab === 'vision')} onClick={() => setActiveTab('vision')}>
            <Camera size={14} /> Image Diagnosis
          </button>
          <button style={style.tabBtn(activeTab === 'telemetry')} onClick={() => setActiveTab('telemetry')}>
            <RefreshCw size={14} /> Telemetry
          </button>
          <button style={style.tabBtn(activeTab === 'safety')} onClick={() => setActiveTab('safety')}>
            <Info size={14} /> SOS Guide
          </button>
        </div>

        {/* ── CHAT TAB ── */}
        {activeTab === 'chat' && (
          <div style={style.chatArea}>
            {!currentConv || currentConv.messages.length <= 1 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1.5rem' }}>
                  <canvas ref={canvasRef} width={160} height={160} style={{ borderRadius: '50%' }} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary, #fff)', marginBottom: '0.4rem' }}>RoadRescue AI Assistant</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', maxWidth: '420px', textAlign: 'center', marginBottom: '1.5rem' }}>
                  Diagnose vehicle problems, estimate repair costs, and connect with nearby mechanics instantly.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
                  {SUGGESTED_PROMPTS.map(p => (
                    <button key={p.text} style={style.suggestedPrompt} onClick={() => sendMessage(p.text)} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-light, rgba(255,255,255,0.1))'; }}>
                      <span>{p.icon}</span> {p.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={style.chatMessages}>
                {currentConv.messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' as const, marginBottom: '1rem', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={style.msgBubble(msg.sender)}>
                      {parseMarkdown(msg.text)}
                      {msg.imageSrc && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <img src={msg.imageSrc} alt="uploaded" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                          {msg.imageFileName && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem' }}>{msg.imageFileName}</div>}
                        </div>
                      )}
                      {msg.recommendedService && (
                        <div style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'rgba(34,197,94,0.08)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.4rem' }}>
                            {SERVICES_MAP[msg.recommendedService.name]?.icon || '🔧'} {msg.recommendedService.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}>
                            <span>ETA: {msg.recommendedService.eta}</span>
                            <span style={{ fontWeight: 800, color: '#22c55e', fontSize: '1rem' }}>₹{msg.recommendedService.price.toLocaleString('en-IN')}</span>
                          </div>
                          <button onClick={() => openBooking(msg.recommendedService!.name, msg.recommendedService!.price)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                            Book Now →
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', padding: '0 0.25rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #64748b)' }}>
                        {msg.time} {msg.sender === 'user' && (msg.status === 'read' ? '✓✓' : '✓')}
                      </span>
                      {msg.sender === 'ai' && (
                        <>
                          <button onClick={() => speakText(msg.text)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: speechSynthesisActive ? '#3b82f6' : 'var(--text-muted, #64748b)', padding: '2px', display: 'flex' }} title="Read aloud">
                            <Volume2 size={12} />
                          </button>
                          <button onClick={() => copyMessage(msg.text, msg.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copiedMessageId === msg.id ? '#22c55e' : 'var(--text-muted, #64748b)', padding: '2px', display: 'flex' }} title="Copy">
                            {copiedMessageId === msg.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {streamingText && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ ...style.msgBubble('ai'), border: '1px solid rgba(59,130,246,0.2)' }}>
                      {parseMarkdown(streamingText)}
                      <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#3b82f6', marginLeft: '2px', animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
                    </div>
                  </div>
                )}
                {isAiTyping && !streamingText && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>AI is thinking</span>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', animation: `bounce 1.4s ${i * 0.16}s infinite ease-in-out both` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            {/* Input Bar */}
            <div style={style.inputBar}>
              {isAiTyping && (
                <button onClick={stopGeneration} title="Stop generating" style={{ ...style.actionBtn(false), background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                  <Square size={14} />
                </button>
              )}
              <button onClick={() => fileInputRef.current?.click()} title="Upload image" style={style.actionBtn()}>
                <Paperclip size={16} />
              </button>
              <button onClick={toggleVoiceAssistant} title="Voice input" style={style.actionBtn(isVoiceListening)}>
                <Mic size={16} />
              </button>
              <input
                type="text"
                placeholder={isVoiceListening ? 'Listening...' : 'Describe your vehicle issue...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                disabled={isAiTyping}
                style={style.textInput}
              />
              {!isAiTyping && currentConv && currentConv.messages.length > 2 && (
                <button onClick={regenerateLastResponse} title="Regenerate last response" style={style.actionBtn()}>
                  <RefreshCw size={16} />
                </button>
              )}
              <button onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || isAiTyping} style={{ ...style.sendBtn, opacity: (!chatInput.trim() || isAiTyping) ? 0.4 : 1, cursor: (!chatInput.trim() || isAiTyping) ? 'not-allowed' : 'pointer' }}>
                <Send size={16} />
              </button>
            </div>
            {isVoiceListening && (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(34,197,94,0.04)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite' }}>
                  <Mic size={18} color="#22c55e" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e' }}>Listening...</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', fontStyle: 'italic' }}>{voiceTranscript || 'Speak your issue now...'}</div>
                </div>
                <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value as any)} style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: '0.75rem' }}>
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
                <button onClick={stopVoice} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Stop</button>
              </div>
            )}
          </div>
        )}

        {/* ── VISION TAB ── */}
        {activeTab === 'vision' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, overflow: 'auto' }}>
            <div style={style.card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={18} /> AI Vision Scanner
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '1rem' }}>
                Upload a photo of your vehicle issue for instant AI-powered diagnosis.
              </p>
              <div style={{ border: '2px dashed var(--border-light, rgba(255,255,255,0.12))', borderRadius: '12px', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                {isScanning && (
                  <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', animation: 'scanLine 1.5s infinite' }} />
                )}
                {uploadedImage ? (
                  <div>
                    <img src={uploadedImage} alt="uploaded" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain', marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>{uploadedFileName}</div>
                    <button onClick={e => { e.stopPropagation(); setUploadedImage(null); setVisionResult(null); }} style={{ marginTop: '0.5rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <Upload size={36} color="var(--text-muted, #64748b)" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>Click or Drop Image Here</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem' }}>JPEG, PNG up to 8MB</div>
                  </div>
                )}
              </div>
              {isScanning && (
                <div style={{ padding: '1rem', textAlign: 'center', marginTop: '0.75rem', background: 'rgba(59,130,246,0.04)', borderRadius: '8px' }}>
                  <RefreshCw size={20} style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: '0.4rem' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>Analyzing image with Vision AI...</div>
                </div>
              )}
              {visionResult && !isScanning && (
                <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', borderLeft: '4px solid #22c55e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: '#22c55e', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CheckCircle size={14} /> Diagnosis Complete</span>
                    {visionResult.confidence > 0 && <span style={style.badge('#22c55e')}>{visionResult.confidence}%</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary, #fff)', marginBottom: '0.5rem' }}><strong>Issue:</strong> {visionResult.issue}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ padding: '0.4rem', background: 'var(--card-bg, rgba(255,255,255,0.04))', borderRadius: '6px', border: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>Est. Cost</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#22c55e' }}>{visionResult.cost}</div>
                    </div>
                    <div style={{ padding: '0.4rem', background: 'var(--card-bg, rgba(255,255,255,0.04))', borderRadius: '6px', border: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>ETA</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>{visionResult.time}</div>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.04)', borderLeft: '3px solid #ef4444', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.75rem' }}>
                    <strong>⚠️ Advice:</strong> {visionResult.advice}
                  </div>
                  <button onClick={sendVisionDiagnosis} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    Discuss in Chat →
                  </button>
                </div>
              )}
            </div>

            <div style={style.card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚙️ Warning Light Scanner
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {warningLights.map(w => (
                  <div key={w.name} onClick={() => setActiveWarningLight(activeWarningLight === w.name ? null : w.name)} style={{ padding: '0.6rem', borderRadius: '10px', border: activeWarningLight === w.name ? `2px solid ${severityColor(w.severity)}` : '1px solid var(--border-light, rgba(255,255,255,0.08))', background: activeWarningLight === w.name ? `${severityColor(w.severity)}11` : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{w.icon}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)' }}>{w.name}</div>
                  </div>
                ))}
              </div>
              {activeWarningLight ? (() => {
                const w = warningLights.find(l => l.name === activeWarningLight)!;
                return (
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light, rgba(255,255,255,0.08))', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>{w.icon} {w.name}</h4>
                      <span style={style.badge(severityColor(w.severity))}>{w.severity}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}>{w.meaning}</p>
                    <p style={{ fontSize: '0.8rem', color: severityColor(w.severity), fontWeight: 700, marginBottom: '0.5rem' }}>Can you drive? {w.drivable}</p>
                    <div style={{ padding: '0.5rem', background: 'rgba(59,130,246,0.04)', borderLeft: '3px solid #3b82f6', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      <strong>Action:</strong> {w.action}
                    </div>
                  </div>
                );
              })() : (
                <div style={{ padding: '1.5rem', border: '1px dashed var(--border-light, rgba(255,255,255,0.08))', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8rem' }}>
                  Click any warning light icon to view details
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TELEMETRY TAB ── */}
        {activeTab === 'telemetry' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, overflow: 'auto' }}>
            <div style={style.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={18} /> Vehicle Health
                </h3>
                <button onClick={triggerHealthScan} disabled={isHealthScanning} style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', border: 'none', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <RefreshCw size={12} className={isHealthScanning ? 'spinning' : ''} /> {isHealthScanning ? 'Scanning...' : 'Run Scan'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {Object.entries(healthMetrics).map(([key, val]) => {
                  const r = 28, sw = 5, c = 2 * Math.PI * r, off = c - (val / 100) * c;
                  const col = val < 75 ? '#ef4444' : val < 85 ? '#f59e0b' : '#22c55e';
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                        <svg width="64" height="64" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
                          <circle cx="32" cy="32" r={r} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.8s ease' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>{val}%</div>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' as const, color: 'var(--text-secondary, #94a3b8)' }}>{key}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem' }}>Care Tips</h4>
                {healthMetrics.oil < 80 && <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(245,158,11,0.05)', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.35rem' }}>Oil at {healthMetrics.oil}% — consider topping off with synthetic oil.</div>}
                {healthMetrics.battery < 80 && <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.05)', borderLeft: '3px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.35rem' }}>Battery at {healthMetrics.battery}% — cold starting may be affected. Recommend test.</div>}
                <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(34,197,94,0.05)', borderLeft: '3px solid #22c55e', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>Engine at {healthMetrics.engine}% — running within nominal limits.</div>
              </div>
            </div>

            <div style={style.card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💵 Cost Estimator
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>Brand</label>
                  <select value={estimatorBrand} onChange={e => setEstimatorBrand(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    {['Tata', 'Maruti Suzuki', 'Hyundai', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'BMW', 'Mercedes'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>Model</label>
                  <input value={estimatorModel} onChange={e => setEstimatorModel(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: '0.82rem', marginTop: '0.2rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>Problem</label>
                  <select value={estimatorProblem} onChange={e => setEstimatorProblem(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    {['Battery Dead', 'Flat Tyre', 'Engine Smoking', 'Brake Squealing', 'Fluid Leakage'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>City</label>
                  <input value={estimatorCity} onChange={e => setEstimatorCity(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: '0.82rem', marginTop: '0.2rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.04)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>Estimated Range</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6' }}>{estimationData.range}</div>
                  <div style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 700 }}>Price Match Guarantee</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.78rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))', paddingTop: '0.5rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <div>Parts: <strong>₹{estimationData.parts.toLocaleString('en-IN')}</strong></div>
                  <div>Labor: <strong>₹{estimationData.labor.toLocaleString('en-IN')}</strong></div>
                  <div>Duration: <strong>{estimationData.duration}</strong></div>
                  <div>City: <strong style={{ textTransform: 'capitalize' as const }}>{estimatorCity}</strong></div>
                </div>
              </div>
              <button onClick={() => sendMessage(`What is the cost of ${estimatorProblem} repair for my ${estimatorBrand} ${estimatorModel} in ${estimatorCity}?`)} style={{ width: '100%', marginTop: '0.75rem', padding: '0.6rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                Ask AI About This →
              </button>
            </div>
          </div>
        )}

        {/* ── SAFETY TAB ── */}
        {activeTab === 'safety' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, overflow: 'auto' }}>
            <div style={style.card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ef4444', marginBottom: '0.5rem' }}>🚨 SOS Emergency Guide</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '1rem' }}>Select a scenario for AI-generated safety steps.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { name: 'Accident', emoji: '🚨', steps: '1. Switch on hazard lights.\n2. Pull over safely.\n3. Move behind guardrail.\n4. Call emergency services.\n5. Exchange insurer details.' },
                  { name: 'Vehicle Fire', emoji: '🔥', steps: '1. Turn off ignition immediately.\n2. Evacuate all passengers 50m away.\n3. Do NOT open the hood.\n4. Call fire services (101).' },
                  { name: 'Flash Flood', emoji: '🌊', steps: '1. Do not drive through water.\n2. Turn around and find higher ground.\n3. If trapped, climb to roof.\n4. Call disaster helpline (1070).' },
                  { name: 'Brake Failure', emoji: '⛔', steps: '1. Pump brakes rapidly.\n2. Downshift to lower gears.\n3. Use handbrake gradually.\n4. Steer to soft shoulder.\n5. Call for towing.' },
                  { name: 'Engine Smoke', emoji: '💨', steps: '1. Pull over immediately.\n2. Turn off engine.\n3. Do NOT open radiator cap.\n4. Wait 30 min before checking.\n5. Call mechanic.' },
                  { name: 'Tyre Burst', emoji: '💥', steps: '1. Grip steering firmly.\n2. Do NOT slam brakes.\n3. Gradually reduce speed.\n4. Pull off road safely.\n5. Call for roadside assist.' },
                ].map(s => (
                  <button key={s.name} onClick={() => sendMessage(`Give me the full emergency safety steps for: ${s.name}`)} style={{ ...style.suggestedPrompt, borderColor: 'rgba(239,68,68,0.2)', fontSize: '0.78rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                    <span>{s.emoji}</span> {s.name}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>Emergency Hotlines</h4>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
                  <a href="tel:112" style={{ padding: '0.55rem', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>
                    🚨 Call Emergency 112
                  </a>
                  <a href="tel:18001800112" style={{ padding: '0.55rem', borderRadius: '8px', border: 'none', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none', display: 'block' }}>
                    📞 RoadRescue Hotline (+91-1800-1800-112)
                  </a>
                </div>
              </div>
            </div>

            <div style={style.card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📋 Quick Services
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '1rem' }}>Indian pricing — book directly or ask AI.</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.65rem' }}>
                {Object.entries(SERVICES_MAP).map(([name, s]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary, #fff)' }}>{name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>ETA: {s.eta}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#22c55e' }}>₹{s.price.toLocaleString('en-IN')}</span>
                      <button onClick={() => openBooking(name, s.price)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>Book</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem' }}>💡 Pricing Notes</h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
                  • All prices include GST and are indicative.<br />
                  • Final price may vary based on vehicle type and location.<br />
                  • Fuel delivery price is ₹700 + actual fuel cost.<br />
                  • Night charges (10 PM - 6 AM) may apply +₹200.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        serviceName={bookingService.name}
        price={bookingService.price}
        onBookingConfirmed={(booking) => {
          setShowBookingModal(false);
          sendMessage(`✅ Booking confirmed for ${bookingService.name} at ₹${bookingService.price.toLocaleString('en-IN')}. Booking ID: ${booking.id}`);
        }}
      />

      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }
        @keyframes scanLine { 0% { left: -100%; } 100% { left: 200%; } }
        .spinning { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
