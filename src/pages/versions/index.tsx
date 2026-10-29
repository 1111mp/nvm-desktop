import { VersionDensityControl } from '@/components/version-density';
import { useVersionDensity } from '@/hooks/use-version-density';
import { cn } from '@/lib/utils';
import { workspaceStyles } from '@/components/workspace-layout';
import { useInstallTasks } from '@/components/install-tasks';
import { availableArchitectures, isInstallActive } from '@/lib/install-tasks';
import { Checkbox } from '@/components/ui';
import { VersionEnvironment } from '@/components/version-environment';
import {
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type DataTableFeatures,
} from '@/components/ui';
import {
  createColumnHelper,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useCreateAtom, useSelector } from '@tanstack/react-store';
import {
  CircleCheckBig,
  Ellipsis,
  CircleSlash,
  CircleX,
  CloudDownload,
  CloudSync,
  LoaderCircle,
  RefreshCw,
  Frown,
  HardDrive,
  MousePointerClick,
  ThumbsUp,
  Trash,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLoaderData } from 'react-router';
import { toast } from 'sonner';
import { Modal, type ModalRef } from './modal';

import { useAppContext } from '@/app-context';
import { checkSupportive } from '@/lib/utils';
import { getCurrent } from '@/services/api';
import {
  installedList,
  installedListWithTray,
  uninstallNode,
  vCurrent,
  versionList,
  vSetCurrent,
} from '@/services/cmds';
import { open } from '@tauri-apps/plugin-shell';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useTranslation } from 'react-i18next';

dayjs.extend(localizedFormat);

type VersionsResult = [string, Nvmd.Versions, Array<string>];

const statusBadgeClassName =
  'h-6 gap-1.5 rounded-lg border-0 px-2 text-xs font-medium';
const rowActionClassName =
  'h-7 min-w-20 gap-1.5 rounded-lg border-0 px-2.5 text-xs font-medium';

const columnHelper = createColumnHelper<DataTableFeatures, Nvmd.Version>();

export async function loader() {
  const versions = await Promise.all([
    vCurrent(),
    versionList(),
    installedList(),
  ]).catch(() => {
    return ['', [], []];
  });

  return versions;
}

export const Versions: React.FC = () => {
  const versionsData = useLoaderData<VersionsResult>();
  const [currentVersion, allVersions, allInstalledVersions] = versionsData;

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() => allVersions);
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [localLoading, seLocaltLoading] = useState<boolean>(false);

  const { settings } = useAppContext();
  const { directory } = settings;
  const { t } = useTranslation();
  const { density } = useVersionDensity();
  const compact = density === 'compact';

  const [selecting, setSelecting] = useState(false);
  const rowSelectionAtom = useCreateAtom<RowSelectionState>({});
  const rowSelection = useSelector(rowSelectionAtom);
  const { tasks, show: showTasks, confirm } = useInstallTasks();
  const queued = (version: string) =>
    tasks.some(
      (task) =>
        task.version === version.slice(1) &&
        task.directory === directory &&
        isInstallActive(task),
    );
  const selectable = (version: Nvmd.Version) =>
    !installedVersions.includes(version.version.slice(1)) &&
    !queued(version.version) &&
    availableArchitectures(version).length > 0;
  const selectedVersions = versions.filter(
    (version) => !!rowSelection[version.version] && selectable(version),
  );
  const modal = useRef<ModalRef>(null);

  useEffect(() => {
    const unlisted = getCurrent().listen<string>(
      'nvm-desktop://refresh-version-info',
      async ({ payload }) => {
        if (payload) {
          setCurrent(payload);
          toast.success(
            t('Restart-Terminal', {
              version: `v${payload}`,
            }),
          );
        } else {
          const installed = await installedList();
          setInstalledVersions(installed);
        }
      },
    );

    return () => {
      unlisted.then((fn) => fn());
    };
  }, [t]);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await installedList();
      setInstalledVersions(iVersions);
    };
    fetcher();
  }, [directory]);

  const columns = columnHelper.columns([
    ...(selecting
      ? [
          columnHelper.display({
            id: 'batch-selection',
            header: ({ table }) => {
              const eligible = table
                .getFilteredRowModel()
                .rows.filter((row) => row.getCanSelect());
              return (
                <Checkbox
                  className='bg-background'
                  aria-label={t('Batch-Select-Filtered', {
                    count: eligible.length,
                  })}
                  title={t('Batch-Select-Filtered', { count: eligible.length })}
                  disabled={!eligible.length}
                  checked={!!eligible.length && table.getIsAllRowsSelected()}
                  indeterminate={
                    !table.getIsAllRowsSelected() &&
                    table.getIsSomeRowsSelected()
                  }
                  onCheckedChange={(checked) =>
                    table.toggleAllRowsSelected(checked)
                  }
                />
              );
            },
            enableHiding: false,
            enableSorting: false,
            enableColumnFilter: false,
            meta: {
              layoutClassName: 'basis-10! grow-0! shrink-0!',
              className: 'flex items-center',
            },
            cell: ({ row }) => (
              <Checkbox
                className='bg-background'
                aria-label={`${t('Batch-Select')} ${row.original.version}`}
                disabled={!row.getCanSelect()}
                checked={row.getCanSelect() && row.getIsSelected()}
                indeterminate={row.getIsSomeSelected()}
                onCheckedChange={(checked) => row.toggleSelected(checked)}
              />
            ),
          }),
        ]
      : []),
    columnHelper.accessor('version', {
      header: t('Version'),
      meta: {
        layoutClassName: 'min-w-52 xl:flex-[1.1_1_0%]',
      },
      enableHiding: false,
      enableColumnFilter: false,
      enableSorting: true,
      filterFn: (row, _columnId, filterValue: string) => {
        const { version, lts } = row.original;
        if ('lts'.includes(filterValue.toLocaleLowerCase())) return !!lts;

        return (
          ('lts'.includes(filterValue.toLocaleLowerCase()) ? !!lts : false) ||
          version
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase()) ||
          (lts
            ? lts.toString().toLowerCase().includes(filterValue.toLowerCase())
            : false)
        );
      },
      cell: ({ row }) => {
        const { version, lts, date } = row.original;
        return (
          <div className='relative flex items-center gap-2 whitespace-nowrap'>
            <Tooltip disableHoverablePopup={true}>
              <TooltipTrigger
                render={
                  <button
                    type='button'
                    className='cursor-pointer rounded-md p-0 font-mono text-sm font-semibold leading-6 text-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring'
                    onClick={async () => {
                      await open(
                        `https://github.com/nodejs/node/releases/tag/${version}`,
                      );
                    }}
                  >
                    {version}
                  </button>
                }
              />
              <TooltipContent
                className='bg-primary text-primary-foreground'
                arrowClassName='bg-primary fill-primary'
              >
                {t('Whats-new')}
              </TooltipContent>
            </Tooltip>
            {lts ? (
              <Badge
                variant='secondary'
                title={`LTS · ${lts}`}
                className='h-5 gap-1 rounded-md border-0 bg-primary/8 px-1.5 text-[0.625rem] font-medium text-foreground'
              >
                <span className='size-1 rounded-full bg-primary' />
                {lts}
              </Badge>
            ) : row.index === 0 ? (
              <Badge
                variant='secondary'
                className='h-5 rounded-md border-0 bg-muted px-1.5 text-[0.625rem] font-medium text-muted-foreground'
              >
                {t('latest')}
              </Badge>
            ) : null}
            {dayjs().diff(date, 'day') <= 3 ? (
              <span className='inline-block absolute w-1 h-1 top-1 -left-1.5 rounded-full bg-primary' />
            ) : null}
          </div>
        );
      },
    }),
    columnHelper.accessor('v8', {
      header: `V8 ${t('Version')}`,
      enableSorting: false,
      meta: {
        label: `V8 ${t('Version')}`,
        layoutClassName: 'min-w-32 xl:flex-[1_1_0%]',
        className: 'flex items-center font-mono text-xs text-muted-foreground',
      },
    }),
    columnHelper.accessor('npm', {
      header: `NPM ${t('Version')}`,
      enableSorting: false,
      meta: {
        label: `NPM ${t('Version')}`,
        layoutClassName: 'min-w-28 xl:flex-[0.8_1_0%]',
        className: 'flex items-center font-mono text-xs text-muted-foreground',
      },
    }),
    columnHelper.accessor('date', {
      header: t('Release-Date'),
      enableColumnFilter: false,
      enableSorting: true,
      meta: {
        label: t('Release-Date'),
        layoutClassName: 'xl:basis-36 xl:grow-0 xl:shrink-0',
        className: 'flex items-center text-muted-foreground',
      },
      cell: ({ row }) => dayjs(row.original.date).format('ll'),
    }),
    columnHelper.accessor(
      ({ version, files }) => {
        {
          if (installedVersions.includes(version.slice(1))) return 'Installed';
          return checkSupportive(files) ? 'Supported' : 'UnSupported';
        }
      },
      {
        id: 'status',
        header: t('Status'),
        enableSorting: false,
        enableColumnFilter: false,
        meta: {
          label: t('Status'),
          layoutClassName: 'xl:basis-40 xl:grow-0 xl:shrink-0',
          className: 'flex items-center',
        },
        filterFn: (row, _columnId, filterValue: string[]) => {
          const { version, files } = row.original;
          const rets = filterValue.map((value) => {
            switch (value) {
              case 'Installed': {
                return !!installedVersions.find(
                  (installed) => version === `v${installed}`,
                );
              }
              case 'Supported': {
                return checkSupportive(files);
              }
              case 'UnSupported': {
                return !checkSupportive(files);
              }
              default:
                return false;
            }
          });
          return rets.includes(true);
        },
        cell: ({ row }) => {
          const { version, files } = row.original;
          const task = tasks.find(
            (task) =>
              task.version === version.slice(1) &&
              task.directory === directory &&
              isInstallActive(task),
          );
          if (task)
            return (
              <Badge variant='secondary' className={statusBadgeClassName}>
                <LoaderCircle />
                {t(`Batch-Phase-${task.phase}`)}
              </Badge>
            );
          const installed = installedVersions.find(
            (installed) => `v${installed}` === version,
          );

          // the current version
          if (installed && current && version === `v${current}`) {
            return (
              <Badge
                variant='secondary'
                className={`${statusBadgeClassName} status-current bg-primary/12 text-foreground`}
              >
                <CircleCheckBig />
                {t('Current')}
              </Badge>
            );
          }

          // the installed version
          if (installed) {
            return (
              <Badge
                variant='secondary'
                className={`${statusBadgeClassName} bg-muted/70 text-foreground`}
              >
                <CircleCheckBig />
                {t('Installed')}
              </Badge>
            );
          }

          const support = checkSupportive(files);
          // the unsupport version
          if (!support) {
            return (
              <Badge variant='destructive' className={statusBadgeClassName}>
                <CircleX />
                {t('Not-Supported')}
              </Badge>
            );
          }

          // default => not installed
          return (
            <Badge
              variant='ghost'
              className={`${statusBadgeClassName} bg-transparent px-0 font-normal text-muted-foreground hover:bg-transparent`}
            >
              <CircleSlash />
              {t('Not-Installed')}
            </Badge>
          );
        },
      },
    ),
    columnHelper.accessor(() => undefined, {
      header: t('Operation'),
      enableHiding: false,
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        layoutClassName: 'xl:basis-32 xl:grow-0 xl:shrink-0',
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { version } = row.original;

        if (queued(version))
          return (
            <Button size='xs' variant='ghost' onClick={showTasks}>
              <LoaderCircle data-icon='inline-start' />
              {t('Batch-View-Task')}
            </Button>
          );
        if (installedVersions.find((install) => version === `v${install}`))
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size='xs'
                    variant='ghost'
                    aria-label={`${t('More')} ${version}`}
                    className={`${rowActionClassName} bg-surface-60 text-muted-foreground hover:bg-muted hover:text-foreground data-popup-open:bg-surface-hover-100 data-popup-open:text-foreground`}
                  >
                    <Ellipsis className='size-3.5' />
                    {t('More')}
                  </Button>
                }
              />
              <DropdownMenuContent
                align='end'
                className='w-52 rounded-xl p-1.5'
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='flex items-center justify-between gap-2 px-2 py-2.5'>
                    <span className='font-mono text-xs font-semibold'>
                      {version}
                    </span>
                    <span className='text-[0.625rem] font-normal text-muted-foreground'>
                      {t(version === `v${current}` ? 'Current' : 'Installed')}
                    </span>
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    disabled={version === `v${current}`}
                    className='gap-2.5 rounded-lg px-2 py-2.5'
                    onClick={async () => {
                      try {
                        const curVersion = version.slice(1);
                        await vSetCurrent(curVersion);
                        setCurrent(curVersion);
                        toast.success(
                          t('Restart-Terminal', {
                            version,
                          }),
                        );
                      } catch (err) {
                        toast.error(err);
                      }
                    }}
                  >
                    <MousePointerClick />
                    {t('Apply')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className='mx-1 my-1 bg-muted' />
                  <DropdownMenuItem
                    className='gap-2.5 rounded-lg px-2 py-2.5'
                    variant='destructive'
                    onClick={async () => {
                      try {
                        await uninstallNode(version.slice(1));
                        const [currentVersion, versions] = await Promise.all([
                          vCurrent(),
                          installedListWithTray(true),
                        ]);
                        setCurrent(currentVersion);
                        setInstalledVersions(versions);
                        toast.success(
                          t('Tip-Uninstall', {
                            version,
                          }),
                        );
                      } catch (err) {
                        toast.error(err);
                      }
                    }}
                  >
                    <Trash />
                    {t('Uninstall')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          );

        return (
          <Button
            size='xs'
            variant='secondary'
            className={`${rowActionClassName} bg-primary/10 text-foreground hover:bg-primary/18`}
            aria-label={`${t('Install')} ${version}`}
            onClick={() => modal.current?.show(row.original)}
          >
            <CloudDownload />
            {t('Install')}
          </Button>
        );
      },
    }),
  ]);

  const onPageReload = async () => {
    seLocaltLoading(true);
    try {
      const [currentVersion, versions, installeds] = await Promise.all([
        vCurrent(),
        versionList(),
        installedList(),
      ]);
      setCurrent(currentVersion);
      setVersions(versions);
      setInstalledVersions(installeds);
      toast.success(t('Refresh-successful'));
    } finally {
      seLocaltLoading(false);
    }
  };

  const onDataUpdate = async () => {
    setLoading(true);
    try {
      const [currentVersion, versions, installeds] = await Promise.all([
        vCurrent(true),
        versionList(true),
        installedList(true),
      ]);
      setCurrent(currentVersion);
      setVersions(versions);
      setInstalledVersions(installeds);
      toast.success(t('Refresh-successful'));
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onInstalledRefresh = async () => {
    const [current, versions] = await Promise.all([
      vCurrent(true),
      installedListWithTray(true),
    ]);

    setCurrent(current);
    setInstalledVersions(versions);
  };

  return (
    <>
      <div
        data-density={density}
        className={cn(
          'flex h-full min-h-0 min-w-0 flex-col',
          compact ? 'gap-2.5' : 'gap-5',
        )}
      >
        <div className='flex shrink-0 flex-wrap items-start justify-between gap-3'>
          <div>
            <h1
              className={cn(
                'leading-tight font-semibold tracking-tight',
                compact ? 'text-xl' : 'mb-1.5 text-2xl',
              )}
            >
              {t('Versions')}
            </h1>
            <p
              className={cn(
                'text-muted-foreground',
                compact ? 'text-xs leading-normal' : 'text-sm leading-relaxed',
              )}
            >
              {t('Versions-Description')}
            </p>
          </div>
          <Button
            variant='secondary'
            className='group h-9 gap-2 rounded-xl border-0 bg-primary/10 bg-linear-to-br from-primary/5 to-transparent pr-3.5 pl-1.5 text-xs text-foreground shadow-xs shadow-primary/5 hover:bg-primary/15 hover:shadow-sm hover:shadow-primary/10'
            title={t('Data-Update-Description')}
            aria-busy={loading}
            disabled={loading || localLoading}
            onClick={onDataUpdate}
          >
            <span className='grid size-6 place-items-center rounded-lg bg-primary/10'>
              {loading ? (
                <LoaderCircle className='size-3.5 animate-spin motion-reduce:animate-none' />
              ) : (
                <CloudSync className='size-3.5' />
              )}
            </span>
            {t('Data-Update')}
          </Button>
        </div>
        <VersionEnvironment
          current={current}
          compact={compact}
          installedCount={installedVersions.length}
          releaseCount={versions.length}
        />
        <div
          id='version-catalog'
          className='flex min-h-0 flex-1 flex-col overflow-hidden'
        >
          <div
            className={cn(
              'flex items-baseline justify-between gap-3',
              compact ? 'pb-2' : 'pb-4',
            )}
          >
            <h2 className='text-sm font-semibold'>{t('Release-Catalog')}</h2>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {t('Available-Releases', {
                count: versions.length,
              })}
            </span>
          </div>
          <DataTable
            density={density}
            key='page-versions-table'
            columns={columns}
            data={versions}
            // Selection must follow release identity when rows are sorted or refreshed.
            getRowId={(version) => version.version}
            rowSelectionAtom={rowSelectionAtom}
            enableRowSelection={(row) => selecting && selectable(row.original)}
            loading={loading || localLoading}
            toolbar={(table) => {
              const selectedRows = table
                .getSelectedRowModel()
                .rows.filter((row) => row.getCanSelect());
              const filteredSelectedRows = table
                .getFilteredSelectedRowModel()
                .rows.filter((row) => row.getCanSelect());
              const hiddenSelectedCount =
                selectedRows.length - filteredSelectedRows.length;
              return (
                <div className='flex shrink-0 flex-wrap items-center gap-2 pb-3'>
                  <DataTableToolbar
                    key='page-versions-table-tool'
                    table={table}
                    options={[
                      {
                        label: t('Installed'),
                        value: 'Installed',
                        icon: HardDrive,
                      },
                      {
                        label: t('Supported'),
                        value: 'Supported',
                        icon: ThumbsUp,
                      },
                      {
                        label: t('Not-Supported'),
                        value: 'UnSupported',
                        icon: Frown,
                      },
                    ]}
                  />
                  <div className='flex items-center gap-2'>
                    <VersionDensityControl />
                    <Button
                      size='sm'
                      variant='ghost'
                      className={workspaceStyles.refreshAction}
                      onClick={() => {
                        setSelecting(!selecting);
                        table.resetRowSelection();
                      }}
                    >
                      {t(selecting ? 'Batch-Exit' : 'Batch-Install')}
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      className={workspaceStyles.refreshAction}
                      title={t('Page-Reload-Description')}
                      aria-busy={localLoading}
                      disabled={localLoading || loading}
                      onClick={onPageReload}
                    >
                      {localLoading ? (
                        <LoaderCircle className='size-3.5 animate-spin motion-reduce:animate-none' />
                      ) : (
                        <RefreshCw className='size-3.5 transition-transform group-hover:rotate-45 motion-reduce:transition-none' />
                      )}
                      {t('Page-Reload')}
                    </Button>
                  </div>
                  {selecting && (
                    <div className='flex w-full flex-wrap items-center gap-2 rounded-xl bg-surface-40 p-3'>
                      <span
                        role='status'
                        className='mr-auto text-xs text-muted-foreground'
                      >
                        {t('Batch-Selected', {
                          count: selectedVersions.length,
                        })}
                        {hiddenSelectedCount > 0 &&
                          ` · ${t('Batch-Hidden', { count: hiddenSelectedCount })}`}
                      </span>
                      <Button
                        size='sm'
                        variant='ghost'
                        disabled={!Object.keys(rowSelection).length}
                        onClick={() => table.resetRowSelection()}
                      >
                        {t('Batch-Clear')}
                      </Button>
                      <Button
                        size='sm'
                        disabled={!selectedVersions.length}
                        onClick={() =>
                          confirm(selectedVersions, () => {
                            setSelecting(false);
                            rowSelectionAtom.set({});
                          })
                        }
                      >
                        <CloudDownload data-icon='inline-start' />
                        {t('Batch-Start', { count: selectedVersions.length })}
                      </Button>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>
      <Modal ref={modal} onRefrresh={onInstalledRefresh} />
    </>
  );
};
