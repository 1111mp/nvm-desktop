import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Await, defer, useAsyncValue, useLoaderData } from "react-router-dom";

import {
  Button,
  DataTable,
  Skeleton,
  Tag,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
  DataTableColumnSortHeader,
  DataTableColumnFilterHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DataTableToolbar
} from "@renderer/components/ui";
import {
  CheckCircledIcon,
  ChevronDownIcon,
  CrossCircledIcon,
  DownloadIcon,
  MinusCircledIcon,
  ReloadIcon,
  UpdateIcon
} from "@radix-ui/react-icons";
import { memo, type ColumnDef, type Table } from "@tanstack/react-table";
import { toast } from "sonner";
import { InfoModal } from "./modal";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { checkSupportive } from "@renderer/util";
import { useI18n, useAppContext } from "@src/renderer/src/app-context";

import type { Ref as InfoRef } from "./modal";

type VersionsResult = [Nvmd.Versions, Array<string>, string];

dayjs.extend(localizedFormat);

export async function loader(): Promise<unknown> {
  try {
    const versions = Promise.all([
      window.Context.getAllNodeVersions(),
      window.Context.getInstalledNodeVersions(),
      window.Context.getCurrentVersion()
    ]).catch((_err) => {
      return [[], [], ""];
    });

    return defer({ versions: versions });
  } catch (err) {
    return defer({ versions: [[], [], ""] });
  }
}

export function VersionsRoute() {
  const data = useLoaderData() as { versions: VersionsResult };

  return (
    <Suspense
      fallback={
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-[400px]" />
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

  const [allVersions, allInstalledVersions, currentVersion] = versionsData;

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() => allVersions);
  const [installedVersions, setInstalledVersions] = useState<string[]>(() => allInstalledVersions);
  const [loading, setLoading] = useState<boolean>(false);
  const [localLoading, seLocaltLoading] = useState<boolean>(false);

  const modal = useRef<InfoRef>(null);

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
          const { version, files } = row.original;

          const rets = filterValue.map((value) => {
            switch (value) {
              case "Installed": {
                return !!installedVersions.find((installed) => version.includes(installed));
              }
              case "Supported": {
                return checkSupportive(files);
              }
              case "UnSupported": {
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

          if (!support) return <Tag color="rose">{i18n("Not-Supported")}</Tag>;

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
          const { version, files } = row.original;
          if (!checkSupportive(files)) return;

          if (installedVersions.find((install) => version.includes(install)))
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
                      await window.Context.uninstallVersion(
                        version.slice(1),
                        version.includes(current)
                      );

                      const [currentVersion, versions] = await Promise.all([
                        window.Context.getCurrentVersion(),
                        window.Context.getInstalledNodeVersions(true)
                      ]);
                      setCurrent(currentVersion);
                      setInstalledVersions(versions);
                      toast.success(i18n("Tip-Uninstall", [version]));
                    }}
                  >
                    <CrossCircledIcon />
                    {i18n("Uninstall")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );

          return (
            <Button
              size="sm"
              variant="tag"
              icon={<DownloadIcon />}
              onClick={() => modal.current?.show(row.original)}
            >
              {i18n("Install")}
            </Button>
          );
        }
      }
    ];
  }, [locale, current, installedVersions.length, versions.length]);

  const statuses = useMemo(
    () => [
      {
        label: i18n("Installed"),
        value: "Installed",
        icon: MinusCircledIcon
      },
      {
        label: i18n("Supported"),
        value: "Supported",
        icon: CheckCircledIcon
      },
      {
        label: i18n("Not-Supported"),
        value: "UnSupported",
        icon: CrossCircledIcon
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
              const { version, files } = facetedRowModel.flatRows[i]!.original;

              let key: string | undefined;
              if (installedVersions.includes(version.slice(1))) key = "Installed";

              if (key === void 0 && checkSupportive(files)) key = "Supported";

              if (key === void 0) key = "UnSupported";

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
  }, [installedVersions.length]);

  const onPageReload = async () => {
    seLocaltLoading(true);
    try {
      const [versions, installeds, currentVersion] = await Promise.all([
        window.Context.getAllNodeVersions(),
        window.Context.getInstalledNodeVersions(),
        window.Context.getCurrentVersion(true)
      ]);
      setVersions(versions);
      setInstalledVersions(installeds);
      setCurrent(currentVersion);

      toast.success(i18n("Refresh-successful"));
    } catch (err) {
    } finally {
      seLocaltLoading(false);
    }
  };

  const onDataUpdate = async () => {
    setLoading(true);
    try {
      const [versions, installeds, currentVersion] = await Promise.all([
        window.Context.getAllNodeVersions({
          fetch: true
        }),
        window.Context.getInstalledNodeVersions(true),
        window.Context.getCurrentVersion(true)
      ]);
      setVersions(versions);
      setInstalledVersions(installeds);
      setCurrent(currentVersion);

      toast.success(i18n("Refresh-successful"));
    } catch (err) {
      toast.error(
        err.message
          ? err.message.split("Error invoking remote method 'all-node-versions': ").slice(-1)
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const onInstalledRefresh = async () => {
    const versions = await window.Context.getInstalledNodeVersions(true);
    setInstalledVersions(versions);
  };

  return (
    <>
      <div className="h-full flex flex-col space-y-2">
        <DataTable
          columns={columns}
          data={versions}
          loading={loading || localLoading}
          toolbar={(table) => (
            <div className="flex items-center gap-2">
              <DataTableToolbar table={table} options={statuses} />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={loading}
                  className="h-7 text-sm"
                  loading={localLoading}
                  icon={<ReloadIcon />}
                  onClick={onPageReload}
                >
                  {i18n("Page-Reload")}
                </Button>
                <Button
                  loading={loading}
                  size="sm"
                  className="h-7 text-sm"
                  icon={<UpdateIcon />}
                  onClick={onDataUpdate}
                >
                  {i18n("Data-Update")}
                </Button>
              </div>
            </div>
          )}
          getFacetedUniqueValues={getFacetedUniqueValues}
        />
      </div>
      <InfoModal ref={modal} onRefrresh={onInstalledRefresh} />
    </>
  );
};
