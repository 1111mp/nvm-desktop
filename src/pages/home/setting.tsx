import { forwardRef, memo, useState } from 'react';
import {
  DefMirrors,
  AutoComplete,
  AutoCompleteProps,
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
} from '@/components/ui';
import { GearIcon, InfoCircledIcon, Pencil2Icon } from '@radix-ui/react-icons';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
} from '@/components/ui';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppContext } from '@/app-context';
import { shallowEqual } from '@/lib/utils';
import { Closer, Themes } from '@/types';

type Options = NonNullable<AutoCompleteProps['options']>;

type Props = {};

const formSchema = z.object({
  locale: z.string(),
  theme: z.nativeEnum(Themes),
  closer: z.nativeEnum(Closer),
  directory: z.string().min(1),
  mirror: z.string().url({ message: 'Invalid mirror url' }),
  proxy: z.object({
    ip: z.string().ip({ message: 'Invalid ip' }),
    port: z.string().regex(/^\d+$/, 'Invalid port'),
  }),
});

const Setting: React.FC<Props> = memo(() => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [options, setOptions] = useState<Options>(() => {
    const optStr = localStorage.getItem('nvmd-mirror');
    return optStr ? optStr.split('__') : [];
  });

  const { settings, onUpdateSetting } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...settings,
      proxy: {
        ip: '127.0.0.1',
        port: '8080',
      },
    },
  });

  const { t } = useTranslation();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const {
      locale: newLocale,
      theme: newTheme,
      closer: newCloser,
      directory: newDirectory,
      mirror: newMirror,
      proxy,
    } = values;
    console.log('values', values);
    console.log('settings', {
      ...settings,
      proxy: {
        ip: '127.0.0.1',
        port: '8080',
      },
    });
    console.log(
      'shallowEqual(settings, values)',
      shallowEqual(
        {
          ...settings,
          proxy: {
            ip: '127.0.0.1',
            port: '8080',
          },
        },
        values
      )
    );
    return;
    if (shallowEqual(settings, values)) {
      setLoading(false);
      setOpen(false);
      return;
    }

    // for custom mirror url
    // if not exesit need to cache
    if (![...DefMirrors, ...options].includes(newMirror)) {
      setOptions((pre) => {
        let newOptions = [...pre];
        newOptions.unshift(newMirror);
        // max cache 5
        newOptions = newOptions.slice(0, 5);
        localStorage.setItem('nvmd-mirror', newOptions.join('__'));

        return newOptions;
      });
    }

    try {
      await onUpdateSetting({
        locale: newLocale,
        theme: newTheme,
        closer: newCloser,
        directory: newDirectory,
        mirror: newMirror,
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        // form.reset({ ...settings });
        setOpen(open);
      }}
    >
      <SheetTrigger asChild>
        <Button
          className='nvmd-setting'
          data-testid='setting-trigger'
          size='sm'
          title={t('Setting')}
          variant='ghost'
          icon={<GearIcon />}
        />
      </SheetTrigger>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{t('Setting')}</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className='flex-1 space-y-6'>
          <Form {...form}>
            <FormField
              control={form.control}
              name='locale'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-muted-foreground'>
                    {t('Language')}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          data-testid='language-trigger'
                          className='w-44 h-8'
                        >
                          <SelectValue
                            data-testid='language-value'
                            placeholder='Select a language to display'
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem data-testid='language-item' value='zh-CN'>
                          简体中文
                        </SelectItem>
                        <SelectItem data-testid='language-item' value='en'>
                          English
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='theme'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel className='text-muted-foreground'>
                    {t('Themes')}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex space-x-1'
                    >
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value={Themes.System} />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {t('System-Default')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value={Themes.Light} />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {t('Light')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value={Themes.Dark} />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {t('Dark')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='closer'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel className='text-muted-foreground'>
                    {t('When-Closing')}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex space-x-1'
                    >
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value={Closer.Minimize} />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {t('Minimize-Window')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center space-x-3 space-y-0'>
                        <FormControl>
                          <RadioGroupItem value={Closer.Close} />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {t('Quit-App')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='directory'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1 text-muted-foreground'>
                    {t('Installation-Directory')}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoCircledIcon className='text-primary cursor-pointer' />
                      </TooltipTrigger>
                      <TooltipContent className='w-96 text-accent-foreground bg-accent'>
                        {t('Installation-Directory-tip')}
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <div className='flex items-center justify-between'>
                      <Tooltip delayDuration={700}>
                        <TooltipTrigger asChild>
                          <LabelCopyable className='max-w-64 leading-5 truncate'>
                            {field.value}
                          </LabelCopyable>
                        </TooltipTrigger>
                        <TooltipContent className='text-accent-foreground bg-accent'>
                          {field.value}
                        </TooltipContent>
                      </Tooltip>
                      <Button
                        variant='secondary'
                        size='sm'
                        icon={<Pencil2Icon />}
                        onClick={async () => {
                          const path = await openDialog({
                            title: t('Directory-Select'),
                            directory: true,
                          });

                          if (path) {
                            field.onChange(path);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='proxy'
              render={() => (
                <FormItem>
                  <FormLabel className='text-muted-foreground'>Proxy</FormLabel>
                  <div className='flex items-center gap-2'>
                    <FormField
                      control={form.control}
                      name='proxy.ip'
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <IpInput {...field} />
                          </FormControl>
                          <FormMessage className='absolute !mt-1' />
                        </FormItem>
                      )}
                    />
                    <span>:</span>
                    <FormField
                      control={form.control}
                      name='proxy.port'
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              className='w-[72px] h-8 text-center'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className='absolute !mt-1' />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='mirror'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-muted-foreground'>
                    {t('Mirror-Url')}
                  </FormLabel>
                  <FormControl>
                    <AutoComplete
                      value={field.value}
                      shouldFilter={false}
                      placeholder='mirror url'
                      options={options}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>{t('Mirror-Tip')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant='secondary'>{t('Cancel')}</Button>
          </SheetClose>
          <Button
            data-testid='setting-submit'
            loading={loading}
            onClick={form.handleSubmit(onSubmit)}
          >
            {t('OK')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

const Proxy = forwardRef<
  HTMLDivElement,
  {
    form: any;
    value: Nvmd.Proxy;
    onChange: (value: Nvmd.Proxy) => void;
  }
>(({ form, value, onChange }, ref) => {
  const onIpChangeHandle = (ip: string) => {
    onChange?.({ ...value, ip });
  };

  const onPortChangeHandle = (evt: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({ ...value, port: evt.target.value });
  };

  return (
    <div ref={ref} className='flex items-center gap-2'>
      <FormField
        control={form.control}
        name='proxy.ip'
        render={({ field }) => {
          console.log('field', field);
          return (
            <FormItem>
              <FormLabel className='text-muted-foreground'>Proxy</FormLabel>
              <FormControl>
                <IpInput {...field} />
                {/* <IpInput value={field.value} onChange={field.onChange} /> */}
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      {/* <IpInput value={value?.ip} onChange={onIpChangeHandle} /> */}
      <span>:</span>
      <Input
        className='w-[72px] h-8 text-center'
        value={value?.port}
        onChange={onPortChangeHandle}
      />
    </div>
  );
});

export default Setting;
