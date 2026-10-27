/// https://tanstack.com/table/latest/docs/framework/react/examples/row-dnd

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { CSS } from '@dnd-kit/utilities';
import {
  flexRender,
  useTable,
  type Cell,
  type ColumnDef,
  type Row,
  type RowData,
} from '@tanstack/react-table';
import { GripVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Bars } from './bars-icon';
import { Button } from './button';
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
  items: UniqueIdentifier[];
  toolbar?: (table: DataTableInstance<TData>) => React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  getRowId?: (
    originalRow: TData,
    index: number,
    parent?: Row<DataTableFeatures, TData>,
  ) => string;
  reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
}

type DraggableRowProps<TData extends RowData> = {
  row: Row<DataTableFeatures, TData>;
  cells: Cell<DataTableFeatures, TData, any>[];
};

function DraggableRow<TData extends RowData>({
  row,
  cells,
}: DraggableRowProps<TData>) {
  const { t } = useTranslation();
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
      className='w-full flex'
      style={style}
    >
      <TableCell
        key={row.id}
        className='flex w-10 shrink-0 items-center justify-center px-1!'
      >
        <Button
          {...attributes}
          className='size-7 cursor-grab text-muted-foreground/50 hover:text-foreground active:cursor-grabbing'
          aria-label={t('Drag-To-Reorder')}
          size='sm'
          variant='ghost'
          {...listeners}
        >
          <GripVertical />
        </Button>
      </TableCell>
      {cells.map((cell) => {
        const { maxSize, meta } = cell.column.columnDef;

        return (
          <TableCell
            key={cell.id}
            className={cn(
              'min-w-0 flex-1',
              meta?.layoutClassName,
              meta?.className,
            )}
            style={{
              maxWidth: maxSize !== Number.MAX_SAFE_INTEGER ? maxSize : void 0,
              width: cell.column.getSize(),
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export function DataDndTable<TData extends RowData>({
  columns,
  data,
  items,
  loading = false,
  emptyState,
  toolbar,
  reorderRow,
  getRowId,
}: DataTableProps<TData>) {
  const { t } = useTranslation();

  const table = useTable(
    {
      features: dataTableFeatures,
      columns,
      data,
      getRowId,
    },
    (state) => state,
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const draggedRowIndex = items.indexOf(active.id);
    const targetRowIndex = items.indexOf(over.id);

    if (draggedRowIndex < 0 || targetRowIndex < 0) return;
    reorderRow(draggedRowIndex, targetRowIndex);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
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
          className='min-h-0 w-full flex-1 overflow-auto rounded-lg bg-muted/20'
          animate={loading ? 'hidden' : 'visible'}
          variants={{
            visible: { opacity: 1 },
            hidden: { opacity: 0.5 },
          }}
          transition={{ duration: 0.3 }}
        >
          <Table className='min-w-240'>
            <table.Subscribe source={table.atoms.columnVisibility}>
              {() => (
                <>
                  <TableHeader className='sticky top-0 z-10 bg-muted xl:bg-card xl:bg-linear-to-b xl:from-muted/80 xl:to-muted/60'>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className='w-full flex items-center'
                      >
                        <TableHead className='flex w-10 shrink-0 items-center justify-center px-1!' />
                        {headerGroup.headers.map((header) => {
                          const { maxSize, meta } = header.column.columnDef;
                          return (
                            <TableHead
                              key={header.id}
                              className={cn(
                                'flex min-w-0 flex-1 items-center',
                                meta?.layoutClassName,
                              )}
                              colSpan={header.colSpan}
                              style={{
                                maxWidth:
                                  maxSize !== Number.MAX_SAFE_INTEGER
                                    ? maxSize
                                    : void 0,
                                width: header.getSize(),
                              }}
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
                          .rows.map((row) => (
                            <DraggableRow
                              key={row.id}
                              row={row}
                              cells={row.getVisibleCells()}
                            />
                          ))
                      ) : (
                        <TableRow className='flex'>
                          <TableCell
                            colSpan={columns.length + 1}
                            className='flex min-h-24 flex-1 items-center justify-center'
                          >
                            {data.length === 0 && emptyState
                              ? emptyState
                              : t('No-results')}
                          </TableCell>
                        </TableRow>
                      )}
                    </SortableContext>
                  </TableBody>
                </>
              )}
            </table.Subscribe>
          </Table>
        </motion.div>
      </div>
    </DndContext>
  );
}
