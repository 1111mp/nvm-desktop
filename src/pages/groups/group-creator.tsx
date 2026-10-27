import { cn } from '@/lib/utils';
import { workspaceStyles } from '@/components/workspace-layout';
import { useState } from 'react';
import {
  Button,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useComboboxAnchor,
} from '@/components/ui';
import { LayersPlus, LoaderCircle } from 'lucide-react';

import { z } from 'zod';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

type Props = {
  projects?: Nvmd.Project[];
  groups?: Nvmd.Group[];
  versions?: string[];
  onSubmit?: (group: Nvmd.Group) => Promise<void>;
  disabled?: boolean;
};

export const GroupCreator: React.FC<Props> = ({
  projects: projectsProp = [],
  groups: groupsProp = [],
  versions = [],
  onSubmit: onSubmitProp,
  disabled = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const { t } = useTranslation();

  const formSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t('Group-Name-Invalid'))
      .max(16, t('Group-Name-Invalid'))
      .refine((val) => !groupsProp.find(({ name }) => name === val), {
        message: t('Group-Name-Exists'),
      }),
    desc: z.string(),
    version: z.string().min(1, { message: t('Select-Version') }),
    projects: z.array(z.string()),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      version: '',
      desc: '',
      projects: [],
    },
  });

  const anchor = useComboboxAnchor();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await onSubmitProp?.(values);
      setOpen(false);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (loading) return;
        if (open) form.reset({ name: '', version: '', desc: '', projects: [] });
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant='secondary'
          className={workspaceStyles.primaryAction}
          disabled={disabled}
        >
          <LayersPlus />
          {t('Create-Group')}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(workspaceStyles.dialog, 'gap-0 overflow-visible p-0')}
        // Portal multi-select options into the dialog, outside its scrolling form.
        ref={setContainer}
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (loading) event.preventDefault();
        }}
      >
        <DialogHeader className='shrink-0 gap-2 rounded-t-2xl bg-muted/40 bg-linear-to-br from-primary/8 to-transparent p-5 sm:p-6'>
          <span className='mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary'>
            <LayersPlus className='size-5' />
          </span>
          <DialogTitle className='text-lg font-semibold tracking-tight'>
            {t('Create-Group')}
          </DialogTitle>
          <DialogDescription className='text-xs leading-relaxed'>
            {t('Create-Group-Description')}
          </DialogDescription>
        </DialogHeader>
        <form
          id='create-group'
          className='min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6'
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className='gap-4'>
            <Field>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-xs font-medium'
                      htmlFor='create-group-name'
                    >
                      {t('Group-Name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id='create-group-name'
                      aria-invalid={fieldState.invalid}
                      placeholder={t('Group-Name')}
                      disabled={loading}
                      className='h-9 rounded-lg border-0 bg-muted/50 text-sm shadow-none'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name='desc'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-xs font-medium'
                      htmlFor='create-group-desc'
                    >
                      {t('Group-Desc')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id='create-group-desc'
                      placeholder={t('Group-Desc')}
                      disabled={loading}
                      className='h-9 rounded-lg border-0 bg-muted/50 text-sm shadow-none'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </Field>
            <Field>
              <Controller
                name='version'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-xs font-medium'
                      htmlFor='create-group-version'
                    >
                      {t('Version')}
                    </FieldLabel>
                    <Select
                      disabled={loading}
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id='create-group-version'
                        className={workspaceStyles.select}
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder={t('Select-Version')} />
                      </SelectTrigger>
                      <SelectContent
                        position='popper'
                        align='start'
                        className={workspaceStyles.popover}
                      >
                        {versions.map((version) => (
                          <SelectItem
                            key={version}
                            value={version}
                            className={`${workspaceStyles.option} font-mono`}
                          >
                            v{version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='projects'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-xs font-medium'
                      htmlFor='create-group-projects'
                    >
                      {t('Projects')}
                    </FieldLabel>
                    <Combobox
                      disabled={loading}
                      multiple
                      autoHighlight
                      value={field.value ?? []}
                      items={projectsProp.map((p) => p.path)}
                      onValueChange={(value) => {
                        field.onChange?.(value);
                      }}
                    >
                      <ComboboxChips
                        ref={anchor}
                        className='max-h-24 overflow-y-auto border-0 bg-muted/50 text-xs shadow-none'
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value: string) => (
                                <ComboboxChip
                                  key={value}
                                  className='max-w-full rounded-md bg-primary/8 text-xs'
                                >
                                  {
                                    projectsProp.find((p) => p.path === value)
                                      ?.name
                                  }
                                </ComboboxChip>
                              ))}
                              <ComboboxChipsInput
                                id='create-group-projects'
                                aria-invalid={fieldState.invalid}
                                placeholder={
                                  values.length === 0
                                    ? t('Select-Projects')
                                    : void 0
                                }
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>
                      <ComboboxContent
                        anchor={anchor}
                        className={`${workspaceStyles.popover} isolate z-100`}
                        container={container ?? undefined}
                      >
                        <ComboboxEmpty>{t('No-results')}</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => (
                            <ComboboxItem
                              key={item}
                              value={item}
                              className={workspaceStyles.option}
                            >
                              <span className='flex min-w-0 flex-col gap-1'>
                                <span className='truncate font-medium'>
                                  {
                                    projectsProp.find((p) => p.path === item)
                                      ?.name
                                  }
                                </span>
                                <span className='truncate font-mono text-[0.625rem] text-muted-foreground'>
                                  {item}
                                </span>
                              </span>
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter
          className={`${workspaceStyles.footer} rounded-t-none rounded-b-2xl px-5 py-4 sm:px-6`}
        >
          <DialogClose asChild>
            <Button disabled={loading} variant='ghost'>
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button
            type='submit'
            disabled={loading || !versions.length}
            form='create-group'
            className='min-w-24 border-0'
          >
            {loading && <LoaderCircle className='animate-spin' />}
            {t('Create-Group')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
