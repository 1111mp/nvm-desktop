import { useSelector } from '@tanstack/react-store';
import type { Column, RowData } from '@tanstack/react-table';
import { ChevronDown, Circle, ListFilter, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import type { DataTableFeatures } from './data-table-features';
import { tableFilterStyles } from './data-table-filter-styles';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DataTableFacetedFilterProps<TData extends RowData, TValue> {
  column: Column<DataTableFeatures, TData, TValue>;
  title?: string;
  options: Options;
}
export type Options = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}[];

export function DataTableFacetedFilter<TData extends RowData, TValue>({
  column,
  title: titleProp,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { t } = useTranslation();
  const title = titleProp || t('Filter');
  const [open, setOpen] = useState(false);
  const filters = useSelector(column.table.atoms.columnFilters);
  const value = filters.find((filter) => filter.id === column.id)?.value;
  const selected = new Set<string>(Array.isArray(value) ? value : []);
  const facets = column.getFacetedUniqueValues();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            tableFilterStyles.trigger,
            selected.size > 0 && tableFilterStyles.activeTrigger,
          )}
          aria-label={title}
        >
          <ListFilter className='size-3.5' />
          {title}
          {selected.size > 0 && (
            <span className='grid min-w-5 place-items-center rounded-md bg-background/75 px-1 py-0.5 text-[0.625rem] tabular-nums'>
              {selected.size}
            </span>
          )}
          <ChevronDown className='size-3 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        aria-label={title}
        className={cn(
          tableFilterStyles.popover,
          'w-64 max-w-[calc(100dvw-2rem)]',
        )}
      >
        <div className='flex items-center justify-between gap-3 bg-muted/30 px-3 py-3'>
          <h3 className='text-xs font-semibold'>{title}</h3>
          <span className='text-[0.625rem] text-muted-foreground'>
            {t('Table-Selected', { count: selected.size })}
          </span>
        </div>
        <Command className='rounded-none! p-1.5 [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-muted/50'>
          <CommandInput
            placeholder={t('Table-Search', { field: title })}
            aria-label={t('Table-Search', { field: title })}
            className='text-xs'
          />
          <CommandList className='max-h-[min(18rem,40dvh)]'>
            <CommandEmpty className='px-3 py-6 text-xs text-muted-foreground'>
              {t('No-results')}
            </CommandEmpty>
            <CommandGroup className='p-1'>
              {options.map((option) => {
                const active = selected.has(option.value);
                const Icon = option.icon || Circle;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label]}
                    data-checked={active}
                    aria-checked={active}
                    className={cn(
                      tableFilterStyles.option,
                      '[&>svg:last-child]:ml-0 data-selected:bg-primary/8',
                      active && 'bg-primary/5',
                    )}
                    onSelect={() => {
                      // Build the next selection from the subscribed state, without mutating render data.
                      const next = new Set(selected);
                      if (active) next.delete(option.value);
                      else next.add(option.value);
                      column.setFilterValue(next.size ? [...next] : undefined);
                    }}
                  >
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-lg bg-muted/50 text-muted-foreground',
                        active && 'bg-primary/10 text-foreground',
                      )}
                    >
                      <Icon className='size-3.5' />
                    </span>
                    <span className='min-w-0 flex-1'>{option.label}</span>
                    <span className='min-w-5 rounded-md bg-muted/60 px-1 py-0.5 text-center font-mono text-[0.625rem] tabular-nums text-muted-foreground'>
                      {facets.get(option.value) ?? 0}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className={tableFilterStyles.footer}>
          <Button
            variant='ghost'
            size='xs'
            disabled={!selected.size}
            className='gap-1.5 border-0 text-xs text-muted-foreground'
            onClick={() => column.setFilterValue(undefined)}
          >
            <RotateCcw className='size-3' />
            {t('Clear-Filters')}
          </Button>
          <Button
            variant='secondary'
            size='xs'
            className='border-0 text-xs'
            onClick={() => setOpen(false)}
          >
            {t('OK')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
