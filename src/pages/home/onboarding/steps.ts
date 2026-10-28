import {
  CheckCheck,
  CloudDownload,
  Folder,
  Palette,
  Rocket,
  Terminal,
} from 'lucide-react';

export const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Onboarding-Welcome-Title',
    description: 'Onboarding-Welcome-Description',
    icon: Rocket,
  },
  {
    id: 'shell',
    title: 'Onboarding-Shell-Title',
    description: 'Onboarding-Shell-Description',
    icon: Terminal,
  },
  {
    id: 'versions',
    title: 'Onboarding-Versions-Title',
    description: 'Onboarding-Versions-Description',
    icon: CloudDownload,
  },
  {
    id: 'projects',
    title: 'Onboarding-Projects-Title',
    description: 'Onboarding-Projects-Description',
    icon: Folder,
  },
  {
    id: 'appearance',
    title: 'Onboarding-Appearance-Title',
    description: 'Onboarding-Appearance-Description',
    icon: Palette,
  },
  {
    id: 'ready',
    title: 'Onboarding-Ready-Title',
    description: 'Onboarding-Ready-Description',
    icon: CheckCheck,
  },
] as const;

export type OnboardingStepId = (typeof onboardingSteps)[number]['id'];
