import {
  AutoComplete,
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  Input,
  IpInput,
  LabelCopyable,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  Check,
  FileCode2,
  Folder,
  Globe2,
  InfoIcon,
  LoaderCircle,
  Network,
  Palette,
  SettingsIcon,
  SlidersHorizontal,
  SquarePenIcon,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { useAppContext } from '@/app-context';
import { compareObject } from '@/lib/utils';
import { z } from '@/lib/zod';
import { Closer, Themes } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
const languageOptions = [
  {
    value: 'zh-CN',
    short: '中',
    label: '简体中文',
  },
  {
    value: 'pl',
    short: 'PL',
    label: 'Polski',
  },
  {
    value: 'en',
    short: 'EN',
    label: 'English',
  },
];

function LanguageOptionLabel({
  short,
  label,
}: {
  short: string;
  label: string;
}) {
  return (
    <>
      <span
        aria-hidden='true'
        className='grid size-6 shrink-0 place-items-center rounded-md bg-surface-60 text-[0.625rem] text-muted-foreground'
      >
        {short}
      </span>
      <span>{label}</span>
    </>
  );
}

// Base UI resolves the closed trigger from items, so share the full visual label.
const languageItems = languageOptions.map(({ value, short, label }) => ({
  value,
  label: <LanguageOptionLabel short={short} label={label} />,
}));

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
  mirror: z.url({
    message: 'Invalid mirror url',
  }),
  proxy: z
    .object({
      enabled: z.boolean().default(false).optional(),
      ip: z
        .ipv4({
          message: 'Invalid ip',
        })
        .optional()
        .or(z.literal('')),
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
  embed_server_port: z
    .number()
    .int('Port must be an integer')
    .min(3000, 'Port must be between 3000 and 65535.')
    .max(65535, 'Port must be between 3000 and 65535.'),
});

const Setting: React.FC<Props> = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [languageOpen, setLanguageOpen] = useState(false);

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
    proxy: settings.proxy || {
      enabled: false,
      ip: '',
      port: '',
    },
    embed_server_port: settings.embed_server_port ?? 53333,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultSettings,
  });

  const drawerContent = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
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
      embed_server_port: newEmbedServerPort,
    } = values;
    if (
      settings.locale === newLocale &&
      settings.theme === newTheme &&
      settings.closer === newCloser &&
      settings.coder === newCoder &&
      settings.node_version_file === newNodeVersionFile &&
      settings.directory === newDirectory &&
      settings.mirror === newMirror &&
      compareObject(settings.proxy, newProxy) &&
      settings.embed_server_port === newEmbedServerPort
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
        embed_server_port: newEmbedServerPort,
      });
      setOpen(false);
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
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
      {
        value: t('Custom'),
        items: mirrorOpts,
      },
      {
        value: t('Default'),
        items: DefMirrors,
      },
    ];

  return (
    <Drawer
      direction='right'
      handleOnly
      repositionInputs={false}
      autoFocus
      dismissible={!loading}
      open={open}
      onOpenChange={(open) => {
        if (loading) return;
        if (open) form.reset(defaultSettings);
        else setLanguageOpen(false);
        setOpen(open);
      }}
    >
      <DrawerTrigger asChild>
        <Button
          size='sm'
          variant='ghost'
          title={t('Setting')}
          aria-label={t('Setting')}
          className='nvmd-setting'
        >
          <SettingsIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        ref={drawerContent}
        className='gap-0'
        onEscapeKeyDown={(event) => {
          // Vaul handles Escape in capture before Base UI can dismiss its select.
          if (languageOpen) event.preventDefault();
        }}
      >
        <DrawerHandle aria-label={t('Drawer-Drag')} />
        <DrawerHeader className='shrink-0 gap-3 rounded-t-2xl bg-surface-40 bg-linear-to-br from-primary/8 to-transparent p-5 sm:p-6'>
          <div className='flex items-center justify-between gap-3'>
            <span className='grid size-10 place-items-center rounded-xl bg-background text-primary shadow-xs'>
              <SettingsIcon className='size-5' />
            </span>
            <DrawerClose asChild>
              <Button
                variant='ghost'
                size='icon-sm'
                disabled={loading}
                aria-label={t('Close')}
              >
                <X />
              </Button>
            </DrawerClose>
          </div>
          <div className='space-y-1.5'>
            <DrawerTitle className='text-xl font-semibold tracking-tight'>
              {t('Setting')}
            </DrawerTitle>
            <DrawerDescription className='max-w-sm text-xs leading-relaxed'>
              {t('Setting-Desc')}
            </DrawerDescription>
          </div>
        </DrawerHeader>
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6'>
          <form id='form-setting' onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={loading} className='space-y-5'>
              <section className='space-y-4 rounded-xl bg-surface-35 p-4'>
                <h3 className='flex items-center gap-2 text-xs font-semibold'>
                  <Palette className='size-3.5 text-muted-foreground' />
                  {t('Settings-Appearance')}
                </h3>
                <FieldGroup className='gap-4'>
                  <Controller
                    name='locale'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor='form-setting-locale'
                          className='text-xs font-medium'
                        >
                          {t('Language')}
                        </FieldLabel>
                        <Select
                          items={languageItems}
                          onOpenChange={setLanguageOpen}
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className='h-9 w-full border-0 bg-inset-70 shadow-none'
                            id='form-setting-locale'
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder={t('Language')} />
                          </SelectTrigger>
                          <SelectContent
                            // Keep popup interaction inside Vaul's modal boundary.
                            container={drawerContent}
                            alignItemWithTrigger={false}
                            align='start'
                            className='p-1.5'
                          >
                            <SelectGroup>
                              <SelectLabel className='px-2.5 py-2 text-[0.625rem]'>
                                {t('Language')}
                              </SelectLabel>
                              {languageOptions.map(
                                ({ value, short, label }) => (
                                  <SelectItem
                                    key={value}
                                    value={value}
                                    label={label}
                                  >
                                    <LanguageOptionLabel
                                      short={short}
                                      label={label}
                                    />
                                  </SelectItem>
                                ),
                              )}
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
                    name='theme'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className='text-xs font-medium'>
                          {t('Themes')}
                        </FieldLabel>
                        <RadioGroup
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                          className='grid-cols-3 gap-2'
                        >
                          <FieldLabel
                            htmlFor='form-setting-theme-system'
                            className='min-w-0 cursor-pointer rounded-lg border-0! bg-inset-70 has-data-checked:bg-primary/10! focus-within:ring-2 focus-within:ring-ring'
                          >
                            <Field
                              orientation='horizontal'
                              className='gap-2 px-2.5! py-3! **:data-[slot=field-label]:text-xs'
                            >
                              <RadioGroupItem
                                value={Themes.System}
                                id='form-setting-theme-system'
                              />
                              <FieldContent>
                                <FieldTitle>{t('System-Default')}</FieldTitle>
                              </FieldContent>
                            </Field>
                          </FieldLabel>
                          <FieldLabel
                            htmlFor='form-setting-theme-light'
                            className='min-w-0 cursor-pointer rounded-lg border-0! bg-inset-70 has-data-checked:bg-primary/10! focus-within:ring-2 focus-within:ring-ring'
                          >
                            <Field
                              orientation='horizontal'
                              className='gap-2 px-2.5! py-3! **:data-[slot=field-label]:text-xs'
                            >
                              <RadioGroupItem
                                value={Themes.Light}
                                id='form-setting-theme-light'
                              />
                              <FieldContent>
                                <FieldTitle>{t('Light')}</FieldTitle>
                              </FieldContent>
                            </Field>
                          </FieldLabel>
                          <FieldLabel
                            htmlFor='form-setting-theme-dark'
                            className='min-w-0 cursor-pointer rounded-lg border-0! bg-inset-70 has-data-checked:bg-primary/10! focus-within:ring-2 focus-within:ring-ring'
                          >
                            <Field
                              orientation='horizontal'
                              className='gap-2 px-2.5! py-3! **:data-[slot=field-label]:text-xs'
                            >
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
                        <FieldLabel className='text-xs font-medium'>
                          {t('When-Closing')}
                        </FieldLabel>
                        <RadioGroup
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                          className='grid-cols-1 gap-2 sm:grid-cols-2'
                        >
                          <FieldLabel
                            htmlFor='form-setting-closer-minimize'
                            className='min-w-0 cursor-pointer rounded-lg border-0! bg-inset-70 has-data-checked:bg-primary/10! focus-within:ring-2 focus-within:ring-ring'
                          >
                            <Field
                              orientation='horizontal'
                              className='gap-2 px-2.5! py-3! **:data-[slot=field-label]:text-xs'
                            >
                              <RadioGroupItem
                                value={Closer.Minimize}
                                id='form-setting-closer-minimize'
                              />
                              <FieldContent>
                                <FieldTitle>{t('Minimize-Window')}</FieldTitle>
                              </FieldContent>
                            </Field>
                          </FieldLabel>
                          <FieldLabel
                            htmlFor='form-setting-closer-close'
                            className='min-w-0 cursor-pointer rounded-lg border-0! bg-inset-70 has-data-checked:bg-primary/10! focus-within:ring-2 focus-within:ring-ring'
                          >
                            <Field
                              orientation='horizontal'
                              className='gap-2 px-2.5! py-3! **:data-[slot=field-label]:text-xs'
                            >
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
                </FieldGroup>
              </section>
              <section className='space-y-4 rounded-xl bg-surface-35 p-4'>
                <h3 className='flex items-center gap-2 text-xs font-semibold'>
                  <Folder className='size-3.5 text-muted-foreground' />
                  {t('Settings-Projects')}
                </h3>
                <FieldGroup className='gap-4'>
                  <Controller
                    name='coder'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          className='text-xs font-medium'
                          htmlFor='form-setting-coder'
                        >
                          {t('VSCode-Code-Command')}
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon-xs'
                                  className='text-muted-foreground'
                                  aria-label={t('Settings-More-Info')}
                                >
                                  <InfoIcon className='size-3.5' />
                                </Button>
                              }
                            />
                            <TooltipContent className='w-96 max-w-[calc(100dvw-3rem)]'>
                              {t('VSCode-Code-Command-tip')}
                            </TooltipContent>
                          </Tooltip>
                        </FieldLabel>
                        <Input
                          {...field}
                          id='form-setting-coder'
                          aria-invalid={fieldState.invalid}
                          placeholder={t('VSCode-Code-Command')}
                          className='h-9 border-0 bg-inset-70 text-sm shadow-none'
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
                          className='text-xs font-medium'
                          htmlFor='form-setting-version_file'
                        >
                          {t('Node-Version-File')}
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon-xs'
                                  className='text-muted-foreground'
                                  aria-label={t('Settings-More-Info')}
                                >
                                  <InfoIcon className='size-3.5' />
                                </Button>
                              }
                            />
                            <TooltipContent className='w-96 max-w-[calc(100dvw-3rem)] break-normal'>
                              {t('Node-Version-File-Tip')}
                            </TooltipContent>
                          </Tooltip>
                        </FieldLabel>
                        <AutoComplete
                          value={field.value}
                          container={drawerContent}
                          className='h-9 border-0 bg-inset-70 shadow-none'
                          items={versionFileItems}
                          id='form-setting-version_file'
                          title={t('Node-Version-File')}
                          icon={FileCode2}
                          disabled={loading}
                          placeholder={t('Node-Version-File')}
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
                        <FieldLabel className='text-xs font-medium'>
                          {t('Installation-Directory')}
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon-xs'
                                  className='text-muted-foreground'
                                  aria-label={t('Settings-More-Info')}
                                >
                                  <InfoIcon className='size-3.5' />
                                </Button>
                              }
                            />
                            <TooltipContent className='w-96 max-w-[calc(100dvw-3rem)]'>
                              {t('Installation-Directory-tip')}
                            </TooltipContent>
                          </Tooltip>
                        </FieldLabel>
                        <div className='flex min-w-0 items-start justify-between gap-3 rounded-lg bg-inset-70 p-3'>
                          <Tooltip>
                            <TooltipTrigger
                              delay={700}
                              render={
                                <LabelCopyable
                                  rootClassName='flex min-w-0 flex-1 items-start'
                                  className='min-w-0 flex-1 break-all font-mono text-xs leading-5'
                                >
                                  {field.value}
                                </LabelCopyable>
                              }
                            />
                            <TooltipContent>{field.value}</TooltipContent>
                          </Tooltip>
                          <Button
                            size='xs'
                            type='button'
                            variant='ghost'
                            aria-label={t('Directory-Select')}
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
                </FieldGroup>
              </section>
              <section className='space-y-4 rounded-xl bg-surface-35 p-4'>
                <h3 className='flex items-center gap-2 text-xs font-semibold'>
                  <Network className='size-3.5 text-muted-foreground' />
                  {t('Settings-Network')}
                </h3>
                <FieldGroup className='gap-4'>
                  <Controller
                    name='mirror'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          className='text-xs font-medium'
                          htmlFor='form-setting-mirror'
                        >
                          {t('Mirror-Url')}
                        </FieldLabel>
                        <AutoComplete
                          value={field.value}
                          container={drawerContent}
                          className='h-9 border-0 bg-inset-70 shadow-none'
                          items={mirrorItems}
                          id='form-setting-mirror'
                          title={t('Mirror-Url')}
                          icon={Globe2}
                          disabled={loading}
                          placeholder={t('Mirror-Url')}
                          aria-invalid={fieldState.invalid}
                          onChange={field.onChange}
                        />
                        <FieldDescription className='text-xs leading-relaxed'>
                          {t('Mirror-Tip')}
                        </FieldDescription>
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
                        <FieldLabel className='inline-block text-xs font-medium'>
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
                                  id='form-setting-proxy-enabled'
                                  aria-label={t('Proxy')}
                                  aria-invalid={fieldState.invalid}
                                />
                                <FieldDescription className='text-xs leading-relaxed'>
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
                                    <IpInput
                                      {...field}
                                      className='border-0 bg-inset-70 shadow-none'
                                      disabled={!enabled}
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
                                        className='border-0 bg-inset-70 shadow-none'
                                        aria-label={t('Settings-Proxy-Port')}
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
                </FieldGroup>
              </section>
              <section className='space-y-4 rounded-xl bg-surface-35 p-4'>
                <h3 className='flex items-center gap-2 text-xs font-semibold'>
                  <SlidersHorizontal className='size-3.5 text-muted-foreground' />
                  {t('Settings-Advanced')}
                </h3>
                <FieldGroup className='gap-4'>
                  <Controller
                    name='embed_server_port'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          className='text-xs font-medium'
                          htmlFor='form-setting-port'
                        >
                          {t('Embedded-Server-Port')}
                        </FieldLabel>
                        <Input
                          value={field.value}
                          onChange={(evt) => {
                            field.onChange(evt.target.valueAsNumber);
                          }}
                          type='number'
                          id='form-setting-port'
                          className='h-9 max-w-36 border-0 bg-inset-70 shadow-none'
                        />
                        <FieldDescription className='text-xs leading-relaxed'>
                          {t('Restart-Required')}
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </section>
            </fieldset>
          </form>
        </div>
        <DrawerFooter className='shrink-0 flex-row items-center justify-end gap-2 rounded-b-2xl bg-surface-40 px-5 py-4 sm:px-6'>
          <DrawerClose asChild>
            <Button variant='ghost' disabled={loading}>
              {t('Cancel')}
            </Button>
          </DrawerClose>
          <Button
            disabled={loading}
            type='submit'
            form='form-setting'
            className='min-w-28 border-0'
          >
            {loading ? <LoaderCircle className='animate-spin' /> : <Check />}
            {t('Settings-Save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

Setting.displayName = 'Setting';

export default Setting;
