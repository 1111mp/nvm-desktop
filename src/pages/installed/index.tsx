import { useEffect, useMemo, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
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
  Tag,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@/components/ui';
import { type ColumnDef, type Table, memo } from '@tanstack/react-table';
import {
  CheckCircledIcon,
  ChevronDownIcon,
  CrossCircledIcon,
  MinusCircledIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/app-context';
import {
  installedList,
  uninstallNode,
  vCurrent,
  versionList,
  vSetCurrent,
} from '@/services/cmds';

type VersionsResult = [string, Nvmd.Versions, Array<string>];

export async function loader() {
  try {
    const versions = await Promise.all([
      vCurrent(),
      versionList(),
      installedList(),
    ]);

    return versions;
  } catch (err) {
    return [[], [], ''];
  }
}

export const Component: React.FC = () => {
  const [currentVersion, allVersions, allInstalledVersions] =
    useLoaderData() as VersionsResult;

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() =>
    allVersions.filter(({ version }) =>
      allInstalledVersions.includes(version.slice(1))
    )
  );
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions
  );
  const [loading, setLoading] = useState<boolean>(false);

  const { settings } = useAppContext();
  const { directory, locale } = settings;
  const { t } = useTranslation();

  useEffect(() => {
    // window.Context.onRegistCurVersionChange((version) => {
    //   setCurrent(version);
    //   toast.success(t('Restart-Terminal', [`v${version}`]));
    // });
  }, []);

  useEffect(() => {
    // const fetcher = async () => {
    //   const iVersions = await window.Context.getInstalledNodeVersions(true);
    //   setVersions(
    //     allVersions.filter(({ version }) =>
    //       iVersions.includes(version.slice(1))
    //     )
    //   );
    //   setInstalledVersions(iVersions);
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
          const { version } = row.original;

          const rets = filterValue.map((value) => {
            switch (value) {
              case 'Current': {
                return version.includes(current);
              }
              case 'Installed': {
                return !!installedVersions.find((installed) =>
                  version.includes(installed)
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
          const { version } = row.original;
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
                      const [currentVersion, installeds] = await Promise.all([
                        vCurrent(),
                        installedList(true),
                      ]);
                      setCurrent(currentVersion);
                      setInstalledVersions(installeds);
                      setVersions(
                        allVersions.filter(({ version }) =>
                          installeds.includes(version.slice(1))
                        )
                      );
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
        },
      },
    ];
  }, [locale, current, installedVersions.length]);

  const statuses = useMemo(
    () => [
      {
        label: t('Current'),
        value: 'Current',
        icon: CheckCircledIcon,
      },
      {
        label: t('Installed'),
        value: 'Installed',
        icon: MinusCircledIcon,
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
              const { version } = facetedRowModel.flatRows[i]!.original;

              let key: string = 'Installed';
              if (version.includes(current)) key = 'Current';

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
  }, [current, installedVersions.length]);

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
        versions.filter(({ version }) => installeds.includes(version.slice(1)))
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
            <DataTableToolbar table={table} options={statuses} />
            <Button
              size='sm'
              className='h-7 text-sm'
              loading={loading}
              icon={<ReloadIcon />}
              onClick={onPageReload}
            >
              {t('Page-Reload')}
            </Button>
          </div>
        )}
        getFacetedUniqueValues={getFacetedUniqueValues}
      />
    </div>
  );
};

Component.displayName = 'Installed';
