import { useSelector } from '@tanstack/react-store';
import type { Column, RowData } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import type { DataTableFeatures } from './data-table-features';
import { tableFilterStyles } from './data-table-filter-styles';

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<DataTableFeatures, TData, TValue>;
}

export function DataTableColumnSortHeader<TData extends RowData, TValue>({
  column,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation();
  const sorting = useSelector(column.table.atoms.sorting, (sorting) =>
    sorting.find((item) => item.id === column.id),
  );
  const direction = sorting ? (sorting.desc ? 'desc' : 'asc') : false;
  const title =
    column.columnDef.meta?.label ||
    (typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id);
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  return (
    <div className={cn('flex w-full min-w-0 items-center', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className={cn(
                tableFilterStyles.headerTrigger,
                '-ml-2 min-w-0 max-w-full',
                direction && tableFilterStyles.activeTrigger,
              )}
              aria-label={t('Table-Sort-Column', {
                field: title,
              })}
            >
              <span className='truncate' title={title}>
                {title}
              </span>
              {direction === 'desc' ? (
                <ArrowDown className='size-3' />
              ) : direction === 'asc' ? (
                <ArrowUp className='size-3' />
              ) : (
                <ChevronsUpDown className='size-3 opacity-50' />
              )}
            </Button>
          }
        />
        <DropdownMenuContent align='start' className={tableFilterStyles.menu}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className='px-2.5 py-2 text-[0.625rem] font-medium text-muted-foreground'>
              {title}
            </DropdownMenuLabel>
            {[
              {
                value: 'asc',
                label: 'Table-Sort-Ascending',
                icon: ArrowUp,
              },
              {
                value: 'desc',
                label: 'Table-Sort-Descending',
                icon: ArrowDown,
              },
            ].map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                className={cn(
                  tableFilterStyles.option,
                  direction === value && 'bg-primary/8',
                )}
                onClick={() => column.toggleSorting(value === 'desc')}
              >
                <Icon className='size-3.5 text-muted-foreground' />
                {t(label)}
                {direction === value && <Check className='ml-auto size-3.5' />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className='mx-2 bg-muted' />
            <DropdownMenuItem
              disabled={!direction}
              className={cn(tableFilterStyles.option, 'text-muted-foreground')}
              onClick={() => column.clearSorting()}
            >
              <RotateCcw className='size-3.5' />
              {t('Table-Clear-Sort')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
