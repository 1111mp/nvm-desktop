import { Button, Label, Popover, PopoverContent, PopoverTrigger } from './ui';
import { Check, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useAppContext } from '@/app-context';

const BASE_COLOR_DATA = [
  {
    name: 'neutral',
    label: 'Neutral',
    activeColor: {
      light: 'oklch(1 0 0)',
      dark: 'okloklch(0.145 0 0)',
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
  { name: 'default', label: 'Default', value: '' },
  { name: 'none', label: 'None', value: '0' },
  { name: 'small', label: 'Small', value: '0.45rem' },
  { name: 'medium', label: 'Medium', value: '0.625rem' },
  { name: 'large', label: 'Large', value: '0.875rem' },
];

export function ThemeCustomizer() {
  const { settings, color, updateColor } = useAppContext();
  const { t } = useTranslation();

  const { theme: mode } = settings;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id='theme-customizer'
          size='sm'
          title={t('Theme')}
          variant='ghost'
        >
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='z-40 w-lg rounded-xl'>
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground'>
            {t('Base Color')}
          </Label>
          <div className='grid grid-cols-4 gap-2'>
            {BASE_COLOR_DATA.map(({ name, label }) => {
              const isActive = color.baseColor === name;

              return (
                <Button
                  key={name}
                  size='sm'
                  variant='outline'
                  className={cn(
                    'flex items-center justify-between font-normal',
                    isActive && 'border-primary!',
                  )}
                  onClick={() => {
                    updateColor({ baseColor: name });
                  }}
                >
                  {label}
                  {isActive && <Check className='size-3 text-primary' />}
                </Button>
              );
            })}
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground'>
            {t('Full Theme')}
          </Label>
          <div className='grid grid-cols-4 gap-2'>
            {FULL_THEME_DATA.map(({ name, label, activeColor }) => {
              const isActive = color.theme === name;

              return (
                <Button
                  key={name}
                  size='sm'
                  variant='outline'
                  className={cn(
                    'justify-start font-normal',
                    isActive && 'border-primary!',
                  )}
                  style={
                    {
                      '--theme-primary':
                        activeColor[mode === 'dark' ? 'dark' : 'light'],
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    updateColor({ theme: isActive ? '' : name });
                  }}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-(--theme-primary) overflow-hidden',
                    )}
                  >
                    {isActive && <Check className='size-3 text-white' />}
                  </span>
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label className='gap-1 text-sm text-muted-foreground'>
            {t('Theme')}
            <span className='text-[10px]'>({t('Theme-Tip')})</span>
          </Label>
          <div className='grid grid-cols-4 gap-2'>
            {THEME_DATA.map(({ name, label, activeColor }) => {
              const isActive = color.theme === name;

              return (
                <Button
                  key={name}
                  size='sm'
                  variant='outline'
                  className={cn(
                    'justify-start font-normal',
                    isActive && 'border-primary!',
                  )}
                  style={
                    {
                      '--theme-primary':
                        activeColor[mode === 'dark' ? 'dark' : 'light'],
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    updateColor({ theme: isActive ? '' : name });
                  }}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-(--theme-primary) overflow-hidden',
                    )}
                  >
                    {isActive && <Check className='size-3 text-white' />}
                  </span>
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground'>{t('Radius')}</Label>
          <div className='grid grid-cols-4 gap-2'>
            {RADII.map(({ name, label }) => {
              const isActive = color.radius === name;

              return (
                <Button
                  key={name}
                  size='sm'
                  variant='outline'
                  className={cn(
                    'flex items-center justify-between font-normal',
                    isActive && 'border-primary!',
                  )}
                  onClick={() => {
                    updateColor({ radius: name });
                  }}
                >
                  {label}
                  {isActive && <Check className='size-3 text-primary' />}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
