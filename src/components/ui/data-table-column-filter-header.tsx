'use no memo';

import { useRef } from 'react';
import { Column } from '@tanstack/react-table';
import { Search, CircleX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnFilterHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const input = useRef<HTMLInputElement>(null);

  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const value = column.getFilterValue() as string;

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
              value={value ?? ''}
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
                    column.setFilterValue('');
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
