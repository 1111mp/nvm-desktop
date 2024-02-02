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
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import { FilePlusIcon, ReloadIcon, TrashIcon } from "@radix-ui/react-icons";

import { useAppContext, useI18n } from "@src/renderer/src/app-context";
import type { ColumnDef } from "@tanstack/react-table";

export async function loader() {
  const versions = await Promise.all([
    window.Context.getProjects(),
    window.Context.getInstalledNodeVersions()
  ]);

  return versions;
}

export const Component: React.FC = () => {
  const [allProjects, allInstalledVersions] = useLoaderData() as [Nvmd.Project[], Array<string>];

  const [installedVersions, setInstalledVersions] = useState<string[]>(() => allInstalledVersions);
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [loading, setLoading] = useState<boolean>(false);

  const i18n = useI18n();
  const { directory, locale } = useAppContext();
  // const { message } = App.useApp();

  useEffect(() => {
    window.Context.onRegistProjectUpdate((pros, version) => {
      setProjects(pros);
      toast.success(i18n("Restart-Terminal", [`v${version}`]));
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
          <LabelCopyable className="max-w-[360px] inline-block truncate">
            {row.original.path}
          </LabelCopyable>
        )
      },
      {
        accessorKey: "version",
        header: i18n("Version"),
        maxSize: 170,
        cell: ({ row }) => {
          const { version, path } = row.original;
          return (
            <Select
              defaultValue={version}
              onValueChange={async (newVersion) => {
                try {
                  const code = await window.Context.syncProjectVersion(path, newVersion || "");

                  const newProjects = projects.map((project) =>
                    project.path === path
                      ? {
                          ...project,
                          version: newVersion ? newVersion : "",
                          active: code === 200 ? true : false,
                          updateAt: new Date().toISOString()
                        }
                      : project
                  );

                  setProjects(newProjects);
                  window.Context.updateProjects(newProjects);
                  code === 200
                    ? toast.success(i18n("Restart-Terminal", [`v${newVersion}`]))
                    : toast.error(`Project not found, please check it`);
                } catch (err) {
                  toast.error("Something went wrong");
                }
              }}
            >
              <SelectTrigger className="h-6 w-36">
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
        header: i18n("Operation"),
        maxSize: 120,
        cell: ({ row }) => {
          const { name, path } = row.original;
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
                    onClick={() => {
                      const newProjects = projects.filter(({ path: source }) => source !== path);

                      setProjects(newProjects);
                      window.Context.updateProjects(newProjects, path);
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
    [locale, projects, installedVersions.length]
  );

  const onAddProject = async () => {
    const { canceled, filePaths, version } = await window.Context.openFolderSelecter({
      title: i18n("Project-Select"),
      project: true
    });
    if (canceled) return;
    const [path] = filePaths;

    if (projects.find(({ path: source }) => source === path)) {
      return toast.error("The project already exists");
    }

    const pathArr = path.split(window.Context.platform === "win32" ? "\\" : "/");
    const now = new Date().toISOString();
    const project: Nvmd.Project = {
      name: pathArr[pathArr.length - 1],
      path,
      version,
      active: true,
      createAt: now,
      updateAt: now
    };
    const newProjects = [project, ...projects];
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
      const [allProjects, installedVersions] = await Promise.all([
        window.Context.getProjects(true),
        window.Context.getInstalledNodeVersions()
      ]);

      setProjects(allProjects);
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
                <Button size="sm" loading={loading} icon={<ReloadIcon />} onClick={onPageReload}>
                  Page Reload
                </Button>
                <Button size="sm" icon={<FilePlusIcon />} onClick={onAddProject}>
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
