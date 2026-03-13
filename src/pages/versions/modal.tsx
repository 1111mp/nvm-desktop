import { useEffect, useImperativeHandle, useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { CloudDownload, LoaderCircle } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from '@/lib/zod';
import { zodResolver } from '@hookform/resolvers/zod';

export type ModalRef = {
  show: (data: Nvmd.Version) => void;
};

type ModalProps = {
  ref?: React.RefObject<ModalRef | null>;
  onRefrresh: () => void;
};

const archs = ['arm64', 'x64', 'x86'];
const managerSchema = z.object({
  arch: z.enum(archs),
  asDefault: z.boolean(),
});

export const Modal: React.FC<ModalProps> = ({ ref, onRefrresh }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [path, setPath] = useState<string>();
  const [, updater] = useState<number>(0);

  const record = useRef<Nvmd.Version>(undefined);
  const arch = useRef<HTMLSpanElement>(null);
  const archOption = useRef<string[]>(archs);
  const progress = useRef<Nvmd.ProgressData>(undefined);

  const { t } = useTranslation();

  const form = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      arch: ['x86', 'x32', 'ia32'].includes(OS_ARCH) ? 'x86' : OS_ARCH,
      asDefault: true,
    },
  });

  useImperativeHandle(ref, () => ({
    show: onShow,
  }));

  // onProgress of the download node
  useEffect(() => {
    const unlisted = getCurrent().listen<Nvmd.ProgressData>(
      'nvm-desktop://node-download-progress',
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
      },
    );

    return () => {
      unlisted.then((fn) => fn());
    };
  }, []);

  const onShow: ModalRef['show'] = (data) => {
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

  const onStart = async (value: z.infer<typeof managerSchema>) => {
    const { arch } = value;
    if (!arch) {
      return toast.warning('arch should not be null');
    }

    setLoading(true);
    setPath(undefined);
    progress.current = undefined;
    try {
      const path = await installNode(record.current!.version.slice(1), arch);

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
    const asDefault = form.getValues('asDefault');
    if (asDefault) {
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
    form.reset();
  };

  const complete = path && path !== 'error';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='top-1/3 max-w-md!'>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <CloudDownload />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('Version-Manager')}</AlertDialogTitle>
          <AlertDialogDescription>{t('Install-Tip')}</AlertDialogDescription>
        </AlertDialogHeader>
        <form id='version-manager' onSubmit={form.handleSubmit(onStart)}>
          <FieldGroup className='gap-2'>
            <FieldSet className='grid grid-cols-2'>
              <Field>
                <FieldLegend>{t('Version')}</FieldLegend>
                <FieldDescription>{record.current?.version}</FieldDescription>
              </Field>
              <Field>
                <FieldLegend>{`NPM ${t('Version')}`}</FieldLegend>
                <FieldDescription>{record.current?.npm}</FieldDescription>
              </Field>
            </FieldSet>
            <FieldSet>
              <Controller
                name='arch'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='w-24! h-6'>
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='asDefault'
                control={form.control}
                render={({ field }) => (
                  <Field orientation='horizontal'>
                    <Checkbox
                      id='version-manager-as-default'
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor='version-manager-as-default'
                      className='font-normal'
                    >
                      {t('Set-as-default')}
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldSet>
          </FieldGroup>
        </form>
        {progress.current && (
          <div className='flex items-center gap-2'>
            <Progress
              value={
                (progress.current.transferred / progress.current.total) * 100
              }
              className='max-w-60'
            />
            {progress.current.source === 'unzip' ? (
              <Label>{t('Unzipping')}...</Label>
            ) : (
              <Label>{`${progress.current.transferred} / ${progress.current.total} B`}</Label>
            )}
          </div>
        )}
        {complete ? (
          <div className='flex flex-col gap-1'>
            <Label>{t('Installation-Directory')}</Label>
            <LabelCopyable className='max-w-96 inline-block text-foreground truncate'>
              {path}
            </LabelCopyable>
          </div>
        ) : null}
        <AlertDialogFooter>
          {complete ? null : loading ? (
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
          {complete ? (
            <Button disabled={loading} onClick={onFinish}>
              {loading && <LoaderCircle className='animate-spin' />}
              {t('OK')}
            </Button>
          ) : (
            <Button disabled={loading} form='version-manager' type='submit'>
              {loading && <LoaderCircle className='animate-spin' />}
              {path === 'error' ? t('Retry') : t('Start-Install')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
