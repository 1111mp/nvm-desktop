import type { VersionDensity } from '@/hooks/use-version-density';
import type { Atom } from '@tanstack/react-store';
import {
  useTable,
  type ColumnDef,
  type Header,
  type RowData,
  type Row,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
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
  density?: VersionDensity;
  rowSelectionAtom?: Atom<RowSelectionState>;
  enableRowSelection?:
    | boolean
    | ((row: Row<DataTableFeatures, TData>) => boolean);
  getRowId?: (row: TData) => string;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  toolbar,
  loading = false,
  density = 'comfortable',
  rowSelectionAtom,
  enableRowSelection = false,
  getRowId,
}: DataTableProps<TData>) {
  // The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLTableSectionElement>(null);

  const { t } = useTranslation();

  const table = useTable(
    {
      features: dataTableFeatures,
      columns,
      data,
      getRowId,
      enableRowSelection,
      ...(rowSelectionAtom
        ? { atoms: { rowSelection: rowSelectionAtom } }
        : {}),
    },
    (state) => state,
  );

  const { rows } = table.getRowModel();

  // oxlint-disable-next-line react/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () =>
      density === 'dense' ? 36 : density === 'compact' ? 40 : 56, // estimate row height for accurate scrollbar dragging
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

  useEffect(() => {
    // Density changes invalidate cached heights, including rows outside the viewport.
    rowVirtualizer.measure();
  }, [density, rowVirtualizer]);

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
    <div className='relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
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
        className='min-h-0 w-full flex-1 overflow-auto rounded-lg bg-muted/20'
        animate={loading ? 'hidden' : 'visible'}
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0.5 },
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Fit the available width with collapsed navigation, regardless of density. */}
        <Table className='grid min-w-0 grid-cols-1 group-has-[[data-slot=sidebar][data-state=expanded]]/sidebar-wrapper:min-w-224'>
          <TableHeader className='sticky top-0 z-10 bg-muted xl:bg-card xl:bg-linear-to-b xl:from-muted/80 xl:to-muted/60'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='w-full flex items-center'
              >
                {headerGroup.headers.map((header) => {
                  const { maxSize, meta } = header.column.columnDef;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'flex flex-1 items-center',
                        meta?.layoutClassName,
                        density === 'dense' &&
                          'h-8 px-1.5 text-[0.625rem] first:pl-2 last:pr-2 [&_button]:gap-1 [&_button]:text-[0.625rem] [&_svg]:size-3',
                      )}
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
                    // Isolate each virtual row so WebKit paints positioned
                    // controls above its hover background.
                    className='isolate w-full flex absolute top-0 left-0'
                  >
                    {row.getVisibleCells().map((cell) => {
                      const { maxSize, meta } = cell.column.columnDef;
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'flex-1 whitespace-normal break-words',
                            density === 'compact' && 'py-1.5',
                            density === 'dense' &&
                              'px-1.5 py-1 first:pl-2 last:pr-2',
                            meta?.layoutClassName,
                            meta?.className,
                          )}
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
