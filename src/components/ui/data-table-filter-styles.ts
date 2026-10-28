import { floatingSurfaceClassName } from './surface-styles';

export const tableFilterStyles = {
  trigger:
    'h-8 gap-2 rounded-lg border-0 bg-surface-40 px-3 text-xs font-medium text-muted-foreground shadow-none hover:bg-surface-hover-80 hover:text-foreground data-popup-open:bg-surface-hover-100 data-popup-open:text-foreground',
  activeTrigger:
    'bg-primary/10 text-foreground hover:bg-primary/15 data-popup-open:bg-primary/15',
  headerTrigger:
    'h-7 gap-2 rounded-md border-0 px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-background/60 hover:text-foreground data-popup-open:bg-background/70',
  popover: `${floatingSurfaceClassName} gap-0 overflow-hidden p-0`,
  menu: 'w-56 rounded-xl p-1.5',
  option: 'min-h-9 gap-2.5 rounded-lg px-2.5 py-2 text-xs',
  footer: 'flex items-center justify-between gap-2 bg-surface-30 px-3 py-2',
};
