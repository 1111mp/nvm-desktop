import { useAppContext } from '@/app-context';
import { CodeSnippet } from '@/components/code-snippet';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui';
import { useOnboarding } from '@/hooks/use-onboarding';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  CloudDownload,
  Folder,
  Palette,
  Settings2,
  Terminal,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { onboardingSteps, type OnboardingStepId } from './steps';

function StepDetails({ step }: { step: OnboardingStepId }) {
  const { t } = useTranslation();
  const { settings } = useAppContext();
  switch (step) {
    case 'welcome':
      return (
        <div className='space-y-2'>
          {[
            { icon: CloudDownload, label: 'Onboarding-Feature-Versions' },
            { icon: Folder, label: 'Onboarding-Feature-Projects' },
            { icon: Palette, label: 'Onboarding-Feature-Appearance' },
          ].map(({ icon: Icon, label }) => (
            <p
              key={label}
              className='flex items-center gap-2.5 rounded-lg bg-surface-40 p-3 text-xs'
            >
              <Icon className='size-3.5 shrink-0 text-muted-foreground' />
              {t(label)}
            </p>
          ))}
        </div>
      );
    case 'shell':
      return (
        <div className='space-y-3'>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t(
              OS_PLATFORM === 'win32'
                ? 'Onboarding-Shell-Windows'
                : 'Tip-Content',
            )}
          </p>
          <CodeSnippet>
            {OS_PLATFORM === 'win32'
              ? '%USERPROFILE%\\.nvmd\\bin'
              : 'export NVMD_DIR="$HOME/.nvmd"\nexport PATH="$NVMD_DIR/bin:$PATH"'}
          </CodeSnippet>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t('Onboarding-Shell-Help')}
          </p>
        </div>
      );
    case 'versions':
      return (
        <div className='space-y-3'>
          {[
            {
              icon: CloudDownload,
              title: 'Install',
              description: 'Guide-Install-Description',
            },
            { icon: Check, title: 'Apply', description: 'Guide-Global' },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className='flex items-start gap-3 rounded-lg bg-surface-40 p-3'
            >
              <span className='grid size-7 shrink-0 place-items-center rounded-md bg-background'>
                <Icon className='size-3.5' />
              </span>
              <div className='space-y-1'>
                <p className='text-xs font-medium'>{t(title)}</p>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  {t(description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    case 'projects':
      return (
        <div className='space-y-3'>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t('Guide-Resolution', {
              file: settings.node_version_file || '.nvmdrc',
            })}
          </p>
          <CodeSnippet>nvmd use node_version --project</CodeSnippet>
          <p className='flex items-start gap-2 rounded-lg bg-surface-40 p-3 text-xs leading-relaxed text-muted-foreground'>
            <Boxes className='mt-0.5 size-3.5 shrink-0' />
            {t('Groups-Empty-Description')}
          </p>
        </div>
      );
    case 'appearance':
      return (
        <div className='space-y-3'>
          <p className='flex items-start gap-2 rounded-lg bg-surface-40 p-3 text-xs leading-relaxed text-muted-foreground'>
            <Palette className='mt-0.5 size-3.5 shrink-0' />
            {t('Onboarding-Appearance-Help')}
          </p>
          <p className='flex items-start gap-2 rounded-lg bg-surface-40 p-3 text-xs leading-relaxed text-muted-foreground'>
            <Settings2 className='mt-0.5 size-3.5 shrink-0' />
            {t('Onboarding-Settings-Help')}
          </p>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t('Onboarding-Directory-Note')}
          </p>
        </div>
      );
    case 'ready':
      return (
        <div className='space-y-3'>
          <CodeSnippet>node --version</CodeSnippet>
          <CodeSnippet>nvmd --help</CodeSnippet>
          <a
            href='https://github.com/1111mp/nvm-desktop/issues'
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
          >
            {t('Guide-Issues')}
            <ArrowUpRight className='size-3' />
          </a>
        </div>
      );
  }
}

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, step, dismiss, goTo } = useOnboarding(onboardingSteps.length);
  const current = onboardingSteps[step];
  const Icon = current.icon;
  const last = step === onboardingSteps.length - 1;

  return (
    <Dialog
      disablePointerDismissal
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className='flex w-[clamp(28rem,calc(24rem+20vw),52rem)] max-w-[calc(100dvw-2rem)]! max-h-[calc(100dvh-3rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 ring-0 shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.28),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.16)] dark:shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.65),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.4)]'
      >
        <header className='flex shrink-0 items-center justify-between gap-4 bg-surface-30 px-5 py-4 sm:px-6'>
          <span className='flex items-center gap-2.5 text-xs font-medium'>
            <span className='grid size-7 place-items-center rounded-lg bg-foreground text-background'>
              <Terminal className='size-3.5' />
            </span>
            NVM Desktop
            <span className='text-muted-foreground'>/ {t('Tour')}</span>
          </span>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('Close')}
            onClick={dismiss}
          >
            <X />
          </Button>
        </header>
        <div className='min-h-0 overflow-y-auto overscroll-contain'>
          <div className='grid gap-6 p-5 sm:grid-cols-[0.8fr_1.2fr] sm:p-6'>
            <div
              aria-hidden='true'
              className='relative flex min-h-36 flex-col items-center justify-center gap-5 overflow-hidden rounded-xl bg-surface-40 bg-linear-to-br from-primary/15 via-primary/4 to-transparent p-6 sm:min-h-72'
            >
              <span className='absolute size-40 rounded-full bg-primary/8 blur-2xl' />
              <span className='absolute size-28 rotate-12 rounded-3xl bg-primary/8' />
              <span className='relative grid size-22 -rotate-3 place-items-center rounded-2xl bg-card shadow-xl shadow-foreground/8'>
                <Icon className='size-9 text-primary' strokeWidth={1.4} />
              </span>
              <span className='relative rounded-full bg-background/70 px-3 py-1.5 text-[0.625rem] font-medium text-muted-foreground'>
                {String(step + 1).padStart(2, '0')} /{' '}
                {String(onboardingSteps.length).padStart(2, '0')}
              </span>
            </div>
            <div className='flex min-w-0 flex-col justify-center gap-5'>
              <div
                className='space-y-2.5'
                aria-live='polite'
                aria-atomic='true'
              >
                <DialogTitle className='text-xl font-semibold leading-tight tracking-tight sm:text-2xl'>
                  {t(current.title)}
                </DialogTitle>
                <DialogDescription className='text-sm leading-relaxed'>
                  {t(current.description)}
                </DialogDescription>
              </div>
              <StepDetails step={current.id} />
            </div>
          </div>
        </div>
        <footer className='flex shrink-0 flex-wrap items-center justify-between gap-4 bg-surface-35 px-5 py-4 sm:px-6'>
          <nav
            aria-label={t('Onboarding-Steps')}
            className='flex items-center gap-1'
          >
            {onboardingSteps.map((item, index) => (
              <button
                key={item.id}
                type='button'
                title={t(item.title)}
                aria-label={t(item.title)}
                aria-current={step === index ? 'step' : undefined}
                className='grid size-6 cursor-pointer place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring'
                onClick={() => goTo(index)}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full bg-foreground/15 transition-[width,background-color] motion-reduce:transition-none',
                    step === index && 'w-4 bg-primary',
                    index < step && 'bg-primary/40',
                  )}
                />
              </button>
            ))}
          </nav>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              onClick={dismiss}
              className='text-xs text-muted-foreground'
            >
              {t('Onboarding-Skip')}
            </Button>
            {step > 0 && (
              <Button
                variant='secondary'
                onClick={() => goTo(step - 1)}
                className='border-0 text-xs'
              >
                <ArrowLeft className='size-3.5' />
                {t('Onboarding-Back')}
              </Button>
            )}
            <Button
              className='min-w-24 border-0 text-xs'
              onClick={() => {
                if (last) {
                  dismiss();
                  navigate('/versions');
                } else goTo(step + 1);
              }}
            >
              {t(last ? 'Onboarding-Start' : 'Continue')}
              <ArrowRight className='size-3.5' />
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
