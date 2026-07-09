import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  Upload, 
  Send, 
  Search, 
  Trash2, 
  Edit2, 
  Plus, 
  X, 
  Volume2, 
  RefreshCw, 
  Camera, 
  ChevronRight, 
  Info,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  time: string;
  status?: 'sent' | 'read';
  imageSrc?: string;
  isDiagnostic?: boolean;
  diagnosisData?: {
    issue: string;
    confidence: number;
    cost: string;
    time: string;
    advice: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export default function AIAssistant() {
  /* --- Tab Control inside AI Hub --- */
  const [activeTab, setActiveTab] = useState<'chat' | 'vision' | 'telemetry' | 'safety'>('chat');
  
  /* --- Conversations / History State --- */
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: '🔋 Dead Battery Diagnosis',
      timestamp: 'Today',
      messages: [
        { id: '1', text: "Hello! I am your AI Roadside Assistant. What is the current issue with your vehicle? Select one of the presets or describe it in detail below.", sender: 'ai', time: '10:30 AM', status: 'read' },
        { id: '2', text: "My battery is dead. Car won't start.", sender: 'user', time: '10:31 AM', status: 'read' },
        { 
          id: '3', 
          text: "🔍 AI DIAGNOSIS: Vehicle battery voltage critical. Requires jump start or battery replacement.\n\nMatching dispatcher carries premium replacement batteries compatible with your model.", 
          sender: 'ai', 
          time: '10:31 AM', 
          status: 'read',
          isDiagnostic: true,
          diagnosisData: {
            issue: "Voltage Under 11.2V (Dead Cell)",
            confidence: 94,
            cost: "$85 - $130",
            time: "15 min dispatch",
            advice: "Turn off all electronics (lights, radio, AC) immediately. Do not crank repeatedly as it can damage your starter motor."
          }
        }
      ]
    },
    {
      id: 'conv-2',
      title: '🔧 Flat Tire Emergency',
      timestamp: 'Yesterday',
      messages: [
        { id: '1', text: "Hello! I am your AI Roadside Assistant. What is the current issue with your vehicle?", sender: 'ai', time: 'Yesterday', status: 'read' }
      ]
    },
    {
      id: 'conv-3',
      title: '💨 Engine Overheating Check',
      timestamp: 'Previous Week',
      messages: [
        { id: '1', text: "Engine temperature gauge is high.", sender: 'user', time: 'Last Wed', status: 'read' }
      ]
    }
  ]);
  
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  
  /* --- Chat Interface States --- */
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  /* --- Voice Assistant States --- */
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es' | 'hi'>('en');
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(false);
  
  /* --- AI Image Diagnosis States --- */
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [visionDiagnosisResult, setVisionDiagnosisResult] = useState<{
    issue: string;
    confidence: number;
    cost: string;
    time: string;
    advice: string;
  } | null>(null);
  
  /* --- Dashboard warning light grid states --- */
  const [activeWarningLight, setActiveWarningLight] = useState<string | null>(null);
  
  /* --- Repair Cost Estimator States --- */
  const [estimatorBrand, setEstimatorBrand] = useState('Tesla');
  const [estimatorModel, setEstimatorModel] = useState('Model Y');
  const [estimatorProblem, setEstimatorProblem] = useState('Battery Dead');
  const [estimatorCity, setEstimatorCity] = useState('Boston');
  const [estimationData, setEstimationData] = useState({
    parts: 120,
    labor: 85,
    duration: '30-45 mins',
    range: '$190 - $225'
  });
  
  /* --- Vehicle Health Report State --- */
  const [healthMetrics, setHealthMetrics] = useState({
    battery: 88,
    tire: 92,
    engine: 98,
    oil: 74,
    brake: 85,
    coolant: 90
  });
  const [isHealthScanning, setIsHealthScanning] = useState(false);

  /* --- Glowing Orb Canvas Animation --- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let width = (canvas.width = 160);
    let height = (canvas.height = 160);
    let time = 0;
    
    // Particle system inside orb
    const particles: Array<{ x: number; y: number; r: number; speed: number; angle: number; color: string }> = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 40,
        y: height / 2 + (Math.random() - 0.5) * 40,
        r: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        angle: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? '#8B5CF6' : '#2563EB'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Outer atmospheric glow glow rings
      const pulseFactor = 1 + Math.sin(time * 3) * 0.05 * (isVoiceListening ? 2.5 : 1);
      
      // Draw outer glowing shadows
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, 60 * pulseFactor);
      glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
      glowGrad.addColorStop(0.4, 'rgba(37, 99, 235, 0.25)');
      glowGrad.addColorStop(0.8, 'rgba(139, 92, 246, 0.05)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70 * pulseFactor, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw central orb core
      const coreGrad = ctx.createRadialGradient(centerX - 10, centerY - 10, 5, centerX, centerY, 35);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#93c5fd');
      coreGrad.addColorStop(0.7, '#2563eb');
      coreGrad.addColorStop(1, '#6d28d9');
      
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
      ctx.fill();
      
      // Orbiting energy fields
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 48 + Math.sin(time) * 4, 0, Math.PI * 2);
      ctx.stroke();
      
      // Particles movement
      particles.forEach((p) => {
        p.angle += 0.015;
        p.x = centerX + Math.cos(p.angle) * (30 + Math.sin(time + p.speed) * 10);
        p.y = centerY + Math.sin(p.angle) * (30 + Math.cos(time + p.speed) * 10);
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Voice wave nodes
      if (isVoiceListening) {
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          const waveHeight = Math.sin(a * 4 + time * 15) * 6;
          const rx = centerX + Math.cos(a) * (42 + waveHeight);
          const ry = centerY + Math.sin(a) * (42 + waveHeight);
          if (a === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.stroke();
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVoiceListening]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId, isAiTyping]);

  /* --- Estimator Recalculation logic --- */
  useEffect(() => {
    let partsVal = 100;
    let laborVal = 60;
    let estDuration = '30-45 mins';
    
    const prob = estimatorProblem.toLowerCase();
    const brand = estimatorBrand.toLowerCase();
    const city = estimatorCity.toLowerCase();
    
    if (prob.includes('battery')) {
      partsVal = brand.includes('tesla') ? 160 : 90;
      laborVal = city.includes('boston') || city.includes('new york') ? 95 : 65;
      estDuration = '20-30 mins';
    } else if (prob.includes('tire') || prob.includes('flat')) {
      partsVal = brand.includes('tesla') || brand.includes('bmw') ? 85 : 45;
      laborVal = 50;
      estDuration = '15-25 mins';
    } else if (prob.includes('smoke') || prob.includes('overheat') || prob.includes('engine')) {
      partsVal = brand.includes('tesla') ? 350 : 220;
      laborVal = city.includes('boston') || city.includes('new york') ? 140 : 95;
      estDuration = '1.5 - 3 hours';
    } else if (prob.includes('brake') || prob.includes('squeal')) {
      partsVal = 130;
      laborVal = 80;
      estDuration = '45-60 mins';
    } else if (prob.includes('leak') || prob.includes('oil')) {
      partsVal = 40;
      laborVal = 70;
      estDuration = '30-50 mins';
    }
    
    // Scale on Premium Brand
    if (brand.includes('bmw') || brand.includes('tesla')) {
      partsVal = Math.round(partsVal * 1.35);
      laborVal = Math.round(laborVal * 1.25);
    }
    
    const total = partsVal + laborVal;
    const low = Math.round(total * 0.9);
    const high = Math.round(total * 1.1);
    
    setEstimationData({
      parts: partsVal,
      labor: laborVal,
      duration: estDuration,
      range: `$${low} - $${high}`
    });
  }, [estimatorBrand, estimatorModel, estimatorProblem, estimatorCity]);

  /* --- Voice Command Simulation --- */
  const toggleVoiceAssistant = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      // Trigger voice processing simulation
      if (voiceTranscript.trim()) {
        const command = voiceTranscript;
        setVoiceTranscript('');
        handleSendMessage(command);
      }
    } else {
      setIsVoiceListening(true);
      setVoiceTranscript('');
      
      // Speech recognition simulation or actual Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage === 'es' ? 'es-ES' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setVoiceTranscript(result);
        };
        
        recognition.onerror = () => {
          simulateVoiceTimeout();
        };
        
        recognition.onend = () => {
          setIsVoiceListening(false);
        };
        
        recognition.start();
      } else {
        // Fallback simulation
        simulateVoiceTimeout();
      }
    }
  };

  const simulateVoiceTimeout = () => {
    const speechSamples = {
      en: [
        "My car has a flat tire, please check nearby mechanics",
        "The battery of my SUV is dead, can I request a jump start?",
        "There is oil dripping from my engine, what should I do?"
      ],
      es: [
        "Tengo un neumático desinflado, ayúdame por favor",
        "Mi batería está muerta, necesito un mecánico",
        "El motor se está calentando demasiado"
      ],
      hi: [
        "मेरी गाड़ी का टायर पंचर हो गया है, मदद चाहिए",
        "कार की बैटरी काम नहीं कर रही है, जंप स्टार्ट चाहिए",
        "इंजन से सफेद धुआं निकल रहा है"
      ]
    };
    
    const samples = speechSamples[selectedLanguage];
    const pickedSample = samples[Math.floor(Math.random() * samples.length)];
    
    let currentText = '';
    let i = 0;
    const typingTimer = setInterval(() => {
      if (i < pickedSample.length) {
        currentText += pickedSample[i];
        setVoiceTranscript(currentText);
        i++;
      } else {
        clearInterval(typingTimer);
        setTimeout(() => {
          setIsVoiceListening(false);
          handleSendMessage(pickedSample);
        }, 800);
      }
    }, 45);
  };

  /* --- Text to Speech Simulator --- */
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (speechSynthesisActive) {
        window.speechSynthesis.cancel();
        setSpeechSynthesisActive(false);
        return;
      }
      
      const cleanText = text.replace(/🔍|🚨|🛡|🔧|🔋|💵|📍|⏰/g, '').replace(/\*\*|##/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = selectedLanguage === 'es' ? 'es-ES' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 1.05;
      
      utterance.onend = () => setSpeechSynthesisActive(false);
      utterance.onerror = () => setSpeechSynthesisActive(false);
      
      setSpeechSynthesisActive(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Voice playback simulated. Speaking: " + text);
    }
  };

  /* --- Image Scan Simulation --- */
  const handleImageUploadSimulation = (category: 'tire' | 'oil' | 'battery' | 'dash') => {
    setIsScanning(true);
    setUploadedImageName(category === 'tire' ? 'flat_tire_scan.jpg' : category === 'oil' ? 'oil_drippage_leak.jpg' : category === 'battery' ? 'battery_corroded_terminals.jpg' : 'dashboard_check_engine.jpg');
    
    const mockImageUrls = {
      tire: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=300",
      oil: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=300",
      battery: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300",
      dash: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=300"
    };

    setUploadedImage(mockImageUrls[category]);

    setTimeout(() => {
      setIsScanning(false);
      
      let res = {
        issue: "Unknown issue",
        confidence: 85,
        cost: "$40 - $100",
        time: "30 mins",
        advice: "Stand in safety."
      };
      
      if (category === 'tire') {
        res = {
          issue: "Severe Puncture / Side-wall Scuffing detected on front-left tire.",
          confidence: 97.4,
          cost: "$49 - $85 (Tire swap/patching)",
          time: "15 min dispatch ETA",
          advice: "Do not attempt to drive on a fully deflated tire as it will permanently damage your alloy wheel rim. Park safely and display warning triangle."
        };
      } else if (category === 'oil') {
        res = {
          issue: "Active Engine Oil Puddle Leak near oil pan casing gaskets.",
          confidence: 89.1,
          cost: "$120 - $210 (Gasket seals replacement)",
          time: "25-30 min mechanics arrival",
          advice: "Ensure the vehicle is turned off. Low oil levels can cause friction welding of internal engine pistons, causing total engine block destruction. Do not drive."
        };
      } else if (category === 'battery') {
        res = {
          issue: "Critical Lead-Acid Terminal Acid Corrosion build-up.",
          confidence: 93.5,
          cost: "$65 - $115 (Terminal cleaning or replacement)",
          time: "12 min rapid technician arrival",
          advice: "Wear safety goggles if checking. Corrosive acid salts can burn skin. Avoid touching with bare hands. Mobile technicians will carry wire brushes and terminal sealants."
        };
      } else if (category === 'dash') {
        res = {
          issue: "Dashboard Warning Light: Critical Engine Check (Fault Code P0302)",
          confidence: 96.2,
          cost: "$90 - $160 diagnostic scanning & tuning",
          time: "15 min towing or mechanic dispatch",
          advice: "An active engine light indicates misfiring. If it starts blinking, turn off the engine immediately to protect the catalytic converter. Towing is recommended."
        };
      }
      
      setVisionDiagnosisResult(res);
    }, 2500);
  };

  /* --- Warning Light Click Handler --- */
  const handleWarningLightClick = (lightName: string) => {
    setActiveWarningLight(lightName);
  };

  const warningLightsDetails: Record<string, {
    emoji: string;
    meaning: string;
    severity: 'Low' | 'Medium' | 'High' | 'Emergency';
    colorClass: string;
    drivable: string;
    action: string;
  }> = {
    'Check Engine': {
      emoji: '🚨',
      meaning: 'Engine management computer has detected a fault in emissions, ignition, fuel systems, or sensors.',
      severity: 'High',
      colorClass: 'warning',
      drivable: 'Yes, but only to diagnostic center. Avoid heavy acceleration. If blinking, STOP immediately.',
      action: 'Check that the gas cap is tightly closed (common sensor trigger). Scan engine OBD-II fault codes at the nearest shop.'
    },
    'Battery': {
      emoji: '🔋',
      meaning: 'Charging system voltage failure. Alternator is not providing power, and vehicle is running solely on battery reserve.',
      severity: 'Emergency',
      colorClass: 'emergency',
      drivable: 'No. The car will shut down completely in minutes once the battery drains, losing power brakes and steering.',
      action: 'Turn off all non-essential loads (radio, headlights, AC, seat heaters). Pull off immediately into a safe parking zone.'
    },
    'Oil Pressure': {
      emoji: '🛢️',
      meaning: 'Engine oil pressure drops below minimum safety thresholds. Lack of lubrication causes terminal metal-on-metal friction.',
      severity: 'Emergency',
      colorClass: 'emergency',
      drivable: 'ABSOLUTELY NOT. Operating the vehicle for even 30 seconds can destroy the engine beyond repair.',
      action: 'Turn off the ignition key instantly. Check dipstick oil levels. Add oil if empty. If it leaks immediately, call towing.'
    },
    'ABS': {
      emoji: '🚗',
      meaning: 'Anti-lock Brake System computer has malfunctioned or detected sensor debris. Emergency automatic pump modulation is disabled.',
      severity: 'Medium',
      colorClass: 'info',
      drivable: 'Yes, regular hydraulic brakes will function normally. However, tires can lock and skid during emergency stops.',
      action: 'Drive carefully and allow double braking distance. Schedule an ABS sensor diagnostic or cleaning service.'
    },
    'Airbag': {
      emoji: '🛡️',
      meaning: 'Supplemental Restraint System (SRS) fault. Airbag computers have deactivated safety collision bags.',
      severity: 'Medium',
      colorClass: 'info',
      drivable: 'Yes, but safety airbags may fail to deploy, or trigger unexpectedly during a collision.',
      action: 'Get checking as soon as possible. Avoid front-end bumps. Often triggered by loose sensor plugs under the front seat tracks.'
    },
    'Tire Pressure': {
      emoji: '💨',
      meaning: 'TPMS system has detected a tire running at least 25% below safety inflation guidelines.',
      severity: 'Medium',
      colorClass: 'warning',
      drivable: 'Yes, but drive slowly (under 40 mph) and proceed directly to an air pump. Handling will feel heavy.',
      action: 'Visually inspect for nails or flattening. Inflate to door card recommended PSI (usually 32-35 PSI). Reset TPMS light.'
    },
    'Brake Warning': {
      emoji: '🛑',
      meaning: 'Brake fluid reservoir level is critically low, or parking brake lever sensor is engaged.',
      severity: 'High',
      colorClass: 'warning',
      drivable: 'Extremely high risk. Brakes may lose pressure and pedal can sink to the floor, failing to stop.',
      action: 'Release parking brake fully. If light stays on, pull over. Check fluid reservoir. Do not drive if brakes feel spongy.'
    },
    'Coolant Temp': {
      emoji: '🌡️',
      meaning: 'Engine coolant has reached boiling threshold (usually > 230°F). System is pressurized and overheated.',
      severity: 'Emergency',
      colorClass: 'emergency',
      drivable: 'No. Continued driving will warp cylinder heads, blow head gaskets, and cause cylinder cracking.',
      action: 'Turn heater on to MAX fan speed to vent core block heat. Pull off safely. Do NOT open radiator cap while hot (causes steam burns).'
    }
  };

  /* --- Chat Action Handlers --- */
  const currentConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = {
      id: Math.random().toString(),
      text: text,
      sender: 'user',
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    // Update active conversation
    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    }));

    setChatInput('');
    setIsAiTyping(true);
    
    // Simulate AI response stream
    setTimeout(() => {
      let responseText = '';
      let isDiag = false;
      let diagData: any = undefined;
      
      const cleaned = text.toLowerCase();
      if (cleaned.includes('tire') || cleaned.includes('puncture')) {
        responseText = "🔍 AI DIAGNOSIS: Standard tire puncture or structural side-wall damage detected.\n\nSafety Advice: Park vehicle in emergency lane, put on hazard warning lights, and step behind safety guard rail immediately.";
        isDiag = true;
        diagData = {
          issue: "Side Puncture (12mm tear)",
          confidence: 96.8,
          cost: "$49 - $80",
          time: "12 min dispatch",
          advice: "Please do not stand next to active highway traffic. A technician is ready with a matching spare tire."
        };
      } else if (cleaned.includes('battery') || cleaned.includes('dead') || cleaned.includes('start')) {
        responseText = "🔍 AI DIAGNOSIS: Voltage levels have dropped critical. Likely a flat battery due to accessory drain or alternator fault.\n\nSafety Advice: Keep ignition off, avoid cranking repeatedly as it damages the starter.";
        isDiag = true;
        diagData = {
          issue: "Low Voltage / Battery Dead Cell",
          confidence: 92.4,
          cost: "$75 - $125",
          time: "15 min dispatch",
          advice: "Turn off all headlights and dashboard items. Certified mechanics are close by with jumper systems and battery spares."
        };
      } else if (cleaned.includes('smoke') || cleaned.includes('overheat') || cleaned.includes('engine')) {
        responseText = "🚨 HIGH CRITICAL ALERT: Cooling system malfunction or oil gasket leakage. Running the engine now risks permanent engine seizure.\n\nSafety Advice: Pull over immediately, switch off the ignition, and get to a safe zone behind a guard rail. Dispatching high-capacity tow flatbed.";
        isDiag = true;
        diagData = {
          issue: "Cooling Circuit Failure / Boil-over",
          confidence: 98.1,
          cost: "$120 - $220 (Flatbed Towing)",
          time: "18 min tow truck ETA",
          advice: "Do not attempt to open the radiator cap until the engine cools for at least 30 minutes. Pressurized steam can cause severe burns."
        };
      } else {
        responseText = "🔍 AI DIAGNOSIS: Custom diagnostic query processed. Your coordinates have been synced to nearby dispatch hubs. Based on description, we recommend connecting with a mobile mechanic to run OBD diagnostics.";
        isDiag = true;
        diagData = {
          issue: "Unspecified engine system code check",
          confidence: 81.5,
          cost: "$80 - $140",
          time: "20 min mechanic ETA",
          advice: "Check if your dashboard warning lights are on, and upload an image if possible to improve system accuracy."
        };
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        text: responseText,
        sender: 'ai',
        time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        isDiagnostic: isDiag,
        diagnosisData: diagData
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            messages: [...c.messages, aiMsg]
          };
        }
        return c;
      }));
      
      setIsAiTyping(false);
      
      // Speak AI response automatically if user used voice
      if (isVoiceListening) {
        speakText(responseText);
      }
    }, 1500);
  };

  const handleStartNewChat = () => {
    const newId = 'conv-' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: '🤖 New Diagnostic Chat',
      timestamp: 'Today',
      messages: [
        { 
          id: '1', 
          text: "Hello! I am your AI Roadside Assistant. What is the current issue with your vehicle? Select one of the presets or describe it in detail below.", 
          sender: 'ai', 
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }), 
          status: 'read' 
        }
      ]
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newId);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (activeConvId === id && filtered.length > 0) {
      setActiveConvId(filtered[0].id);
    }
  };

  const handleRenameConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentTitle = conversations.find(c => c.id === id)?.title || '';
    const newTitle = prompt("Enter new title for conversation:", currentTitle);
    if (newTitle && newTitle.trim()) {
      setConversations(prev => prev.map(c => {
        if (c.id === id) {
          return { ...c, title: newTitle.trim() };
        }
        return c;
      }));
    }
  };

  /* --- Start Health Scanner --- */
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
        coolant: Math.floor(Math.random() * 12) + 85
      });
      setIsHealthScanning(false);
    }, 2000);
  };

  const filteredHistory = conversations.filter(c => 
    c.title.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <div className="ai-assistant-wrapper">
      
      {/* 1. SIDEBAR CHAT HISTORY */}
      <aside className="ai-sidebar ai-glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>📚 AI Scan History</h3>
          <button 
            onClick={handleStartNewChat}
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Start New Conversation"
          >
            <Plus size={14} /> New Chat
          </button>
        </div>
        
        <div className="ai-history-search">
          <Search size={14} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search diagnostics..." 
            value={searchHistoryQuery}
            onChange={(e) => setSearchHistoryQuery(e.target.value)}
          />
        </div>
        
        <div className="ai-history-list">
          {['Today', 'Yesterday', 'Previous Week'].map(group => {
            const groupConvs = filteredHistory.filter(c => c.timestamp === group);
            if (groupConvs.length === 0) return null;
            
            return (
              <React.Fragment key={group}>
                <div className="ai-history-group">{group}</div>
                {groupConvs.map(c => (
                  <div 
                    key={c.id} 
                    className={`ai-history-item ${activeConvId === c.id ? 'active' : ''}`}
                    onClick={() => setActiveConvId(c.id)}
                  >
                    <div className="ai-history-item-content">
                      <span>💬</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                    </div>
                    <div className="ai-history-item-actions">
                      <button 
                        className="ai-history-action-btn" 
                        onClick={(e) => handleRenameConversation(c.id, e)}
                        title="Rename"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button 
                        className="ai-history-action-btn" 
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
        
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)' }}></div>
            <span>Diagnostics Telemetry Synced</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* SUB NAVIGATION BAR */}
        <div className="ai-glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, textAlign: 'left' }}>RoadRescue AI Assistant</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Core Model 3.5 Active • GPS Engaged</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              💬 Chat & Voice
            </button>
            <button 
              onClick={() => setActiveTab('vision')}
              className={`btn ${activeTab === 'vision' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              📸 Image Diagnosis
            </button>
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`btn ${activeTab === 'telemetry' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              📈 Telemetry Health
            </button>
            <button 
              onClick={() => setActiveTab('safety')}
              className={`btn ${activeTab === 'safety' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
            >
              🚨 SOS Guide
            </button>
          </div>
        </div>

        {/* 2. CHAT & VOICE HUB */}
        {activeTab === 'chat' && (
          <div className="ai-module-grid">
            
            {/* LEFT CHAT AREA */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '520px', position: 'relative' }}>
              
              {currentConv.messages.length <= 1 ? (
                /* HERO SCREEN WHEN NEW CHAT */
                <div className="ai-orb-hero animate-slide-up">
                  <div className="ai-orb-container">
                    <canvas ref={canvasRef} className="ai-orb-canvas" />
                    <div className="ai-orb-visual"></div>
                    <div className="ai-orb-halo-1"></div>
                    <div className="ai-orb-halo-2"></div>
                  </div>
                  
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>Meet RoadRescue AI Assistant</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '460px', marginBottom: '1.5rem' }}>
                    Your intelligent roadside companion. Diagnose vehicle problems, estimate repair costs, and locate nearby mechanics in seconds.
                  </p>
                  
                  <div style={{ width: '100%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>
                      💡 Quick Presets:
                    </div>
                    <div className="ai-suggested-grid">
                      <button onClick={() => handleSendMessage("🔋 My car won't start")} className="ai-suggested-btn">
                        <span>🔋</span> My car won't start
                      </button>
                      <button onClick={() => handleSendMessage("🔧 I have a flat tire")} className="ai-suggested-btn">
                        <span>🔧</span> Flat tire help
                      </button>
                      <button onClick={() => handleSendMessage("💨 Engine is overheating / smoking")} className="ai-suggested-btn">
                        <span>💨</span> Engine overheating
                      </button>
                      <button onClick={() => handleSendMessage("🛢️ Oil level warning light is on")} className="ai-suggested-btn">
                        <span>🛢️</span> Strange oil leakage
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ACTIVE CHAT FEED */
                <>
                  <div className="chatbot-body" style={{ flexGrow: 1, paddingRight: '0.5rem' }}>
                    {currentConv.messages.map((msg) => (
                      <div key={msg.id} className={`chat-message ${msg.sender}`} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          
                          {/* Message Content */}
                          <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                          
                          {/* If AI Diagnostic Card */}
                          {msg.isDiagnostic && msg.diagnosisData && (
                            <div style={{ 
                              marginTop: '0.75rem', 
                              background: 'var(--light-surface)', 
                              padding: '0.75rem', 
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-light)',
                              borderLeft: '4px solid var(--primary)',
                              fontSize: '0.82rem'
                            }}>
                              <div style={{ fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                <Sparkles size={14} /> AI Diagnostic Summary
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                                <strong>Issue:</strong> <span>{msg.diagnosisData.issue}</span>
                                <strong>Confidence:</strong> <span>{msg.diagnosisData.confidence}% match</span>
                                <strong>Est. Cost:</strong> <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{msg.diagnosisData.cost}</span>
                                <strong>Est. Time:</strong> <span>{msg.diagnosisData.time}</span>
                              </div>
                              
                              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <strong>⚠️ Safety Note:</strong> {msg.diagnosisData.advice}
                              </div>
                              
                              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={() => speakText(msg.text)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                                >
                                  <Volume2 size={12} /> Play Voice
                                </button>
                                <button 
                                  onClick={() => setActiveTab('safety')}
                                  className="btn btn-emergency" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  🚨 View SOS Steps
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Timestamp & Status */}
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginTop: '0.25rem' }}>
                            {msg.time} {msg.sender === 'user' && (msg.status === 'read' ? '✓✓' : '✓')}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {isAiTyping && (
                      <div className="chatbot-typing" style={{ display: 'inline-flex', padding: '0.6rem 1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Core analyzing</span>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </>
              )}

              {/* Chat Input Bar */}
              <div className="chatbot-footer" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                <input 
                  type="text" 
                  placeholder="Ask a question or describe your emergency..." 
                  className="chatbot-input" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                  disabled={isAiTyping}
                />
                
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    onClick={toggleVoiceAssistant}
                    className={`chatbot-action-btn ${isVoiceListening ? 'active' : ''}`}
                    style={{ position: 'relative', overflow: 'visible', color: isVoiceListening ? 'var(--secondary)' : 'var(--text-secondary)' }}
                    title="Talk to AI (Voice to Text)"
                  >
                    <Mic size={16} />
                    {isVoiceListening && (
                      <span className="map-pulse-circle" style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: 'var(--secondary)' }}></span>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('vision')}
                    className="chatbot-action-btn"
                    title="AI Image diagnosis upload"
                  >
                    <Camera size={16} />
                  </button>
                  <button 
                    onClick={() => handleSendMessage(chatInput)} 
                    className="chatbot-action-btn send"
                    disabled={isAiTyping || !chatInput.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE MODULES IN CHAT TAB: SMART SUGGESTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* VOICE MODAL POPUP OR WIDGET */}
              {isVoiceListening && (
                <div className="ai-glass-panel" style={{ background: 'var(--primary-glow)', borderColor: 'var(--primary)', textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <div style={{ display: 'flex', justifySelf: 'center', marginBottom: '1rem' }}>
                    <div className="voice-pulse-btn">
                      <Mic size={32} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>Listening Live...</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', minHeight: '32px' }}>
                    {voiceTranscript || "Start speaking, describing your car symptoms..."}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <select 
                      value={selectedLanguage}
                      onChange={(e: any) => setSelectedLanguage(e.target.value)}
                      className="auth-input-field"
                      style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.5rem', width: 'auto', background: 'var(--light-bg)' }}
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español (ES)</option>
                      <option value="hi">हिंदी (HI)</option>
                    </select>
                    
                    <button 
                      onClick={() => setIsVoiceListening(false)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.2,0.5rem', fontSize: '0.75rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SMART SUGGESTION CARDS */}
              <div className="ai-glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={16} color="var(--ai-purple)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Smart AI Recommendations</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  <div className="db-timeline-item completed" style={{ paddingLeft: '1.5rem', fontSize: '0.8rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 2 }}>📍</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Nearest Tow Service</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Express Tow Boston (1.4 mi) • 14 min arrival ETA</span>
                  </div>
                  
                  <div className="db-timeline-item completed" style={{ paddingLeft: '1.5rem', fontSize: '0.8rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 2 }}>🔧</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Recommended Repair Shop</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Eastside Auto Center (2.0 mi) • specializes in Hybrid/EV</span>
                  </div>
                  
                  <div className="db-timeline-item completed" style={{ paddingLeft: '1.5rem', fontSize: '0.8rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 2 }}>📋</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Warranty Information</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Engine diagnostic covered under RoadRescue Gold policy.</span>
                  </div>

                </div>
              </div>

              {/* NOTIFICATION FEED */}
              <div className="ai-glass-panel">
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔔 Smart Alerts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--accent)', borderRadius: '4px' }}>
                    <strong>Low battery voltage detected</strong>: Battery capacity at 22%. Diagnostic replacement advised.
                  </div>
                  <div style={{ padding: '0.5rem', background: 'rgba(230, 240, 255, 0.5)', borderLeft: '3px solid var(--primary)', borderRadius: '4px' }}>
                    <strong>Weather Warning</strong>: High heat warnings. Engine coolant lines under stress.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. VISION & SENSOR HUB */}
        {activeTab === 'vision' && (
          <div className="ai-module-grid">
            
            {/* IMAGE UPLOAD DIAGNOSIS */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📸 AI Vision Engine Scanner
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Upload or drag a photo of your engine bay leak, tire wear, warning lights, or battery terminals.
              </p>

              {/* Drag and Drop Container */}
              <div className={`ai-scan-container ${isScanning ? 'scanning' : ''}`} style={{ border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '2rem 1rem', textAlign: 'center', position: 'relative' }}>
                
                {isScanning && <div className="ai-scan-laser"></div>}
                
                {uploadedImage ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded Scan" 
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <button 
                      onClick={() => { setUploadedImage(null); setVisionDiagnosisResult(null); }}
                      style={{ position: 'absolute', top: 5, right: 5, padding: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                    
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      📄 {uploadedImageName}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem', display: 'inline-block' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Drag & Drop Image Here</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', margin: '0.25rem 0' }}>Supports JPEG, PNG up to 8MB</span>
                    
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => handleImageUploadSimulation('tire')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>🚗 Punctured Tire</button>
                      <button onClick={() => handleImageUploadSimulation('oil')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>🛢️ Oil Leak</button>
                      <button onClick={() => handleImageUploadSimulation('battery')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>🔋 Acid Battery</button>
                      <button onClick={() => handleImageUploadSimulation('dash')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>🚨 Dashboard Warning</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnosis Output Result Panel */}
              {isScanning && (
                <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(37,99,235,0.04)', borderRadius: '8px' }}>
                  <RefreshCw size={24} className="spinning" style={{ display: 'inline-block', marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Analyzing visual pixels...</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Executing diagnostic matrix & confidence calculations...</span>
                </div>
              )}

              {visionDiagnosisResult && !isScanning && (
                <div className="animate-slide-up" style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: '8px', borderLeft: '4px solid var(--secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle size={16} /> Image Diagnosis Successful
                    </div>
                    <span style={{ fontSize: '0.8rem', background: 'var(--secondary-glow)', color: '#16a34a', padding: '2px 8px', borderRadius: '99px', fontWeight: 800 }}>
                      {visionDiagnosisResult.confidence}% Confidence
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>Detected Issue:</strong> {visionDiagnosisResult.issue}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--light-bg)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Estimated Repair Cost</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{visionDiagnosisResult.cost}</strong>
                      </div>
                      <div style={{ padding: '0.5rem', background: 'var(--light-bg)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Repair Duration</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{visionDiagnosisResult.time}</strong>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent)', borderRadius: '4px', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      <strong>⚠️ Safety Advice:</strong> {visionDiagnosisResult.advice}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          const userText = `📸 Vision Diagnosis: ${visionDiagnosisResult.issue}`;
                          handleSendMessage(userText);
                          setActiveTab('chat');
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', flexGrow: 1 }}
                      >
                        Ask AI About This
                      </button>
                      <button 
                        onClick={() => alert("Connecting live technician dispatch...")}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                      >
                        Dispatch Mechanic
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INTERACTIVE WARNING LIGHT SCANNER GRID */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚙️ Warning Light Scanner
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click an icon to diagnose</span>
              </div>
              
              <div className="warning-lights-grid">
                {Object.keys(warningLightsDetails).map((light) => (
                  <div 
                    key={light}
                    onClick={() => handleWarningLightClick(light)}
                    className={`warning-light-card ${activeWarningLight === light ? 'active' : ''}`}
                  >
                    <span className="warning-light-icon">
                      {light === 'Check Engine' && '🔧'}
                      {light === 'Battery' && '🔋'}
                      {light === 'Oil Pressure' && '🛢️'}
                      {light === 'ABS' && '🛑'}
                      {light === 'Airbag' && '🎈'}
                      {light === 'Tire Pressure' && '💨'}
                      {light === 'Brake Warning' && '⛔'}
                      {light === 'Coolant Temp' && '🌡️'}
                    </span>
                    <span className="warning-light-label">{light}</span>
                  </div>
                ))}
              </div>

              {/* Warning Light Detailed explanation */}
              {activeWarningLight ? (
                <div className="animate-slide-up" style={{ 
                  padding: '1rem', 
                  background: 'var(--light-surface)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {warningLightsDetails[activeWarningLight].emoji} {activeWarningLight}
                    </h4>
                    
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      background: warningLightsDetails[activeWarningLight].severity === 'Emergency' ? 'rgba(239, 68, 68, 0.15)' : warningLightsDetails[activeWarningLight].severity === 'High' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: warningLightsDetails[activeWarningLight].severity === 'Emergency' ? '#dc2626' : warningLightsDetails[activeWarningLight].severity === 'High' ? '#d97706' : '#2563eb'
                    }}>
                      {warningLightsDetails[activeWarningLight].severity} Severity
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Meaning:</strong> {warningLightsDetails[activeWarningLight].meaning}</div>
                    <div>
                      <strong>Can you drive?</strong> <br />
                      <span style={{ color: warningLightsDetails[activeWarningLight].severity === 'Emergency' ? '#dc2626' : 'var(--text-primary)', fontWeight: 700 }}>
                        {warningLightsDetails[activeWarningLight].drivable}
                      </span>
                    </div>
                    
                    <div style={{ padding: '0.5rem', background: 'var(--light-bg)', borderRadius: '6px', borderLeft: '3px solid var(--primary)', fontSize: '0.78rem' }}>
                      <strong>🔧 Recommended Action:</strong> {warningLightsDetails[activeWarningLight].action}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          handleSendMessage(`🚨 Tell me more about my ${activeWarningLight} warning light.`);
                          setActiveTab('chat');
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', flexGrow: 1 }}
                      >
                        Ask AI Diagnostic
                      </button>
                      
                      {warningLightsDetails[activeWarningLight].severity === 'Emergency' && (
                        <button 
                          onClick={() => {
                            alert("Calling dispatch centers immediately...");
                          }}
                          className="btn btn-emergency"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Request SOS Tow
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Info size={18} style={{ display: 'inline-block', marginBottom: '0.25rem' }} />
                  <div>Select any warning symbol above to display details, severity, drivability check, and required troubleshooting actions.</div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 4. TELEMETRY & REPAIR ESTIMATOR */}
        {activeTab === 'telemetry' && (
          <div className="ai-module-grid">
            
            {/* VEHICLE HEALTH REPORT DASHBOARD */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📈 Vehicle Telemetry Health
                </h3>
                <button 
                  onClick={triggerHealthScan}
                  disabled={isHealthScanning}
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <RefreshCw size={12} className={isHealthScanning ? 'spinning' : ''} /> {isHealthScanning ? "Scanning..." : "Run Active Scan"}
                </button>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Real-time OBD sensor telemetry readings. Circular metrics represent structural performance levels.
              </p>

              <div className="telemetry-grid" style={{ marginTop: '0.5rem' }}>
                {Object.entries(healthMetrics).map(([metric, value]) => {
                  const radius = 24;
                  const strokeWidth = 5;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (value / 100) * circumference;
                  
                  // Color thresholds
                  let color = 'var(--primary)';
                  if (value < 75) color = 'var(--accent)';
                  else if (value < 85) color = '#f59e0b';
                  else color = 'var(--secondary)';
                  
                  return (
                    <div key={metric} className="telemetry-card">
                      <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <svg className="circle-progress-svg" width="60" height="60" viewBox="0 0 60 60">
                          <circle 
                            className="circle-progress-bg" 
                            cx="30" 
                            cy="30" 
                            r={radius} 
                            strokeWidth={strokeWidth} 
                          />
                          <circle 
                            className="circle-progress-bar" 
                            cx="30" 
                            cy="30" 
                            r={radius} 
                            strokeWidth={strokeWidth}
                            stroke={color}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                          />
                        </svg>
                        
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                          {value}%
                        </div>
                      </div>
                      
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.5rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                        {metric}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Maintenance Tip Suggestions based on values */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>💡 Personalized Care Advice</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {healthMetrics.oil < 80 && (
                    <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid #f59e0b', borderRadius: '4px' }}>
                      <strong>Oil levels running low ({healthMetrics.oil}%)</strong>: Consider topping off with synthetic oil to protect camshaft seals.
                    </div>
                  )}
                  {healthMetrics.battery < 80 && (
                    <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--accent)', borderRadius: '4px' }}>
                      <strong>Battery Capacity Declining ({healthMetrics.battery}%)</strong>: Cold starting performance is degraded. Recommend battery test.
                    </div>
                  )}
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '3px solid var(--secondary)', borderRadius: '4px' }}>
                    <strong>Engine Status Strong ({healthMetrics.engine}%)</strong>: Cylinder compression and spark timings are executing within nominal limits.
                  </div>
                </div>
              </div>
            </div>

            {/* REPAIR COST ESTIMATOR CALCULATOR */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💵 Repair Cost Estimator
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Select vehicle details to calculate realistic market rates for parts, dispatches, and labor.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Brand</label>
                  <select 
                    value={estimatorBrand}
                    onChange={(e) => setEstimatorBrand(e.target.value)}
                    className="auth-input-field"
                    style={{ height: '38px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--light-bg)' }}
                  >
                    <option>Tesla</option>
                    <option>Toyota</option>
                    <option>Ford</option>
                    <option>Honda</option>
                    <option>BMW</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Model</label>
                  <input 
                    type="text"
                    value={estimatorModel}
                    onChange={(e) => setEstimatorModel(e.target.value)}
                    className="auth-input-field"
                    style={{ height: '38px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--light-bg)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Symptoms / Problem</label>
                  <select 
                    value={estimatorProblem}
                    onChange={(e) => setEstimatorProblem(e.target.value)}
                    className="auth-input-field"
                    style={{ height: '38px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--light-bg)' }}
                  >
                    <option>Battery Dead</option>
                    <option>Flat Tire Puncture</option>
                    <option>Engine Smoking</option>
                    <option>Brake Squealing</option>
                    <option>Fluid Leakage</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>City</label>
                  <input 
                    type="text"
                    value={estimatorCity}
                    onChange={(e) => setEstimatorCity(e.target.value)}
                    className="auth-input-field"
                    style={{ height: '38px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--light-bg)' }}
                  />
                </div>
              </div>

              {/* Estimate Details Output Cards */}
              <div className="animate-slide-up" style={{ padding: '1rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Price Range</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', margin: '0.1rem 0' }}>
                    {estimationData.range}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 800 }}>
                    ⚡ Price Match Guarantee
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  <div>Parts Cost: <strong>${estimationData.parts}</strong></div>
                  <div>Labor Rate: <strong>${estimationData.labor} / hr</strong></div>
                  <div>Estimated Time: <strong>{estimationData.duration}</strong></div>
                  <div>City Factor: <strong style={{ textTransform: 'capitalize' }}>{estimatorCity} Standard</strong></div>
                </div>

                <button 
                  onClick={() => {
                    handleSendMessage(`💵 I need to request a quote for my ${estimatorBrand} ${estimatorModel} experiencing ${estimatorProblem} in ${estimatorCity}.`);
                    setActiveTab('chat');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', padding: '0.6rem' }}
                >
                  Send Quote to Chat
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 5. RECOMMENDATIONS & SOS GUIDES */}
        {activeTab === 'safety' && (
          <div className="ai-module-grid">
            
            {/* EMERGENCY ACTION PLAN */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                🚨 SOS Emergency Manuals
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Select an active hazard category. Our AI has generated safe operational guidelines.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {['Accident', 'Vehicle Fire', 'Flash Flood', 'Brake Failure', 'Engine Smoke', 'Tire Burst'].map((scenario) => (
                  <button 
                    key={scenario}
                    onClick={() => {
                      let text = "";
                      if (scenario === 'Accident') {
                        text = "🚨 **Accident Steps**:\n1. Switch on hazard warning lights.\n2. Put vehicle in park and pull handbrake.\n3. Take passengers behind highway guard rail safety barriers.\n4. Call emergency numbers.\n\nDo's: Exchange insurer details.\nDon'ts: Argue on active traffic lanes.";
                      } else if (scenario === 'Vehicle Fire') {
                        text = "🔥 **Fire Emergency**:\n1. Turn off ignition key to stop fuel pumps.\n2. Evacuate passengers at least 150 feet away.\n3. Do not open hood (oxygen vents fires).\n4. Call 911 immediately.";
                      } else {
                        text = `⚠️ **${scenario} Steps**:\n1. Turn on warning lights.\n2. Pull vehicle safely to emergency breakdown zones.\n3. Keep calm and avoid sudden braking.`;
                      }
                      
                      setConversations(prev => prev.map(c => {
                        if (c.id === activeConvId) {
                          return {
                            ...c,
                            messages: [
                              ...c.messages,
                              { id: Math.random().toString(), text: `🚨 Manual checked: ${scenario}`, sender: 'user', time: 'Just now' },
                              { id: Math.random().toString(), text: text, sender: 'ai', time: 'Just now' }
                            ]
                          };
                        }
                        return c;
                      }));
                      setActiveTab('chat');
                    }}
                    className="ai-suggested-btn"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.25)', fontSize: '0.8rem' }}
                  >
                    <span>⚠️</span> {scenario} Guide
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>📞 Direct Dispatch Hotlines</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a href="tel:911" className="btn btn-emergency" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}>
                    🚨 Call Emergency 911
                  </a>
                  <a href="tel:+18005557672" className="btn btn-secondary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}>
                    📞 RoadRescue Dispatch Hotline (+1-800-555-SOS)
                  </a>
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS MAP & LIST */}
            <div className="ai-glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📍 Local Smart Recommendations
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                AI scans your localized coordinates and recommends suitable facilities.
              </p>

              {/* Map Placeholder Vector */}
              <div style={{ height: '140px', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%' }}>
                  {/* Grid Lines representing map streets */}
                  <path d="M 0 40 L 400 40 M 0 100 L 400 100 M 120 0 L 120 150 M 280 0 L 280 150" stroke="var(--border-light)" strokeWidth="4" />
                  
                  {/* Driver Center Dot */}
                  <circle cx="120" cy="100" r="10" fill="var(--primary)" opacity="0.2" className="map-pulse-circle" />
                  <circle cx="120" cy="100" r="4" fill="var(--primary)" />
                  <text x="132" y="104" fontSize="9" fontWeight="800" fill="var(--text-primary)">You</text>
                  
                  {/* Mechanic Pin */}
                  <circle cx="280" cy="40" r="8" fill="var(--secondary)" opacity="0.3" />
                  <circle cx="280" cy="40" r="4" fill="var(--secondary)" />
                  <text x="290" y="44" fontSize="9" fontWeight="700" fill="var(--text-secondary)">Mechanic (0.8mi)</text>
                  
                  {/* Towing Pin */}
                  <circle cx="80" cy="30" r="8" fill="var(--accent)" opacity="0.3" />
                  <circle cx="80" cy="30" r="4" fill="var(--accent)" />
                  <text x="90" y="34" fontSize="9" fontWeight="700" fill="var(--text-secondary)">Tow Truck (1.2mi)</text>
                </svg>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Apex Hybrid & EV Repair</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0.8 miles away • Highly rated on Tesla Model Y issues</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Towing Pros Logistics</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1.2 miles away • Has flatbed support ready</span>
                  </div>
                  <ChevronRight size={16} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--light-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.8rem', display: 'block' }}>Boston Metro EV Supercharger</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1.5 miles away • 8 open charge terminals</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
