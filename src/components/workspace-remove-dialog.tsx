import { Boxes, Folder, LoaderCircle, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from './ui';
import { workspaceStyles } from './workspace-layout';

export function WorkspaceRemoveDialog({
  kind,
  name,
  details,
  onConfirm,
}: {
  kind: 'project' | 'group';
  name: string;
  details: { label: string; value: ReactNode }[];
  onConfirm: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const Icon = kind === 'project' ? Folder : Boxes;

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      // Keep the dialog open on failure, so the user can retry without losing context.
      await onConfirm();
      setOpen(false);
    } catch (error) {
      toast.error(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size='xs'
          variant='ghost'
          className={workspaceStyles.removeAction}
          aria-label={`${t('Remove')} ${name}`}
        >
          <Trash2 />
          {t('Remove')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={`${workspaceStyles.dialog} gap-0 p-0`}>
        <div className='flex shrink-0 items-start gap-3 rounded-t-2xl bg-muted/40 bg-linear-to-br from-destructive/5 to-transparent p-5 sm:p-6'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive'>
            <Trash2 className='size-4.5' />
          </span>
          <div className='min-w-0 space-y-1.5'>
            <AlertDialogTitle className='text-base font-semibold'>
              {t(kind === 'project' ? 'Remove-Project' : 'Remove-Group')}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs leading-relaxed'>
              {t(kind === 'project' ? 'Project-Delete' : 'Group-Delete')}
            </AlertDialogDescription>
          </div>
        </div>
        <div className='min-h-0 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6'>
          <div className='rounded-xl bg-muted/40 p-4'>
            <p className='mb-4 flex items-center gap-2.5 text-sm font-semibold'>
              <Icon className='size-4 shrink-0 text-muted-foreground' />
              <span className='min-w-0 break-all'>{name}</span>
            </p>
            <dl className='space-y-3'>
              {details.map(({ label, value }) => (
                <div key={label} className='space-y-1'>
                  <dt className='text-[0.625rem] text-muted-foreground'>
                    {label}
                  </dt>
                  <dd className='whitespace-normal break-all font-mono text-xs leading-relaxed'>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {t(
              kind === 'project'
                ? 'Remove-Project-Effect'
                : 'Remove-Group-Effect',
            )}
          </p>
        </div>
        <AlertDialogFooter
          className={`${workspaceStyles.footer} rounded-none px-5 py-4 sm:px-6`}
        >
          <AlertDialogCancel variant='ghost' disabled={pending}>
            {t('Cancel')}
          </AlertDialogCancel>
          <Button
            variant='destructive'
            disabled={pending}
            onClick={confirm}
            className='min-w-24 border-0'
          >
            {pending ? <LoaderCircle className='animate-spin' /> : <Trash2 />}
            {t('Remove')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
