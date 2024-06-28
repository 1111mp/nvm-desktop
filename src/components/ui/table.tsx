import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Table = forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
	<table
		ref={ref}
		className={cn('w-full caption-bottom text-sm', className)}
		{...props}
	/>
));
Table.displayName = 'Table';

const TableHeader = forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		ref={ref}
		className={cn('[&_tr]:border-b bg-secondary', className)}
		{...props}
	/>
));
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		ref={ref}
		className={cn('[&_tr:last-child]:border-0', className)}
		{...props}
	/>
));
TableBody.displayName = 'TableBody';

const TableFooter = forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		ref={ref}
		className={cn(
			'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
			className
		)}
		{...props}
	/>
));
TableFooter.displayName = 'TableFooter';

const TableRow = forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			'w-full flex border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
			className
		)}
		{...props}
	/>
));
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			'h-9 flex flex-1 items-center px-2 text-left align-middle font-light text-secondary-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
			className
		)}
		{...props}
	/>
));
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			'flex flex-1 p-2 items-center [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
			className
		)}
		{...props}
	/>
));
TableCell.displayName = 'TableCell';

const TableCaption = forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn('mt-4 text-sm text-muted-foreground', className)}
		{...props}
	/>
));
TableCaption.displayName = 'TableCaption';

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
};
