import {
  useTable,
  type ColumnDef,
  type Header,
  type RowData,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bars } from './bars-icon';
import { DataTableColumnFilterHeader } from './data-table-column-filter-header';
import { DataTableColumnSortHeader } from './data-table-column-sort-header';
import {
  dataTableFeatures,
  type DataTableFeatures,
  type DataTableInstance,
} from './data-table-features';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData, any>[];
  data: TData[];
  toolbar?: (table: DataTableInstance<TData>) => React.ReactNode;
  loading?: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  toolbar,
  loading = false,
}: DataTableProps<TData>) {
  // The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLTableSectionElement>(null);

  const { t } = useTranslation();

  const table = useTable(
    {
      features: dataTableFeatures,
      columns,
      data,
    },
    (state) => state,
  );

  const { rows } = table.getRowModel();

  // oxlint-disable-next-line react/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40, // estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    // measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    directDomUpdates: true,
    overscan: 5,
  });

  const renderHeader = (header: Header<DataTableFeatures, TData, any>) => {
    if (header.isPlaceholder) {
      return null;
    }

    if (header.column.getCanFilter()) {
      return <DataTableColumnFilterHeader column={header.column} />;
    }

    if (header.column.getCanSort()) {
      return <DataTableColumnSortHeader column={header.column} />;
    }

    return <table.FlexRender header={header} />;
  };

  return (
    <div className='relative flex flex-col flex-1 space-y-2 rounded-md overflow-hidden'>
      {toolbar?.(table)}
      <AnimatePresence>
        {loading && (
          <motion.p
            className='w-full absolute top-40 z-10 flex justify-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Bars className='w-6 fill-primary' />
          </motion.p>
        )}
      </AnimatePresence>
      <motion.div
        ref={tableContainerRef}
        className='w-full flex-1 rounded-md [overflow-y:overlay]'
        animate={loading ? 'hidden' : 'visible'}
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0.5 },
        }}
        transition={{ duration: 0.3 }}
      >
        <Table>
          <TableHeader className='sticky top-0 z-10 bg-muted'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='w-full flex items-center [&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:right-0 [&>*:not(:last-child)]:after:w-px [&>*:not(:last-child)]:after:h-5 [&>*:not(:last-child)]:after:bg-zinc-300 dark:[&>*:not(:last-child)]:after:bg-zinc-700'
              >
                {headerGroup.headers.map((header) => {
                  const { maxSize } = header.column.columnDef;
                  return (
                    <TableHead
                      key={header.id}
                      className='flex flex-1 items-center'
                      style={{
                        maxWidth:
                          maxSize !== Number.MAX_SAFE_INTEGER
                            ? maxSize
                            : void 0,
                        width: header.getSize(),
                      }}
                    >
                      {renderHeader(header)}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className='w-full grid relative'
            ref={rowVirtualizer.containerRef}
          >
            {table.getRowModel().rows.length ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];

                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index} //needed for dynamic row height measurement
                    ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                    className='w-full flex absolute top-0 left-0'
                  >
                    {row.getVisibleCells().map((cell) => {
                      const { maxSize, meta } = cell.column.columnDef;
                      return (
                        <TableCell
                          key={cell.id}
                          className={`flex-1 ${meta?.className ?? ''}`}
                          style={{
                            maxWidth:
                              maxSize !== Number.MAX_SAFE_INTEGER
                                ? maxSize
                                : void 0,
                            width: cell.column.getSize(),
                          }}
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className='flex'>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className='flex flex-1 h-24 items-center justify-center'
                >
                  {t('No-results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
