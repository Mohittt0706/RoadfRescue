import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Mic, Trash2, Sparkles, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface SOSStep2Props {
  data: {
    problem: string;
    description: string;
    uploadedImages: string[];
    aiReport: any;
  };
  onUpdate: (data: Partial<SOSStep2Props['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PROBLEMS = [
  { name: 'Flat Tyre', icon: '🛞' },
  { name: 'Battery', icon: '🔋' },
  { name: 'Fuel', icon: '⛽' },
  { name: 'Engine', icon: '⚙️' },
  { name: 'Accident', icon: '💥' },
  { name: 'Locked Out', icon: '🔑' },
  { name: 'Overheating', icon: '🌡️' },
  { name: 'Other', icon: '❓' },
];

const DESCRIPTIONS: Record<string, string> = {
  'Flat Tyre': 'I have a flat tyre on the rear right side. I ran over a metallic screw on the expressway. I have a spare tyre in my trunk but no mechanic jack to lift the chassis.',
  'Battery': 'My battery is completely dead. I left the headlights on for 6 hours. The engine clicked once and refused to turn over. Need emergency jump start.',
  'Fuel': 'I ran out of fuel about 2 miles before the toll bridge. The fuel gauge was reading empty for a while. I need 5 litres of fuel delivered.',
  'Engine': 'My vehicle lost all power suddenly on the highway. There is a clicking noise when trying to crank the engine, and the check engine light is flashing.',
  'Accident': 'Minor bumper crash with another vehicle at the junction. No human injuries, but the front bumper is rubbing against the front tyre, preventing driving.',
  'Locked Out': 'I accidentally locked my keys inside the car. The spare keys are at home. I need an unlock specialist with professional lockout gear.',
  'Overheating': 'Smoke and white steam are venting from beneath the hood. The dashboard temperature gauge is in the red zone. I pulled over to the side.',
  'Other': 'Stuck in mud near the roadside shoulder. Need assistance with winch recovery.',
};

export default function SOSStep2Problem({ data, onUpdate, onNext, onBack }: SOSStep2Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleProblemSelect = (problem: string) => {
    onUpdate({ problem, description: DESCRIPTIONS[problem] || '' });
  };

  const startVoiceRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      onUpdate({ description: (data.description || '') + ' Stood on Mumbai bypass route. Sudden tyre blowout. Suspect sidewall rupture. Vehicle hazard warning lights are on.' });
      setIsRecording(false);
    }, 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      onUpdate({ uploadedImages: [...data.uploadedImages, ...newImages] });
    }
  };

  const runAiDiagnosis = () => {
    setAiLoading(true);
    setTimeout(() => {
      onUpdate({
        aiReport: {
          issue: `${data.problem} - AI Diagnostic Analysis`,
          cost: data.problem === 'Flat Tyre' ? '₹699' : data.problem === 'Battery' ? '₹999' : data.problem === 'Fuel' ? '₹799 + fuel' : data.problem === 'Locked Out' ? '₹899' : '₹1,499',
          time: data.problem === 'Flat Tyre' ? '15 mins' : '10 mins',
          safety: [
            'Turn off the engine immediately and engage the parking brake.',
            'Activate your vehicle hazard warning lights.',
            'Step out of the vehicle and stand behind the highway guardrails.',
          ],
          confidence: 96,
        },
      });
      setAiLoading(false);
      onNext();
    }, 2500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="sos-glass">
        <div className="sos-step-header">
          <h2>Describe the Problem</h2>
          <p>Select the issue you are experiencing. Upload images or describe the situation for AI diagnostic estimation.</p>
        </div>

        {/* Problem Cards */}
        <div className="sos-problem-grid">
          {PROBLEMS.map(prob => (
            <motion.div
              key={prob.name}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`sos-problem-card ${data.problem === prob.name ? 'active' : ''}`}
              onClick={() => handleProblemSelect(prob.name)}
            >
              <div className="sos-problem-icon">
                <span style={{ fontSize: '1.4rem' }}>{prob.icon}</span>
              </div>
              <span className="sos-problem-label">{prob.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Description */}
        <div className="sos-form-group" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label className="sos-form-label">Describe what happened</label>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{data.description.length} / 500</span>
          </div>
          <textarea
            rows={4}
            maxLength={500}
            placeholder="Provide context (e.g. noise occurred, vehicle position)..."
            className="sos-textarea"
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />

          {/* Voice Assistant Bar */}
          <div
            onClick={startVoiceRecording}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', marginTop: '0.5rem',
              borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-light)',
              background: isRecording ? 'rgba(239, 68, 68, 0.04)' : 'var(--light-surface)',
              cursor: 'pointer', transition: 'all 0.25s',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isRecording ? 'var(--accent)' : 'var(--primary-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isRecording ? 'white' : 'var(--primary)',
            }}>
              <Mic size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                {isRecording ? 'Listening & transcribing...' : 'One-Tap Voice Assistant'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {isRecording ? 'Speak clearly into your microphone' : 'Tap to dictate issue using speech AI'}
              </div>
            </div>
            {isRecording && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                {[0, 0.2, 0.4].map(d => (
                  <div key={d} style={{
                    width: 4, height: 16, borderRadius: 2,
                    background: 'var(--accent)',
                    animation: 'typing-dot-bounce 0.6s ease-in-out infinite alternate',
                    animationDelay: `${d}s`,
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div className="sos-form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="sos-form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Upload Fault Images (Optional)</label>
          <div className="sos-upload-zone" onClick={() => document.getElementById('sos-file-input')?.click()}>
            <input type="file" id="sos-file-input" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <div className="sos-upload-icon"><Upload size={20} /></div>
            <span className="sos-upload-text">Drag & drop images here or browse files</span>
            <span className="sos-upload-hint">Support PNG, JPG, JPEG up to 10MB</span>
          </div>

          <div className="sos-ai-alert">
            <Sparkles size={18} className="sos-ai-alert-icon" />
            <span className="sos-ai-alert-text">AI Engine: Uploading images triggers automatic diagnostic fault calculations.</span>
          </div>

          {data.uploadedImages.length > 0 && (
            <div className="sos-upload-previews">
              {data.uploadedImages.map((src, i) => (
                <div key={i} className="sos-upload-preview">
                  <img src={src} alt="Upload preview" />
                  <button className="sos-upload-preview-remove" onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ uploadedImages: data.uploadedImages.filter((_, idx) => idx !== i) });
                  }}><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sos-footer-bar">
          <button className="sos-btn sos-btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <button
            className="sos-btn sos-btn-primary"
            disabled={!data.problem || aiLoading}
            onClick={runAiDiagnosis}
          >
            {aiLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Running AI Diagnosis...
              </>
            ) : (
              <>
                Run AI Diagnosis <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
