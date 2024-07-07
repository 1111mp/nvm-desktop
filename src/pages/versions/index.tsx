import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Await, defer, useAsyncValue, useLoaderData } from 'react-router-dom';
import {
  Button,
  DataTable,
  DataTableColumnFilterHeader,
  DataTableColumnSortHeader,
  DataTableToolbar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Tag,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@/components/ui';
import {
  CheckCircledIcon,
  ChevronDownIcon,
  CrossCircledIcon,
  DownloadIcon,
  MinusCircledIcon,
  ReloadIcon,
  UpdateIcon,
} from '@radix-ui/react-icons';
import { memo, type ColumnDef, type Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Modal, type Ref as ModalRef } from './modal';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/app-context';
import {
  vCurrent,
  installedList,
  versionList,
  uninstallNode,
  vSetCurrent,
} from '@/services/cmds';
import { checkSupportive } from '@/lib/utils';

dayjs.extend(localizedFormat);

type VersionsResult = [string, Nvmd.Versions, Array<string>];

export async function loader(): Promise<unknown> {
  try {
    const versions = Promise.all([
      vCurrent(),
      versionList(),
      installedList(),
    ]).catch((_err) => {
      return [[], [], ''];
    });

    return defer({ versions: versions });
  } catch (err) {
    return defer({ versions: ['', [], []] });
  }
}

export function VersionsRoute() {
  const data = useLoaderData() as { versions: VersionsResult };

  return (
    <Suspense
      fallback={
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-8 w-40' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-40' />
              <Skeleton className='h-8 w-40' />
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-[400px]' />
          </div>
        </div>
      }
    >
      <Await resolve={data.versions}>
        <Versions />
      </Await>
    </Suspense>
  );
}

const Versions: React.FC = () => {
  const versionsData = useAsyncValue() as VersionsResult;

  const [currentVersion, allVersions, allInstalledVersions] = versionsData;

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() => allVersions);
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [localLoading, seLocaltLoading] = useState<boolean>(false);

  const modal = useRef<ModalRef>(null);

  const { settings } = useAppContext();
  const { directory, locale } = settings;
  const { t } = useTranslation();

  useEffect(() => {
    // window.Context.onRegistCurVersionChange((version) => {
    // 	setCurrent(version);
    // 	toast.success(t('Restart-Terminal', [`v${version}`]));
    // });
  }, []);

  useEffect(() => {
    // const fetcher = async () => {
    // 	const iVersions = await window.Context.getInstalledNodeVersions(true);
    // 	setInstalledVersions(iVersions);
    // };
    // fetcher();
  }, [directory]);

  const columns: ColumnDef<Nvmd.Version>[] = useMemo(() => {
    const { version: latest } = versions[0] || { version: '' };
    return [
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
          const { version, lts } = row.original;
          return (
            <div className='flex gap-1 items-center'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='link'
                    className='h-6 p-0 text-md text-foreground font-medium hover:text-primary'
                    onClick={() => {
                      window.open(
                        `https://github.com/nodejs/node/releases/tag/${version}`,
                        '_blank'
                      );
                    }}
                  >
                    {version}
                  </Button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent>{t('Whats-new')}</TooltipContent>
                </TooltipPortal>
              </Tooltip>
              {lts ? (
                <span className='text-foreground-foreground'>({lts})</span>
              ) : latest === version ? (
                <span className='text-foreground-foreground'>
                  ({t('latest')})
                </span>
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
        enableSorting: false,
      },
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <DataTableColumnSortHeader
            column={column}
            title={t('Release-Date')}
          />
        ),
        cell: ({ row }) => dayjs(row.original.date).format('ll'),
      },
      {
        accessorKey: 'status',
        header: t('Status'),
        enableSorting: false,
        filterFn: (row, _columnId, filterValue: string[]) => {
          const { version, files } = row.original;

          const rets = filterValue.map((value) => {
            switch (value) {
              case 'Installed': {
                return !!installedVersions.find((installed) =>
                  version.includes(installed)
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
          const support = checkSupportive(files);

          if (!support) return <Tag color='rose'>{t('Not-Supported')}</Tag>;

          const installed = installedVersions.find((installed) =>
            version.includes(installed)
          );

          if (installed && current && version.includes(current))
            return <Tag color='lime'>{t('Current')}</Tag>;

          if (installed) return <Tag color='purple'>{t('Installed')}</Tag>;

          return <Tag color='neutral'>{t('Not-Installed')}</Tag>;
        },
      },
      {
        header: t('Operation'),
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const { version, files } = row.original;
          // if (!checkSupportive(files)) return;

          if (installedVersions.find((install) => version.includes(install)))
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size='sm'
                    variant='tag'
                    className='text-fuchsia-500 border-fuchsia-500 hover:text-fuchsia-500/80 hover:border-fuchsia-500/60 focus-visible:ring-1 focus-visible:ring-fuchsia-500/60'
                    icon={<ChevronDownIcon />}
                  >
                    {t('More')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='min-w-8'>
                  <DropdownMenuItem
                    className='flex gap-2 cursor-pointer'
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
                    <CheckCircledIcon />
                    {t('Apply')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='flex gap-2 text-red-600 focus:text-red-500 cursor-pointer'
                    onSelect={async () => {
                      try {
                        await uninstallNode(
                          version.slice(1),
                          version.includes(current)
                        );
                        const [currentVersion, versions] = await Promise.all([
                          vCurrent(),
                          installedList(true),
                        ]);
                        setCurrent(currentVersion);
                        setInstalledVersions(versions);
                        toast.success(t('Tip-Uninstall', { version }));
                      } catch (err) {
                        toast.error(err);
                      }
                    }}
                  >
                    <CrossCircledIcon />
                    {t('Uninstall')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );

          return (
            <Button
              size='sm'
              variant='tag'
              icon={<DownloadIcon />}
              onClick={() => modal.current?.show(row.original)}
            >
              {t('Install')}
            </Button>
          );
        },
      },
    ];
  }, [locale, current, installedVersions.length, versions.length]);

  const statuses = useMemo(
    () => [
      {
        label: t('Installed'),
        value: 'Installed',
        icon: MinusCircledIcon,
      },
      {
        label: t('Supported'),
        value: 'Supported',
        icon: CheckCircledIcon,
      },
      {
        label: t('Not-Supported'),
        value: 'UnSupported',
        icon: CrossCircledIcon,
      },
    ],
    [locale]
  );

  const getFacetedUniqueValues: () => (
    table: Table<Nvmd.Version>,
    columnId: string
  ) => () => Map<any, number> = useMemo(() => {
    return function getFacetedUniqueValues() {
      return (table, columnId) =>
        memo(
          () => [table.getColumn(columnId)?.getFacetedRowModel()],
          (facetedRowModel) => {
            if (!facetedRowModel) return new Map();

            let facetedUniqueValues = new Map<any, number>();

            for (let i = 0; i < facetedRowModel.flatRows.length; i++) {
              const { version, files } = facetedRowModel.flatRows[i]!.original;

              let key: string | undefined;
              if (installedVersions.includes(version.slice(1)))
                key = 'Installed';

              if (key === void 0 && checkSupportive(files)) key = 'Supported';

              if (key === void 0) key = 'UnSupported';

              if (facetedUniqueValues.has(key)) {
                facetedUniqueValues.set(
                  key,
                  (facetedUniqueValues.get(key) ?? 0) + 1
                );
              } else {
                facetedUniqueValues.set(key, 1);
              }
            }

            return facetedUniqueValues;
          },
          {
            key:
              process.env.NODE_ENV === 'development' &&
              'getFacetedUniqueValues_' + columnId,
            debug: () => table.options.debugAll ?? table.options.debugTable,
            onChange: () => {},
          }
        );
    };
  }, [installedVersions.length]);

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
    const versions = await installedList(true);
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
                options={statuses}
              />
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  disabled={loading}
                  className='h-7 text-sm'
                  loading={localLoading}
                  icon={<ReloadIcon />}
                  onClick={onPageReload}
                >
                  {t('Page-Reload')}
                </Button>
                <Button
                  loading={loading}
                  size='sm'
                  className='h-7 text-sm'
                  icon={<UpdateIcon />}
                  onClick={onDataUpdate}
                >
                  {t('Data-Update')}
                </Button>
              </div>
            </div>
          )}
          getFacetedUniqueValues={getFacetedUniqueValues}
        />
      </div>
      <Modal ref={modal} onRefrresh={onInstalledRefresh} />
    </>
  );
};
