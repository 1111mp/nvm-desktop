import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  DataDndTable,
  type DataTableFeatures,
  DataTableToolbar,
  LabelCopyable,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { VsCodeLogo } from '@/components/vscode-logo';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { FolderSync, PackagePlus, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router';
import { toast } from 'sonner';

import { useAppContext } from '@/app-context';
import { cn } from '@/lib/utils';
import { getCurrent } from '@/services/api';
import {
  addProjects,
  groupList,
  installedList,
  openDir,
  openWithVSCode,
  projectList,
  syncProjectVersion,
  updateGroups,
  updateProjects,
  updateProjectsWithoutTray,
} from '@/services/cmds';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

export async function loader() {
  const versions = await Promise.all([
    projectList(),
    groupList(),
    installedList(),
  ]);

  return versions;
}

export const Component: React.FC = () => {
  const [allProjects, allGroups, allInstalledVersions] =
    useLoaderData<[Nvmd.Project[], Nvmd.Group[], Array<string>]>();

  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [groups, setGroups] = useState<Nvmd.Group[]>(() => allGroups);
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation();
  const { settings } = useAppContext();
  const { directory } = settings;

  useEffect(() => {
    const current = getCurrent();
    const projectListener = current.listen<string>(
      'nvm-desktop://refresh-project-info',
      async ({ payload }) => {
        const [projects, groups] = await Promise.all([
          projectList(),
          groupList(),
        ]);
        setProjects(projects);
        setGroups(groups);
        if (payload)
          toast.success(t('Restart-Terminal', { version: `v${payload}` }));
      },
    );

    const versionListener = current.listen<string>(
      'nvm-desktop://refresh-version-info',
      async () => {
        const installed = await installedList();
        setProjects([...projects]);
        setInstalledVersions([...installed]);
      },
    );

    return () => {
      projectListener.then((fn) => fn());
      versionListener.then((fn) => fn());
    };
  }, [t, projects]);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await installedList();
      setInstalledVersions(iVersions);
    };

    fetcher();
  }, [directory]);

  const columns: ColumnDef<DataTableFeatures, Nvmd.Project>[] = [
    {
      accessorKey: 'name',
      header: t('Project-Name'),
      maxSize: 240,
      enableHiding: false,
      meta: {
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { name } = row.original;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='truncate'>{name}</span>
            </TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'path',
      header: t('Project-Path'),
      enableHiding: false,
      meta: {
        className: 'flex items-center text-muted-foreground',
      },
      cell: ({ row }) => {
        const path = row.original.path;
        return (
          <div className='flex items-center gap-1'>
            <LabelCopyable
              rootClassName='flex'
              className={cn(
                'max-w-77.5 xl:max-w-125 2xl:max-w-200 leading-6 inline-block truncate cursor-pointer hover:text-primary',
                {
                  'line-through': !row.original.active,
                },
              )}
              title={path}
              onClick={async () => {
                if (!row.original.active) return;
                try {
                  await openDir(path);
                } catch {
                  toast.error(t('Invalid-project-path'));
                }
              }}
            >
              {path}
            </LabelCopyable>
            <Tooltip>
              <TooltipTrigger asChild>
                <VsCodeLogo
                  onClick={async () => {
                    try {
                      await openWithVSCode(path);
                    } catch {
                      toast.error(t('VSCode-code-command-not-found'));
                    }
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{t('open-with-vscode')}</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
    {
      accessorKey: 'version',
      header: t('Version'),
      meta: {
        label: t('Version'),
      },
      maxSize: 200,
      cell: ({ row }) => {
        const { version, path } = row.original;
        return (
          <Select
            defaultValue={version ?? ''}
            onValueChange={async (newVersion) => {
              // fromGroup: whether to switch from group, need to remove
              // toGroup: whether to switch to group, need to add
              const fromGroup = groups.find(({ name }) => name === version),
                toGroup = groups.find(({ name }) => name === newVersion);
              try {
                const targetVersion = toGroup
                  ? toGroup.version
                  : newVersion || '';
                const code = await syncProjectVersion(path, targetVersion);

                const needUpdateGroups = [...groups];
                let needUpdate: boolean = false;
                needUpdateGroups.forEach((group) => {
                  const groupProjects = [...group.projects];
                  if (fromGroup && group.name === version) {
                    needUpdate = true;
                    group.projects = groupProjects.filter(
                      (project) => project !== path,
                    );
                  }

                  if (toGroup && group.name === newVersion) {
                    needUpdate = true;
                    group.projects = [path].concat(groupProjects);
                  }
                });

                const updateProjectsPromise = async () => {
                  const newProjects = projects.map((project) =>
                    project.path === path
                      ? {
                          ...project,
                          version: toGroup
                            ? toGroup.name
                            : newVersion
                              ? newVersion
                              : '',
                          active: code === 200 ? true : false,
                          updateAt: new Date().toISOString(),
                        }
                      : project,
                  );
                  if (needUpdate) {
                    await updateProjectsWithoutTray(newProjects);
                  } else {
                    await updateProjects(newProjects);
                  }

                  return newProjects;
                };

                const updateGroupsPromise = async () => {
                  if (!needUpdate) return Promise.resolve(undefined);

                  await updateGroups(needUpdateGroups);
                  return needUpdateGroups;
                };

                const [newProjects, newGroups] = await Promise.all([
                  updateProjectsPromise(),
                  updateGroupsPromise(),
                ]);

                setProjects(newProjects);
                if (newGroups) setGroups(newGroups);

                if (code === 200)
                  toast.success(
                    t('Restart-Terminal', { version: `v${targetVersion}` }),
                  );
                else toast.error(`Project not found, please check it`);
              } catch {
                toast.error('Something went wrong');
              }
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select version' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className='text-muted-foreground'>
                  {t('Versions')}
                </SelectLabel>
                {installedVersions.map((version) => (
                  <SelectItem key={version} value={version}>
                    v{version}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className='text-muted-foreground'>
                  {t('Groups')}
                </SelectLabel>
                {groups.map(({ name, desc }) => (
                  <SelectItem
                    key={name}
                    value={name}
                    title={`${name} (${desc})`}
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      header: t('Operation'),
      maxSize: 120,
      meta: {
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { name, path, version } = row.original;
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size='xs' variant='destructive'>
                <TrashIcon />
                {t('Remove')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className='top-1/3' size='sm'>
              <AlertDialogHeader>
                <AlertDialogMedia className='bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'>
                  <TrashIcon />
                </AlertDialogMedia>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('Project-Delete')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant='outline'>
                  {t('Cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant='destructive'
                  onClick={async () => {
                    const needUpdateGroups = [...groups];
                    let needUpdate: boolean = false;
                    needUpdateGroups.forEach((group) => {
                      if (group.name === version) {
                        needUpdate = true;
                        const projects = [...group.projects];
                        group.projects = projects.filter(
                          (proPath) => proPath !== path,
                        );
                      }
                    });

                    const [newProjects, newGroups] = await Promise.all([
                      (async () => {
                        const newProjects = projects.filter(
                          ({ path: source }) => source !== path,
                        );
                        if (needUpdate) {
                          await updateProjectsWithoutTray(newProjects, path);
                        } else {
                          await updateProjects(newProjects, path);
                        }
                        return newProjects;
                      })(),
                      (async () => {
                        if (needUpdate) await updateGroups(needUpdateGroups);
                        return needUpdate ? needUpdateGroups : undefined;
                      })(),
                    ]);
                    setProjects(newProjects);
                    if (newGroups) setGroups(newGroups);
                  }}
                >
                  {t('OK')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

  const dataIds: UniqueIdentifier[] = projects?.map(({ path }) => path);

  // add project (multiple)
  const onAddProject = async () => {
    const paths = await openDialog({
      title: t('Add-Project'),
      directory: true,
      multiple: true,
    });
    if (paths === null) return;

    const needAddProjects: Nvmd.Project[] = paths.map((path) => {
      const name = path.split(OS_PLATFORM === 'win32' ? '\\' : '/').pop()!,
        now = new Date().toISOString();

      return {
        name,
        path,
        // version,
        active: true,
        createAt: now,
        updateAt: now,
      };
    });

    try {
      await addProjects(needAddProjects);
    } catch (err) {
      toast.error(err);
    }
    // refresh data
    const allProjects = await projectList();
    setProjects(allProjects);
  };

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setProjects((previous) => {
      const newProject = [...previous];
      const [draggedProject] = newProject.splice(draggedRowIndex, 1);
      if (!draggedProject) return previous;

      newProject.splice(targetRowIndex, 0, draggedProject);
      updateProjects(newProject);

      return newProject;
    });
  };

  const onPageReload = async () => {
    setLoading(true);
    try {
      const [allProjects, allGroups, installedVersions] = await Promise.all([
        projectList(true),
        groupList(true),
        installedList(),
      ]);
      setProjects(allProjects);
      setGroups(allGroups);
      setInstalledVersions(installedVersions);
      toast.success(t('Refresh-successful'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-full flex flex-col space-y-2'>
      <DataDndTable
        columns={columns}
        data={projects}
        items={dataIds}
        loading={loading}
        toolbar={(table) => (
          <div className='flex items-center gap-2'>
            <DataTableToolbar
              table={table}
              filterName='Project-Name'
              status={false}
            />
            <div className='flex items-center gap-2'>
              <Button size='sm' disabled={loading} onClick={onPageReload}>
                <FolderSync />
                {t('Page-Reload')}
              </Button>
              <Button size='sm' disabled={loading} onClick={onAddProject}>
                <PackagePlus />
                {t('Add-Project')}
              </Button>
            </div>
          </div>
        )}
        getRowId={(row) => row.path}
        reorderRow={reorderRow}
      />
    </div>
  );
};

Component.displayName = 'Projects';
