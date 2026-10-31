import { AlignJustify, List, Rows3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useVersionDensity } from '@/hooks/use-version-density';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { workspaceStyles } from './workspace-layout';

export function VersionDensityControl() {
  const { density, setDensity } = useVersionDensity();
  const { t } = useTranslation();
  const options = {
    comfortable: { icon: List, label: 'Density-Comfortable' },
    compact: { icon: AlignJustify, label: 'Density-Compact' },
    dense: { icon: Rows3, label: 'Density-Dense' },
  } as const;
  const Icon = options[density].icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size='sm'
            variant='ghost'
            className={workspaceStyles.refreshAction}
            aria-label={t('Version-Density')}
            title={t('Version-Density')}
          >
            <Icon data-icon='inline-start' />
            {t(options[density].label)}
          </Button>
        }
      />
      <DropdownMenuContent
        align='end'
        className={cn(
          workspaceStyles.popover,
          'w-max min-w-48 max-w-(--available-width)',
        )}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('Version-Density')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={density}
            onValueChange={(value) => {
              if (
                value === 'compact' ||
                value === 'comfortable' ||
                value === 'dense'
              )
                setDensity(value);
            }}
          >
            {Object.entries(options).map(
              ([value, { icon: OptionIcon, label }]) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className='gap-2.5 pr-10 whitespace-nowrap'
                  closeOnClick
                >
                  <OptionIcon data-icon='inline-start' />
                  {t(label)}
                </DropdownMenuRadioItem>
              ),
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
