'use no memo';

import { Column } from '@tanstack/react-table';
import { Button } from './button';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnSortHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation();

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            animate={false}
            variant='ghost'
            size='sm'
            className='text-sm font-light -translate-x-1.75 hover:bg-secondary-hover data-[state=open]:bg-secondary-hover'
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
