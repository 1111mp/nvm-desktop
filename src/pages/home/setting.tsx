import { useRef, useState } from 'react';
import {
  Button,
  LabelCopyable,
  RadioGroup,
  RadioGroupItem,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  SheetDescription,
  Input,
  IpInput,
  Switch,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
  FieldDescription,
  FieldTitle,
  Select,
  AutoComplete,
} from '@/components/ui';
import {
  InfoIcon,
  LoaderCircle,
  SettingsIcon,
  SquarePenIcon,
} from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppContext } from '@/app-context';
import { compareObject } from '@/lib/utils';
import { Closer, Themes } from '@/types';
import { z } from '@/lib/zod';

type Props = unknown;

const DefNodeVersionFiles = ['.nvmrc', '.nvmdrc', '.node-version'];
const DefMirrors = [
  'https://nodejs.org/dist',
  'https://npmmirror.com/mirrors/node',
];

const formSchema = z.object({
  locale: z.string(),
  theme: z.enum(Themes),
  closer: z.enum(Closer),
  coder: z.string(),
  node_version_file: z.string(),
  directory: z.string().min(1),
  mirror: z.url({ message: 'Invalid mirror url' }),
  proxy: z
    .object({
      enabled: z.boolean().default(false).optional(),
      ip: z.ipv4({ message: 'Invalid ip' }).optional().or(z.literal('')),
      port: z
        .string()
        .regex(/^\d+$/, 'Invalid port')
        .optional()
        .or(z.literal('')),
    })
    .superRefine((val, ctx) => {
      if (val.enabled && (val.ip === '' || val.ip === void 0)) {
        ctx.addIssue({
          code: 'custom',
          path: ['ip'],
          message: 'Invalid ip',
        });
      }

      if (
        val.enabled &&
        (val.port === '' || val.port === '0' || val.port === void 0)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['port'],
          message: 'Invalid port',
        });
      }
    }),
});

const Setting: React.FC<Props> = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [versionFileOpts, setVersionFileOptions] = useState<string[]>(() => {
    const optStr = localStorage.getItem('nvmd-version-file');
    return optStr ? optStr.split('__') : [];
  });
  const [mirrorOpts, setMirrorOpts] = useState<string[]>(() => {
    const optStr = localStorage.getItem('nvmd-mirror');
    return optStr ? optStr.split('__') : [];
  });

  const { settings, updateSetting } = useAppContext();
  const defaultSettings = {
    ...settings,
    node_version_file: settings.node_version_file ?? '.nvmdrc',
    proxy: settings.proxy || { enabled: false, ip: '', port: '' },
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultSettings,
  });

  const sheetContent = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const {
      locale: newLocale,
      theme: newTheme,
      closer: newCloser,
      coder: newCoder,
      node_version_file: newNodeVersionFile,
      directory: newDirectory,
      mirror: newMirror,
      proxy: newProxy,
    } = values;
    if (
      settings.locale === newLocale &&
      settings.theme === newTheme &&
      settings.closer === newCloser &&
      settings.coder === newCoder &&
      settings.node_version_file === newNodeVersionFile &&
      settings.directory === newDirectory &&
      settings.mirror === newMirror &&
      compareObject(settings.proxy, newProxy)
    ) {
      setLoading(false);
      setOpen(false);
      return;
    }

    // for custom node file config name
    // if not exesit need to cache
    if (
      ![...DefNodeVersionFiles, ...versionFileOpts].includes(newNodeVersionFile)
    ) {
      setVersionFileOptions((pre) => {
        let newOptions = [...pre];
        newOptions.unshift(newNodeVersionFile);
        // max cache 5
        newOptions = newOptions.slice(0, 5);
        localStorage.setItem('nvmd-version-file', newOptions.join('__'));

        return newOptions;
      });
    }

    // for custom mirror url
    // if not exesit need to cache
    if (![...DefMirrors, ...mirrorOpts].includes(newMirror)) {
      setMirrorOpts((pre) => {
        let newOptions = [...pre];
        newOptions.unshift(newMirror);
        // max cache 5
        newOptions = newOptions.slice(0, 5);
        localStorage.setItem('nvmd-mirror', newOptions.join('__'));

        return newOptions;
      });
    }

    try {
      await updateSetting({
        locale: newLocale,
        theme: newTheme,
        closer: newCloser,
        coder: newCoder,
        node_version_file: newNodeVersionFile,
        directory: newDirectory,
        mirror: newMirror,
        proxy: newProxy,
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const enabled = useWatch({
      control: form.control,
      name: 'proxy.enabled',
    }),
    versionFileItems = [
      {
        value: t('Custom'),
        items: versionFileOpts,
      },
      {
        value: t('Default'),
        items: DefNodeVersionFiles,
      },
    ],
    mirrorItems = [
      { value: t('Custom'), items: mirrorOpts },
      {
        value: t('Default'),
        items: DefMirrors,
      },
    ];

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        form.reset(defaultSettings);
        setOpen(open);
      }}
    >
      <SheetTrigger asChild>
        <Button
          size='sm'
          variant='ghost'
          title={t('Setting')}
          className='nvmd-setting'
        >
          <SettingsIcon />
        </Button>
      </SheetTrigger>
      <SheetContent ref={sheetContent} className='gap-0'>
        <SheetHeader className='pt-6 px-6'>
          <SheetTitle>{t('Setting')}</SheetTitle>
          <SheetDescription>{t('Setting-Desc')}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 px-6 space-y-6 [overflow-y:overlay]'>
          <form id='form-setting' onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className='gap-4'>
              <Controller
                name='locale'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor='form-setting-locale'
                      className='text-muted-foreground'
                    >
                      {t('Language')}
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className='w-44! h-8!'
                        id='form-setting-locale'
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder='Select a language to display' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='zh-CN'>简体中文</SelectItem>
                        <SelectItem value='en'>English</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='theme'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className='text-muted-foreground'>
                      {t('Themes')}
                    </FieldLabel>
                    <RadioGroup
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FieldLabel htmlFor='form-setting-theme-system'>
                        <Field orientation='horizontal' className='py-1.5!'>
                          <RadioGroupItem
                            value={Themes.System}
                            id='form-setting-theme-system'
                          />
                          <FieldContent>
                            <FieldTitle>{t('System-Default')}</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor='form-setting-theme-light'>
                        <Field orientation='horizontal' className='py-1.5!'>
                          <RadioGroupItem
                            value={Themes.Light}
                            id='form-setting-theme-light'
                          />
                          <FieldContent>
                            <FieldTitle>{t('Light')}</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor='form-setting-theme-dark'>
                        <Field orientation='horizontal' className='py-1.5!'>
                          <RadioGroupItem
                            value={Themes.Dark}
                            id='form-setting-theme-dark'
                          />
                          <FieldContent>
                            <FieldTitle>{t('Dark')}</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='closer'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className='text-muted-foreground'>
                      {t('When-Closing')}
                    </FieldLabel>
                    <RadioGroup
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FieldLabel htmlFor='form-setting-closer-minimize'>
                        <Field orientation='horizontal' className='py-1.5!'>
                          <RadioGroupItem
                            value={Closer.Minimize}
                            id='form-setting-closer-minimize'
                          />
                          <FieldContent>
                            <FieldTitle>{t('Minimize-Window')}</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor='form-setting-closer-close'>
                        <Field orientation='horizontal' className='py-1.5!'>
                          <RadioGroupItem
                            value={Closer.Close}
                            id='form-setting-closer-close'
                          />
                          <FieldContent>
                            <FieldTitle>{t('Quit-App')}</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='coder'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-muted-foreground'
                      htmlFor='form-setting-coder'
                    >
                      {t('VSCode-Code-Command')}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className='size-4 text-primary cursor-pointer' />
                        </TooltipTrigger>
                        <TooltipContent className='w-96'>
                          {t('VSCode-Code-Command-tip')}
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-setting-coder'
                      aria-invalid={fieldState.invalid}
                      placeholder='Enter'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='node_version_file'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-muted-foreground'
                      htmlFor='form-setting-version_file'
                    >
                      {t('Node-Version-File')}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className='size-4 text-primary cursor-pointer' />
                        </TooltipTrigger>
                        <TooltipContent className='w-96 break-normal'>
                          {t('Node-Version-File-Tip')}
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <AutoComplete
                      value={field.value}
                      container={sheetContent}
                      items={versionFileItems}
                      id='form-setting-version_file'
                      placeholder='Node Version File'
                      aria-invalid={fieldState.invalid}
                      onChange={field.onChange}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='directory'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className='text-muted-foreground'>
                      {t('Installation-Directory')}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className='size-4 text-primary cursor-pointer' />
                        </TooltipTrigger>
                        <TooltipContent className='w-96'>
                          {t('Installation-Directory-tip')}
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                    <div className='flex items-center justify-between'>
                      <Tooltip delayDuration={700}>
                        <TooltipTrigger asChild>
                          <LabelCopyable
                            rootClassName='flex item-center'
                            className='max-w-64 inline-block truncate leading-5'
                          >
                            {field.value}
                          </LabelCopyable>
                        </TooltipTrigger>
                        <TooltipContent>{field.value}</TooltipContent>
                      </Tooltip>
                      <Button
                        size='xs'
                        type='button'
                        variant='secondary'
                        onClick={async (evt) => {
                          evt.preventDefault();
                          const path = await openDialog({
                            title: t('Directory-Select'),
                            directory: true,
                          });

                          if (path) {
                            field.onChange(path);
                          }
                        }}
                      >
                        <SquarePenIcon />
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='proxy'
                control={form.control}
                render={() => (
                  <Field>
                    <FieldLabel className='inline-block text-muted-foreground'>
                      {t('Proxy')}
                    </FieldLabel>
                    <div className='space-y-4'>
                      <Controller
                        name='proxy.enabled'
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field
                            orientation='horizontal'
                            data-invalid={fieldState.invalid}
                          >
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldDescription>
                              {t(field.value ? 'Enabled' : 'Disabled')}
                            </FieldDescription>
                          </Field>
                        )}
                      />
                      <div className='flex items-center gap-2'>
                        <Controller
                          name='proxy.ip'
                          control={form.control}
                          render={({ field, fieldState }) => {
                            return (
                              <Field
                                className='relative w-40'
                                data-disabled={!enabled}
                                data-invalid={fieldState.invalid}
                              >
                                <IpInput {...field} disabled={!enabled} />
                                {fieldState.invalid && (
                                  <FieldError
                                    className='absolute top-full'
                                    errors={[fieldState.error]}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        />
                        <span>:</span>
                        <div className='w-20'>
                          <Controller
                            name='proxy.port'
                            control={form.control}
                            render={({ field, fieldState }) => {
                              return (
                                <Field
                                  className='relative'
                                  data-invalid={fieldState.invalid}
                                >
                                  <Input
                                    {...field}
                                    disabled={!enabled}
                                    // className='w-18 h-8 text-center'
                                  />
                                  {fieldState.invalid && (
                                    <FieldError
                                      className='absolute top-full'
                                      errors={[fieldState.error]}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Field>
                )}
              />
              <Controller
                name='mirror'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-muted-foreground'
                      htmlFor='form-setting-mirror'
                    >
                      {t('Mirror-Url')}
                    </FieldLabel>
                    <AutoComplete
                      value={field.value}
                      container={sheetContent}
                      items={mirrorItems}
                      id='form-setting-mirror'
                      placeholder='Mirror Url'
                      aria-invalid={fieldState.invalid}
                      onChange={field.onChange}
                    />
                    <FieldDescription>{t('Mirror-Tip')}</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </div>
        <SheetFooter>
          <Button type='submit' form='form-setting'>
            {loading && <LoaderCircle className='animate-spin' />}
            {t('OK')}
          </Button>
          <SheetClose asChild>
            <Button variant='outline'>{t('Cancel')}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

Setting.displayName = 'Setting';

export default Setting;
