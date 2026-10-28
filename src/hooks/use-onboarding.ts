import { useCallback, useState } from 'react';
import { markOnboardingSeen, shouldShowOnboarding } from '@/lib/onboarding';

export function useOnboarding(stepCount: number) {
  const [open, setOpen] = useState(shouldShowOnboarding);
  const [step, setStep] = useState(0);
  const dismiss = useCallback(() => {
    markOnboardingSeen();
    setOpen(false);
  }, []);

  const goTo = (index: number) =>
    setStep(Math.max(0, Math.min(stepCount - 1, index)));
  return { open, step, dismiss, goTo };
}
