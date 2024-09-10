import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui';
import { Share1Icon } from '@radix-ui/react-icons';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

import { z } from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/app-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { configrationExport, configrationImport } from '@/services/cmds';

const items = [
	{
		id: 'color',
		label: 'Theme color',
	},
	{
		id: 'setting',
		label: 'Setting',
	},
	{
		id: 'projects',
		label: 'Projects',
	},
] as const;

const FormSchema = z.object({
	items: z.array(z.string()).refine((value) => value.some((item) => item), {
		message: 'You have to select at least one item.',
	}),
});

const Configration: React.FC = () => {
	const { t } = useTranslation();

	const exporter = useRef<Exporter>(null);
	const importer = useRef<Importer>(null);

	useEffect(() => {
		const listener = (evt: KeyboardEvent) => {
			if (evt.metaKey && evt.shiftKey && (evt.key === 'e' || evt.key === 'E')) {
				exporter.current?.alert();
			}

			if (evt.metaKey && evt.shiftKey && (evt.key === 'i' || evt.key === 'I')) {
				importer.current?.alert();
			}
		};
		document.addEventListener('keydown', listener);
		return () => {
			document.removeEventListener('keydown', listener);
		};
	}, []);

	const title = t('Configration'),
		platform = OS_PLATFORM;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						className="nvmd-tip"
						size="sm"
						title={title}
						variant="ghost"
						icon={<Share1Icon />}
					/>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuLabel>{title}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem
							onClick={() => {
								exporter.current?.alert();
							}}
						>
							{t('Configration-export')}
							<DropdownMenuShortcut>
								⇧{platform === 'win32' ? '⊞' : '⌘'}E
							</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								importer.current?.alert();
							}}
						>
							{t('Configration-import')}
							<DropdownMenuShortcut>
								⇧{platform === 'win32' ? '⊞' : '⌘'}I
							</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConfigrationExport ref={exporter} />
			<ConfigrationImport ref={importer} />
		</>
	);
};

type Exporter = {
	alert: () => void;
};

const ConfigrationExport = forwardRef<Exporter, {}>(({}, ref) => {
	const [open, setOpen] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	const { color } = useAppContext();
	const { t } = useTranslation();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			items: ['color', 'setting', 'projects'],
		},
	});

	useImperativeHandle(ref, () => ({
		alert: onAlert,
	}));

	const onAlert = () => {
		setOpen(true);
	};

	const onExportSubmit = async (values: z.infer<typeof FormSchema>) => {
		const path = await openDialog({
			title: t('Directory-Select'),
			directory: true,
		});
		if (!path) return;

		const { items } = values;
		setLoading(true);
		try {
			const filename = `${path}${
				OS_PLATFORM === 'win32' ? '\\' : '/'
			}configration_${Date.now()}.json`;
			const exportSetting = items.includes('setting');

			await configrationExport(filename, {
				color: items.includes('color') ? color : void 0,
				projects: items.includes('projects'),
				setting: exportSetting,
				mirrors: exportSetting
					? localStorage.getItem('nvmd-mirror') || void 0
					: void 0,
			});
			toast.success(t('Configration-export-success', { filename }), {
				duration: 5000,
			});
			setOpen(false);
		} catch (err) {
			toast.error(err?.message || err.toString());
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={(open) => {
				if (!open) form.reset({ items: ['color', 'setting', 'projects'] });
				setOpen(open);
			}}
		>
			<AlertDialogContent className="top-1/3">
				<AlertDialogHeader>
					<AlertDialogTitle>{t('Configration-export')}</AlertDialogTitle>
					<AlertDialogDescription>
						{t('Configration-export-tip')}
					</AlertDialogDescription>
					<Form {...form}>
						<FormField
							control={form.control}
							name="items"
							render={() => (
								<FormItem>
									{items.map((item) => (
										<FormField
											key={item.id}
											control={form.control}
											name="items"
											render={({ field }) => {
												return (
													<FormItem
														key={item.id}
														className="flex flex-row items-center space-x-3 space-y-0"
													>
														<FormControl>
															<Checkbox
																checked={field.value?.includes(item.id)}
																onCheckedChange={(checked) => {
																	return checked
																		? field.onChange([...field.value, item.id])
																		: field.onChange(
																				field.value?.filter(
																					(value) => value !== item.id
																				)
																		  );
																}}
															/>
														</FormControl>
														<FormLabel className="flex items-center gap-1 text-sm font-normal">
															{t(item.label)}
															{item.id === 'setting' ? (
																<span className="text-muted-foreground">
																	{t('Configration-export-setting')}
																</span>
															) : item.id === 'projects' ? (
																<span className="text-muted-foreground">
																	{t('Configration-export-projects')}
																</span>
															) : null}
														</FormLabel>
													</FormItem>
												);
											}}
										/>
									))}
									<FormMessage />
								</FormItem>
							)}
						/>
					</Form>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>
						{t('Cancel')}
					</AlertDialogCancel>
					<Button loading={loading} onClick={form.handleSubmit(onExportSubmit)}>
						{t('Continue')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});

type Importer = {
	alert: () => void;
};

const ConfigrationImport = forwardRef<Importer, {}>(({}, ref) => {
	const [open, setOpen] = useState<boolean>(false);

	const { setColor, onUpdateSetting } = useAppContext();
	const { t } = useTranslation();

	useImperativeHandle(ref, () => ({
		alert: onAlert,
	}));

	const onAlert = () => {
		setOpen(true);
	};

	const onConfigrationImport = async (sync: boolean) => {
		try {
			const data = await configrationImport(sync);
			if (!data) return;

			console.log(data);
			const { color, mirrors, setting } = data;
			toast.success(t('Configration-import-success'), { duration: 5000 });
			color && setColor(color);
			mirrors && localStorage.setItem('nvmd-mirror', mirrors);
			setting && onUpdateSetting(setting);
			setOpen(false);
		} catch (err) {
			toast.error(err?.message || err.toString());
		}
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={(open) => {
				setOpen(open);
			}}
		>
			<AlertDialogContent className="top-1/3">
				<AlertDialogHeader>
					<AlertDialogTitle>{t('Configration-import')}</AlertDialogTitle>
					<AlertDialogDescription>
						{t('Configration-import-tip')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
					<Button variant="tag" onClick={() => onConfigrationImport(false)}>
						{t('Import-only')}
					</Button>
					<Button onClick={() => onConfigrationImport(true)}>
						{t('Import-and-sync')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});

export default Configration;
