import { useMemo, useState, useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';

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
  SelectValue,
} from '@/components/ui';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FilePlusIcon, ReloadIcon, TrashIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useAppContext } from '@/app-context';
import { useTranslation } from 'react-i18next';
import {
  selectProjects,
  groupList,
  installedList,
  projectList,
  updateGroups,
  updateProjects,
  syncProjectVersion,
} from '@/services/cmds';
import { getCurrent } from '@/services/api';
import type { ColumnDef } from '@tanstack/react-table';

export async function loader() {
  const versions = await Promise.all([
    projectList(),
    groupList(),
    installedList(),
  ]);

  return versions;
}

export const Component: React.FC = () => {
  const [allProjects, allGroups, allInstalledVersions] = useLoaderData() as [
    Nvmd.Project[],
    Nvmd.Group[],
    Array<string>
  ];

  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions
  );
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [groups, setGroups] = useState<Nvmd.Group[]>(() => allGroups);
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation();
  const { settings } = useAppContext();
  const { directory, locale } = settings;

  useEffect(() => {
    const unlisted = getCurrent().listen<string>(
      'call-projects-update',
      async ({ payload }) => {
        const [projects, groups] = await Promise.all([
          projectList(),
          groupList(),
        ]);
        setProjects(projects);
        setGroups(groups);
        payload &&
          toast.success(t('Restart-Terminal', { version: `v${payload}` }));
      }
    );

    return () => {
      unlisted.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await installedList(true);
      setInstalledVersions(iVersions);
    };

    fetcher();
  }, [directory]);

  const columns: ColumnDef<Nvmd.Project>[] = useMemo(
    () => [
      {
        accessorKey: 'sort',
        maxSize: 50,
        enableHiding: false,
        header: () => null,
      },
      {
        accessorKey: 'name',
        header: t('Project-Name'),
        maxSize: 240,
        enableHiding: false,
      },
      {
        accessorKey: 'path',
        header: t('Project-Path'),
        enableHiding: false,
        cell: ({ row }) => (
          <span className='flex items-center gap-1'>
            <LabelCopyable
              asChild
              className={cn('max-w-[330px] leading-6 inline-block truncate', {
                'line-through': !row.original.active,
              })}
              title={row.original.path}
            >
              {row.original.path}
            </LabelCopyable>
          </span>
        ),
      },
      {
        accessorKey: 'version',
        header: t('Version'),
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
                  const targetVersion = toGroup
                    ? toGroup.version
                    : newVersion || '';
                  const code = await syncProjectVersion(path, targetVersion);

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
                        : project
                    );
                    await updateProjects(newProjects);

                    return newProjects;
                  };

                  const updateGroupsPromise = async () => {
                    const newGroups = [...groups];
                    let needUpdate: boolean = false;
                    newGroups.forEach((group) => {
                      const groupProjects = [...group.projects];
                      if (fromGroup && group.name === version) {
                        needUpdate = true;
                        group.projects = groupProjects.filter(
                          (project) => project !== path
                        );
                      }

                      if (toGroup && group.name === newVersion) {
                        needUpdate = true;
                        group.projects = [path].concat(groupProjects);
                      }
                    });

                    if (!needUpdate) return Promise.resolve(undefined);

                    await updateGroups(newGroups);
                    return newGroups;
                  };

                  const [newProjects, newGroups] = await Promise.all([
                    updateProjectsPromise(),
                    updateGroupsPromise(),
                  ]);

                  setProjects(newProjects);
                  newGroups && setGroups(newGroups);
                  code === 200
                    ? toast.success(
                        t('Restart-Terminal', { version: `v${targetVersion}` })
                      )
                    : toast.error(`Project not found, please check it`);
                } catch (err) {
                  toast.error('Something went wrong');
                }
              }}
            >
              <SelectTrigger className='h-6'>
                <SelectValue />
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
        cell: ({ row }) => {
          const { name, path, version } = row.original;
          return (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size='sm' variant='tag'>
                  <TrashIcon />
                  {t('Remove')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{name}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('Project-Delete')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const [newProjects, newGroups] = await Promise.all([
                        (async () => {
                          const newProjects = projects.filter(
                            ({ path: source }) => source !== path
                          );
                          await updateProjects(newProjects, path);
                          return newProjects;
                        })(),
                        (async () => {
                          const newGroups = [...groups];
                          let needUpdate: boolean = false;
                          newGroups.forEach((group) => {
                            if (group.name === version) {
                              needUpdate = true;
                              const projects = [...group.projects];
                              group.projects = projects.filter(
                                (proPath) => proPath !== path
                              );
                            }
                          });
                          needUpdate && (await updateGroups(newGroups));
                          return needUpdate ? newGroups : undefined;
                        })(),
                      ]);
                      setProjects(newProjects);
                      newGroups && setGroups(newGroups);
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
    ],
    [locale, projects, installedVersions.length, groups.length]
  );

  // add project (multiple)
  const onAddProject = async () => {
    const pInfo = await selectProjects();
    if (!pInfo) return;

    const addedProjects: Nvmd.Project[] = [];
    pInfo.forEach(({ path, version }) => {
      const name = path.split(OS_PLATFORM === 'win32' ? '\\' : '/').pop()!,
        now = new Date().toISOString();

      if (!projects.find(({ path: source }) => source === path)) {
        addedProjects.push({
          name,
          path,
          version,
          active: true,
          createAt: now,
          updateAt: now,
        });
      } else {
        toast.error(`The project "${name}" already exists`);
      }
    });

    const newProjects = [...addedProjects, ...projects];
    setProjects(newProjects);
    updateProjects(newProjects);
    return;
  };

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setProjects((previous) => {
      previous.splice(
        targetRowIndex,
        0,
        previous.splice(draggedRowIndex, 1)[0]
      );

      const newProject = [...previous];
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
    <DndProvider backend={HTML5Backend}>
      <div className='h-full flex flex-col space-y-2'>
        <DataDndTable
          columns={columns}
          data={projects}
          loading={loading}
          toolbar={(table) => (
            <div className='flex items-center gap-2'>
              <DataTableToolbar
                table={table}
                filterName='name'
                status={false}
              />
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  className='h-7 text-sm'
                  loading={loading}
                  icon={<ReloadIcon />}
                  onClick={onPageReload}
                >
                  {t('Page-Reload')}
                </Button>
                <Button
                  size='sm'
                  className='h-7 text-sm'
                  icon={<FilePlusIcon />}
                  onClick={onAddProject}
                >
                  {t('Add-Project')}
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

Component.displayName = 'Projects';
