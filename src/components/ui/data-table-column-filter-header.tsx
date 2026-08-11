import { CircleX, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import { type Column, type RowData } from '@tanstack/react-table';
import { type DataTableFeatures } from './data-table-features';

import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}

export function DataTableColumnFilterHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const input = useRef<HTMLInputElement>(null);
  const columnValue = (column.getFilterValue() as string | undefined) ?? '';
  const [value, setValue] = useState(columnValue);

  useEffect(() => {
    setValue(columnValue);
  }, [columnValue]);

  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='text-sm font-light -translate-x-1.75'
          >
            <span>{title}</span>
            <Search className='ml-2 size-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-fit p-2'>
          <div className='relative'>
            <Input
              ref={input}
              className='w-40 h-7'
              placeholder={`Filter ${title}`}
              value={value}
              onChange={(event) => column.setFilterValue(event.target.value)}
            />
            <AnimatePresence>
              {value && (
                <motion.span
                  className='absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={(evt) => {
                    evt.stopPropagation();
                    input.current?.focus();
                    setValue('');
                    column.setFilterValue(undefined);
                  }}
                >
                  <CircleX className='size-4' />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
