import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
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
import {
  LoaderCircle,
  Share2Icon,
  SquareArrowRightEnter,
  SquareArrowRightExit,
} from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

import { z } from 'zod';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/app-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { configrationExport, configrationImport } from '@/services/cmds';

const items = [
  {
    id: 'color',
    label: 'Theme',
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
          <Button size='sm' title={title} variant='ghost'>
            <Share2Icon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
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

type ConfigrationExportProps = {
  ref?: React.RefObject<Exporter | null>;
};

const ConfigrationExport: React.FC<ConfigrationExportProps> = ({ ref }) => {
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
        baseColor: items.includes('color') ? color.baseColor : void 0,
        color: items.includes('color') ? color.theme : void 0,
        radius: items.includes('color') ? color.radius : void 0,
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
      <AlertDialogContent className='top-1/3 max-w-md!'>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <SquareArrowRightExit />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('Configration-export')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Configration-export-tip')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          id='configuration-export'
          onSubmit={form.handleSubmit(onExportSubmit)}
        >
          <FieldGroup>
            <Controller
              name='items'
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldGroup>
                  <FieldSet data-invalid={fieldState.invalid}>
                    <FieldGroup data-slot='checkbox-group'>
                      {items.map((item) => (
                        <Field
                          key={item.id}
                          orientation='horizontal'
                          data-invalid={fieldState.invalid}
                        >
                          <Checkbox
                            id={`configuration-export-items-${item.id}`}
                            name={field.name}
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
                            className='font-normal'
                          >
                            {item.label}
                            {item.id === 'setting' ? (
                              <span className='text-muted-foreground'>
                                {t('Configration-export-setting')}
                              </span>
                            ) : item.id === 'projects' ? (
                              <span className='text-muted-foreground'>
                                {t('Configration-export-projects')}
                              </span>
                            ) : null}
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
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
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

type ConfigrationImportProps = {
  ref?: React.RefObject<Importer | null>;
};

const ConfigrationImport: React.FC<ConfigrationImportProps> = ({ ref }) => {
  const [open, setOpen] = useState<boolean>(false);

  const { updateColor, updateSetting } = useAppContext();
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
      toast.success(t('Configration-import-success'), { duration: 5000 });
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
      <AlertDialogContent className='top-1/3'>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <SquareArrowRightEnter />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('Configration-import')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Configration-import-tip')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant='outline'>{t('Cancel')}</AlertDialogCancel>
          <Button
            variant='secondary'
            onClick={() => onConfigrationImport(false)}
          >
            {t('Import-only')}
          </Button>
          <AlertDialogAction
            onClick={(evt) => {
              evt.preventDefault();
              onConfigrationImport(true);
            }}
          >
            {t('Import-and-sync')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Configration;
