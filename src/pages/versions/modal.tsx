import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
	useRef,
} from 'react';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Checkbox,
	Label,
	LabelCopyable,
	Progress,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getCurrent } from '@/services/api';
import { installNode, installNodeCancel, vSetCurrent } from '@/services/cmds';

export type Ref = {
	show: (data: Nvmd.Version) => void;
};

type Props = {
	onRefrresh: () => void;
};

const archs = ['arm64', 'x64', 'x86'];

export const Modal = forwardRef<Ref, Props>(({ onRefrresh }, ref) => {
	const [open, setOpen] = useState<boolean>(false);
	const [asDefault, setAsDefault] = useState<boolean>(true);
	const [loading, setLoading] = useState<boolean>(false);
	const [path, setPath] = useState<string>();
	const [, updater] = useState<number>(0);

	const record = useRef<Nvmd.Version>();
	const arch = useRef<HTMLSpanElement>(null);
	const archOption = useRef<string[]>(archs);
	const progress = useRef<Nvmd.ProgressData>();

	const { t } = useTranslation();

	const systemArch = ['x86', 'x32', 'ia32'].includes(OS_ARCH) ? 'x86' : OS_ARCH;

	useImperativeHandle(ref, () => ({
		show: onShow,
	}));

	// onProgress of the download node
	useEffect(() => {
		const unlisted = getCurrent().listen<Nvmd.ProgressData>(
			'on-node-progress',
			({ payload }) => {
				const { source, transferred, total } = payload;
				if (source === 'download') {
					progress.current = {
						source,
						transferred,
						total,
					};
				}

				if (source === 'unzip' && progress.current?.source !== 'unzip') {
					progress.current = {
						...progress.current!,
						source,
						transferred: progress.current!.total,
					};
				}

				updater((pre) => pre + 1);
			}
		);

		return () => {
			unlisted.then((fn) => fn());
		};
	}, []);

	const onShow: Ref['show'] = (data) => {
		const { files } = data,
			platform = OS_PLATFORM;
		const newArchs = archOption.current.filter((arch) => {
			const name =
				platform === 'darwin'
					? `osx-${arch}`
					: platform === 'win32'
					? `win-${arch}`
					: `${platform}-${arch}`;
			return files.find((file) => file.includes(name));
		});
		record.current = data;
		archOption.current = newArchs;
		setOpen(true);
	};

	const onStart = async () => {
		if (!arch.current?.innerText) {
			return toast.warning('arch should not be null');
		}

		setLoading(true);
		setPath(undefined);
		progress.current = undefined;
		try {
			const path = await installNode(
				record.current!.version.slice(1),
				arch.current!.innerText
			);

			progress.current = {
				...progress.current!,
				source: 'download',
			};
			setPath(path);
		} catch (err) {
			toast.error(err);
			setPath('error');
		} finally {
			setLoading(false);
		}
	};

	const onAbort = async () => {
		try {
			await installNodeCancel();
			progress.current = undefined;
			updater((pre) => pre + 1);
		} catch (err) {
			toast.error(err);
		}
	};

	const onFinish = async () => {
		if (asDefault) {
			console.log(record.current!.version.slice(1));
			await vSetCurrent(record.current!.version.slice(1));
		}
		onRefrresh();
		setOpen(false);
		setTimeout(() => {
			reset();
		});
	};

	const reset = () => {
		record.current = undefined;
		progress.current = undefined;
		archOption.current = archs;
		setPath(undefined);
		setAsDefault(true);
	};

	return (
		<AlertDialog open={open}>
			<AlertDialogContent className='top-1/3'>
				<AlertDialogHeader>
					<AlertDialogTitle>{t('Version-Manager')}</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className='space-y-2'>
							<div className='columns-2'>
								<p className='space-x-2'>
									<Label>{t('Version')}</Label>
									<Label className='text-foreground'>
										{record.current?.version}
									</Label>
								</p>
								<p className='space-x-2'>
									<Label>{`NPM ${t('Version')}`}</Label>
									<Label className='text-foreground'>
										{record.current?.npm}
									</Label>
								</p>
							</div>
							<div className='flex items-center h-5'>
								{progress.current ? (
									<div className='flex flex-1 items-center space-x-2'>
										<Progress
											value={
												(progress.current.transferred /
													progress.current.total) *
												100
											}
											className='max-w-60'
										/>
										{progress.current.source === 'unzip' ? (
											<Label>{t('Unzipping')}...</Label>
										) : (
											<Label>{`${progress.current.transferred} / ${progress.current.total} B`}</Label>
										)}
									</div>
								) : (
									<p className='flex-1'>{t('Install-Tip')}</p>
								)}
							</div>
							{path && path !== 'error' ? (
								<div className='flex items-center gap-2'>
									<Label>{t('Installation-Directory')}</Label>
									<LabelCopyable className='text-foreground'>
										{path}
									</LabelCopyable>
								</div>
							) : null}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className='sm:justify-between items-end'>
					<div className='flex flex-col gap-3'>
						<Select disabled={loading} defaultValue={systemArch}>
							<SelectTrigger className='w-24 h-6'>
								<SelectValue ref={arch} />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{archOption.current.map((arch) => (
										<SelectItem key={arch} value={arch}>
											{arch}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<div className='h-6 items-top flex items-center space-x-2'>
							<Checkbox
								id='as-default'
								checked={asDefault}
								onCheckedChange={(checked) => {
									setAsDefault(checked as boolean);
								}}
							/>
							<div className='grid gap-1.5 leading-none'>
								<label
									htmlFor='as-default'
									className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									{t("Set-as-default")}
								</label>
							</div>
						</div>
					</div>
					<div className='flex items-center space-x-2'>
						{path && path !== 'error' ? null : loading ? (
							<Button variant='destructive' onClick={onAbort}>
								{t('Cancel')}
							</Button>
						) : (
							<Button
								variant='secondary'
								onClick={() => {
									setOpen(false);
									setTimeout(() => {
										reset();
									});
								}}
							>
								{t('Cancel')}
							</Button>
						)}
						{path && path !== 'error' ? (
							<Button loading={loading} onClick={onFinish}>
								{t('OK')}
							</Button>
						) : (
							<Button loading={loading} onClick={onStart}>
								{path === 'error' ? t('Retry') : t('Start-Install')}
							</Button>
						)}
					</div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});
