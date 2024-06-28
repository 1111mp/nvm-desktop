import {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Primitive } from '@radix-ui/react-primitive';

import { Badge } from './badge';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from './command';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip';

import { cn } from '@/lib/utils';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

export interface MultiSelectOptionItem {
	value: string;
	label?: React.ReactNode;
}

interface MultiSelectContextValue {
	value: string[];

	open: boolean;

	onSelect(value: string, item: MultiSelectOptionItem): void;

	onDeselect(value: string, item: MultiSelectOptionItem): void;

	onSearch?(keyword: string | undefined): void;

	filter?: boolean | ((keyword: string, current: string) => boolean);

	disabled?: boolean;

	maxCount?: number;

	itemCache: Map<string, MultiSelectOptionItem>;
}

const MultiSelectContext = createContext<MultiSelectContextValue | undefined>(
	undefined
);

const useMultiSelect = () => {
	const context = useContext(MultiSelectContext);

	if (!context) {
		throw new Error('useMultiSelect must be used within MultiSelectProvider');
	}

	return context;
};

type MultiSelectProps = React.ComponentPropsWithoutRef<
	typeof PopoverPrimitive.Root
> & {
	value?: string[];
	onValueChange?(value: string[], items: MultiSelectOptionItem[]): void;
	onSelect?(value: string, item: MultiSelectOptionItem): void;
	onDeselect?(value: string, item: MultiSelectOptionItem): void;
	defaultValue?: string[];
	onSearch?(keyword: string | undefined): void;
	filter?: boolean | ((keyword: string, current: string) => boolean);
	disabled?: boolean;
	maxCount?: number;
};

const MultiSelect: React.FC<MultiSelectProps> = ({
	value: valueProp,
	onValueChange: onValueChangeProp,
	onDeselect: onDeselectProp,
	onSelect: onSelectProp,
	defaultValue,
	open: openProp,
	onOpenChange,
	defaultOpen,
	onSearch,
	filter,
	disabled,
	maxCount,
	// ? Scroll not working inside a Popover
	// ? https://github.com/shadcn-ui/ui/issues/542#issuecomment-1587142689
	modal = true,
	...popoverProps
}) => {
	const itemCache = useRef(new Map<string, MultiSelectOptionItem>()).current;

	const handleValueChange = useCallback(
		(state: string[]) => {
			if (onValueChangeProp) {
				const items = state.map((value) => itemCache.get(value)!);

				onValueChangeProp(state, items);
			}
		},
		[onValueChangeProp]
	);

	const [value, setValue] = useControllableState({
		prop: valueProp,
		defaultProp: defaultValue,
		onChange: handleValueChange,
	});

	const [open, setOpen] = useControllableState({
		prop: openProp,
		defaultProp: defaultOpen,
		onChange: onOpenChange,
	});

	const handleSelect = useCallback(
		(value: string, item: MultiSelectOptionItem) => {
			setValue((prev) => {
				if (prev?.includes(value)) {
					return prev;
				}

				onSelectProp?.(value, item);

				return prev ? [...prev, value] : [value];
			});
		},
		[onSelectProp, setValue]
	);

	const handleDeselect = useCallback(
		(value: string, item: MultiSelectOptionItem) => {
			setValue((prev) => {
				if (!prev || !prev.includes(value)) {
					return prev;
				}

				onDeselectProp?.(value, item);

				return prev.filter((v) => v !== value);
			});
		},
		[onDeselectProp, setValue]
	);

	const contextValue = useMemo(() => {
		return {
			value: value || [],
			open: open || false,
			onSearch,
			filter,
			disabled,
			maxCount,
			onSelect: handleSelect,
			onDeselect: handleDeselect,
			itemCache,
		};
	}, [
		value,
		open,
		onSearch,
		filter,
		disabled,
		maxCount,
		handleSelect,
		handleDeselect,
	]);

	return (
		<MultiSelectContext.Provider value={contextValue}>
			<PopoverPrimitive.Root
				modal={modal}
				{...popoverProps}
				open={open}
				onOpenChange={setOpen}
			/>
		</MultiSelectContext.Provider>
	);
};

MultiSelect.displayName = 'MultiSelect';

type MultiSelectTriggerElement = React.ElementRef<typeof Primitive.div>;

interface MultiSelectTriggerProps
	extends React.ComponentPropsWithoutRef<typeof Primitive.div> {}

const PreventClick = (e: React.MouseEvent | React.TouchEvent) => {
	e.preventDefault();
	e.stopPropagation();
};

const MultiSelectTrigger = forwardRef<
	MultiSelectTriggerElement,
	MultiSelectTriggerProps
>(({ className, children, ...props }, forwardedRef) => {
	const { disabled } = useMultiSelect();

	return (
		<PopoverPrimitive.Trigger ref={forwardedRef as any} asChild>
			<div
				aria-disabled={disabled}
				data-disabled={disabled}
				{...props}
				className={cn(
					'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring [&>span]:line-clamp-1',
					disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text',
					className
				)}
				onClick={disabled ? PreventClick : props.onClick}
				onTouchStart={disabled ? PreventClick : props.onTouchStart}
			>
				{children}
				<CaretSortIcon aria-hidden className="h-4 w-4 opacity-50 shrink-0" />
			</div>
		</PopoverPrimitive.Trigger>
	);
});

MultiSelectTrigger.displayName = 'MultiSelectTrigger';

interface MultiSelectValueProps
	extends React.ComponentPropsWithoutRef<typeof Primitive.div> {
	placeholder?: string;
	maxDisplay?: number;
	maxItemLength?: number;
}

const MultiSelectValue = forwardRef<
	React.ElementRef<typeof Primitive.div>,
	MultiSelectValueProps
>(
	(
		{ className, placeholder, maxDisplay, maxItemLength, ...props },
		forwardRef
	) => {
		const { value, itemCache, onDeselect } = useMultiSelect();
		const [firstRendered, setFirstRendered] = useState(false);

		const renderRemain =
			maxDisplay && value.length > maxDisplay ? value.length - maxDisplay : 0;
		const renderItems = renderRemain ? value.slice(0, maxDisplay) : value;

		useLayoutEffect(() => {
			setFirstRendered(true);
		}, []);

		if (!value.length || !firstRendered) {
			return (
				<span className="pointer-events-none text-muted-foreground">
					{placeholder}
				</span>
			);
		}

		return (
			<TooltipProvider delayDuration={300}>
				<div
					className={cn(
						'flex flex-1 overflow-x-hidden flex-wrap items-center gap-1.5',
						className
					)}
					{...props}
					ref={forwardRef}
				>
					{renderItems.map((value) => {
						const item = itemCache.get(value);

						const content = item?.label || value;

						const child =
							maxItemLength &&
							typeof content === 'string' &&
							content.length > maxItemLength
								? `${content.slice(0, maxItemLength)}...`
								: content;

						const el = (
							<Badge
								variant="outline"
								key={value}
								className="px-2 py-0 leading-4 pr-1 group/multi-select-badge cursor-pointer rounded-full"
							>
								<span>{child}</span>
								<Cross2Icon
									className="h-3 w-3 ml-1 text-muted-foreground group-hover/multi-select-badge:text-foreground"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onDeselect(value, item!);
									}}
								/>
							</Badge>
						);

						if (child !== content) {
							return (
								<Tooltip key={value}>
									<TooltipTrigger className="inline-flex">{el}</TooltipTrigger>
									<TooltipContent
										side="bottom"
										align="start"
										className="z-[51]"
									>
										{content}
									</TooltipContent>
								</Tooltip>
							);
						}

						return el;
					})}
					{renderRemain ? (
						<span className="text-muted-foreground text-xs leading-4 py-.5">
							+{renderRemain}
						</span>
					) : null}
				</div>
			</TooltipProvider>
		);
	}
);

const MultiSelectSearch = forwardRef<
	React.ElementRef<typeof CommandInput>,
	React.ComponentPropsWithoutRef<typeof CommandInput>
>((props, ref) => {
	const { onSearch } = useMultiSelect();

	return (
		<CommandInput
			ref={ref}
			className="h-9"
			{...props}
			onValueChange={onSearch}
		/>
	);
});

MultiSelectSearch.displayName = 'MultiSelectSearch';

const MultiSelectList = forwardRef<
	React.ElementRef<typeof CommandList>,
	React.ComponentPropsWithoutRef<typeof CommandList>
>(({ className, ...props }, ref) => {
	return (
		<CommandList
			ref={ref}
			className={cn('py-1 px-0 max-h-[unset]', className)}
			{...props}
		/>
	);
});

MultiSelectList.displayName = 'MultiSelectList';

interface MultiSelectContentProps
	extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {}

const MultiSelectContent = forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	MultiSelectContentProps
>(({ className, children, ...props }, ref) => {
	const context = useMultiSelect();

	const fragmentRef = useRef<DocumentFragment>();

	if (!fragmentRef.current && typeof window !== 'undefined') {
		fragmentRef.current = document.createDocumentFragment();
	}

	if (!context.open) {
		return fragmentRef.current
			? createPortal(<Command>{children}</Command>, fragmentRef.current)
			: null;
	}

	return (
		<PopoverPrimitive.Portal forceMount>
			<PopoverPrimitive.Content
				ref={ref}
				align="start"
				sideOffset={4}
				collisionPadding={10}
				className={cn(
					'z-50 w-full rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
				)}
				style={
					{
						'--radix-select-content-transform-origin':
							'var(--radix-popper-transform-origin)',
						'--radix-select-content-available-width':
							'var(--radix-popper-available-width)',
						'--radix-select-content-available-height':
							'var(--radix-popper-available-height)',
						'--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
						'--radix-select-trigger-height':
							'var(--radix-popper-anchor-height)',
					} as any
				}
				{...props}
			>
				<Command
					className={cn(
						'pt-1 px-1 max-h-96 w-full min-w-[var(--radix-select-trigger-width)]',
						className
					)}
					shouldFilter={!context.onSearch}
				>
					{children}
				</Command>
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	);
});

type MultiSelectItemProps = React.ComponentPropsWithoutRef<typeof CommandItem> &
	Partial<MultiSelectOptionItem> & {
		onSelect?: (value: string, item: MultiSelectOptionItem) => void;
		onDeselect?: (value: string, item: MultiSelectOptionItem) => void;
	};

const MultiSelectItem = forwardRef<
	React.ElementRef<typeof CommandItem>,
	MultiSelectItemProps
>(
	(
		{
			value,
			onSelect: onSelectProp,
			onDeselect: onDeselectProp,
			children,
			label,
			disabled: disabledProp,
			className,
			...props
		},
		forwardedRef
	) => {
		const {
			value: contextValue,
			maxCount,
			onSelect,
			onDeselect,
			itemCache,
		} = useMultiSelect();

		const item = useMemo(() => {
			return value
				? {
						value,
						label:
							label || (typeof children === 'string' ? children : undefined),
				  }
				: undefined;
		}, [value, label, children]);

		const selected = Boolean(value && contextValue.includes(value));

		useEffect(() => {
			if (value) {
				itemCache.set(value, item!);
			}
		}, [selected, value, item]);

		const disabled = Boolean(
			disabledProp || (!selected && maxCount && contextValue.length >= maxCount)
		);

		const handleClick = () => {
			if (selected) {
				onDeselectProp?.(value!, item!);
				onDeselect(value!, item!);
			} else {
				itemCache.set(value!, item!);
				onSelectProp?.(value!, item!);
				onSelect(value!, item!);
			}
		};

		return (
			<CommandItem
				{...props}
				value={value}
				className={cn(
					disabled && 'text-muted-foreground cursor-not-allowed',
					className
				)}
				disabled={disabled}
				onSelect={!disabled && value ? handleClick : undefined}
				ref={forwardedRef}
			>
				<span className="mr-2 whitespace-nowrap overflow-hidden text-ellipsis">
					{children || label || value}
				</span>
				{selected ? <CheckIcon className="h-4 w-4 ml-auto shrink-0" /> : null}
			</CommandItem>
		);
	}
);

const MultiSelectGroup = forwardRef<
	React.ElementRef<typeof CommandGroup>,
	React.ComponentPropsWithoutRef<typeof CommandGroup>
>((props, forwardRef) => {
	return <CommandGroup {...props} ref={forwardRef} />;
});

MultiSelectGroup.displayName = 'MultiSelectGroup';

const MultiSelectSeparator = forwardRef<
	React.ElementRef<typeof CommandSeparator>,
	React.ComponentPropsWithoutRef<typeof CommandSeparator>
>((props, forwardRef) => {
	return <CommandSeparator {...props} ref={forwardRef} />;
});

MultiSelectSeparator.displayName = 'MultiSelectSeparator';

const MultiSelectEmpty = forwardRef<
	React.ElementRef<typeof CommandEmpty>,
	React.ComponentPropsWithoutRef<typeof CommandEmpty>
>(({ children = 'No Content', ...props }, forwardRef) => {
	return (
		<CommandEmpty {...props} ref={forwardRef}>
			{children}
		</CommandEmpty>
	);
});

MultiSelectEmpty.displayName = 'MultiSelectEmpty';

export interface MultiSelectOptionSeparator {
	type: 'separator';
}

export interface MultiSelectOptionGroup {
	heading?: React.ReactNode;
	value?: string;
	children: MultiSelectOption[];
}

export type MultiSelectOption =
	| Pick<
			MultiSelectItemProps,
			'value' | 'label' | 'disabled' | 'onSelect' | 'onDeselect'
	  >
	| MultiSelectOptionSeparator
	| MultiSelectOptionGroup;

const renderMultiSelectOptions = (list: MultiSelectOption[]) => {
	return list.map((option, index) => {
		if ('type' in option) {
			if (option.type === 'separator') {
				return <MultiSelectSeparator key={index} />;
			}

			return null;
		}

		if ('children' in option) {
			return (
				<MultiSelectGroup
					key={option.value || index}
					value={option.value}
					heading={option.heading}
				>
					{renderMultiSelectOptions(option.children)}
				</MultiSelectGroup>
			);
		}

		return (
			<MultiSelectItem key={option.value} {...option}>
				{option.label}
			</MultiSelectItem>
		);
	});
};

export {
	MultiSelect,
	MultiSelectTrigger,
	MultiSelectValue,
	MultiSelectSearch,
	MultiSelectContent,
	MultiSelectList,
	MultiSelectItem,
	MultiSelectGroup,
	MultiSelectSeparator,
	MultiSelectEmpty,
	renderMultiSelectOptions,
};
