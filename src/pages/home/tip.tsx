import { useAppContext } from '@/app-context';
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui';
import { CodeSnippet } from '@/components/code-snippet';
import { resetOnboarding } from '@/lib/onboarding';
import {
  ArrowUpRight,
  CheckCheck,
  CloudDownload,
  Info,
  Layers,
  Sparkles,
  Terminal,
  X,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

function GuideSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className='space-y-4 rounded-xl bg-surface-35 p-4'>
      <h3 className='flex items-center gap-2 text-sm font-semibold'>
        <Icon className='size-4 text-muted-foreground' />
        {title}
      </h3>
      <div className='space-y-3 text-xs leading-relaxed text-muted-foreground'>
        {children}
      </div>
    </section>
  );
}

function Tip() {
  const { settings } = useAppContext();
  const { t } = useTranslation();
  return (
    <Drawer direction='right' handleOnly repositionInputs={false} autoFocus>
      <DrawerTrigger asChild>
        <Button
          className='nvmd-tip'
          size='sm'
          title={t('Tip')}
          aria-label={t('Tip')}
          variant='ghost'
        >
          <Info />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='gap-0'>
        <DrawerHandle aria-label={t('Drawer-Drag')} />
        <DrawerHeader className='shrink-0 gap-3 rounded-t-2xl bg-surface-40 bg-linear-to-br from-primary/8 to-transparent p-5 sm:p-6'>
          <div className='flex items-center justify-between gap-3'>
            <span className='grid size-10 place-items-center rounded-xl bg-background text-primary shadow-xs'>
              <Info className='size-5' />
            </span>
            <DrawerClose asChild>
              <Button variant='ghost' size='icon-sm' aria-label={t('Close')}>
                <X />
              </Button>
            </DrawerClose>
          </div>
          <div className='space-y-1.5'>
            <DrawerTitle className='text-xl font-semibold tracking-tight'>
              {t('Tip')}
            </DrawerTitle>
            <DrawerDescription className='max-w-sm text-xs leading-relaxed'>
              {t('Guide-Description')}
            </DrawerDescription>
          </div>
        </DrawerHeader>
        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6'>
          <GuideSection title={t('Guide-Install')} icon={CloudDownload}>
            <p>{t('Guide-Install-Description')}</p>
            {OS_PLATFORM !== 'win32' && (
              <>
                <p>{t('Tip-Content')}</p>
                <CodeSnippet>
                  {
                    'export NVMD_DIR="$HOME/.nvmd"\nexport PATH="$NVMD_DIR/bin:$PATH"'
                  }
                </CodeSnippet>
              </>
            )}
            <a
              className='inline-flex items-center gap-1.5 rounded-md text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'
              href='https://nodejs.org/dist/'
              target='_blank'
              rel='noreferrer'
            >
              nodejs.org/dist
              <ArrowUpRight className='size-3' />
            </a>
          </GuideSection>
          <GuideSection title={t('Guide-Versions')} icon={Layers}>
            <p>{t('Guide-Global')}</p>
            <p>{t('Guide-Project')}</p>
            <p className='rounded-lg bg-inset-60 p-3'>
              {t('Guide-Resolution', {
                file: settings.node_version_file || '.nvmdrc',
              })}
            </p>
          </GuideSection>
          <GuideSection title={t('Command-tools-intro')} icon={Terminal}>
            <p>{t('Guide-Commands')}</p>
            {[
              { label: 'Guide-List', command: 'nvmd list' },
              { label: 'Guide-Use', command: 'nvmd use node_version' },
              {
                label: 'Guide-Project-Use',
                command: 'nvmd use node_version --project',
              },
            ].map(({ label, command }) => (
              <div key={command} className='space-y-1.5'>
                <p className='text-[0.625rem] font-medium'>{t(label)}</p>
                <CodeSnippet>{command}</CodeSnippet>
              </div>
            ))}
            <p>{t('Guide-Refresh')}</p>
            <CodeSnippet>nvmd --help</CodeSnippet>
          </GuideSection>
          <GuideSection title={t('Guide-Verify')} icon={CheckCheck}>
            <p>{t('Guide-Verify-Description')}</p>
            <CodeSnippet>node --version</CodeSnippet>
            <a
              className='inline-flex items-center gap-1.5 rounded-md text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'
              href='https://github.com/1111mp/nvm-desktop/issues'
              target='_blank'
              rel='noreferrer'
            >
              {t('Guide-Issues')}
              <ArrowUpRight className='size-3' />
            </a>
          </GuideSection>
          <section className='space-y-3 rounded-xl bg-primary/7 p-4'>
            <h3 className='flex items-center gap-2 text-sm font-semibold'>
              <Sparkles className='size-4 text-primary' />
              {t('Tour')}
            </h3>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              {t('Guide-Tour')}
            </p>
            <Button
              variant='ghost'
              className='h-8 border-0 bg-inset-70 text-xs hover:bg-surface-hover-70'
              onClick={() => {
                if (resetOnboarding()) toast.success(t('Tour-Tip'));
                else toast.error(t('Onboarding-Reset-Failed'));
              }}
            >
              <Sparkles className='size-3.5' />
              {t('Tour-Text')}
            </Button>
          </section>
        </div>
        <DrawerFooter className='shrink-0 flex-row justify-end rounded-b-2xl bg-surface-40 px-5 py-4 sm:px-6'>
          <DrawerClose asChild>
            <Button variant='secondary' className='min-w-24 border-0'>
              {t('Close')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default Tip;
