import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { toast } from "sonner";

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
  TooltipTrigger
} from "@renderer/components/ui";
import { type ColumnDef, type Table, memo } from "@tanstack/react-table";
import {
  CheckCircledIcon,
  ChevronDownIcon,
  CrossCircledIcon,
  MinusCircledIcon,
  ReloadIcon
} from "@radix-ui/react-icons";

import dayjs from "dayjs";
import { useI18n, useAppContext } from "@src/renderer/src/app-context";

type VersionsResult = [Nvmd.Versions, Array<string>, string];

export async function loader() {
  try {
    const versions = await Promise.all([
      window.Context.getAllNodeVersions(),
      window.Context.getInstalledNodeVersions(),
      window.Context.getCurrentVersion()
    ]);

    return versions;
  } catch (err) {
    return [[], [], ""];
  }
}

export const Component: React.FC = () => {
  const [allVersions, allInstalledVersions, currentVersion] = useLoaderData() as VersionsResult;

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() =>
    allVersions.filter(({ version }) => allInstalledVersions.includes(version.slice(1)))
  );
  const [installedVersions, setInstalledVersions] = useState<string[]>(() => allInstalledVersions);
  const [loading, setLoading] = useState<boolean>(false);

  const { directory, locale } = useAppContext();
  const i18n = useI18n();

  useEffect(() => {
    window.Context.onRegistCurVersionChange((version) => {
      setCurrent(version);
      toast.success(i18n("Restart-Terminal", [`v${version}`]));
    });
  }, []);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await window.Context.getInstalledNodeVersions(true);
      setVersions(allVersions.filter(({ version }) => iVersions.includes(version.slice(1))));
      setInstalledVersions(iVersions);
    };

    fetcher();
  }, [directory]);

  const columns: ColumnDef<Nvmd.Version>[] = useMemo(() => {
    const { version: latest } = versions[0] || { version: "" };
    return [
      {
        accessorKey: "version",
        header: ({ column }) => (
          <DataTableColumnSortHeader column={column} title={i18n("Version")} />
        ),
        enableHiding: false,
        filterFn: (row, _columnId, filterValue: string) => {
          const { version, lts } = row.original;
          if ("lts".includes(filterValue.toLocaleLowerCase())) return !!lts;

          return (
            ("lts".includes(filterValue.toLocaleLowerCase()) ? !!lts : false) ||
            version.toString().toLowerCase().includes(filterValue.toLowerCase()) ||
            (lts ? lts.toString().toLowerCase().includes(filterValue.toLowerCase()) : false)
          );
        },
        cell: ({ row }) => {
          const { version, lts } = row.original;
          return (
            <div className="flex gap-1 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    className="h-6 p-0 text-md text-foreground font-medium hover:text-primary"
                    onClick={() => {
                      window.open(
                        `https://github.com/nodejs/node/releases/tag/${version}`,
                        "_blank"
                      );
                    }}
                  >
                    {version}
                  </Button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent>{i18n("Whats-new")}</TooltipContent>
                </TooltipPortal>
              </Tooltip>
              {lts ? (
                <span className="text-foreground-foreground">({lts})</span>
              ) : latest === version ? (
                <span className="text-foreground-foreground">({i18n("latest")})</span>
              ) : null}
            </div>
          );
        }
      },
      {
        accessorKey: "v8",
        header: ({ column }) => (
          <DataTableColumnFilterHeader column={column} title={`V8 ${i18n("Version")}`} />
        ),
        enableSorting: false
      },
      {
        accessorKey: "npm",
        header: ({ column }) => (
          <DataTableColumnFilterHeader column={column} title={`NPM ${i18n("Version")}`} />
        ),
        enableSorting: false
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnSortHeader column={column} title={i18n("Release-Date")} />
        ),
        cell: ({ row }) => dayjs(row.original.date).format("ll")
      },
      {
        accessorKey: "status",
        header: i18n("Status"),
        enableSorting: false,
        filterFn: (row, _columnId, filterValue: string[]) => {
          const { version } = row.original;

          const rets = filterValue.map((value) => {
            switch (value) {
              case "Current": {
                return version.includes(current);
              }
              case "Installed": {
                return !!installedVersions.find((installed) => version.includes(installed));
              }
              default:
                return false;
            }
          });

          return rets.includes(true);
        },
        cell: ({ row }) => {
          const { version } = row.original;

          const installed = installedVersions.find((installed) => version.includes(installed));

          if (installed && current && version.includes(current))
            return <Tag color="lime">{i18n("Current")}</Tag>;

          if (installed) return <Tag color="purple">{i18n("Installed")}</Tag>;

          return <Tag color="neutral">{i18n("Not-Installed")}</Tag>;
        }
      },
      {
        header: i18n("Operation"),
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const { version } = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="tag"
                  className="text-fuchsia-500 border-fuchsia-500 hover:text-fuchsia-500/80 hover:border-fuchsia-500/60 focus-visible:ring-1 focus-visible:ring-fuchsia-500/60"
                  icon={<ChevronDownIcon />}
                >
                  {i18n("More")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-8">
                <DropdownMenuItem
                  className="flex gap-2 cursor-pointer"
                  onSelect={async () => {
                    await window.Context.useNodeVersion(version.slice(1));
                    const currentVersion = await window.Context.getCurrentVersion();
                    setCurrent(currentVersion);
                    toast.success(i18n("Restart-Terminal", [version]));
                  }}
                >
                  <CheckCircledIcon />
                  {i18n("Apply")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex gap-2 text-red-600 focus:text-red-500 cursor-pointer"
                  onSelect={async () => {
                    try {
                      await window.Context.uninstallVersion(
                        version.slice(1),
                        version.includes(current)
                      );

                      const [currentVersion, installeds] = await Promise.all([
                        window.Context.getCurrentVersion(),
                        window.Context.getInstalledNodeVersions(true)
                      ]);
                      setCurrent(currentVersion);
                      setInstalledVersions(installeds);
                      setVersions(
                        allVersions.filter(({ version }) => installeds.includes(version.slice(1)))
                      );
                      toast.success(i18n("Tip-Uninstall", [version]));
                    } catch (err) {
                      toast.error(
                        err.message
                          ? err.message
                              .split(
                                "Error: Error invoking remote method 'uninstall-node-version': "
                              )
                              .slice(-1)
                          : "Something went wrong"
                      );
                    }
                  }}
                >
                  <CrossCircledIcon />
                  {i18n("Uninstall")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    ];
  }, [locale, current, installedVersions.length]);

  const statuses = useMemo(
    () => [
      {
        label: i18n("Current"),
        value: "Current",
        icon: CheckCircledIcon
      },
      {
        label: i18n("Installed"),
        value: "Installed",
        icon: MinusCircledIcon
      }
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

              let key: string = "Installed";
              if (version.includes(current)) key = "Current";

              if (facetedUniqueValues.has(key)) {
                facetedUniqueValues.set(key, (facetedUniqueValues.get(key) ?? 0) + 1);
              } else {
                facetedUniqueValues.set(key, 1);
              }
            }

            return facetedUniqueValues;
          },
          {
            key: process.env.NODE_ENV === "development" && "getFacetedUniqueValues_" + columnId,
            debug: () => table.options.debugAll ?? table.options.debugTable,
            onChange: () => {}
          }
        );
    };
  }, [current, installedVersions.length]);

  const onPageReload = async () => {
    setLoading(true);
    try {
      const [versions, installeds, currentVersion] = await Promise.all([
        window.Context.getAllNodeVersions(),
        window.Context.getInstalledNodeVersions(),
        window.Context.getCurrentVersion(true)
      ]);
      setVersions(versions.filter(({ version }) => installeds.includes(version.slice(1))));
      setInstalledVersions(installeds);
      setCurrent(currentVersion);
      toast.success(i18n("Refresh-successful"));
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-2">
      <DataTable
        columns={columns}
        data={versions}
        loading={loading}
        toolbar={(table) => (
          <div className="flex items-center gap-2">
            <DataTableToolbar table={table} options={statuses} />
            <Button size="sm" loading={loading} icon={<ReloadIcon />} onClick={onPageReload}>
              {i18n("Page-Reload")}
            </Button>
          </div>
        )}
        getFacetedUniqueValues={getFacetedUniqueValues}
      />
    </div>
  );
};

Component.displayName = "Installed";
