import { useRef } from "react";
import { Column } from "@tanstack/react-table";
import { MagnifyingGlassIcon, CrossCircledIcon } from "@radix-ui/react-icons";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@renderer/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnFilterHeader<TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const input = useRef<HTMLInputElement>(null);
  const value = column.getFilterValue() as string;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            animate={false}
            variant="ghost"
            size="sm"
            className="text-sm font-light -translate-x-[7px] hover:bg-secondary-hover data-[state=open]:bg-secondary-hover"
          >
            <span>{title}</span>
            <MagnifyingGlassIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-fit p-2">
          <div className="relative">
            <Input
              ref={input}
              className="w-40 h-7"
              placeholder={`Filter ${title}`}
              value={value ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
            />
            <AnimatePresence>
              {value && (
                <motion.span
                  className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={(evt) => {
                    evt.stopPropagation();
                    input.current?.focus();
                    column.setFilterValue("");
                  }}
                >
                  <CrossCircledIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
