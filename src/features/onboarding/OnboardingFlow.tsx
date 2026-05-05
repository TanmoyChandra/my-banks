import React, { useState } from 'react';
import SplashScreenOne from './SplashScreenOne';
import SplashScreenTwo from './SplashScreenTwo';
import UserEntryScreen from './UserEntryScreen';

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  if (step === 0) return <SplashScreenOne onNext={() => setStep(1)} />;
  if (step === 1) return <SplashScreenTwo onNext={() => setStep(2)} />;
  return <UserEntryScreen />;
}
