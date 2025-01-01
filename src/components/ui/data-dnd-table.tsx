/// https://tanstack.com/table/latest/docs/framework/react/examples/row-dnd

import { useState } from 'react';
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
  type Table as StackTable,
  getFacetedRowModel,
  Row,
  getFacetedUniqueValues,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Bars } from './bars-icon';
import { Button } from './button';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  items: (
    | UniqueIdentifier
    | {
        id: UniqueIdentifier;
      }
  )[];
  toolbar?: (table: StackTable<TData>) => React.ReactNode;
  loading?: boolean;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
  getFacetedUniqueValues?: () => (
    table: StackTable<TData>,
    columnId: string,
  ) => () => Map<any, number>;
}

type DraggableRowProps<TData = any> = {
  row: Row<TData>;
};

function DraggableRow<TData>({ row }: DraggableRowProps<TData>) {
  const {
    attributes,
    listeners,
    isDragging,
    transform,
    transition,
    setNodeRef,
  } = useSortable({
    id: row.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  return (
    <TableRow
      ref={setNodeRef}
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      className='w-full flex'
      style={style}
    >
      <TableCell key={row.id} className='max-w-12 flex items-center'>
        <Button
          {...attributes}
          className='cursor-move'
          size='sm'
          variant='ghost'
          icon={<HamburgerMenuIcon />}
          {...listeners}
        />
      </TableCell>
      {row.getVisibleCells().map((cell) => {
        const { maxSize } = cell.column.columnDef;

        return (
          <TableCell
            key={cell.id}
            className='text-[#999999]'
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
}

export function DataDndTable<TData, TValue>({
  columns,
  data,
  items,
  loading = false,
  toolbar,
  reorderRow,
  getRowId,
  getFacetedUniqueValues: getFacetedUniqueValuesProp,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { t } = useTranslation();

  const table = useReactTable({
    columns,
    data,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesProp
      ? getFacetedUniqueValuesProp()
      : getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      reorderRow?.(items.indexOf(active.id), items.indexOf(over.id));
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
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
          className='w-full flex-1 rounded-md [overflow-y:overlay]'
          animate={loading ? 'hidden' : 'visible'}
          variants={{
            visible: { opacity: 1 },
            hidden: { opacity: 0.5 },
          }}
          transition={{ duration: 0.3 }}
        >
          <Table>
            <TableHeader className='sticky top-0 z-10'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className='[&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:right-0 [&>*:not(:last-child)]:after:w-px [&>*:not(:last-child)]:after:h-5 [&>*:not(:last-child)]:after:bg-zinc-300 dark:[&>*:not(:last-child)]:after:bg-zinc-700'
                >
                  <TableHead key='header_sortable' className='max-w-12' />
                  {headerGroup.headers.map((header) => {
                    const { maxSize } = header.column.columnDef;
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={
                          maxSize !== Number.MAX_SAFE_INTEGER
                            ? { maxWidth: maxSize }
                            : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows.length ? (
                  table
                    .getRowModel()
                    .rows.map((row) => <DraggableRow key={row.id} row={row} />)
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 justify-center'
                    >
                      {t('No-results')}
                    </TableCell>
                  </TableRow>
                )}
              </SortableContext>
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </DndContext>
  );
}
