import { ArrowUpRight, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function VersionEnvironment({
  current,
  installedCount,
  releaseCount,
  destination = '/installed',
}: {
  current: string;
  installedCount: number;
  releaseCount: number;
  destination?: '/installed' | '/versions';
}) {
  const { t } = useTranslation();
  return (
    <section
      className='flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-surface-40 bg-linear-to-br from-primary/10 via-primary/3 to-transparent p-4 dark:from-primary/15 dark:via-primary/5 lg:gap-4.5'
      aria-label={t('Current-Environment')}
    >
      <div className='grid size-11.5 shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-xs'>
        <Terminal className='size-5.5' strokeWidth={1.5} />
      </div>
      <div className='min-w-30 flex-1'>
        <span className='mb-1.5 block text-xs text-muted-foreground'>
          {t('Current-Environment')}
        </span>
        <div className='flex items-center gap-3'>
          <strong className='font-mono text-2xl font-medium tracking-tight sm:text-3xl'>
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
      <div className='flex min-w-14 flex-col gap-1 rounded-lg bg-card/80 px-4 py-2 lg:min-w-22 lg:px-6'>
        <strong className='text-2xl font-medium tabular-nums'>
          {installedCount}
        </strong>
        <span className='text-xs text-muted-foreground'>{t('Installed')}</span>
      </div>
      <div className='flex min-w-14 flex-col gap-1 rounded-lg bg-card/80 px-4 py-2 lg:min-w-22 lg:px-6'>
        <strong className='text-2xl font-medium tabular-nums'>
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
