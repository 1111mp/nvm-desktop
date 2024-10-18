import './progress.css';

import { useEffect, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Progress,
} from '@/components/ui';
import Markdown from 'react-markdown';
import { GlobeIcon } from '@radix-ui/react-icons';
import { CircularProgressbar } from 'react-circular-progressbar';
import { check, type Update } from '@tauri-apps/plugin-updater';

import { toast } from 'sonner';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { relaunch } from '@/services/cmds';

enum ModalType {
	Check = 'check',
	Complete = 'complete',
}

export const Updater: React.FC = () => {
	const [open, setOpen] = useState<{ visible: boolean; type: ModalType }>({
		visible: false,
		type: ModalType.Check,
	});
	const [pop, setPop] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [percentage, setPercentage] = useState<number>();
	const [updateInfo, setUpdateInfo] = useState<Update>();

	const { t } = useTranslation();

	/// auto check update
	useEffect(() => {
		const checkUpdate = async () => {
			try {
				const update = await check();
				if (update) {
					setUpdateInfo(update);
				}
			} catch (err) {}
		};

		checkUpdate();
	}, []);

	const onCheckUpdates = async () => {
		if (updateInfo?.available) {
			return setOpen({ visible: true, type: ModalType.Check });
		}

		setLoading(true);
		try {
			const update = await check();
			if (update) {
				setUpdateInfo(update);
				setOpen({ visible: true, type: ModalType.Check });
			} else {
				toast.success(t('Up-to-date'));
			}
		} catch (err) {
			toast.error(err?.message || err.toString());
		} finally {
			setLoading(false);
		}
	};

	const onUpgrade = async () => {
		if (!updateInfo) return;

		setOpen({ visible: false, type: ModalType.Check });

		let downloaded = 0;
		let contentLength = 0;
		const updateProgress = debounce((downloaded, contentLength) => {
			const percent = Math.floor((downloaded / contentLength) * 100);
			setPercentage(percent);
		}, 100);

		await updateInfo.download((progress) => {
			switch (progress.event) {
				case 'Started': {
					contentLength = progress.data.contentLength!;
					break;
				}
				case 'Progress': {
					downloaded += progress.data.chunkLength;
					updateProgress(downloaded, contentLength);
					break;
				}
				case 'Finished': {
					setOpen({ visible: true, type: ModalType.Complete });
					break;
				}
			}
		});
	};

	const onMakeUpdateNow = async () => {
		if (!updateInfo) return;

		try {
			await updateInfo.install();
			await relaunch();
		} catch (err) {
			toast.error(err?.message || err.toString());
		}
	};

	return (
		<>
			{percentage === void 0 ? (
				<div className='relative flex'>
					<Button
						size='sm'
						variant='ghost'
						loading={loading}
						title={t('Check-Update')}
						className='module-home-btn'
						icon={<GlobeIcon />}
						onClick={onCheckUpdates}
					/>
					{updateInfo?.available && (
						<span className='inline-block absolute top-1 left-1 w-1.5 h-1.5 rounded bg-red-500' />
					)}
				</div>
			) : (
				<Popover open={pop} onOpenChange={(open) => setPop(open)}>
					<PopoverTrigger asChild>
						<Button
							size='sm'
							variant='ghost'
							className='w-[31px] h-6'
							icon={<CircularProgressbar value={percentage} />}
							onClick={() => {
								percentage >= 100 &&
									setOpen({ visible: true, type: ModalType.Complete });
							}}
							onMouseOver={() => {
								setPop(true);
							}}
						/>
					</PopoverTrigger>
					<PopoverContent align='end' className='p-2'>
						<p className='text-sm font-normal'>{t('Download-Progress')}</p>
						<div className='flex items-center gap-2'>
							<Progress value={percentage} className='my-2' />
							<span className='text-xs'>{percentage}%</span>
						</div>
					</PopoverContent>
				</Popover>
			)}

			<AlertDialog open={open.visible}>
				<AlertDialogContent className='top-72'>
					<AlertDialogHeader className='space-y-0'>
						<AlertDialogTitle>{t('Update-Info')}</AlertDialogTitle>
						<AlertDialogDescription className='my-0'></AlertDialogDescription>
					</AlertDialogHeader>
					<div>
						{open.type === ModalType.Check && updateInfo ? (
							<>
								<div className='columns-2'>
									<p className='space-x-4 mb-3'>
										<Label>{t('Current-Version')} :</Label>
										<span className='text-popover-foreground'>
											{updateInfo?.currentVersion}
										</span>
									</p>
									<p className='space-x-4 mb-3'>
										<Label>{t('New-Version')} :</Label>
										<span className='text-popover-foreground'>
											{updateInfo?.version}
										</span>
									</p>
								</div>
								<p className='space-x-4'>
									<Label>{t('Release-Notes')} :</Label>
								</p>
								<Markdown
									className='max-h-60 mt-2 p-3 overflow-auto bg-secondary text-secondary-foreground rounded-sm'
									components={{
										a: ({ children, ...props }) => {
											return (
												<a
													className='text-primary underline'
													{...props}
													target='_blank'
												>
													{children}
												</a>
											);
										},
										h3: ({ children }) => (
											<h3 className='text-base font-bold'>{children}</h3>
										),
										ul: ({ children }) => (
											<ul className='px-6 py-2'>{children}</ul>
										),
										li: ({ children }) => (
											<li className='text-sm leading-6 list-disc'>
												{children}
											</li>
										),
										code: ({ children }) => (
											<code className='px-1.5 text-card-foreground bg-card rounded-sm'>
												{children}
											</code>
										),
									}}
								>
									{updateInfo.body}
								</Markdown>
							</>
						) : (
							<p>{t('Upgrade-Tip')}</p>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setOpen({ visible: false, type: ModalType.Check })}
						>
							{t('Cancel')}
						</AlertDialogCancel>
						{open.type === ModalType.Check ? (
							<AlertDialogAction onClick={onUpgrade}>
								{t('Upgrade')}
							</AlertDialogAction>
						) : (
							<AlertDialogAction onClick={onMakeUpdateNow}>
								{t('Quit-And-Install')}
							</AlertDialogAction>
						)}
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
