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
  SelectValue,
} from '@/components/ui';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import {
  MagnifyingGlassIcon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { GroupCreator } from './group-creator';

import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/app-context';
import {
  projectList,
  installedList,
  groupList,
  updateGroups,
} from '@/services/cmds';
import type { ColumnDef } from '@tanstack/react-table';

export async function loader() {
  const loadData = await Promise.all([
    projectList(),
    groupList(),
    installedList(),
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
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions
  );
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation();
  const { settings } = useAppContext();
  const { directory, locale } = settings;

  useEffect(() => {
    // window.Context.onRegistProjectUpdate(({ projects, groups, version }) => {
    //   setProjects(projects);
    //   groups && setGroups(groups);
    //   version && toast.success(t('Restart-Terminal', [`v${version}`]));
    // });
    // return () => {
    //   window.Context.onRegistProjectUpdate(null);
    // };
  }, []);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await installedList(true);
      setInstalledVersions(iVersions);
    };

    fetcher();
  }, [directory]);

  const columns: ColumnDef<Nvmd.Group>[] = useMemo(
    () => [
      {
        accessorKey: 'sort',
        maxSize: 50,
        enableHiding: false,
        header: () => null,
      },
      {
        accessorKey: 'name',
        header: t('Group-Name'),
        maxSize: 160,
        enableHiding: false,
      },
      {
        accessorKey: 'desc',
        header: t('Group-Desc'),
        enableHiding: false,
        cell: ({ getValue }) => {
          const desc = getValue() as string;
          return (
            <span className='max-w-52 inline-block truncate' title={desc}>
              {desc}
            </span>
          );
        },
      },
      {
        accessorKey: 'version',
        header: t('Version'),
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
                  toast.success(
                    t('Restart-Terminal', { version: `v${newVersion}` })
                  );
                } catch (err) {
                  toast.error(err);
                }
              }}
            >
              <SelectTrigger className='h-6'>
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
        },
      },
      {
        accessorKey: 'projects',
        header: t('Projects'),
        maxSize: 240,
        cell: ({ row }) => {
          const { name, projects: defaultProjects, version } = row.original;
          return (
            <MultiSelect
              defaultValue={defaultProjects}
              onValueChange={async (projectsPath) => {
                const needAddition =
                  projectsPath.length > defaultProjects.length;
                const [newProjects, newGroups] = await Promise.all([
                  (async () => {
                    let newProjects: Nvmd.Project[] = [];
                    // New addition
                    if (needAddition) {
                      newProjects =
                        await window.Context.updateProjectsWhenRemoveGroup(
                          projectsPath.filter(
                            (path) => !defaultProjects.includes(path)
                          ),
                          name,
                          version
                        );
                    }

                    // Need remove
                    if (projectsPath.length < defaultProjects.length) {
                      newProjects =
                        await window.Context.updateProjectsWhenRemoveGroup(
                          defaultProjects.filter(
                            (path) => !projectsPath.includes(path)
                          )
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
                    await updateGroups(newGroups);
                    return newGroups;
                  })(),
                ]);
                setProjects(newProjects);
                setGroups(newGroups);
              }}
            >
              <MultiSelectTrigger className='h-6'>
                <MultiSelectValue maxDisplay={2} maxItemLength={5} />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch
                  icon={<MagnifyingGlassIcon />}
                  placeholder={t('Input-To-Search')}
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
        },
      },
      {
        header: t('Operation'),
        maxSize: 120,
        enableHiding: false,
        cell: ({ row }) => {
          const { name, projects: groupProjects } = row.original;
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
                    {t('Group-Delete')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const [newProjects, newGroups] = await Promise.all([
                        (async () => {
                          const newProjects =
                            await window.Context.updateProjectsWhenRemoveGroup(
                              groupProjects
                            );
                          return newProjects;
                        })(),
                        (async () => {
                          const newGroups = [...groups].filter(
                            ({ name: groupName }) => name !== groupName
                          );
                          await updateGroups(newGroups);
                          return newGroups;
                        })(),
                      ]);
                      setProjects(newProjects);
                      setGroups(newGroups);
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

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setGroups((previous) => {
      previous.splice(
        targetRowIndex,
        0,
        previous.splice(draggedRowIndex, 1)[0]
      );

      const newGroups = [...previous];
      updateGroups(newGroups);

      return newGroups;
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

  const onSubmit = async (group: Nvmd.Group) => {
    const { projects: groupProjects, version, name } = group;
    const [newProjects, newGroups] = await Promise.all([
      // update projects
      (async () => {
        let needUpdate: boolean = false;
        if (groupProjects && groupProjects.length && version) {
          // Need to update the version of the project
          const newProjects = [...projects];
          newProjects.forEach((project) => {
            if (groupProjects.includes(project.path)) {
              needUpdate = true;
              project.version = name;
            }
          });
          console.log('newProjects', newProjects);
          if (needUpdate) {
            // todo update
          }

          return newProjects;
        }

        return Promise.resolve(undefined);
      })(),
      // update groups
      (async () => {
        // If the project is already in another group, you need to remove it from the group.
        if (projects && projects.length) {
          let needUpdate: boolean = false;
          const dGroups = [...groups];
          dGroups.forEach((group) => {
            const gProjects = [...group.projects];
            group.projects = gProjects.filter((project) => {
              const exist = groupProjects.includes(project);
              if (exist) needUpdate = true;
              return !groupProjects.includes(project);
            });
          });

          if (needUpdate) {
            const newGroups = [group, ...dGroups];
            await updateGroups(newGroups);
            return newGroups;
          }
        }

        return Promise.resolve(undefined);
      })(),
    ]);

    newProjects && setProjects(newProjects);
    newGroups && setGroups(newGroups);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='h-full flex flex-col space-y-2'>
        <DataDndTable
          key='page-groups-table'
          columns={columns}
          data={groups}
          loading={loading}
          toolbar={(table) => (
            <div className='flex items-center gap-2'>
              <DataTableToolbar
                key='page-groups-table-tool'
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

Component.displayName = 'Groups';
