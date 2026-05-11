import React, { useState } from 'react';
import IconSplashScreen from './IconSplashScreen';
import UserEntryScreen from './UserEntryScreen';

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  if (step === 0) return <IconSplashScreen onNext={() => setStep(1)} />;
  return <UserEntryScreen />;
}
