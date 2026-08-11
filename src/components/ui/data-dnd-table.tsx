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
import { CSS } from '@dnd-kit/utilities';
import {
  flexRender,
  useTable,
  type Cell,
  type ColumnDef,
  type Row,
  type RowData,
} from '@tanstack/react-table';
import { GripHorizontal } from 'lucide-react';
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
      <TableCell key={row.id} className='w-12 flex items-center'>
        <Button
          {...attributes}
          className='cursor-move'
          size='sm'
          variant='ghost'
          {...listeners}
        >
          <GripHorizontal />
        </Button>
      </TableCell>
      {cells.map((cell) => {
        const { maxSize, meta } = cell.column.columnDef;

        return (
          <TableCell
            key={cell.id}
            className={`flex-1 ${meta?.className ?? ''}`}
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
          className='w-full flex-1 rounded-md overflow-x-hidden overflow-y-auto'
          animate={loading ? 'hidden' : 'visible'}
          variants={{
            visible: { opacity: 1 },
            hidden: { opacity: 0.5 },
          }}
          transition={{ duration: 0.3 }}
        >
          <Table>
            <table.Subscribe source={table.atoms.columnVisibility}>
              {() => (
                <>
                  <TableHeader className='sticky top-0 z-10 bg-muted'>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className='w-full flex items-center [&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:right-0 [&>*:not(:last-child)]:after:w-px [&>*:not(:last-child)]:after:h-5 [&>*:not(:last-child)]:after:bg-zinc-300 dark:[&>*:not(:last-child)]:after:bg-zinc-700'
                      >
                        <TableHead className='w-12 flex items-center' />
                        {headerGroup.headers.map((header) => {
                          const { maxSize } = header.column.columnDef;
                          return (
                            <TableHead
                              key={header.id}
                              className='flex flex-1 items-center'
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
                            colSpan={columns.length}
                            className='flex flex-1 h-24 items-center justify-center'
                          >
                            {t('No-results')}
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
