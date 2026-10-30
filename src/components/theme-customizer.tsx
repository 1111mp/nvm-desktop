import { Check, Palette, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, PopoverContent, PopoverTrigger } from './ui';

import { useAppContext } from '@/app-context';
import { cn } from '@/lib/utils';

const BASE_COLOR_DATA = [
  {
    name: 'neutral',
    label: 'Neutral',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.145 0 0)',
    },
  },
  {
    name: 'stone',
    label: 'Stone',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.147 0.004 49.25)',
    },
  },
  {
    name: 'zinc',
    label: 'Zinc',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.141 0.005 285.823)',
    },
  },
  {
    name: 'mauve',
    label: 'Mauve',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.145 0.008 326)',
    },
  },
  {
    name: 'olive',
    label: 'Olive',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.153 0.006 107.1)',
    },
  },
  {
    name: 'mist',
    label: 'Mist',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.148 0.004 228.8)',
    },
  },
  {
    name: 'taupe',
    label: 'Taupe',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'oklch(0.147 0.004 49.3)',
    },
  },
];
const FULL_THEME_DATA = [
  {
    name: 'claude',
    label: 'Claude',
    activeColor: {
      light: 'oklch(0.62 0.14 39.15)',
      dark: 'oklch(0.67 0.13 38.92)',
    },
  },
  {
    name: 'clean_slate',
    label: 'Clean Slate',
    activeColor: {
      light: 'oklch(0.59 0.20 277.06)',
      dark: 'oklch(0.68 0.16 276.93)',
    },
  },
  {
    name: 'corporate',
    label: 'Corporate',
    activeColor: {
      light: 'oklch(0.48 0.20 260.47)',
      dark: 'oklch(0.56 0.24 260.92)',
    },
  },
  {
    name: 'marvel',
    label: 'Marvel',
    activeColor: {
      light: 'oklch(0.55 0.22 27.03)',
      dark: 'oklch(0.55 0.22 27.03)',
    },
  },
  {
    name: 'nature',
    label: 'Nature',
    activeColor: {
      light: 'oklch(0.52 0.13 144.33)',
      dark: 'oklch(0.67 0.16 144.06)',
    },
  },
  {
    name: 'pastel_dreams',
    label: 'Pastel',
    activeColor: {
      light: 'oklch(0.71 0.16 293.40)',
      dark: 'oklch(0.79 0.12 295.97)',
    },
  },
  {
    name: 'perplexity',
    label: 'Perplexity',
    activeColor: {
      light: 'oklch(0.72 0.12 210.36)',
      dark: 'oklch(0.72 0.12 210.36)',
    },
  },
  {
    name: 'summer',
    label: 'Summer',
    activeColor: {
      light: 'oklch(0.70 0.17 28.12)',
      dark: 'oklch(0.70 0.17 28.12)',
    },
  },
  {
    name: 'vs_code',
    label: 'Vs Code',
    activeColor: {
      light: 'oklch(0.71 0.15 239.15)',
      dark: 'oklch(0.71 0.15 239.15)',
    },
  },
];
const THEME_DATA = [
  {
    name: 'amber',
    label: 'Amber',
    activeColor: {
      light: 'oklch(0.555 0.163 48.998)',
      dark: 'oklch(0.473 0.137 46.201)',
    },
  },
  {
    name: 'blue',
    label: 'Blue',
    activeColor: {
      light: 'oklch(0.488 0.243 264.376)',
      dark: 'oklch(0.424 0.199 265.638)',
    },
  },
  {
    name: 'cyan',
    label: 'Cyan',
    activeColor: {
      light: 'oklch(0.52 0.105 223.128)',
      dark: 'oklch(0.45 0.085 224.283)',
    },
  },
  {
    name: 'emerald',
    label: 'Emerald',
    activeColor: {
      light: 'oklch(0.508 0.118 165.612)',
      dark: 'oklch(0.432 0.095 166.913)',
    },
  },
  {
    name: 'fuchsia',
    label: 'Fuchsia',
    activeColor: {
      light: 'oklch(0.518 0.253 323.949)',
      dark: 'oklch(0.452 0.211 324.591)',
    },
  },
  {
    name: 'green',
    label: 'Green',
    activeColor: {
      light: 'oklch(0.532 0.157 131.589)',
      dark: 'oklch(0.453 0.124 130.933)',
    },
  },
  {
    name: 'indigo',
    label: 'Indigo',
    activeColor: {
      light: 'oklch(0.457 0.24 277.023)',
      dark: 'oklch(0.398 0.195 277.366)',
    },
  },
  {
    name: 'lime',
    label: 'Lime',
    activeColor: {
      light: 'oklch(0.532 0.157 131.589)',
      dark: 'oklch(0.453 0.124 130.933)',
    },
  },
  {
    name: 'orange',
    label: 'Orange',
    activeColor: {
      light: 'oklch(0.553 0.195 38.402)',
      dark: 'oklch(0.47 0.157 37.304)',
    },
  },
  {
    name: 'pink',
    label: 'Pink',
    activeColor: {
      light: 'oklch(0.525 0.223 3.958)',
      dark: 'oklch(0.459 0.187 3.815)',
    },
  },
  {
    name: 'purple',
    label: 'Purple',
    activeColor: {
      light: 'oklch(0.496 0.265 301.924)',
      dark: 'oklch(0.438 0.218 303.724)',
    },
  },
  {
    name: 'red',
    label: 'Red',
    activeColor: {
      light: 'oklch(0.505 0.213 27.518)',
      dark: 'oklch(0.444 0.177 26.899)',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    activeColor: {
      light: 'oklch(0.514 0.222 16.935)',
      dark: 'oklch(0.455 0.188 13.697)',
    },
  },
  {
    name: 'sky',
    label: 'Sky',
    activeColor: {
      light: 'oklch(0.5 0.134 242.749)',
      dark: 'oklch(0.443 0.11 240.79)',
    },
  },
  {
    name: 'teal',
    label: 'Teal',
    activeColor: {
      light: 'oklch(0.511 0.096 186.391)',
      dark: 'oklch(0.437 0.078 188.216)',
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    activeColor: {
      light: 'oklch(0.491 0.27 292.581)',
      dark: 'oklch(0.432 0.232 292.759)',
    },
  },
  {
    name: 'yellow',
    label: 'Yellow',
    activeColor: {
      light: 'oklch(0.852 0.199 91.936)',
      dark: 'oklch(0.795 0.184 86.047)',
    },
  },
];
export const RADII = [
  {
    name: 'default',
    label: 'Default',
    value: '',
  },
  {
    name: 'none',
    label: 'None',
    value: '0',
  },
  {
    name: 'small',
    label: 'Small',
    value: '0.45rem',
  },
  {
    name: 'medium',
    label: 'Medium',
    value: '0.625rem',
  },
  {
    name: 'large',
    label: 'Large',
    value: '0.875rem',
  },
];

// Local theme classes let each preset preview its own semantic tokens in either mode.
function ThemePreview() {
  return (
    <span
      aria-hidden='true'
      className='flex h-12 w-full gap-1 rounded-md bg-background p-1.5'
    >
      <span className='flex w-5 shrink-0 flex-col gap-1 rounded-sm bg-muted p-1'>
        <span className='h-1 rounded-full bg-primary' />
        <span className='h-1 rounded-full bg-foreground/15' />
        <span className='h-1 rounded-full bg-foreground/15' />
      </span>
      <span className='flex flex-1 flex-col gap-1.5 p-0.5'>
        <span className='h-1 w-1/2 rounded-full bg-foreground/60' />
        <span className='flex flex-1 gap-1'>
          <span className='flex-1 rounded-sm bg-primary/20' />
          <span className='flex-1 rounded-sm bg-muted' />
        </span>
        <span className='h-1 w-2/3 rounded-full bg-foreground/15' />
      </span>
    </span>
  );
}

export function ThemeCustomizer() {
  const { color, updateColor } = useAppContext();
  const { t } = useTranslation();
  const [remSize, setRemSize] = useState(0);
  const selectionClassName =
    'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover';

  return (
    <Popover
      onOpenChange={(open) => {
        // Radix positioning expects measured units; derive them from rem on each opening.
        if (open)
          setRemSize(
            parseFloat(getComputedStyle(document.documentElement).fontSize),
          );
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id='theme-customizer'
            size='sm'
            title={t('Theme')}
            aria-label={t('Theme')}
            variant='ghost'
          >
            <Palette />
          </Button>
        }
      />
      <PopoverContent
        side='right'
        align='end'
        sideOffset={remSize * 0.75}
        collisionPadding={{
          top: remSize * 3,
          right: remSize,
          bottom: remSize,
          left: remSize,
        }}
        aria-label={t('Theme')}
        className='z-40 w-[clamp(32rem,40vw,38rem)] max-w-[calc(100dvw-2rem)] max-h-(--available-height) gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.28),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.16)] ring-1 ring-surface-edge dark:shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.65),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.4)]'
      >
        <div className='flex shrink-0 items-center justify-between gap-3 bg-surface-50 bg-linear-to-br from-primary/8 to-transparent px-[clamp(1.25rem,1.5vw,1.5rem)] py-4'>
          <div className='flex items-center gap-3'>
            <span className='grid size-9 place-items-center rounded-xl bg-background text-primary shadow-xs'>
              <Palette className='size-4' />
            </span>
            <div>
              <h2 className='text-sm font-semibold'>{t('Theme')}</h2>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                {t('Theme-Tip')}
              </p>
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon-sm'
            title={t('Reset')}
            aria-label={t('Reset')}
            onClick={() =>
              updateColor({
                baseColor: 'neutral',
                theme: '',
                radius: '',
              })
            }
          >
            <RotateCcw className='size-3.5' />
          </Button>
        </div>
        <div className='@container min-h-0 space-y-4 overflow-y-auto overscroll-contain p-[clamp(1.25rem,1.5vw,1.5rem)]'>
          <fieldset className='min-w-0 space-y-2'>
            <legend className='text-xs font-medium'>{t('Base Color')}</legend>
            <div className='grid grid-cols-7 gap-1.5'>
              {BASE_COLOR_DATA.map(({ name, label }) => {
                const isActive = color.baseColor === name;
                return (
                  <button
                    key={name}
                    type='button'
                    aria-label={label}
                    aria-pressed={isActive}
                    title={label}
                    onClick={() => {
                      // Full presets override base tokens; leave the preset so the chosen base is visible.
                      const isFullTheme = FULL_THEME_DATA.some(
                        ({ name }) => name === color.theme,
                      );
                      updateColor({
                        baseColor: name,
                        ...(isFullTheme
                          ? {
                              theme: '',
                            }
                          : {}),
                      });
                    }}
                    className={cn(
                      selectionClassName,
                      'flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-lg py-2 hover:bg-muted',
                      isActive && 'bg-primary/8',
                    )}
                  >
                    <span
                      className={`color-${name} relative flex h-9 w-full overflow-hidden rounded-md shadow-xs`}
                    >
                      <span aria-hidden='true' className='flex-1 bg-muted' />
                      <span aria-hidden='true' className='flex-1 bg-border' />
                      <span
                        aria-hidden='true'
                        className='flex-1 bg-muted-foreground'
                      />
                      {isActive && (
                        <span className='absolute inset-0 grid place-items-center'>
                          <span className='grid size-4 place-items-center rounded-full bg-background text-foreground shadow-xs'>
                            <Check className='size-3' />
                          </span>
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[0.625rem] text-muted-foreground',
                        isActive && 'font-medium text-foreground',
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className='min-w-0 space-y-2'>
            <legend className='text-xs font-medium'>{t('Full Theme')}</legend>
            <div className='grid grid-cols-3 gap-2 @min-[28rem]:grid-cols-5'>
              {FULL_THEME_DATA.map(({ name, label }) => {
                const isActive = color.theme === name;
                return (
                  <button
                    key={name}
                    type='button'
                    aria-pressed={isActive}
                    onClick={() =>
                      updateColor({
                        theme: isActive ? '' : name,
                      })
                    }
                    className={cn(
                      selectionClassName,
                      'group cursor-pointer rounded-lg bg-surface-40 p-1.5 text-left hover:bg-muted',
                      isActive && 'bg-primary/10',
                    )}
                  >
                    <span className={`theme-${name} block rounded-md`}>
                      <ThemePreview />
                    </span>
                    <span className='flex items-center justify-between gap-1 px-0.5 pt-2 pb-0.5 text-[0.625rem]'>
                      <span
                        className={cn(
                          'truncate text-muted-foreground group-hover:text-foreground',
                          isActive && 'font-medium text-foreground',
                        )}
                      >
                        {label}
                      </span>
                      <span className='size-3 shrink-0'>
                        {isActive && <Check className='size-3 text-primary' />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className='min-w-0 space-y-2'>
            <legend className='text-xs font-medium'>{t('Accent-Color')}</legend>
            <div className='grid grid-cols-8 justify-items-center gap-3 @min-[28rem]:grid-cols-9'>
              {THEME_DATA.map(({ name, label, activeColor }) => {
                const isActive = color.theme === name;
                return (
                  <button
                    key={name}
                    type='button'
                    title={label}
                    aria-label={label}
                    aria-pressed={isActive}
                    onClick={() =>
                      updateColor({
                        theme: isActive ? '' : name,
                      })
                    }
                    // CSS variables resolve the swatch mode with the same dark variant as the app, including system mode.
                    style={
                      {
                        '--swatch-light': activeColor.light,
                        '--swatch-dark': activeColor.dark,
                      } as React.CSSProperties
                    }
                    className={cn(
                      selectionClassName,
                      'group grid size-8 cursor-pointer place-items-center rounded-full hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-6 place-items-center rounded-full bg-(--swatch-light) text-background shadow-xs transition-[transform,box-shadow] group-hover:scale-110 motion-reduce:transition-none dark:bg-(--swatch-dark)',
                        isActive &&
                          'shadow-[0_0_0_0.1875rem_var(--popover),0_0_0_0.3125rem_color-mix(in_oklab,var(--swatch-light),transparent_60%)] dark:shadow-[0_0_0_0.1875rem_var(--popover),0_0_0_0.3125rem_color-mix(in_oklab,var(--swatch-dark),transparent_45%)]',
                      )}
                    >
                      {isActive && (
                        <span className='grid size-3.5 place-items-center rounded-full bg-background text-foreground'>
                          <Check className='size-2.5' strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className='min-w-0 space-y-2'>
            <legend className='text-xs font-medium'>{t('Radius')}</legend>
            <div className='grid grid-cols-5 gap-1 rounded-xl bg-surface-60 p-1'>
              {RADII.map(({ name, label, value }) => {
                const isActive = (color.radius || 'default') === name;
                return (
                  <button
                    key={name}
                    type='button'
                    aria-pressed={isActive}
                    onClick={() =>
                      updateColor({
                        radius: name,
                      })
                    }
                    className={cn(
                      selectionClassName,
                      'flex cursor-pointer flex-col items-center gap-2 rounded-lg px-1 py-2.5 text-muted-foreground hover:text-foreground',
                      isActive && 'bg-background text-foreground shadow-xs',
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className='size-5 bg-current/15'
                      style={{
                        borderRadius: value || '0.625rem',
                      }}
                    />
                    <span className='text-[0.625rem]'>{t(label)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </PopoverContent>
    </Popover>
  );
}
