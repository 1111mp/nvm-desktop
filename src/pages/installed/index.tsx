import {
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type DataTableFeatures,
} from '@/components/ui';
import { createColumnHelper } from '@tanstack/react-table';
import {
  CircleCheckBig,
  CircleChevronDownIcon,
  CircleSlash,
  FolderSync,
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
    return [[], [], ''];
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

  useEffect(() => {
    const unlisted = getCurrent().listen<string>(
      'nvm-desktop://refresh-version-info',
      async ({ payload }) => {
        if (payload) {
          setCurrent(payload);
          toast.success(t('Restart-Terminal', { version: `v${payload}` }));
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
          <div className='flex gap-1 items-center'>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  className='h-6 p-0 leading-6 text-md text-foreground font-medium hover:text-primary hover:underline'
                  href={`https://github.com/nodejs/node/releases/tag/${version}`}
                  rel='noreferrer'
                  target='_blank'
                >
                  {version}
                </a>
              </TooltipTrigger>
              <TooltipContent
                className='bg-primary text-primary-foreground'
                arrowClassName='bg-primary fill-primary'
              >
                {t('Whats-new')}
              </TooltipContent>
            </Tooltip>
            {lts ? (
              <span className='text-muted-foreground'>({lts})</span>
            ) : row.index === 0 ? (
              <span className='text-muted-foreground'>({t('latest')})</span>
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
        className: 'flex items-center text-muted-foreground',
      },
    }),
    columnHelper.accessor('npm', {
      header: `NPM ${t('Version')}`,
      enableSorting: false,
      meta: {
        label: `NPM ${t('Version')}`,
        className: 'flex items-center text-muted-foreground',
      },
    }),
    columnHelper.accessor('date', {
      header: t('Release-Date'),
      enableColumnFilter: false,
      enableSorting: true,
      meta: {
        label: t('Release-Date'),
        className: 'flex items-center text-muted-foreground',
      },
      cell: ({ row }) => dayjs(row.original.date).format('ll'),
    }),
    columnHelper.accessor(
      ({ version }) =>
        current && version.includes(current) ? 'Current' : 'Installed',
      {
        id: 'status',
        header: t('Status'),
        meta: {
          label: t('Status'),
          className: 'flex items-center',
        },
        enableSorting: false,
        enableColumnFilter: false,
        filterFn: (row, _columnId, filterValue: string[]) => {
          const { version } = row.original;
          const rets = filterValue.map((value) => {
            switch (value) {
              case 'Current': {
                return version.includes(current);
              }
              case 'Installed': {
                return !!installedVersions.find((installed) =>
                  version.includes(installed),
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
          const installed = installedVersions.find((installed) =>
            version.includes(installed),
          );

          // the current version
          if (installed && current && version.includes(current)) {
            return (
              <Badge>
                <CircleCheckBig />
                {t('Current')}
              </Badge>
            );
          }

          // the installed version
          if (installed) {
            return (
              <Badge variant='secondary'>
                <CircleCheckBig />
                {t('Installed')}
              </Badge>
            );
          }

          // default => not installed
          return (
            <Badge variant='outline'>
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
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { version } = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='xs' variant='outline'>
                <CircleChevronDownIcon />
                {t('More')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={async () => {
                    try {
                      const curVersion = version.slice(1);
                      await vSetCurrent(curVersion);
                      setCurrent(curVersion);
                      toast.success(t('Restart-Terminal', { version }));
                    } catch (err) {
                      toast.error(err);
                    }
                  }}
                >
                  <MousePointerClick />
                  {t('Apply')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={async () => {
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
                      toast.success(t('Tip-Uninstall', { version }));
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
    <div className='h-full flex flex-col space-y-2'>
      <DataTable
        columns={columns}
        data={versions}
        loading={loading}
        toolbar={(table) => (
          <div className='flex items-center gap-2'>
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
            <Button size='sm' disabled={loading} onClick={onPageReload}>
              <FolderSync />
              {t('Page-Reload')}
            </Button>
          </div>
        )}
      />
    </div>
  );
};

Component.displayName = 'Installed';
