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
import { motion, AnimatePresence } from 'framer-motion';
import { Bars } from './bars-icon';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from './button';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';

import { useTranslation } from 'react-i18next';
import { type Table as StackTable } from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	toolbar?: (table: StackTable<TData>) => React.ReactNode;
	loading?: boolean;
	reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
	getFacetedUniqueValues?: () => (
		table: StackTable<TData>,
		columnId: string
	) => () => Map<any, number>;
}

type DraggableRowProps<TData> = {
	row: Row<TData>;
	reorderRow: (draggedRowIndex: number, targetRowIndex: number) => void;
};

function DraggableRow<TData>({ row, reorderRow }: DraggableRowProps<TData>) {
	const [, dropRef] = useDrop({
		accept: 'row',
		drop: (draggedRow: Row<TData>) => reorderRow(draggedRow.index, row.index),
	});

	const [, dragRef, previewRef] = useDrag({
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
		item: () => row,
		type: 'row',
	});

	return (
		<TableRow
			ref={previewRef} //previewRef could go here
			key={row.id}
			data-state={row.getIsSelected() && 'selected'}
			className="w-full flex"
		>
			{row.getVisibleCells().map((cell, index) => {
				const { maxSize } = cell.column.columnDef;
				if (index === 0)
					return (
						<TableCell
							key={cell.id}
							ref={dropRef}
							className="flex items-center"
							style={
								maxSize !== Number.MAX_SAFE_INTEGER
									? { maxWidth: `${maxSize}px` }
									: undefined
							}
						>
							<Button
								ref={dragRef}
								className="cursor-move"
								size="sm"
								variant="ghost"
								icon={<HamburgerMenuIcon />}
							/>
						</TableCell>
					);

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
}

export function DataDndTable<TData, TValue>({
	columns,
	data,
	toolbar,
	loading = false,
	reorderRow,
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
				className="w-full flex-1 rounded-md [overflow-y:overlay]"
				animate={loading ? 'hidden' : 'visible'}
				variants={{
					visible: { opacity: 1 },
					hidden: { opacity: 0.5 },
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
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
												  )}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table
								.getRowModel()
								.rows.map((row) => (
									<DraggableRow
										key={row.id}
										row={row}
										reorderRow={reorderRow}
									/>
								))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 justify-center"
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
