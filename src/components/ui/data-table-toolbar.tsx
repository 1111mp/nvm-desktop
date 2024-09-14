import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from './button';
import { Input } from './input';
import { DataTableViewOptions } from './data-table-view-options';

import {
	DataTableFacetedFilter,
	type Options,
} from './data-table-faceted-filter';
import { useTranslation } from 'react-i18next';

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	filterName?: string;
	status?: boolean;
	options?: Options;
}

const FILTER_NAME_FIELD: Record<string, string> = {
	Version: 'version',
	'Project-Name': 'name',
	'Group-Name': 'name',
};

export function DataTableToolbar<TData>({
	table,
	filterName = 'Version',
	status = true,
	options = [],
}: DataTableToolbarProps<TData>) {
	const { t } = useTranslation();

	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex flex-1 items-center justify-between p-[1px]">
			<div className="flex flex-1 items-center space-x-2">
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
					className="h-7 w-[180px]"
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
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-7 px-2 lg:px-3"
					>
						{t('Reset')}
						<Cross2Icon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<DataTableViewOptions table={table} />
		</div>
	);
}
