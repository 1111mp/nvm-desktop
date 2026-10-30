import { VersionDensityControl } from '@/components/version-density';
import { useVersionDensity } from '@/hooks/use-version-density';
import { cn } from '@/lib/utils';
import { VersionEnvironment } from '@/components/version-environment';
import { open } from '@tauri-apps/plugin-shell';
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
import { createColumnHelper } from '@tanstack/react-table';
import {
  CircleCheckBig,
  Ellipsis,
  CircleSlash,
  LoaderCircle,
  RefreshCw,
  HardDriveIcon,
  LightbulbIcon,
  MousePointerClick,
  TrashIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router';
import { toast } from 'sonner';

import { useAppContext } from '@/app-context';
import { getCurrent } from '@/services/api';
import {
  installedList,
  installedListWithTray,
  uninstallNode,
  vCurrent,
  versionList,
  vSetCurrent,
} from '@/services/cmds';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

type VersionsResult = [string, Nvmd.Versions, Array<string>];

const statusBadgeClassName =
  'h-6 gap-1.5 rounded-lg border-0 px-2 text-xs font-medium';
const rowActionClassName =
  'h-7 min-w-20 gap-1.5 rounded-lg border-0 px-2.5 text-xs font-medium';

const columnHelper = createColumnHelper<DataTableFeatures, Nvmd.Version>();

export async function loader() {
  try {
    const versions = await Promise.all([
      vCurrent(),
      versionList(),
      installedList(),
    ]);

    return versions;
  } catch {
    return ['', [], []];
  }
}

export const Component: React.FC = () => {
  const [currentVersion, allVersions, allInstalledVersions] =
    useLoaderData<VersionsResult>();

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() =>
    allVersions.filter(({ version }) =>
      allInstalledVersions.includes(version.slice(1)),
    ),
  );
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [loading, setLoading] = useState<boolean>(false);

  const { settings } = useAppContext();
  const { directory } = settings;
  const { t } = useTranslation();
  const { density } = useVersionDensity();
  const compact = density !== 'comfortable';
  const dense = density === 'dense';

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
          const iVersions = await installedList();
          setVersions(
            allVersions.filter(({ version }) =>
              iVersions.includes(version.slice(1)),
            ),
          );
          setInstalledVersions(iVersions);
        }
      },
    );

    return () => {
      unlisted.then((fn) => fn());
    };
  }, [t, allVersions]);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await installedList();
      setVersions(
        allVersions.filter(({ version }) =>
          iVersions.includes(version.slice(1)),
        ),
      );
      setInstalledVersions(iVersions);
    };
    fetcher();
  }, [directory, allVersions]);

  const columns = columnHelper.columns([
    columnHelper.accessor('version', {
      header: t('Version'),
      meta: {
        layoutClassName: dense
          ? 'min-w-0 flex-[1.6_1_0%]'
          : 'min-w-52 xl:flex-[1.1_1_0%]',
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
        const { version, lts } = row.original;
        return (
          <div
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap',
              dense && 'gap-1.5',
              dense &&
                'min-w-0 flex-nowrap [&_button]:min-w-0 [&_button]:truncate [&_[data-slot=badge]]:shrink-0',
            )}
          >
            <Tooltip disableHoverablePopup={true}>
              <TooltipTrigger
                render={
                  <button
                    type='button'
                    className='cursor-pointer rounded-md p-0 font-mono text-sm font-semibold leading-6 text-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring'
                    onClick={() =>
                      open(
                        `https://github.com/nodejs/node/releases/tag/${version}`,
                      )
                    }
                  >
                    {version}
                  </button>
                }
              />
              <TooltipContent
                className='bg-primary text-primary-foreground'
                arrowClassName='bg-primary fill-primary'
              >
                {dense ? `${version} · ${t('Whats-new')}` : t('Whats-new')}
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
            ) : version === allVersions[0]?.version ? (
              <Badge
                variant='secondary'
                className='h-5 rounded-md border-0 bg-muted px-1.5 text-[0.625rem] font-medium text-muted-foreground'
              >
                {t('latest')}
              </Badge>
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
        layoutClassName: dense
          ? 'min-w-0 flex-[1.2_1_0%]'
          : 'min-w-32 xl:flex-[1_1_0%]',
        className: 'flex items-center font-mono text-xs text-muted-foreground',
      },
    }),
    columnHelper.accessor('npm', {
      header: `NPM ${t('Version')}`,
      enableSorting: false,
      meta: {
        label: `NPM ${t('Version')}`,
        layoutClassName: dense
          ? 'min-w-0 flex-[0.8_1_0%]'
          : 'min-w-28 xl:flex-[0.8_1_0%]',
        className: 'flex items-center font-mono text-xs text-muted-foreground',
      },
    }),
    columnHelper.accessor('date', {
      header: t('Release-Date'),
      enableColumnFilter: false,
      enableSorting: true,
      meta: {
        label: t('Release-Date'),
        layoutClassName: dense
          ? 'min-w-0 flex-[1.1_1_0%]'
          : 'xl:basis-36 xl:grow-0 xl:shrink-0',
        className: 'flex items-center text-muted-foreground',
      },
      cell: ({ row }) =>
        dayjs(row.original.date).format(dense ? 'YYYY-MM-DD' : 'll'),
    }),
    columnHelper.accessor(
      ({ version }) =>
        current && version === `v${current}` ? 'Current' : 'Installed',
      {
        id: 'status',
        header: t('Status'),
        meta: {
          label: t('Status'),
          layoutClassName: dense
            ? 'min-w-0 flex-[1.2_1_0%]'
            : 'xl:basis-40 xl:grow-0 xl:shrink-0',
          className: 'flex items-center',
        },
        enableSorting: false,
        enableColumnFilter: false,
        filterFn: (row, _columnId, filterValue: string[]) => {
          const { version } = row.original;
          const rets = filterValue.map((value) => {
            switch (value) {
              case 'Current': {
                return version === `v${current}`;
              }
              case 'Installed': {
                return !!installedVersions.find(
                  (installed) => version === `v${installed}`,
                );
              }
              default:
                return false;
            }
          });
          return rets.includes(true);
        },
        cell: ({ row }) => {
          const { version } = row.original;
          const installed = installedVersions.find(
            (installed) => version === `v${installed}`,
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
        layoutClassName: dense
          ? 'min-w-0 flex-[1.1_1_0%]'
          : 'xl:basis-32 xl:grow-0 xl:shrink-0',
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { version } = row.original;
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
            <DropdownMenuContent align='end' className='w-52 rounded-xl p-1.5'>
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
                      const [currentVersion, installeds] = await Promise.all([
                        vCurrent(),
                        installedListWithTray(true),
                      ]);
                      setCurrent(currentVersion);
                      setInstalledVersions(installeds);
                      setVersions(
                        allVersions.filter(({ version }) =>
                          installeds.includes(version.slice(1)),
                        ),
                      );
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
                  <TrashIcon />
                  {t('Uninstall')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ]);

  const onPageReload = async () => {
    setLoading(true);
    try {
      const [currentVersion, versions, installeds] = await Promise.all([
        vCurrent(true),
        versionList(),
        installedList(true),
      ]);
      setCurrent(currentVersion);
      setVersions(
        versions.filter(({ version }) => installeds.includes(version.slice(1))),
      );
      setInstalledVersions(installeds);
      toast.success(t('Refresh-successful'));
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-density={density}
      className={cn(
        'flex h-full min-h-0 min-w-0 flex-col',
        dense ? 'gap-1.5' : compact ? 'gap-2.5' : 'gap-5',
      )}
    >
      <div className='flex shrink-0 flex-wrap items-start justify-between gap-3'>
        <div>
          <h1
            className={cn(
              'leading-tight font-semibold tracking-tight',
              dense ? 'text-lg' : compact ? 'text-xl' : 'mb-1.5 text-2xl',
            )}
          >
            {t('Installed')}
          </h1>
          <p
            className={cn(
              'text-muted-foreground',
              dense
                ? 'hidden'
                : compact
                  ? 'text-xs leading-normal'
                  : 'text-sm leading-relaxed',
            )}
          >
            {t('Installed-Description')}
          </p>
        </div>
      </div>
      <VersionEnvironment
        current={current}
        compact={compact}
        dense={dense}
        installedCount={installedVersions.length}
        releaseCount={allVersions.length}
        destination='/versions'
      />
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        {!dense && (
          <div
            className={cn(
              'flex items-baseline justify-between gap-3',
              compact ? 'pb-2' : 'pb-4',
            )}
          >
            <h2 className='text-sm font-semibold'>{t('Installed-Catalog')}</h2>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {t('Installed-Count', {
                count: versions.length,
              })}
            </span>
          </div>
        )}
        <DataTable
          density={density}
          columns={columns}
          data={versions}
          loading={loading}
          toolbar={(table) => (
            <div
              className={cn(
                'flex shrink-0 flex-wrap items-center gap-2',
                dense ? 'pb-1.5' : 'pb-3',
              )}
            >
              <DataTableToolbar
                table={table}
                options={[
                  {
                    label: t('Current'),
                    value: 'Current',
                    icon: LightbulbIcon,
                  },
                  {
                    label: t('Installed'),
                    value: 'Installed',
                    icon: HardDriveIcon,
                  },
                ]}
              />
              <VersionDensityControl />
              <Button
                size='sm'
                variant='ghost'
                className='group h-8 gap-2 rounded-lg border-0 bg-surface-40 px-3 text-xs font-medium text-muted-foreground hover:bg-surface-hover-80 hover:text-foreground'
                aria-busy={loading}
                disabled={loading}
                onClick={onPageReload}
              >
                {loading ? (
                  <LoaderCircle className='size-3.5 animate-spin motion-reduce:animate-none' />
                ) : (
                  <RefreshCw className='size-3.5 transition-transform group-hover:rotate-45 motion-reduce:transition-none' />
                )}
                {t('Page-Reload')}
              </Button>
            </div>
          )}
        />
      </div>
    </div>
  );
};

Component.displayName = 'Installed';
