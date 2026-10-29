import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
} from '@/components/ui';
import { workspaceStyles } from '@/components/workspace-layout';
import {
  isInstallActive,
  currentInstallTasks,
  mergeInstallTasks,
  type InstallRequest,
  type InstallTask,
} from '@/lib/install-tasks';
import { cn } from '@/lib/utils';
import { getCurrent } from '@/services/api';
import { invoke } from '@tauri-apps/api/core';
import {
  Check,
  Clock3,
  CloudDownload,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BatchInstallForm } from './batch-install-form';

const InstallContext = createContext<{
  tasks: InstallTask[];
  show: () => void;
  confirm: (versions: Nvmd.Version[], onDone: () => void) => void;
  enqueue: (requests: InstallRequest[]) => Promise<void>;
}>({ tasks: [], show: () => {}, confirm: () => {}, enqueue: async () => {} });
export const useInstallTasks = () => useContext(InstallContext);

export function InstallTasksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tasks, setTasks] = useState<InstallTask[]>([]);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    versions: Nvmd.Version[];
    onDone: () => void;
  } | null>(null);
  const [panelHeight, setPanelHeight] = useState(408);
  const [pending, setPending] = useState(false);

  const hadActive = useRef<boolean>(false);

  const { t } = useTranslation();

  useEffect(() => {
    let disposed = false;
    // Subscribe before reading the snapshot, then merge by revision to close the
    // event/snapshot race when the UI remounts during an installation.
    const subscription = getCurrent().listen<InstallTask>(
      'nvm-desktop://install-task',
      ({ payload }) => {
        if (!disposed)
          setTasks((current) => mergeInstallTasks(current, [payload]));
      },
    );
    void subscription
      .then(async () => {
        const snapshot = await invoke<InstallTask[]>('install_tasks');
        if (!disposed)
          setTasks((current) => mergeInstallTasks(current, snapshot));
      })
      .catch((error) => toast.error(String(error)));
    return () => {
      disposed = true;
      void subscription.then((stop) => stop());
    };
  }, []);

  const enqueue = async (requests: InstallRequest[]) => {
    setPending(true);
    try {
      const added = await invoke<InstallTask[]>('enqueue_installs', {
        requests,
      });
      setTasks((current) => mergeInstallTasks(current, added));
      if (!open)
        setPanelHeight(
          Math.min(
            480,
            280 +
              currentInstallTasks(mergeInstallTasks(tasks, added)).length * 64,
          ),
        );
      // Change only the contents: keep the popup, backdrop and focus scope mounted.
      setConfirmation(null);
      setOpen(true);
    } finally {
      setPending(false);
    }
  };

  const action = async (run: () => Promise<unknown>) => {
    setPending(true);
    try {
      await run();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setPending(false);
    }
  };

  const visibleTasks = currentInstallTasks(tasks);

  useEffect(() => {
    const activeNow = tasks.some(isInstallActive);
    if (hadActive.current && !activeNow)
      toast.info(
        t('Batch-Finished', {
          complete: visibleTasks.filter((task) => task.phase === 'complete')
            .length,
          failed: visibleTasks.filter((task) => task.phase === 'failed').length,
          cancelled: visibleTasks.filter((task) => task.phase === 'cancelled')
            .length,
        }),
      );
    hadActive.current = activeNow;
  }, [tasks, visibleTasks, t]);

  const active = visibleTasks.filter(isInstallActive);
  const failed = visibleTasks.filter((task) => task.phase === 'failed');

  return (
    <InstallContext.Provider
      value={{
        tasks,
        show: () => {
          setConfirmation(null);
          setPanelHeight(Math.min(480, 280 + visibleTasks.length * 64));
          setOpen(true);
        },
        confirm: (versions, onDone) => {
          setConfirmation({ versions, onDone });
          setPanelHeight(Math.min(480, 280 + versions.length * 64));
          setOpen(true);
        },
        enqueue,
      }}
    >
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) {
            setOpen(next);
            if (!next) setConfirmation(null);
          }
        }}
      >
        <DialogContent
          className={cn(workspaceStyles.dialog, 'gap-4')}
          style={{ height: `min(${panelHeight}px, calc(100dvh - 3rem))` }}
        >
          {confirmation ? (
            <BatchInstallForm
              versions={confirmation.versions}
              onBack={() => {
                setOpen(false);
                setConfirmation(null);
              }}
              onStart={enqueue}
              onDone={confirmation.onDone}
            />
          ) : (
            <>
              {/* Keep the shell and task slots stable as download details come and go. */}
              <DialogHeader className='shrink-0'>
                <DialogTitle>{t('Batch-Tasks')}</DialogTitle>
                <DialogDescription>
                  {t('Batch-Summary', {
                    complete: visibleTasks.filter(
                      (task) => task.phase === 'complete',
                    ).length,
                    total: visibleTasks.length,
                    failed: failed.length,
                    cancelled: visibleTasks.filter(
                      (task) => task.phase === 'cancelled',
                    ).length,
                  })}
                </DialogDescription>
                <p className='text-xs text-muted-foreground'>
                  {t('Batch-Active-Summary', {
                    downloading: active.filter((task) =>
                      ['download', 'verify'].includes(task.phase),
                    ).length,
                    extracting: active.filter((task) => task.phase === 'unzip')
                      .length,
                    queued: active.filter((task) =>
                      ['queued', 'waiting-extract'].includes(task.phase),
                    ).length,
                  })}
                </p>
              </DialogHeader>
              <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]'>
                {visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    className='grid h-16 shrink-0 grid-rows-[1.75rem_1rem] gap-1 rounded-xl bg-surface-40 px-3 py-2'
                  >
                    <div className='flex min-w-0 items-center gap-2'>
                      <span className='shrink-0 font-mono text-sm font-semibold'>
                        v{task.version}
                      </span>
                      <Badge variant='secondary'>{task.arch}</Badge>
                      <span
                        className='ml-auto flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground [&>svg]:shrink-0'
                        role='status'
                      >
                        {task.phase === 'complete' ? (
                          <Check className='size-3.5 text-primary' />
                        ) : task.phase === 'failed' ? (
                          <TriangleAlert className='size-3.5 text-destructive' />
                        ) : ['queued', 'waiting-extract'].includes(
                            task.phase,
                          ) ? (
                          <Clock3 className='size-3.5' />
                        ) : isInstallActive(task) ? (
                          <LoaderCircle className='size-3.5 animate-spin motion-reduce:animate-none' />
                        ) : (
                          <X className='size-3.5' />
                        )}
                        <span
                          className='truncate'
                          title={t(`Batch-Phase-${task.phase}`)}
                        >
                          {t(`Batch-Phase-${task.phase}`)}
                        </span>
                      </span>
                      <div className='flex w-14 shrink-0 justify-end'>
                        {isInstallActive(task) && (
                          <Button
                            size='xs'
                            variant='ghost'
                            disabled={pending || task.phase === 'cancelling'}
                            aria-label={`${t('Cancel')} v${task.version}`}
                            onClick={() =>
                              void action(() =>
                                invoke('cancel_install_task', { id: task.id }),
                              )
                            }
                          >
                            {t('Cancel')}
                          </Button>
                        )}
                        {task.phase === 'failed' && (
                          <Button
                            size='xs'
                            variant='secondary'
                            disabled={
                              pending ||
                              active.some(
                                (item) =>
                                  item.version === task.version &&
                                  item.directory === task.directory,
                              )
                            }
                            onClick={() =>
                              void action(() =>
                                enqueue([
                                  {
                                    version: task.version,
                                    arch: task.arch,
                                    directory: task.directory,
                                    batchId: task.batchId,
                                  },
                                ]),
                              )
                            }
                          >
                            {t('Retry')}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className='flex min-w-0 items-center gap-2'>
                      {task.phase === 'download' && (
                        <>
                          <Progress
                            className='min-w-0 flex-1'
                            value={
                              task.total > 0
                                ? Math.min(
                                    100,
                                    (task.transferred / task.total) * 100,
                                  )
                                : task.transferred === 0
                                  ? 0
                                  : null
                            }
                            aria-label={`${t('Download-Progress')} v${task.version}`}
                          />
                          <span className='shrink-0 text-[0.625rem] tabular-nums text-muted-foreground'>
                            {(task.transferred / 1024 ** 2).toFixed(1)} MiB
                            {task.total > 0 &&
                              ` / ${(task.total / 1024 ** 2).toFixed(1)} MiB`}
                          </span>
                        </>
                      )}
                      {task.phase === 'complete' && task.path && (
                        <p
                          className='truncate font-mono text-[0.625rem] text-muted-foreground select-text'
                          title={task.path}
                        >
                          {task.path}
                        </p>
                      )}
                      {task.error && (
                        <p
                          className='truncate text-xs text-destructive select-text'
                          title={task.error}
                        >
                          {task.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {!tasks.length && (
                  <p className='py-6 text-center text-sm text-muted-foreground'>
                    {t('Batch-Empty')}
                  </p>
                )}
              </div>
              <DialogFooter className={workspaceStyles.footer}>
                {!!active.length && (
                  <Button
                    variant='ghost'
                    disabled={pending}
                    onClick={() =>
                      void action(() => invoke('cancel_install_task'))
                    }
                  >
                    {t('Batch-Cancel-All')}
                  </Button>
                )}
                {!!failed.length && (
                  <Button
                    variant='secondary'
                    disabled={pending || !!active.length}
                    onClick={() =>
                      void action(() =>
                        enqueue([
                          ...new Map(
                            failed.map((task) => [
                              `${task.directory}\0${task.version}`,
                              {
                                version: task.version,
                                arch: task.arch,
                                directory: task.directory,
                                batchId: task.batchId,
                              },
                            ]),
                          ).values(),
                        ]),
                      )
                    }
                  >
                    {t('Batch-Retry-Failed')}
                  </Button>
                )}
                <Button onClick={() => setOpen(false)}>
                  {t(active.length ? 'Batch-Hide' : 'OK')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </InstallContext.Provider>
  );
}

export function InstallTasksButton() {
  const { tasks, show } = useInstallTasks();
  const { t } = useTranslation();
  if (!tasks.length) return null;
  return (
    <Button
      size='sm'
      variant='ghost'
      className={workspaceStyles.refreshAction}
      onClick={show}
    >
      <CloudDownload data-icon='inline-start' />
      {t('Batch-Tasks')}
      <Badge variant='secondary'>{tasks.filter(isInstallActive).length}</Badge>
    </Button>
  );
}
