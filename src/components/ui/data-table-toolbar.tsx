import { CircleX } from 'lucide-react';
import { Button } from './button';
import { DataTableViewOptions } from './data-table-view-options';
import { Input } from './input';

import { type RowData } from '@tanstack/react-table';
import { type DataTableInstance } from './data-table-features';

import { useTranslation } from 'react-i18next';
import {
  DataTableFacetedFilter,
  type Options,
} from './data-table-faceted-filter';

interface DataTableToolbarProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  filterName?: string;
  status?: boolean;
  options?: Options;
}

const FILTER_NAME_FIELD: Record<string, string> = {
  Version: 'version',
  'Project-Name': 'name',
  'Group-Name': 'name',
};

export function DataTableToolbar<TData extends RowData>({
  table,
  filterName = 'Version',
  status = true,
  options = [],
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslation();

  const isFiltered = table.state.columnFilters.length > 0;

  return (
    <div className='flex flex-1 items-center justify-between p-px'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder={`${t('Filter')} ${t(filterName)}`}
          value={
            (table
              .getColumn(FILTER_NAME_FIELD[filterName])
              ?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table
              .getColumn(FILTER_NAME_FIELD[filterName])
              ?.setFilterValue(event.target.value)
          }
          className='h-7 w-45'
        />
        {status ? (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title={t('Status')}
            options={options}
          />
        ) : null}
        {isFiltered && (
          <Button
            variant='outline'
            onClick={() => table.resetColumnFilters()}
            className='h-7 px-2 lg:px-3 border-dashed'
          >
            {t('Reset')}
            <CircleX className='ml-1 size-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
