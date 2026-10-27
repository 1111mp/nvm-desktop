import {
  floatingSurfaceClassName,
  floatingOptionClassName,
} from './ui/surface-styles';
import { Boxes, Folder, HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const workspaceStyles = {
  popover: `${floatingSurfaceClassName} p-1.5`,
  option: floatingOptionClassName,
  primaryAction:
    'h-9 gap-2 rounded-xl border-0 bg-primary/10 bg-linear-to-br from-primary/5 to-transparent px-3.5 text-xs text-foreground shadow-xs shadow-primary/5 hover:bg-primary/15',
  refreshAction:
    'group h-8 gap-2 rounded-lg border-0 bg-muted/40 px-3 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground',
  removeAction:
    'h-7 gap-1.5 rounded-lg border-0 bg-muted/50 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
  select:
    'h-8 w-full min-w-0 rounded-lg border-0 bg-muted/50 text-xs shadow-none hover:bg-muted/80',
  dialog:
    'flex w-[clamp(28rem,calc(26rem+8vw),36rem)] max-w-[calc(100dvw-2rem)]! max-h-[calc(100dvh-3rem)] flex-col gap-5 overflow-hidden rounded-2xl p-[clamp(1rem,3dvh,1.75rem)] ring-0 shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.28),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.16)] dark:shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.65),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.4)]',
  footer:
    'm-0 flex! shrink-0 flex-row justify-end gap-2 rounded-xl border-0 bg-muted/40 p-3',
};

export function WorkspaceOverview({
  projectCount,
  groupCount,
  installedCount,
  mode,
}: {
  projectCount: number;
  groupCount: number;
  installedCount: number;
  mode: 'projects' | 'groups';
}) {
  const { t } = useTranslation();
  const Icon = mode === 'projects' ? Folder : Boxes;
  return (
    <section
      aria-label={t('Workspace')}
      className='flex shrink-0 flex-wrap items-center gap-4 rounded-xl bg-muted/40 bg-linear-to-br from-primary/10 via-primary/3 to-transparent p-4 dark:from-primary/15 dark:via-primary/5'
    >
      <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-xs'>
        <Icon className='size-5' strokeWidth={1.5} />
      </span>
      <div className='min-w-32 flex-1 space-y-1'>
        <p className='text-xs text-muted-foreground'>{t('Workspace')}</p>
        <p className='text-sm font-medium'>
          {t(mode === 'projects' ? 'Project-Count' : 'Group-Count', {
            count: mode === 'projects' ? projectCount : groupCount,
          })}
        </p>
      </div>
      {[
        {
          label: mode === 'projects' ? 'Groups' : 'Projects',
          count: mode === 'projects' ? groupCount : projectCount,
          icon: mode === 'projects' ? Boxes : Folder,
        },
        { label: 'Installed', count: installedCount, icon: HardDrive },
      ].map(({ label, count, icon: StatIcon }) => (
        <div key={label} className='min-w-24 rounded-lg bg-card/80 px-3 py-2'>
          <p className='text-xl font-medium tabular-nums'>{count}</p>
          <p className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
            <StatIcon className='size-3' />
            {t(label)}
          </p>
        </div>
      ))}
    </section>
  );
}
