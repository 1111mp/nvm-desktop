import { useSelector } from '@tanstack/react-store';
import type { RowData } from '@tanstack/react-table';
import { Columns3, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import type { DataTableInstance } from './data-table-features';
import { tableFilterStyles } from './data-table-filter-styles';

interface DataTableViewOptionsProps<TData extends RowData> {
  table: DataTableInstance<TData>;
}

export function DataTableViewOptions<TData extends RowData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation();
  const visibility = useSelector(table.atoms.columnVisibility);
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    );
  const hiddenCount = columns.filter(
    (column) => visibility[column.id] === false,
  ).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            tableFilterStyles.trigger,
            'ml-auto',
            hiddenCount > 0 && tableFilterStyles.activeTrigger,
          )}
          aria-label={t('Toggle-Columns')}
          title={t('Toggle-Columns')}
        >
          <Columns3 className='size-3.5' />
          <span className='hidden sm:inline'>{t('View')}</span>
          {hiddenCount > 0 && (
            <span className='rounded-md bg-background/75 px-1.5 py-0.5 text-[0.625rem] tabular-nums'>
              {hiddenCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className={tableFilterStyles.menu}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex items-center justify-between gap-2 px-2.5 py-2 text-[0.625rem] font-medium text-muted-foreground'>
            <span>{t('Toggle-Columns')}</span>
            <span className='font-mono tabular-nums'>
              {columns.length - hiddenCount} / {columns.length}
            </span>
          </DropdownMenuLabel>
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className={cn(
                tableFilterStyles.option,
                'pr-8',
                column.getIsVisible() && 'bg-primary/4',
              )}
              checked={column.getIsVisible()}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.columnDef.meta?.label ||
                (typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className='mx-2 bg-muted' />
        <DropdownMenuItem
          disabled={!hiddenCount}
          className={cn(tableFilterStyles.option, 'text-muted-foreground')}
          onSelect={(event) => {
            event.preventDefault();
            columns.forEach((column) => column.toggleVisibility(true));
          }}
        >
          <RotateCcw className='size-3.5' />
          {t('Table-Show-All-Columns')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
