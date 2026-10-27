import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CloudDownload,
  Globe,
  LoaderCircle,
  RefreshCw,
  Rocket,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useAppUpdater, type UpdatePhase } from '@/hooks/use-app-updater';
import { formatDownloadSize, updatePercentage } from '@/lib/update-progress';
import { cn } from '@/lib/utils';

// Preview is opt-in for development and is always removed from production builds.
const PREVIEW_UPDATER =
  import.meta.env.DEV && import.meta.env.VITE_UPDATER_PREVIEW === 'true';

function ReleaseNotes({ body }: { body?: string }) {
  const { t } = useTranslation();
  return (
    <section className='flex min-w-0 flex-col gap-3'>
      <h3 className='text-xs font-semibold'>{t('Release-Notes')}</h3>
      <div className='min-h-[min(30dvh,18rem)] max-h-[min(48dvh,32rem)] flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-xl bg-muted/35 p-(--updater-card-padding) text-xs leading-relaxed text-muted-foreground select-text [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-foreground [&_p]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background/70 [&_pre]:p-3 [&_code]:break-words [&_code]:rounded-sm [&_code]:bg-background/70 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.625rem] [&_blockquote]:rounded-lg [&_blockquote]:bg-background/60 [&_blockquote]:p-3 [&_hr]:my-4 [&_hr]:border-0 [&_hr]:bg-muted [&_hr]:h-px [&_img]:max-w-full'>
        {body?.trim() ? (
          <Markdown
            components={{
              a: ({ children, ...props }) => (
                <a
                  {...props}
                  className='inline-flex items-center gap-1 text-foreground underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring'
                  target='_blank'
                  rel='noreferrer'
                >
                  {children}
                  <ArrowUpRight className='size-3 shrink-0' />
                </a>
              ),
            }}
          >
            {body}
          </Markdown>
        ) : (
          <p>{t('Updater-No-Notes')}</p>
        )}
      </div>
    </section>
  );
}

export const Updater: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(PREVIEW_UPDATER);
  const [previewPhase, setPreviewPhase] = useState<UpdatePhase>('available');
  const live = useAppUpdater({ enabled: !PREVIEW_UPDATER });
  const phase = PREVIEW_UPDATER ? previewPhase : live.phase;
  const previewComplete = phase === 'ready' || phase === 'installing';
  const updateInfo = PREVIEW_UPDATER
    ? phase === 'current' || phase === 'checking'
      ? null
      : {
          currentVersion: '4.4.0',
          version: '4.5.0',
          body: t('Updater-Preview-Notes'),
        }
    : live.updateInfo;
  const currentVersion = PREVIEW_UPDATER ? '4.4.0' : live.currentVersion;
  const progress = PREVIEW_UPDATER
    ? {
        transferred: (previewComplete ? 80 : 32) * 1024 ** 2,
        total: 80 * 1024 ** 2,
        finished: previewComplete,
      }
    : live.progress;
  const error = PREVIEW_UPDATER ? t('Updater-Preview-Error') : live.error;
  const failureStage = PREVIEW_UPDATER ? 'download' : live.failureStage;
  const { checkUpdates, download, install } = live;
  const downloading = phase === 'downloading';
  const checking = phase === 'checking' || phase === 'idle';
  const installing = phase === 'installing';
  const ready = phase === 'ready';
  const failed = phase === 'error';
  const percentage = updatePercentage(progress);
  const title = checking
    ? 'Updater-Checking'
    : phase === 'current'
      ? 'Up-to-date'
      : ready
        ? 'Updater-Ready'
        : downloading
          ? 'Updater-Downloading'
          : installing
            ? 'Updater-Installing'
            : failed
              ? 'Updater-Failed'
              : 'Updater-Available';
  const description = checking
    ? 'Updater-Checking-Description'
    : phase === 'current'
      ? 'Updater-Current-Description'
      : ready
        ? 'Upgrade-Tip'
        : downloading
          ? 'Updater-Download-Description'
          : installing
            ? 'Updater-Installing-Description'
            : failed
              ? 'Updater-Failed-Description'
              : 'Updater-Available-Description';
  const Icon =
    checking || downloading || installing
      ? LoaderCircle
      : failed
        ? TriangleAlert
        : ready || phase === 'current'
          ? CheckCheck
          : Rocket;

  const show = () => {
    setOpen(true);
    if (!PREVIEW_UPDATER && !updateInfo && !checking) void checkUpdates();
  };
  const startDownload = async () => {
    if (PREVIEW_UPDATER) {
      setPreviewPhase('downloading');
      return;
    }
    if (await download()) setOpen(true);
  };
  const installUpdate = () => {
    if (PREVIEW_UPDATER) setPreviewPhase('installing');
    else void install();
  };
  const retry = () => {
    if (PREVIEW_UPDATER) {
      setPreviewPhase('downloading');
      return;
    }
    if (failureStage === 'check') void checkUpdates();
    else if (failureStage === 'download') void startDownload();
    else void install();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!installing || PREVIEW_UPDATER) setOpen(next);
      }}
    >
      <div className='relative flex'>
        <AlertDialogTrigger asChild>
          <Button
            size='sm'
            variant='ghost'
            className='module-home-btn'
            title={t(title === 'Updater-Available' ? 'Check-Update' : title)}
            aria-label={t(
              checking || downloading || ready || installing
                ? title
                : 'Check-Update',
            )}
            aria-busy={checking || downloading || installing}
            onClick={show}
          >
            {checking || downloading || installing ? (
              <LoaderCircle className='animate-spin motion-reduce:animate-none' />
            ) : ready ? (
              <CheckCheck />
            ) : (
              <Globe />
            )}
          </Button>
        </AlertDialogTrigger>
        {updateInfo && !downloading && !installing && (
          <span
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute top-1 right-1 size-1.5 rounded-full bg-primary',
              ready && 'bg-foreground',
            )}
          />
        )}
      </div>

      <AlertDialogContent className='flex w-[clamp(36rem,calc(28rem+24vw),56rem)] max-w-[calc(100dvw-2rem)]! max-h-[min(88dvh,calc(100dvh-2rem))] [--updater-padding:clamp(1rem,min(2vw,3dvh),1.75rem)] [--updater-gap:clamp(1rem,2.5dvh,1.5rem)] [--updater-card-padding:clamp(0.875rem,2dvh,1.25rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 ring-0 shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.28),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.16)] dark:shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.65),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.4)]'>
        {PREVIEW_UPDATER && (
          <div className='flex shrink-0 flex-wrap items-center justify-between gap-2 bg-primary/10 px-(--updater-padding) py-3 text-xs'>
            <span>{t('Updater-Preview')}</span>
            <Select
              value={previewPhase}
              onValueChange={(value) => setPreviewPhase(value as UpdatePhase)}
            >
              <SelectTrigger
                aria-label={t('Updater-Preview-State')}
                className='h-7 w-40 border-0 bg-background/70 text-xs'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 'available', label: 'Updater-Available' },
                  { value: 'checking', label: 'Updater-Checking' },
                  { value: 'current', label: 'Up-to-date' },
                  { value: 'downloading', label: 'Updater-Downloading' },
                  { value: 'ready', label: 'Updater-Ready' },
                  { value: 'installing', label: 'Updater-Installing' },
                  { value: 'error', label: 'Updater-Failed' },
                ].map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {t(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className='flex shrink-0 items-start gap-3 bg-muted/40 bg-linear-to-br from-primary/8 to-transparent p-(--updater-padding)'>
          <span
            className={cn(
              'grid size-10 place-items-center rounded-xl bg-background text-primary shadow-xs',
              failed && 'text-destructive',
            )}
          >
            <Icon
              className={cn(
                'size-5',
                (checking || downloading || installing) &&
                  'animate-spin motion-reduce:animate-none',
              )}
            />
          </span>
          <div
            className='min-w-0 flex-1 space-y-1.5'
            aria-live='polite'
            aria-atomic='true'
          >
            <AlertDialogTitle className='text-lg font-semibold tracking-tight'>
              {t(title)}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs leading-relaxed'>
              {t(description)}
            </AlertDialogDescription>
          </div>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('Close')}
            disabled={installing && !PREVIEW_UPDATER}
            onClick={() => setOpen(false)}
          >
            <X />
          </Button>
        </div>
        <div
          className={cn(
            'min-h-0 space-y-(--updater-gap) overflow-y-auto overscroll-contain p-(--updater-padding)',
            updateInfo &&
              !checking &&
              'md:grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-stretch md:gap-(--updater-gap) md:space-y-0',
          )}
        >
          <div className='min-w-0 space-y-(--updater-gap)'>
            {updateInfo ? (
              <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-muted/40 p-(--updater-card-padding)'>
                <div className='min-w-0 space-y-1.5'>
                  <p className='text-[0.625rem] text-muted-foreground'>
                    {t('Current-Version')}
                  </p>
                  <p className='break-all font-mono text-lg font-medium'>
                    {updateInfo.currentVersion}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden='true'
                  className='size-4 text-muted-foreground/60'
                />
                <div className='min-w-0 space-y-1.5 rounded-lg bg-primary/8 p-3'>
                  <p className='text-[0.625rem] text-muted-foreground'>
                    {t('New-Version')}
                  </p>
                  <p className='break-all font-mono text-lg font-semibold'>
                    {updateInfo.version}
                  </p>
                </div>
              </div>
            ) : currentVersion ? (
              <div className='flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-(--updater-card-padding)'>
                <span className='text-xs text-muted-foreground'>
                  {t('Current-Version')}
                </span>
                <span className='font-mono text-sm font-medium'>
                  {currentVersion}
                </span>
              </div>
            ) : null}
            {checking && (
              <div className='flex items-center gap-3 rounded-xl bg-muted/35 p-(--updater-card-padding) text-xs text-muted-foreground'>
                <LoaderCircle className='size-4 animate-spin motion-reduce:animate-none' />
                {t('Updater-Checking-Description')}
              </div>
            )}
            {(downloading ||
              ready ||
              installing ||
              (failed && failureStage !== 'check')) && (
              <section className='space-y-4 rounded-xl bg-muted/35 p-(--updater-card-padding)'>
                <div className='flex items-center justify-between gap-3 text-xs'>
                  <span className='font-medium'>
                    {t(
                      ready || installing
                        ? 'Updater-Downloaded'
                        : progress.finished
                          ? 'Updater-Preparing'
                          : 'Download-Progress',
                    )}
                  </span>
                  {percentage !== undefined && (
                    <span className='font-mono tabular-nums text-muted-foreground'>
                      {Math.floor(percentage)}%
                    </span>
                  )}
                </div>
                {percentage !== undefined ? (
                  <Progress
                    value={percentage}
                    aria-label={t('Download-Progress')}
                    className='h-2 bg-primary/10'
                  />
                ) : (
                  <div
                    role='progressbar'
                    aria-label={t('Download-Progress')}
                    className='h-2 overflow-hidden rounded-full bg-primary/10'
                  >
                    <span
                      className={cn(
                        'block h-full w-1/3 rounded-full bg-primary/50',
                        downloading &&
                          'animate-pulse motion-reduce:animate-none',
                      )}
                    />
                  </div>
                )}
                <p className='text-xs tabular-nums text-muted-foreground'>
                  {formatDownloadSize(progress.transferred, i18n.language)}
                  {progress.total
                    ? ` / ${formatDownloadSize(progress.total, i18n.language)}`
                    : ''}
                </p>
                <ol className='grid grid-cols-3 gap-2 text-[0.625rem] text-muted-foreground'>
                  {[
                    {
                      label: 'Install-Download',
                      done: ready || installing,
                      active: downloading,
                    },
                    {
                      label: 'Updater-Ready-Step',
                      done: installing,
                      active: ready,
                    },
                    {
                      label: 'Updater-Restart-Step',
                      done: false,
                      active: installing,
                    },
                  ].map(({ label, done, active }) => (
                    <li
                      key={label}
                      className={cn(
                        'flex items-center gap-1.5',
                        (done || active) && 'font-medium text-foreground',
                      )}
                    >
                      {done ? (
                        <Check className='size-3 shrink-0 text-primary' />
                      ) : (
                        <span
                          className={cn(
                            'size-1.5 shrink-0 rounded-full bg-muted-foreground/25',
                            active && 'bg-primary',
                          )}
                        />
                      )}
                      {t(label)}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {ready && (
              <p className='flex items-start gap-2 rounded-lg bg-primary/7 p-3 text-xs leading-relaxed text-muted-foreground'>
                <Check className='mt-0.5 size-3.5 shrink-0 text-primary' />
                {t('Updater-Restart-Notice')}
              </p>
            )}
            {failed && (
              <div
                role='alert'
                className='space-y-2 rounded-xl bg-destructive/5 p-4'
              >
                <p className='flex items-center gap-2 text-xs font-medium text-destructive'>
                  <TriangleAlert className='size-3.5' />
                  {t(
                    failureStage === 'check'
                      ? 'Updater-Check-Failed'
                      : failureStage === 'download'
                        ? 'Updater-Download-Failed'
                        : failureStage === 'restart'
                          ? 'Updater-Restart-Failed'
                          : 'Updater-Install-Failed',
                  )}
                </p>
                {error && (
                  <p className='max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-[0.625rem] leading-relaxed text-muted-foreground select-text'>
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
          {updateInfo && !checking && <ReleaseNotes body={updateInfo.body} />}
        </div>
        <AlertDialogFooter className='m-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-none border-0 bg-muted/40 px-(--updater-padding) py-[clamp(0.75rem,2dvh,1.25rem)]'>
          {!installing && (
            <Button variant='ghost' onClick={() => setOpen(false)}>
              {t(
                downloading
                  ? 'Updater-Background'
                  : ready || phase === 'available'
                    ? 'Updater-Later'
                    : 'Close',
              )}
            </Button>
          )}
          {phase === 'available' && (
            <Button onClick={startDownload} className='min-w-28 border-0'>
              <CloudDownload />
              {t('Updater-Download')}
            </Button>
          )}
          {ready && (
            <Button onClick={installUpdate} className='min-w-28 border-0'>
              <RefreshCw />
              {t('Quit-And-Install')}
            </Button>
          )}
          {installing && (
            <Button disabled className='min-w-28 border-0'>
              <LoaderCircle className='animate-spin motion-reduce:animate-none' />
              {t('Updater-Installing')}
            </Button>
          )}
          {failed && (
            <Button onClick={retry} className='min-w-24 border-0'>
              <RefreshCw />
              {t('Retry')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
