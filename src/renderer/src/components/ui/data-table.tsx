import { useRef, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  getFacetedRowModel,
  Row,
  getFacetedUniqueValues
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { motion, AnimatePresence } from "framer-motion";
import { Bars } from "svg-loaders-react";

import { useVirtualizer } from "@tanstack/react-virtual";
import { type Table as StackTable } from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  toolbar?: (table: StackTable<TData>) => React.ReactNode;
  loading?: boolean;
  getFacetedUniqueValues?: () => (
    table: StackTable<TData>,
    columnId: string
  ) => () => Map<any, number>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  loading = false,
  getFacetedUniqueValues: getFacetedUniqueValuesProp
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLTableSectionElement>(null);

  const table = useReactTable({
    columns,
    data,
    state: {
      sorting,
      columnVisibility,
      columnFilters
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesProp
      ? getFacetedUniqueValuesProp()
      : getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40, // estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5
  });

  return (
    <div className="relative flex flex-col flex-1 space-y-2 rounded-md overflow-hidden">
      {toolbar?.(table)}
      <AnimatePresence>
        {loading && (
          <motion.p
            className="w-full absolute top-40 z-10 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Bars className="w-6 fill-primary" />
          </motion.p>
        )}
      </AnimatePresence>
      <motion.div
        ref={tableContainerRef}
        className="w-full flex-1 rounded-md [overflow-y:overlay]"
        animate={loading ? "hidden" : "visible"}
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0.5 }
        }}
        transition={{ duration: 0.3 }}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="[&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:right-0 [&>*:not(:last-child)]:after:w-px [&>*:not(:last-child)]:after:h-5 [&>*:not(:last-child)]:after:bg-zinc-300 dark:[&>*:not(:last-child)]:after:bg-zinc-700"
              >
                {headerGroup.headers.map((header) => {
                  const { maxSize } = header.column.columnDef;
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        maxSize !== Number.MAX_SAFE_INTEGER
                          ? { maxWidth: `${maxSize}px` }
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className="grid relative"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {table.getRowModel().rows.length ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<Nvmd.Version>;

                return (
                  <TableRow
                    key={row.id}
                    // needed for dynamic row height measurement
                    data-index={virtualRow.index}
                    // measure dynamic row height
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    data-state={row.getIsSelected() && "selected"}
                    className="w-full flex absolute"
                    style={{
                      transform: `translateY(${virtualRow.start}px)` //this should always be a `style` as it changes on scroll
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const { maxSize } = cell.column.columnDef;
                      return (
                        <TableCell
                          key={cell.id}
                          className="text-[#999999]"
                          style={
                            maxSize !== Number.MAX_SAFE_INTEGER
                              ? { maxWidth: `${maxSize}px` }
                              : undefined
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
