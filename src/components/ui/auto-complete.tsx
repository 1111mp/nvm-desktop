import { Autocomplete as AutocompletePrimitive } from '@base-ui/react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group';
import {
  floatingOptionClassName,
  floatingSurfaceClassName,
} from './surface-styles';

type GroupItem = { value: string; items: string[] };
type AutoCompleteProps = Omit<
  React.ComponentProps<typeof AutocompletePrimitive.Input>,
  'value' | 'defaultValue' | 'onChange' | 'className' | 'render'
> & {
  value?: string;
  items?: GroupItem[];
  container?: React.ComponentProps<
    typeof AutocompletePrimitive.Portal
  >['container'];
  onChange?: (value: string) => void;
  className?: string;
  title?: string;
  icon?: LucideIcon;
};

function AutoComplete({
  value: controlledValue,
  container,
  items = [],
  onChange,
  className,
  title,
  icon: Icon,
  disabled,
  onFocus,
  ...props
}: AutoCompleteProps) {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState('');
  const [open, setOpen] = useState(false);
  const value = controlledValue ?? internalValue;
  const groups = items.filter((group) => group.items.length > 0);
  return (
    <AutocompletePrimitive.Root
      items={groups}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      openOnInputClick
      value={value}
      filter={() => true}
      onValueChange={(next) => {
        // Autocomplete's string value supports custom input and follows external form resets.
        if (controlledValue === undefined) setInternalValue(next);
        onChange?.(next);
      }}
    >
      <AutocompletePrimitive.InputGroup
        render={
          <InputGroup
            className={cn(
              'h-9 w-full rounded-lg border-0 bg-muted/40 shadow-none has-[[data-slot=input-group-control]:focus-visible]:ring-2',
              className,
            )}
          />
        }
      >
        {Icon && (
          <InputGroupAddon>
            <Icon className='size-3.5 text-muted-foreground' />
          </InputGroupAddon>
        )}
        <AutocompletePrimitive.Input
          {...props}
          disabled={disabled}
          onFocus={(event) => {
            onFocus?.(event);
            // Show presets for keyboard focus as well as pointer interaction.
            if (!disabled && !event.defaultPrevented) setOpen(true);
          }}
          render={
            <InputGroupInput className='h-9 font-mono text-xs md:text-xs' />
          }
        />
        <InputGroupAddon align='inline-end'>
          <AutocompletePrimitive.Trigger
            disabled={disabled}
            aria-label={t('Settings-Show-Presets', { field: title || '' })}
            render={
              <InputGroupButton
                size='icon-xs'
                variant='ghost'
                className='text-muted-foreground'
              />
            }
          >
            <ChevronDown className='size-3.5' />
          </AutocompletePrimitive.Trigger>
        </InputGroupAddon>
      </AutocompletePrimitive.InputGroup>
      <AutocompletePrimitive.Portal container={container}>
        <AutocompletePrimitive.Positioner align='start' className='z-50'>
          <AutocompletePrimitive.Popup
            className={cn(
              floatingSurfaceClassName,
              'group/autocomplete w-(--anchor-width) min-w-0 max-w-(--available-width) origin-(--transform-origin) overflow-hidden data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
            )}
          >
            {title && (
              <div className='bg-muted/30 px-3 py-3 text-xs font-semibold'>
                {title}
              </div>
            )}
            <AutocompletePrimitive.List className='max-h-[min(20rem,calc(var(--available-height)-6rem))] overflow-y-auto overscroll-contain p-1.5'>
              {(group: GroupItem) => (
                <AutocompletePrimitive.Group
                  key={group.value}
                  items={group.items}
                >
                  <AutocompletePrimitive.GroupLabel className='px-2.5 pt-2 pb-1 text-[0.625rem] font-medium text-muted-foreground'>
                    {group.value}
                  </AutocompletePrimitive.GroupLabel>
                  <AutocompletePrimitive.Collection>
                    {(item: string) => (
                      <AutocompletePrimitive.Item
                        key={item}
                        value={item}
                        className={cn(
                          floatingOptionClassName,
                          'flex cursor-default items-start px-2.5 text-popover-foreground outline-none',
                          item === value && 'bg-primary/5',
                        )}
                      >
                        <span className='min-w-0 flex-1 break-all font-mono text-xs leading-relaxed'>
                          {item}
                        </span>
                        {item === value && (
                          <Check className='mt-0.5 size-3.5 shrink-0' />
                        )}
                      </AutocompletePrimitive.Item>
                    )}
                  </AutocompletePrimitive.Collection>
                </AutocompletePrimitive.Group>
              )}
            </AutocompletePrimitive.List>
            <AutocompletePrimitive.Empty className='px-3 py-4 text-xs text-muted-foreground'>
              {t('No-results')}
            </AutocompletePrimitive.Empty>
            <p className='bg-muted/30 px-3 py-2.5 text-[0.625rem] leading-relaxed text-muted-foreground'>
              {t('Settings-Custom-Value-Help')}
            </p>
          </AutocompletePrimitive.Popup>
        </AutocompletePrimitive.Positioner>
      </AutocompletePrimitive.Portal>
    </AutocompletePrimitive.Root>
  );
}

export { AutoComplete };
