import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "./button";
import { Input } from "./input";
import { DataTableViewOptions } from "./data-table-view-options";

import { DataTableFacetedFilter, type Options } from "./data-table-faceted-filter";
import { useI18n } from "@renderer/app-context";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterName?: string;
  status?: boolean;
  options?: Options;
}

export function DataTableToolbar<TData>({
  table,
  filterName = "version",
  status = true,
  options = []
}: DataTableToolbarProps<TData>) {
  const i18n = useI18n();

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-1 items-center justify-between p-[1px]">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={`Filter ${filterName}...`}
          value={(table.getColumn(filterName)?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn(filterName)?.setFilterValue(event.target.value)}
          className="h-7 w-[180px]"
        />
        {status ? (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title={i18n("Status")}
            options={options}
          />
        ) : null}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-7 px-2 lg:px-3"
          >
            {i18n("Reset")}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
