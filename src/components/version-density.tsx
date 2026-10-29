import { AlignJustify, List } from 'lucide-react';
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
  const Icon = density === 'compact' ? AlignJustify : List;
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
            {t(
              density === 'compact' ? 'Density-Compact' : 'Density-Comfortable',
            )}
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
              if (value === 'compact' || value === 'comfortable')
                setDensity(value);
            }}
          >
            <DropdownMenuRadioItem
              value='comfortable'
              className='gap-2.5 pr-10 whitespace-nowrap'
              closeOnClick
            >
              <List data-icon='inline-start' />
              {t('Density-Comfortable')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value='compact'
              className='gap-2.5 pr-10 whitespace-nowrap'
              closeOnClick
            >
              <AlignJustify data-icon='inline-start' />
              {t('Density-Compact')}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
