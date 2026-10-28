import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import {
  Check,
  ChevronDown,
  Copy,
  Layers,
  RefreshCw,
  Terminal,
  Unplug,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useNavigation,
  useRouteError,
} from 'react-router';
import { Button } from './ui';

function getErrorDetails(error: unknown): string {
  // Loaders may throw route responses or strings rather than Error instances.
  if (isRouteErrorResponse(error)) {
    const message = `${error.status} ${error.statusText}`;
    return typeof error.data === 'string'
      ? `${message}\n${error.data}`
      : message;
  }
  if (error instanceof Error) return error.stack || error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error, null, 2) || '';
  } catch {
    return String(error);
  }
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const [copiedText, copy] = useCopyToClipboard();
  const details = getErrorDetails(error) || t('Error-Unknown');
  const pending = navigation.state !== 'idle';

  return (
    <section
      aria-labelledby='route-error-title'
      className='relative isolate flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-radial-[ellipse_at_50%_30%] from-primary/6 via-transparent to-transparent'
      />
      <div className='m-auto w-full max-w-lg px-1 py-[clamp(1.5rem,5dvh,3.5rem)]'>
        <div className='flex flex-col items-center text-center'>
          <div
            aria-hidden='true'
            className='relative mb-5 grid h-32 w-48 place-items-center sm:h-36'
          >
            <span className='absolute inset-x-5 inset-y-2 rounded-full bg-primary/8 blur-2xl' />
            <span className='absolute size-28 rotate-12 rounded-[2rem] bg-linear-to-br from-primary/12 via-primary/4 to-transparent sm:size-32' />
            <span className='absolute size-22 -rotate-6 rounded-3xl bg-linear-to-br from-card via-card to-muted shadow-xl shadow-foreground/8' />
            <Unplug
              className='relative size-9 text-primary'
              strokeWidth={1.25}
            />
            <span className='absolute top-5 right-8 size-2 rounded-full bg-primary/25' />
            <span className='absolute bottom-6 left-7 size-1.5 rounded-full bg-primary/15' />
          </div>
          <span className='mb-3 inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1 text-[0.625rem] font-medium tracking-wide text-muted-foreground'>
            <span
              aria-hidden='true'
              className='size-1.5 rounded-full bg-primary/70'
            />
            {isRouteErrorResponse(error)
              ? `${error.status} · ${t('Error-Status')}`
              : t('Error-Status')}
          </span>
          <h1
            id='route-error-title'
            className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'
          >
            {t('Error-Title')}
          </h1>
          <p className='mt-3 max-w-80 text-sm leading-6 text-muted-foreground'>
            {t('Error-Description')}
          </p>
          <div className='mt-6 flex flex-wrap justify-center gap-2.5'>
            <Button
              className='h-9 rounded-lg px-5 shadow-md shadow-primary/10'
              disabled={pending}
              onClick={() => navigate(pathname, { replace: true })}
            >
              <RefreshCw className={pending ? 'animate-spin' : ''} />
              {t('Retry')}
            </Button>
            {pathname !== '/versions' && (
              <Button
                className='h-9 rounded-lg px-4'
                variant='ghost'
                disabled={pending}
                onClick={() => navigate('/versions', { replace: true })}
              >
                <Layers />
                {t('Versions')}
              </Button>
            )}
          </div>
        </div>
        <details className='group mt-8 rounded-xl bg-surface-35 transition-colors hover:bg-surface-hover-55 open:bg-surface-hover-55'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden'>
            <span className='flex items-center gap-2.5'>
              <Terminal className='size-3.5 opacity-60' />
              {t('Error-Details')}
            </span>
            <ChevronDown className='size-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none' />
          </summary>
          <div className='px-4 pb-4'>
            <div className='mb-2 flex justify-end'>
              <Button size='xs' variant='ghost' onClick={() => copy(details)}>
                {copiedText === details ? <Check /> : <Copy />}
                {t(copiedText === details ? 'Error-Copied' : 'Error-Copy')}
              </Button>
            </div>
            <pre className='max-h-[min(15rem,32dvh)] overflow-auto rounded-lg bg-inset-80 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-muted-foreground select-text'>
              {details}
            </pre>
          </div>
        </details>
      </div>
    </section>
  );
}
