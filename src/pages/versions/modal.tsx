import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Checkbox,
  FieldError,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';
import { z } from '@/lib/zod';
import { getCurrent } from '@/services/api';
import { installNode, installNodeCancel, vSetCurrent } from '@/services/cmds';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  CheckCheck,
  CloudDownload,
  Copy,
  Cpu,
  Folder,
  LoaderCircle,
  PackageOpen,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export type ModalRef = { show: (data: Nvmd.Version) => void };
type ModalProps = {
  ref?: React.RefObject<ModalRef | null>;
  onRefrresh: () => void | Promise<void>;
};

const archs = ['arm64', 'x64', 'x86'];
const managerSchema = z.object({ arch: z.enum(archs), asDefault: z.boolean() });

function formatBytes(bytes: number, locale: string) {
  const value = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
  const unit =
    value >= 1024 ** 3 ? 3 : value >= 1024 ** 2 ? 2 : value >= 1024 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1024 ** unit)} ${['B', 'KiB', 'MiB', 'GiB'][unit]}`;
}

export const Modal: React.FC<ModalProps> = ({ ref, onRefrresh }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [record, setRecord] = useState<Nvmd.Version>();
  const [archOptions, setArchOptions] = useState(archs);
  const [progress, setProgress] = useState<Nvmd.ProgressData>();
  const [path, setPath] = useState<string>();
  const activeDownload = useRef(false);
  const cancelRequested = useRef(false);
  const [copiedText, copy] = useCopyToClipboard();
  const { t, i18n } = useTranslation();
  const form = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      arch: ['x86', 'x32', 'ia32'].includes(OS_ARCH) ? 'x86' : OS_ARCH,
      asDefault: true,
    },
  });

  useImperativeHandle(ref, () => ({
    show(data) {
      const available = archs.filter((arch) => {
        const platform =
          OS_PLATFORM === 'darwin'
            ? 'osx'
            : OS_PLATFORM === 'win32'
              ? 'win'
              : OS_PLATFORM;
        return data.files.some((file) => file.includes(`${platform}-${arch}`));
      });
      const preferred = ['x86', 'x32', 'ia32'].includes(OS_ARCH)
        ? 'x86'
        : OS_ARCH;
      // Each release has its own architectures; never carry a previous release's selection forward.
      form.reset({
        arch: available.includes(preferred) ? preferred : available[0] || '',
        asDefault: true,
      });
      setRecord(data);
      setArchOptions(available);
      setProgress(undefined);
      setPath(undefined);
      setCancelled(false);
      setOpen(true);
    },
  }));

  useEffect(() => {
    const unlisten = getCurrent().listen<Nvmd.ProgressData>(
      'nvm-desktop://node-download-progress',
      ({ payload }) => {
        if (!activeDownload.current) return;
        setProgress((previous) => {
          // Extraction events do not consistently include download totals; preserve the last known size.
          if (payload.source === 'unzip')
            return {
              source: 'unzip',
              total: previous?.total || 0,
              transferred: previous?.total || 0,
            };
          return previous?.source === 'unzip' ? previous : payload;
        });
      },
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const onStart = async ({ arch }: z.infer<typeof managerSchema>) => {
    if (!record || !archOptions.includes(arch) || activeDownload.current)
      return;
    activeDownload.current = true;
    cancelRequested.current = false;
    setLoading(true);
    setCancelled(false);
    setPath(undefined);
    setProgress(undefined);
    try {
      const installedPath = await installNode(record.version.slice(1), arch);
      setPath(installedPath);
    } catch (error) {
      if (cancelRequested.current) {
        setCancelled(true);
        setProgress(undefined);
      } else {
        toast.error(error);
        setPath('error');
      }
    } finally {
      activeDownload.current = false;
      setLoading(false);
      setCancelling(false);
    }
  };

  const onAbort = async () => {
    if (cancelRequested.current) return;
    cancelRequested.current = true;
    setCancelling(true);
    try {
      // Keep install disabled until the original request settles, preventing overlapping downloads.
      await installNodeCancel();
    } catch (error) {
      cancelRequested.current = false;
      setCancelling(false);
      toast.error(error);
    }
  };

  const onFinish = async () => {
    if (!record || finishing) return;
    setFinishing(true);
    try {
      if (form.getValues('asDefault'))
        await vSetCurrent(record.version.slice(1));
      await onRefrresh();
      setOpen(false);
    } catch (error) {
      toast.error(error);
    } finally {
      setFinishing(false);
    }
  };

  const complete = !!path && path !== 'error';
  const failed = path === 'error';
  const extracting = loading && progress?.source === 'unzip';
  const total = progress?.total || 0;
  const percentage =
    total > 0
      ? Math.min(100, Math.max(0, ((progress?.transferred || 0) / total) * 100))
      : undefined;
  const status = complete
    ? 'Install-Complete'
    : failed
      ? 'Install-Failed'
      : cancelling
        ? 'Install-Cancelling'
        : extracting
          ? 'Unzipping'
          : progress
            ? 'Install-Downloading'
            : 'Install-Preparing';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='flex w-[clamp(26rem,calc(22rem+16vw),38rem)] max-w-[calc(100dvw-2rem)]! max-h-[min(90dvh,calc(100dvh-2rem))] [--dialog-padding:clamp(1rem,min(2vw,3dvh),1.75rem)] [--dialog-gap:clamp(1rem,2.5dvh,1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 ring-0 shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.28),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.16)] dark:shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.65),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.4)]'>
        <div className='flex shrink-0 items-start gap-3 bg-surface-40 bg-linear-to-br from-primary/8 to-transparent p-(--dialog-padding)'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-xs'>
            {complete ? (
              <CheckCheck className='size-5' />
            ) : (
              <CloudDownload className='size-5' />
            )}
          </span>
          <div className='min-w-0 space-y-1'>
            <AlertDialogTitle className='text-base font-semibold tracking-tight'>
              {t(complete ? 'Install-Complete' : 'Start-Install')}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs leading-relaxed'>
              {t(complete ? 'Install-Complete-Description' : 'Install-Tip')}
            </AlertDialogDescription>
          </div>
        </div>
        <div className='min-h-0 space-y-(--dialog-gap) overflow-y-auto overscroll-contain p-(--dialog-padding)'>
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-40 p-[clamp(0.875rem,2dvh,1.25rem)]'>
            <div className='space-y-1.5'>
              <span className='text-xs text-muted-foreground'>Node.js</span>
              <p className='font-mono text-2xl font-semibold tracking-tight'>
                {record?.version}
              </p>
            </div>
            <div className='flex flex-col items-end gap-2'>
              {record?.lts && (
                <span className='rounded-md bg-primary/10 px-2 py-1 text-[0.625rem] font-medium'>
                  LTS · {record.lts}
                </span>
              )}
              <span className='font-mono text-xs text-muted-foreground'>
                npm {record?.npm}
              </span>
            </div>
          </div>
          <form
            id='version-manager'
            onSubmit={form.handleSubmit(onStart)}
            className='space-y-4'
          >
            <Controller
              name='arch'
              control={form.control}
              render={({ field, fieldState }) => (
                <div className='space-y-2'>
                  <label
                    htmlFor='version-manager-arch'
                    className='flex items-center gap-2 text-xs font-medium'
                  >
                    <Cpu className='size-3.5 text-muted-foreground' />
                    {t('Install-Architecture')}
                  </label>
                  <Select
                    items={archOptions.map((value) => ({
                      value,
                      label: value,
                    }))}
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading || complete}
                  >
                    <SelectTrigger
                      id='version-manager-arch'
                      aria-invalid={fieldState.invalid}
                      className='h-9 w-full border-0 bg-surface-50 shadow-none'
                    >
                      <SelectValue placeholder={t('Install-No-Architecture')} />
                    </SelectTrigger>
                    <SelectContent>
                      {archOptions.map((arch) => (
                        <SelectItem key={arch} value={arch}>
                          {arch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!archOptions.length && (
                    <p className='text-xs text-destructive'>
                      {t('Install-No-Architecture')}
                    </p>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </div>
              )}
            />
            <Controller
              name='asDefault'
              control={form.control}
              render={({ field }) => (
                <div className='flex items-center gap-3 rounded-lg bg-surface-25 p-3'>
                  <Checkbox
                    id='version-manager-as-default'
                    disabled={finishing}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <label
                    htmlFor='version-manager-as-default'
                    className='cursor-pointer text-xs leading-relaxed'
                  >
                    {t('Set-as-default')}
                  </label>
                </div>
              )}
            />
          </form>
          {(loading || complete || failed) && (
            <div
              className={cn(
                'space-y-4 rounded-xl bg-surface-40 p-[clamp(0.875rem,2dvh,1.25rem)]',
                complete && 'bg-primary/7',
                failed && 'bg-destructive/5',
              )}
            >
              <div className='flex items-center justify-between gap-3'>
                <p
                  role='status'
                  className='flex items-center gap-2 text-xs font-medium'
                >
                  {complete ? (
                    <Check className='size-4 text-primary' />
                  ) : failed ? (
                    <TriangleAlert className='size-4 text-destructive' />
                  ) : (
                    <LoaderCircle className='size-4 animate-spin text-muted-foreground motion-reduce:animate-none' />
                  )}
                  {t(status)}
                </p>
                {loading && !extracting && percentage !== undefined && (
                  <span className='font-mono text-xs tabular-nums text-muted-foreground'>
                    {Math.floor(percentage)}%
                  </span>
                )}
              </div>
              {loading && !extracting && percentage !== undefined ? (
                <Progress
                  value={percentage}
                  aria-label={t('Download-Progress')}
                  aria-valuenow={Math.floor(percentage)}
                  className='h-2 bg-primary/10'
                />
              ) : loading ? (
                <div
                  role='progressbar'
                  aria-label={t(status)}
                  className='h-2 overflow-hidden rounded-full bg-primary/10'
                >
                  <span className='block h-full w-1/3 animate-pulse rounded-full bg-primary/50 motion-reduce:animate-none' />
                </div>
              ) : complete ? (
                <Progress
                  value={100}
                  aria-label={t('Install-Complete')}
                  aria-valuenow={100}
                  className='h-2 bg-primary/10'
                />
              ) : null}
              {loading && total > 0 && (
                <p className='text-xs tabular-nums text-muted-foreground'>
                  {formatBytes(progress?.transferred || 0, i18n.language)} /{' '}
                  {formatBytes(total, i18n.language)}
                </p>
              )}
              <ol className='grid grid-cols-3 gap-2 text-[0.625rem] text-muted-foreground'>
                {[
                  {
                    label: 'Install-Download',
                    icon: CloudDownload,
                    done: extracting || complete,
                    active: loading && !extracting,
                  },
                  {
                    label: 'Unzipping',
                    icon: PackageOpen,
                    done: complete,
                    active: extracting,
                  },
                  {
                    label: 'Install-Ready',
                    icon: Check,
                    done: complete,
                    active: false,
                  },
                ].map(({ label, icon: Icon, done, active }) => (
                  <li
                    key={label}
                    className={cn(
                      'flex items-center gap-1.5',
                      (done || active) && 'font-medium text-foreground',
                    )}
                  >
                    {done ? (
                      <Check className='size-3 shrink-0 text-primary' />
                    ) : (
                      <Icon
                        className={cn(
                          'size-3 shrink-0',
                          !active && 'opacity-40',
                        )}
                      />
                    )}
                    {t(label)}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {cancelled && (
            <p role='status' className='text-xs text-muted-foreground'>
              {t('Install-Cancelled')}
            </p>
          )}
          {complete && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Folder className='size-3.5' />
                  {t('Installation-Directory')}
                </span>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  title={t(copiedText === path ? 'Error-Copied' : 'Error-Copy')}
                  aria-label={t(
                    copiedText === path ? 'Error-Copied' : 'Error-Copy',
                  )}
                  onClick={() => copy(path!)}
                >
                  {copiedText === path ? <Check /> : <Copy />}
                </Button>
              </div>
              <p className='rounded-lg bg-surface-40 p-3 font-mono text-xs leading-relaxed break-all text-muted-foreground select-text'>
                {path}
              </p>
            </div>
          )}
        </div>
        <AlertDialogFooter className='m-0 shrink-0 flex-row justify-end rounded-none border-0 bg-surface-40 px-(--dialog-padding) py-[clamp(0.75rem,2dvh,1.25rem)]'>
          {complete ? (
            <Button
              disabled={finishing}
              onClick={onFinish}
              className='min-w-24 border-0'
            >
              {finishing ? (
                <LoaderCircle className='animate-spin' />
              ) : (
                <Check />
              )}
              {t('OK')}
            </Button>
          ) : (
            <>
              <Button
                variant='ghost'
                disabled={cancelling}
                onClick={loading ? onAbort : () => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                disabled={loading || !archOptions.length}
                form='version-manager'
                type='submit'
                className='min-w-28 border-0'
              >
                {loading ? (
                  <LoaderCircle className='animate-spin' />
                ) : (
                  <CloudDownload />
                )}
                {t(failed ? 'Retry' : 'Start-Install')}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
