import { Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

import { type RowData } from '@tanstack/react-table';
import { type DataTableInstance } from './data-table-features';

interface DataTableViewOptionsProps<TData extends RowData> {
  table: DataTableInstance<TData>;
}

export function DataTableViewOptions<TData extends RowData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='ml-auto hidden h-7 lg:flex'
        >
          <Waypoints className='mr-2 size-4' />
          {t('View')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('Toggle-Columns')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <table.Subscribe source={table.atoms.columnVisibility}>
            {() =>
              table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide(),
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.columnDef.meta?.label}
                  </DropdownMenuCheckboxItem>
                ))
            }
          </table.Subscribe>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
