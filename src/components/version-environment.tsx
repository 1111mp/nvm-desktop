import { cn } from '@/lib/utils';
import { ArrowUpRight, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function VersionEnvironment({
  current,
  installedCount,
  releaseCount,
  destination = '/installed',
  compact = false,
}: {
  compact?: boolean;
  current: string;
  installedCount: number;
  releaseCount: number;
  destination?: '/installed' | '/versions';
}) {
  const { t } = useTranslation();
  return (
    <section
      className={cn(
        'flex shrink-0 flex-wrap items-center rounded-xl bg-surface-40 bg-linear-to-br from-primary/10 via-primary/3 to-transparent dark:from-primary/15 dark:via-primary/5',
        compact ? 'gap-3 px-3 py-2' : 'gap-3 p-4 lg:gap-4.5',
      )}
      aria-label={t('Current-Environment')}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-xs',
          compact ? 'size-8' : 'size-11.5',
        )}
      >
        <Terminal className='size-5.5' strokeWidth={1.5} />
      </div>
      <div
        className={cn(
          'min-w-30 flex-1',
          compact && 'flex flex-wrap items-center gap-x-3 gap-y-1',
        )}
      >
        <span
          className={cn(
            'block text-xs text-muted-foreground',
            !compact && 'mb-1.5',
          )}
        >
          {t('Current-Environment')}
        </span>
        <div className='flex items-center gap-3'>
          <strong
            className={cn(
              'font-mono font-medium tracking-tight',
              compact ? 'text-lg' : 'text-2xl sm:text-3xl',
            )}
          >
            {current ? `v${current}` : '—'}
          </strong>
          {current && (
            <span className='inline-flex items-center gap-1.5 rounded-md bg-primary/8 px-2 py-0.5 text-xs text-primary'>
              <span className='size-1 rounded-full bg-current' />
              {t('Current')}
            </span>
          )}
        </div>
      </div>
      <div
        className={cn(
          'flex rounded-lg bg-card/80',
          compact
            ? 'items-baseline gap-2 px-2.5 py-1'
            : 'min-w-14 flex-col gap-1 px-4 py-2 lg:min-w-22 lg:px-6',
        )}
      >
        <strong
          className={cn(
            'font-medium tabular-nums',
            compact ? 'text-lg' : 'text-2xl',
          )}
        >
          {installedCount}
        </strong>
        <span className='text-xs text-muted-foreground'>{t('Installed')}</span>
      </div>
      <div
        className={cn(
          'flex rounded-lg bg-card/80',
          compact
            ? 'items-baseline gap-2 px-2.5 py-1'
            : 'min-w-14 flex-col gap-1 px-4 py-2 lg:min-w-22 lg:px-6',
        )}
      >
        <strong
          className={cn(
            'font-medium tabular-nums',
            compact ? 'text-lg' : 'text-2xl',
          )}
        >
          {releaseCount}
        </strong>
        <span className='text-xs text-muted-foreground'>{t('Versions')}</span>
      </div>
      <Link
        className='rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground'
        to={destination}
        aria-label={t(destination === '/versions' ? 'Versions' : 'Installed')}
      >
        <ArrowUpRight className='size-4.5' />
      </Link>
    </section>
  );
}
