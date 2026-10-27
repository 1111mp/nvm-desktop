import { useSelector } from '@tanstack/react-store';
import type { RowData } from '@tanstack/react-table';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import {
  DataTableFacetedFilter,
  type Options,
} from './data-table-faceted-filter';
import type { DataTableInstance } from './data-table-features';
import { DataTableSearch } from './data-table-search';
import { DataTableViewOptions } from './data-table-view-options';

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
  const filters = useSelector(table.atoms.columnFilters);
  const column = table.getColumn(FILTER_NAME_FIELD[filterName]);
  const value = filters.find((filter) => filter.id === column?.id)?.value;
  const statusColumn = status ? table.getColumn('status') : undefined;
  return (
    <div className='flex min-w-0 flex-[1_1_18rem] flex-wrap items-center justify-between gap-2 p-0.5'>
      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
        <DataTableSearch
          placeholder={t('Table-Search', { field: t(filterName) })}
          value={typeof value === 'string' ? value : ''}
          onChange={(value) => column?.setFilterValue(value || undefined)}
        />
        {status && statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn}
            title={t('Status')}
            options={options}
          />
        )}
        {filters.length > 0 && (
          <Button
            variant='ghost'
            className='h-8 gap-1.5 rounded-lg border-0 px-2 text-xs font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            aria-label={t('Clear-Filters')}
            title={t('Clear-Filters')}
            onClick={() => table.resetColumnFilters()}
          >
            <RotateCcw className='size-3' />
            {t('Reset')}
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
