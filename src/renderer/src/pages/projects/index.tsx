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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import { FilePlusIcon, ReloadIcon, TrashIcon } from "@radix-ui/react-icons";

import { useAppContext, useI18n } from "@src/renderer/src/app-context";
import { cn } from "@renderer/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

export async function loader() {
  const versions = await Promise.all([
    window.Context.getProjects(),
    window.Context.getGroups(),
    window.Context.getInstalledNodeVersions()
  ]);

  return versions;
}

export const Component: React.FC = () => {
  const [allProjects, allGroups, allInstalledVersions] = useLoaderData() as [
    Nvmd.Project[],
    Nvmd.Group[],
    Array<string>
  ];

  const [installedVersions, setInstalledVersions] = useState<string[]>(() => allInstalledVersions);
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [groups, setGroups] = useState<Nvmd.Group[]>(() => allGroups);
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

  const columns: ColumnDef<Nvmd.Project>[] = useMemo(
    () => [
      {
        accessorKey: "sort",
        maxSize: 50,
        enableHiding: false,
        header: () => null
      },
      {
        accessorKey: "name",
        header: i18n("Project-Name"),
        maxSize: 240,
        enableHiding: false
      },
      {
        accessorKey: "path",
        header: i18n("Project-Path"),
        enableHiding: false,
        cell: ({ row }) => (
          <span className="flex items-center gap-1">
            <LabelCopyable
              asChild
              className={cn("max-w-[360px] leading-6 inline-block truncate", {
                "line-through": !row.original.active
              })}
              title={row.original.path}
            >
              {row.original.path}
            </LabelCopyable>
          </span>
        )
      },
      {
        accessorKey: "version",
        header: i18n("Version"),
        maxSize: 200,
        cell: ({ row }) => {
          const { version, path } = row.original;
          return (
            <Select
              defaultValue={version}
              onValueChange={async (newVersion) => {
                // fromGroup: whether to switch from group, need to remove
                // toGroup: whether to switch to group, need to add
                const fromGroup = groups.find(({ name }) => name === version),
                  toGroup = groups.find(({ name }) => name === newVersion);
                try {
                  const targetVersion = toGroup ? toGroup.version : newVersion || "";
                  const code = await window.Context.syncProjectVersion(path, targetVersion);

                  const updateProjects = async () => {
                    const newProjects = projects.map((project) =>
                      project.path === path
                        ? {
                            ...project,
                            version: toGroup ? toGroup.name : newVersion ? newVersion : "",
                            active: code === 200 ? true : false,
                            updateAt: new Date().toISOString()
                          }
                        : project
                    );
                    await window.Context.updateProjects(newProjects);

                    return newProjects;
                  };

                  const updateGroups = async () => {
                    const newGroups = [...groups];
                    newGroups.forEach((group) => {
                      const groupProjects = [...group.projects];
                      if (fromGroup && group.name === version) {
                        group.projects = groupProjects.filter((project) => project !== path);
                      }

                      if (toGroup && group.name === newVersion) {
                        group.projects = [path].concat(groupProjects);
                      }
                    });
                    await window.Context.onGroupUpdate(newGroups);

                    return newGroups;
                  };

                  const [newProjects, newGroups] = await Promise.all([
                    updateProjects(),
                    updateGroups()
                  ]);

                  setProjects(newProjects);
                  setGroups(newGroups);
                  code === 200
                    ? toast.success(i18n("Restart-Terminal", [`v${targetVersion}`]))
                    : toast.error(`Project not found, please check it`);
                } catch (err) {
                  toast.error("Something went wrong");
                }
              }}
            >
              <SelectTrigger className="h-6">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-muted-foreground">{i18n("Versions")}</SelectLabel>
                  {installedVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      v{version}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-muted-foreground">{i18n("Groups")}</SelectLabel>
                  {groups.map(({ name, desc }) => (
                    <SelectItem key={name} value={name} title={`${name} (${desc})`}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          );
        }
      },
      {
        header: i18n("Operation"),
        maxSize: 120,
        cell: ({ row }) => {
          const { name, path, version } = row.original;
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
                  <AlertDialogDescription>{i18n("Project-Delete")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{i18n("Cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const [newProjects, newGroups] = await Promise.all([
                        (async () => {
                          const newProjects = projects.filter(
                            ({ path: source }) => source !== path
                          );
                          await window.Context.updateProjects(newProjects, path);
                          return newProjects;
                        })(),
                        (async () => {
                          const newGroups = [...groups];
                          let needUpdate: boolean = false;
                          newGroups.forEach((group) => {
                            if (group.name === version) {
                              needUpdate = true;
                              const projects = [...group.projects];
                              group.projects = projects.filter((proPath) => proPath !== path);
                            }
                          });
                          needUpdate && (await window.Context.onGroupUpdate(newGroups));
                          return needUpdate ? newGroups : undefined;
                        })()
                      ]);
                      setProjects(newProjects);
                      newGroups && setGroups(newGroups);
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

  const onAddProject = async () => {
    const {
      canceled,
      filePaths,
      versions = []
    } = await window.Context.openFolderSelecter({
      title: i18n("Project-Select"),
      multiple: true,
      project: true
    });
    if (canceled) return;

    const addProjects: Nvmd.Project[] = [];

    filePaths.forEach((path, index) => {
      const pathArr = path.split(window.Context.platform === "win32" ? "\\" : "/"),
        name = pathArr[pathArr.length - 1],
        now = new Date().toISOString();

      if (!projects.find(({ path: source }) => source === path)) {
        addProjects.push({
          name,
          path,
          version: versions[index],
          active: true,
          createAt: now,
          updateAt: now
        });
      } else {
        toast.error(`The project "${name}" already exists`);
      }
    });

    const newProjects = [...addProjects, ...projects];
    setProjects(newProjects);
    window.Context.updateProjects(newProjects);
    return;
  };

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setProjects((previous) => {
      previous.splice(targetRowIndex, 0, previous.splice(draggedRowIndex, 1)[0]);

      const newProject = [...previous];
      window.Context.updateProjects(newProject);

      return newProject;
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col space-y-2">
        <DataDndTable
          columns={columns}
          data={projects}
          loading={loading}
          toolbar={(table) => (
            <div className="flex items-center gap-2">
              <DataTableToolbar table={table} filterName="name" status={false} />
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
                <Button
                  size="sm"
                  className="h-7 text-sm"
                  icon={<FilePlusIcon />}
                  onClick={onAddProject}
                >
                  {i18n("Add-Project")}
                </Button>
              </div>
            </div>
          )}
          reorderRow={reorderRow}
        />
      </div>
    </DndProvider>
  );
};

Component.displayName = "Projects";
