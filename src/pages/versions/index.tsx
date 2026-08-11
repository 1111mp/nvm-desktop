import {
  Badge,
  Button,
  DataTable,
  DataTableColumnFilterHeader,
  DataTableColumnSortHeader,
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
import { type ColumnDef } from '@tanstack/react-table';
import {
  CircleCheckBig,
  CircleChevronDown,
  CircleSlash,
  CircleX,
  CloudDownload,
  CloudSync,
  FolderSync,
  Frown,
  HardDrive,
  LoaderCircle,
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

export async function loader() {
  const versions = await Promise.all([
    vCurrent(),
    versionList(),
    installedList(),
  ]).catch(() => {
    return [[], [], ''];
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

  const modal = useRef<ModalRef>(null);

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

  const columns: ColumnDef<DataTableFeatures, Nvmd.Version>[] = [
    {
      accessorKey: 'version',
      header: ({ column }) => (
        <DataTableColumnSortHeader column={column} title={t('Version')} />
      ),
      enableHiding: false,
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
          <div className='relative flex gap-1 items-center'>
            <Tooltip disableHoverableContent={true}>
              <TooltipTrigger asChild>
                <a
                  className='h-6 p-0 leading-6 text-md text-foreground font-medium cursor-pointer hover:text-primary hover:underline'
                  onClick={async () => {
                    await open(
                      `https://github.com/nodejs/node/releases/tag/${version}`,
                    );
                  }}
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
            {dayjs().diff(date, 'day') <= 3 ? (
              <span className='inline-block absolute w-1 h-1 top-1 -left-1.5 rounded-full bg-primary' />
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'v8',
      header: ({ column }) => (
        <DataTableColumnFilterHeader
          column={column}
          title={`V8 ${t('Version')}`}
        />
      ),
      meta: {
        label: `V8 ${t('Version')}`,
        className: 'flex items-center text-muted-foreground',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'npm',
      header: ({ column }) => (
        <DataTableColumnFilterHeader
          column={column}
          title={`NPM ${t('Version')}`}
        />
      ),
      meta: {
        label: `NPM ${t('Version')}`,
        className: 'flex items-center text-muted-foreground',
      },
      enableSorting: false,
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnSortHeader column={column} title={t('Release-Date')} />
      ),
      meta: {
        label: t('Release-Date'),
        className: 'flex items-center text-muted-foreground',
      },
      cell: ({ row }) => dayjs(row.original.date).format('ll'),
    },
    {
      id: 'status',
      accessorFn: ({ version, files }) => {
        if (installedVersions.includes(version.slice(1))) return 'Installed';
        return checkSupportive(files) ? 'Supported' : 'UnSupported';
      },
      header: t('Status'),
      meta: {
        label: t('Status'),
        className: 'flex items-center',
      },
      enableSorting: false,
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
        const installed = installedVersions.find(
          (installed) => `v${installed}` === version,
        );

        // the current version
        if (installed && current && version === `v${current}`) {
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

        const support = checkSupportive(files);
        // the unsupport version
        if (!support) {
          return (
            <Badge variant='destructive'>
              <CircleX />
              {t('Not-Supported')}
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
    {
      header: t('Operation'),
      enableHiding: false,
      enableSorting: false,
      meta: {
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { version } = row.original;

        if (installedVersions.find((install) => version === `v${install}`))
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='xs' variant='outline'>
                  <CircleChevronDown />
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
                        const [currentVersion, versions] = await Promise.all([
                          vCurrent(),
                          installedListWithTray(true),
                        ]);
                        setCurrent(currentVersion);
                        setInstalledVersions(versions);
                        toast.success(t('Tip-Uninstall', { version }));
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
          <Button size='xs' onClick={() => modal.current?.show(row.original)}>
            <CloudDownload />
            {t('Install')}
          </Button>
        );
      },
    },
  ];

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
      <div className='h-full flex flex-col space-y-2'>
        <DataTable
          key='page-versions-table'
          columns={columns}
          data={versions}
          loading={loading || localLoading}
          toolbar={(table) => (
            <div className='flex items-center gap-2'>
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
                <Button
                  size='sm'
                  disabled={localLoading || loading}
                  onClick={onPageReload}
                >
                  <FolderSync />
                  {t('Page-Reload')}
                </Button>
                <Button
                  size='sm'
                  disabled={loading || localLoading}
                  onClick={onDataUpdate}
                >
                  {loading ? (
                    <LoaderCircle className='animate-spin' />
                  ) : (
                    <CloudSync />
                  )}
                  {t('Data-Update')}
                </Button>
              </div>
            </div>
          )}
        />
      </div>
      <Modal ref={modal} onRefrresh={onInstalledRefresh} />
    </>
  );
};
