import { useState, useCallback } from 'react';
import SOSStepper from './sos/SOSStepper';
import SOSStep1Location from './sos/SOSStep1Location';
import SOSStep2Problem from './sos/SOSStep2Problem';
import SOSStep3Mechanics from './sos/SOSStep3Mechanics';
import SOSStep4Tracking from './sos/SOSStep4Tracking';

interface SOSDispatchProps {
  onBack: () => void;
}

const STEPS = [
  { label: 'Location & Vehicle' },
  { label: 'Problem Details' },
  { label: 'Nearby Mechanics' },
  { label: 'Live Tracking' },
];

export default function SOSDispatch({ onBack }: SOSDispatchProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const [step1Data, setStep1Data] = useState({
    address: '120 Bandra Kurla Complex, Mumbai',
    vehicleType: 'car',
    brand: '',
    model: '',
    regNum: '',
  });

  const [step2Data, setStep2Data] = useState({
    problem: '',
    description: '',
    uploadedImages: [] as string[],
    aiReport: null as any,
  });

  const [step3Data, setStep3Data] = useState({
    selectedMechanic: null as any,
    paymentMethod: 'upi',
  });

  const updateStep1 = useCallback((update: Partial<typeof step1Data>) => {
    setStep1Data(prev => ({ ...prev, ...update }));
    if (update.brand) localStorage.setItem('rr-brand', update.brand);
    if (update.model) localStorage.setItem('rr-model', update.model);
    if (update.regNum) localStorage.setItem('rr-regnum', update.regNum);
  }, []);

  const updateStep2 = useCallback((update: Partial<typeof step2Data>) => {
    setStep2Data(prev => ({ ...prev, ...update }));
  }, []);

  return (
    <div className="sos-dispatch">
      <SOSStepper steps={STEPS} currentStep={currentStep} />

      {currentStep === 1 && (
        <SOSStep1Location
          data={step1Data}
          onUpdate={updateStep1}
          onNext={() => setCurrentStep(2)}
          onCancel={onBack}
        />
      )}

      {currentStep === 2 && (
        <SOSStep2Problem
          data={step2Data}
          onUpdate={updateStep2}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <SOSStep3Mechanics
          data={{
            problem: step2Data.problem,
            address: step1Data.address,
            ...step3Data,
            aiReport: step2Data.aiReport,
          }}
          onUpdate={(update) => {
            if ('selectedMechanic' in update) setStep3Data(prev => ({ ...prev, selectedMechanic: update.selectedMechanic }));
            if ('paymentMethod' in update) setStep3Data(prev => ({ ...prev, paymentMethod: update.paymentMethod! }));
          }}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <SOSStep4Tracking
          data={{
            problem: step2Data.problem,
            address: step1Data.address,
            selectedMechanic: step3Data.selectedMechanic,
            paymentMethod: step3Data.paymentMethod,
            aiReport: step2Data.aiReport,
          }}
          onBack={() => setCurrentStep(3)}
          onDone={onBack}
          onCancel={onBack}
        />
      )}
    </div>
  );
}
