import { useMemo, useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  DataDndTable,
  DataTableToolbar,
  LabelCopyable,
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import { MagnifyingGlassIcon, ReloadIcon, TrashIcon } from "@radix-ui/react-icons";

import { useAppContext, useI18n } from "@renderer/app-context";
import { cn } from "@renderer/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { GroupCreator } from "./group-creator";

export async function loader() {
  const loadData = await Promise.all([
    window.Context.getProjects(),
    window.Context.getGroups(),
    window.Context.getInstalledNodeVersions()
  ]);

  return loadData;
}

export const Component: React.FC = () => {
  const [allProjects, allGroups, allInstalledVersions] = useLoaderData() as [
    Nvmd.Project[],
    Nvmd.Group[],
    Array<string>
  ];

  const [groups, setGroups] = useState<Nvmd.Group[]>(() => allGroups);
  const [installedVersions, setInstalledVersions] = useState<string[]>(() => allInstalledVersions);
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [loading, setLoading] = useState<boolean>(false);

  const i18n = useI18n();
  const { directory, locale } = useAppContext();

  useEffect(() => {
    window.Context.onRegistProjectUpdate((pros, version) => {
      setProjects(pros);
      version && toast.success(i18n("Restart-Terminal", [`v${version}`]));
    });

    return () => {
      window.Context.onRegistProjectUpdate(null);
    };
  }, []);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await window.Context.getInstalledNodeVersions(true);
      setInstalledVersions(iVersions);
    };

    fetcher();
  }, [directory]);

  const columns: ColumnDef<Nvmd.Group>[] = useMemo(
    () => [
      {
        accessorKey: "sort",
        maxSize: 50,
        enableHiding: false,
        header: () => null
      },
      {
        accessorKey: "name",
        header: i18n("Group-Name"),
        maxSize: 160,
        enableHiding: false
      },
      {
        accessorKey: "desc",
        header: i18n("Group-Desc"),
        enableHiding: false,
        cell: ({ getValue }) => {
          const desc = getValue() as string;
          return (
            <span className="max-w-52 inline-block truncate" title={desc}>
              {desc}
            </span>
          );
        }
      },
      {
        accessorKey: "version",
        header: i18n("Version"),
        maxSize: 170,
        cell: ({ row }) => {
          const { version } = row.original;
          return (
            <Select
              defaultValue={version}
              onValueChange={async (newVersion) => {
                try {
                  const newGroups = await window.Context.onGroupUpdateVersion(
                    row.original,
                    newVersion
                  );

                  setGroups(newGroups);
                  toast.success(i18n("Restart-Terminal", [`v${newVersion}`]));
                } catch (err) {
                  toast.error(
                    err.message
                      ? err.message
                          .split("Error invoking remote method 'group-update-version': ")
                          .slice(-1)
                      : "Something went wrong"
                  );
                }
              }}
            >
              <SelectTrigger className="h-6">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {installedVersions.map((version) => (
                  <SelectItem key={version} value={version}>
                    v{version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
      },
      {
        accessorKey: "projects",
        header: i18n("Projects"),
        maxSize: 240,
        cell: ({ row }) => {
          const { name, projects: defaultProjects, version } = row.original;
          return (
            <MultiSelect
              defaultValue={defaultProjects}
              onValueChange={async (projectsPath) => {
                const needAddition = projectsPath.length > defaultProjects.length;
                const [newProjects, newGroups] = await Promise.all([
                  (async () => {
                    let newProjects: Nvmd.Project[] = [];
                    // New addition
                    if (needAddition) {
                      newProjects = await window.Context.updateProjectsWhenRemoveGroup(
                        projectsPath.filter((path) => !defaultProjects.includes(path)),
                        name,
                        version
                      );
                    }

                    // Need remove
                    if (projectsPath.length < defaultProjects.length) {
                      newProjects = await window.Context.updateProjectsWhenRemoveGroup(
                        defaultProjects.filter((path) => !projectsPath.includes(path))
                      );
                    }

                    return newProjects;
                  })(),
                  (async () => {
                    const newGroups = [...groups];
                    newGroups.forEach((group) => {
                      // If the project is already in other groups, you need to remove it from the original group.
                      const repeatProjects = group.projects.filter((path) =>
                        projectsPath.includes(path)
                      );
                      if (needAddition && repeatProjects.length) {
                        const groupProjects = [...group.projects];
                        group.projects = groupProjects.filter(
                          (path) => !repeatProjects.includes(path)
                        );
                      }

                      if (group.name === name) {
                        group.projects = projectsPath;
                      }
                    });
                    await window.Context.onGroupUpdate(newGroups);
                    return newGroups;
                  })()
                ]);
                setProjects(newProjects);
                setGroups(newGroups);
              }}
            >
              <MultiSelectTrigger className="h-6">
                <MultiSelectValue maxDisplay={2} maxItemLength={5} />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch
                  icon={<MagnifyingGlassIcon />}
                  placeholder={i18n("Input-To-Search")}
                />
                <MultiSelectList>
                  {projects.map(({ name, path }) => (
                    <MultiSelectItem key={path} value={path}>
                      {name}
                    </MultiSelectItem>
                  ))}
                </MultiSelectList>
              </MultiSelectContent>
            </MultiSelect>
          );
        }
      },
      {
        header: i18n("Operation"),
        maxSize: 120,
        enableHiding: false,
        cell: ({ row }) => {
          const { name, projects: groupProjects } = row.original;
          return (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="tag">
                  <TrashIcon />
                  {i18n("Remove")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{name}</AlertDialogTitle>
                  <AlertDialogDescription>{i18n("Group-Delete")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{i18n("Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const [newProjects, newGroups] = await Promise.all([
                        (async () => {
                          const newProjects =
                            await window.Context.updateProjectsWhenRemoveGroup(groupProjects);
                          return newProjects;
                        })(),
                        (async () => {
                          const newGroups = [...groups].filter(
                            ({ name: groupName }) => name !== groupName
                          );
                          await window.Context.onGroupUpdate(newGroups);
                          return newGroups;
                        })()
                      ]);
                      setProjects(newProjects);
                      setGroups(newGroups);
                    }}
                  >
                    {i18n("OK")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        }
      }
    ],
    [locale, projects, installedVersions.length, groups.length]
  );

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setGroups((previous) => {
      previous.splice(targetRowIndex, 0, previous.splice(draggedRowIndex, 1)[0]);

      const newGroups = [...previous];
      window.Context.onGroupUpdate(newGroups);

      return newGroups;
    });
  };

  const onPageReload = async () => {
    setLoading(true);
    try {
      const [allProjects, allGroups, installedVersions] = await Promise.all([
        window.Context.getProjects(true),
        window.Context.getGroups(true),
        window.Context.getInstalledNodeVersions()
      ]);

      setProjects(allProjects);
      setGroups(allGroups);
      setInstalledVersions(installedVersions);
      toast.success(i18n("Refresh-successful"));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    const newGroups = await window.Context.getGroups();
    setGroups(newGroups);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col space-y-2">
        <DataDndTable
          key="page-groups-table"
          columns={columns}
          data={groups}
          loading={loading}
          toolbar={(table) => (
            <div className="flex items-center gap-2">
              <DataTableToolbar
                key="page-groups-table-tool"
                table={table}
                filterName="name"
                status={false}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-sm"
                  loading={loading}
                  icon={<ReloadIcon />}
                  onClick={onPageReload}
                >
                  {i18n("Page-Reload")}
                </Button>
                <GroupCreator
                  projects={projects}
                  groups={groups}
                  versions={installedVersions}
                  onSubmit={onSubmit}
                />
              </div>
            </div>
          )}
          reorderRow={reorderRow}
        />
      </div>
    </DndProvider>
  );
};

Component.displayName = "Groups";
