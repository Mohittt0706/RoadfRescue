import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface SOSStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function SOSStepper({ steps, currentStep }: SOSStepperProps) {
  return (
    <div className="sos-stepper">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} style={{ display: 'contents' }}>
            <div className={`sos-stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="sos-stepper-circle">
                {isCompleted ? <Check size={16} strokeWidth={3} /> : stepNum}
              </div>
              <span className="sos-stepper-label">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`sos-stepper-connector ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
