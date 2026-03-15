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
};

export const GroupCreator: React.FC<Props> = ({
  projects: projectsProp = [],
  groups: groupsProp = [],
  versions = [],
  onSubmit: onSubmitProp,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const { t } = useTranslation();

  const formSchema = z.object({
    name: z
      .string()
      .min(1, 'Group name is invalid')
      .max(16, 'Group name is invalid')
      .trim()
      .refine((val) => !groupsProp.find(({ name }) => name === val), {
        message: 'Group name already exists',
      }),
    desc: z.string(),
    version: z.string().min(1, { message: 'Please select a version' }),
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
        form.reset({ name: '', version: '', desc: '', projects: [] });
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button size='sm'>
          <LayersPlus />
          {t('Create-Group')}
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('Create-Group')}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form
          id='create-group'
          ref={setContainer}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className='gap-2'>
            <Field>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className='text-muted-foreground'
                      htmlFor='create-group-name'
                    >
                      {t('Group-Name')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id='create-group-name'
                      aria-invalid={fieldState.invalid}
                      placeholder='name'
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
                      className='text-muted-foreground'
                      htmlFor='create-group-desc'
                    >
                      {t('Group-Desc')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id='create-group-desc'
                      placeholder='description'
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
                      className='text-muted-foreground'
                      htmlFor='create-group-version'
                    >
                      {t('Version')}
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id='create-group-version'
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder='version' />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version} value={version}>
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
                      className='text-muted-foreground'
                      htmlFor='create-group-projects'
                    >
                      {t('Projects')}
                    </FieldLabel>
                    <Combobox
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
                        className='max-h-14 overflow-y-auto'
                      >
                        <ComboboxValue>
                          {(values: string[]) => (
                            <>
                              {values.map((value: string) => (
                                <ComboboxChip key={value}>
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
                                  values.length === 0 ? 'projects' : void 0
                                }
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>
                      <ComboboxContent
                        anchor={anchor}
                        className='isolate z-100'
                        container={container ?? undefined}
                      >
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => (
                            <ComboboxItem key={item} value={item}>
                              {projectsProp.find((p) => p.path === item)?.name}
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
        <DialogFooter>
          <DialogClose asChild>
            <Button size='sm' disabled={loading} variant='secondary'>
              {t('Cancel')}
            </Button>
          </DialogClose>
          <Button size='sm' disabled={loading} form='create-group'>
            {loading && <LoaderCircle className='animate-spin' />}
            {t('OK')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
