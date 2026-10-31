import { useSelector } from '@tanstack/react-store';
import type { Column, RowData } from '@tanstack/react-table';
import { Search, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './button';
import type { DataTableFeatures } from './data-table-features';
import { tableFilterStyles } from './data-table-filter-styles';
import { DataTableSearch } from './data-table-search';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<DataTableFeatures, TData, TValue>;
}

export function DataTableColumnFilterHeader<TData extends RowData, TValue>({
  column,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const value = useSelector(
    column.table.atoms.columnFilters,
    (filters) =>
      (filters.find((filter) => filter.id === column.id)?.value as
        | string
        | undefined) ?? '',
  );
  const title =
    column.columnDef.meta?.label ||
    (typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id);
  if (!column.getCanFilter()) return <span className={className}>{title}</span>;
  return (
    <div className={cn('flex w-full min-w-0 items-center', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant='ghost'
              className={cn(
                tableFilterStyles.headerTrigger,
                '-ml-2 min-w-0 max-w-full',
                value && tableFilterStyles.activeTrigger,
              )}
              aria-label={t('Table-Filter-Column', {
                field: title,
              })}
            >
              <span className='truncate' title={title}>
                {title}
              </span>
              <Search className='size-3 opacity-60' />
              {value && (
                <span
                  aria-hidden='true'
                  className='size-1 rounded-full bg-primary'
                />
              )}
            </Button>
          }
        />
        <PopoverContent
          align='start'
          aria-label={t('Table-Filter-Column', {
            field: title,
          })}
          className={cn(
            tableFilterStyles.popover,
            'w-64 max-w-[calc(100dvw-2rem)]',
          )}
        >
          <div className='space-y-3 p-3'>
            <h3 className='text-xs font-semibold'>{title}</h3>
            <DataTableSearch
              autoFocus
              className='w-full'
              value={value}
              placeholder={t('Table-Search', {
                field: title,
              })}
              onChange={(value) => column.setFilterValue(value || undefined)}
            />
          </div>
          <div className={tableFilterStyles.footer}>
            <Button
              variant='ghost'
              size='xs'
              disabled={!value}
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
    </div>
  );
}
