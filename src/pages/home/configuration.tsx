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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  ArrowUpRight,
  Folder,
  Palette,
  Settings2,
  RefreshCw,
  LoaderCircle,
  Share2Icon,
  SquareArrowRightEnter,
  SquareArrowRightExit,
} from 'lucide-react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { useAppContext } from '@/app-context';
import { configurationExport, configurationImport } from '@/services/cmds';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

const items = [
  {
    id: 'color',
    label: 'Theme',
    icon: Palette,
    description: 'Configuration-theme-description',
  },
  {
    id: 'setting',
    label: 'Setting',
    icon: Settings2,
    description: 'Configuration-export-setting',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Folder,
    description: 'Configuration-export-projects',
  },
] as const;

// Grow gently with the app window without changing card proportions; only the body scrolls.
const dialogClassName =
  'flex w-[clamp(30rem,calc(28rem+8vw),36rem)] max-w-[calc(100dvw-2rem)]! max-h-[calc(100dvh-2rem)] flex-col overflow-hidden gap-[clamp(0.75rem,2.5dvh,1.5rem)] rounded-2xl p-[clamp(1rem,3dvh,1.75rem)] shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.28),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.16)] dark:shadow-[0_1.5rem_4rem_-0.75rem_rgb(0_0_0/0.65),0_0.5rem_1.25rem_-0.5rem_rgb(0_0_0/0.4)]';
const headerClassName =
  'flex! shrink-0 flex-col! items-start! gap-2! text-left!';
const bodyClassName = 'min-h-0 overflow-y-auto overscroll-contain -m-1 p-1';
const footerClassName =
  'm-0 shrink-0 flex-row justify-end gap-2 rounded-xl border-0 bg-surface-50 p-3';

const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
});

const Configuration: React.FC = () => {
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

  const title = t('Configuration'),
    platform = OS_PLATFORM;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size='sm' title={title} variant='ghost'>
              <Share2Icon />
            </Button>
          }
        />
        <DropdownMenuContent className='w-64 rounded-xl p-2'>
          <DropdownMenuGroup>
            <DropdownMenuLabel className='px-2 pb-2 text-xs text-muted-foreground'>
              {title}
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                exporter.current?.alert();
              }}
            >
              <SquareArrowRightExit className='text-muted-foreground' />
              {t('Configuration-export')}
              <DropdownMenuShortcut>
                ⇧{platform === 'win32' ? '⊞' : '⌘'}E
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                importer.current?.alert();
              }}
            >
              <SquareArrowRightEnter className='text-muted-foreground' />
              {t('Configuration-import')}
              <DropdownMenuShortcut>
                ⇧{platform === 'win32' ? '⊞' : '⌘'}I
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfigurationExport ref={exporter} />
      <ConfigurationImport ref={importer} />
    </>
  );
};

type Exporter = {
  alert: () => void;
};

type ConfigurationExportProps = {
  ref?: React.RefObject<Exporter | null>;
};

const ConfigurationExport: React.FC<ConfigurationExportProps> = ({ ref }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { color } = useAppContext();
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: ['color', 'setting', 'projects'],
    },
  });

  const onAlert = () => {
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    alert: onAlert,
  }));

  const onExportSubmit = async (values: z.infer<typeof FormSchema>) => {
    const path = await openDialog({
      title: t('Directory-Select'),
      directory: true,
    });
    if (!path) return;

    const { items } = values;
    setLoading(true);
    try {
      // oxlint-disable-next-line react/purity
      const now = Date.now();
      const filename = `${path}${OS_PLATFORM === 'win32' ? '\\' : '/'}configuration_${now}.json`;
      const exportSetting = items.includes('setting');

      await configurationExport(filename, {
        baseColor: items.includes('color') ? color.baseColor : void 0,
        color: items.includes('color') ? color.theme : void 0,
        radius: items.includes('color') ? color.radius : void 0,
        projects: items.includes('projects'),
        setting: exportSetting,
        mirrors: exportSetting
          ? localStorage.getItem('nvmd-mirror') || void 0
          : void 0,
      });
      toast.success(
        t('Configuration-export-success', {
          filename,
        }),
        {
          duration: 5000,
        },
      );
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
        if (!open)
          form.reset({
            items: ['color', 'setting', 'projects'],
          });
        setOpen(open);
      }}
    >
      <AlertDialogContent className={dialogClassName}>
        <AlertDialogHeader className={headerClassName}>
          <span className='mb-1 grid size-11 place-items-center rounded-xl bg-primary/10 bg-linear-to-br from-primary/10 to-transparent text-primary [&_svg]:size-5'>
            <SquareArrowRightExit />
          </span>
          <AlertDialogTitle className='text-lg font-semibold tracking-tight'>
            {t('Configuration-export')}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-xs leading-relaxed'>
            {t('Configuration-export-tip')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          id='configuration-export'
          className={bodyClassName}
          onSubmit={form.handleSubmit(onExportSubmit)}
        >
          <FieldGroup>
            <Controller
              name='items'
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldGroup>
                  <FieldSet data-invalid={fieldState.invalid}>
                    <FieldGroup data-slot='checkbox-group' className='gap-2!'>
                      {items.map((item) => (
                        <Field
                          key={item.id}
                          orientation='horizontal'
                          className={cn(
                            'relative gap-3 rounded-xl bg-surface-40 p-3.5 transition-colors hover:bg-surface-hover-70',
                            field.value.includes(item.id) &&
                              'bg-primary/7 hover:bg-primary/10',
                          )}
                          data-invalid={fieldState.invalid}
                        >
                          {/* Keep the checkbox above the stretched label so both remain clickable. */}
                          <Checkbox
                            id={`configuration-export-items-${item.id}`}
                            className='relative z-10'
                            name={field.name}
                            disabled={loading}
                            aria-invalid={fieldState.invalid}
                            checked={field.value.includes(item.id)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...field.value, item.id]
                                : field.value.filter(
                                    (value) => value !== item.id,
                                  );
                              field.onChange(newValue);
                            }}
                          />
                          <FieldLabel
                            htmlFor={`configuration-export-items-${item.id}`}
                            className='cursor-pointer items-center gap-3 font-normal after:absolute after:inset-0'
                          >
                            <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground shadow-xs'>
                              <item.icon className='size-4' />
                            </span>
                            <span className='flex min-w-0 flex-col gap-1'>
                              <span className='text-sm font-medium'>
                                {t(item.label)}
                              </span>
                              <span className='text-xs leading-relaxed text-muted-foreground'>
                                {t(item.description)}
                              </span>
                            </span>
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldSet>
                </FieldGroup>
              )}
            />
          </FieldGroup>
        </form>
        <AlertDialogFooter className={footerClassName}>
          <AlertDialogCancel variant='ghost' disabled={loading}>
            {t('Cancel')}
          </AlertDialogCancel>
          <Button disabled={loading} type='submit' form='configuration-export'>
            {loading && <LoaderCircle className='animate-spin' />}
            {t('Continue')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

type Importer = {
  alert: () => void;
};

type ConfigurationImportProps = {
  ref?: React.RefObject<Importer | null>;
};

const ConfigurationImport: React.FC<ConfigurationImportProps> = ({ ref }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { updateColor, updateSetting } = useAppContext();
  const { t } = useTranslation();

  const onAlert = () => {
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    alert: onAlert,
  }));

  const onConfigurationImport = async (sync: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await configurationImport(sync);
      if (!data) return;

      const { baseColor, color, radius, mirrors, setting } = data;
      if (baseColor || color || radius) {
        updateColor({
          baseColor: baseColor ?? void 0,
          theme: color ?? void 0,
          radius: radius ?? void 0,
        });
      }

      if (mirrors) {
        localStorage.setItem('nvmd-mirror', mirrors);
      }

      if (setting) {
        updateSetting(setting);
      }

      setOpen(false);
      toast.success(t('Configuration-import-success'), {
        duration: 5000,
      });
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
        setOpen(open);
      }}
    >
      <AlertDialogContent className={dialogClassName}>
        <AlertDialogHeader className={headerClassName}>
          <span className='mb-1 grid size-11 place-items-center rounded-xl bg-primary/10 bg-linear-to-br from-primary/10 to-transparent text-primary [&_svg]:size-5'>
            <SquareArrowRightEnter />
          </span>
          <AlertDialogTitle className='text-lg font-semibold tracking-tight'>
            {t('Configuration-import')}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-xs leading-relaxed'>
            {t('Configuration-import-tip')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className={cn(bodyClassName, 'space-y-2')} aria-busy={loading}>
          {[
            {
              sync: false,
              label: 'Import-only',
              description: 'Configuration-import-only-description',
              icon: SquareArrowRightEnter,
            },
            {
              sync: true,
              label: 'Import-and-sync',
              description: 'Configuration-import-sync-description',
              icon: RefreshCw,
            },
          ].map(({ sync, label, description, icon: Icon }) => (
            <button
              key={label}
              type='button'
              disabled={loading}
              onClick={() => onConfigurationImport(sync)}
              className='group flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface-50 p-4 text-left transition-colors hover:bg-surface-primary-hover-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
            >
              <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-background text-primary shadow-xs'>
                <Icon className='size-4' />
              </span>
              <span className='flex-1 space-y-1'>
                <span className='block text-sm font-medium'>{t(label)}</span>
                <span className='block text-xs leading-relaxed text-muted-foreground'>
                  {t(description)}
                </span>
              </span>
              <ArrowUpRight className='size-4 shrink-0 text-muted-foreground group-hover:text-primary' />
            </button>
          ))}
        </div>
        <AlertDialogFooter className={footerClassName}>
          {loading && (
            <span
              role='status'
              className='mr-auto flex items-center px-2 text-muted-foreground'
            >
              <LoaderCircle className='size-4 animate-spin' />
              <span className='sr-only'>{t('Configuration-import')}</span>
            </span>
          )}
          <AlertDialogCancel variant='ghost' disabled={loading}>
            {t('Cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Configuration;
