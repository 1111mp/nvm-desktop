import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

import { type Column, type RowData } from '@tanstack/react-table';
import { type DataTableFeatures } from './data-table-features';

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

  const title = (column.columnDef.header as string) ?? '';

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='text-sm font-light -translate-x-1.75'
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className='ml-2 size-4' />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className='ml-2 size-4' />
            ) : (
              <ChevronsUpDown className='ml-2 size-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className='mr-2 size-3.5 text-muted-foreground/70' />
            {t('Asc')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className='mr-2 size-3.5 text-muted-foreground/70' />
            {t('Desc')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <EyeOff className='mr-2 size-3.5 text-muted-foreground/70' />
            {t('Cancel')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
