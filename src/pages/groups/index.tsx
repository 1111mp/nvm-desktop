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
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  DataDndTable,
  DataTableToolbar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useComboboxAnchor,
  type DataTableFeatures,
} from '@/components/ui';
import { FolderSync, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router';
import { toast } from 'sonner';
import { GroupCreator } from './group-creator';

import { useAppContext } from '@/app-context';
import { compareArray } from '@/lib/utils';
import { getCurrent } from '@/services/api';
import {
  batchUpdateProjectVersion,
  groupList,
  installedList,
  projectList,
  updateGroups,
  updateGroupVersion,
  updateProjectsWithoutTray,
} from '@/services/cmds';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

const columnHelper = createColumnHelper<DataTableFeatures, Nvmd.Group>();

export async function loader() {
  const loadData = await Promise.all([
    projectList(),
    groupList(),
    installedList(),
  ]);

  return loadData;
}

export const Component: React.FC = () => {
  const [allProjects, allGroups, allInstalledVersions] =
    useLoaderData<[Nvmd.Project[], Nvmd.Group[], Array<string>]>();

  const [groups, setGroups] = useState<Nvmd.Group[]>(() => allGroups);
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
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
        if (groups) setGroups(groups);
        if (payload)
          toast.success(t('Restart-Terminal', { version: `v${payload}` }));
      },
    );

    const versionListener = current.listen<string>(
      'nvm-desktop://refresh-version-info',
      async () => {
        const installed = await installedList();
        setGroups([...groups]);
        setInstalledVersions([...installed]);
      },
    );

    return () => {
      projectListener.then((fn) => fn());
      versionListener.then((fn) => fn());
    };
  }, [t, groups]);

  useEffect(() => {
    const fetcher = async () => {
      const iVersions = await installedList();
      setInstalledVersions(iVersions);
    };

    fetcher();
  }, [directory]);

  const columns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: t('Group-Name'),
      maxSize: 160,
      enableHiding: false,
      meta: {
        className: 'flex items-center',
      },
    }),
    columnHelper.accessor('desc', {
      header: t('Group-Desc'),
      meta: {
        className: 'flex items-center text-muted-foreground',
      },
      enableHiding: false,
      cell: ({ getValue }) => {
        const desc = getValue() as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className='max-w-52 xl:max-w-100 2xl:max-w-150 inline-block truncate'
                title={desc}
              >
                {desc}
              </span>
            </TooltipTrigger>
            <TooltipContent className='max-w-2xl'>{desc}</TooltipContent>
          </Tooltip>
        );
      },
    }),
    columnHelper.accessor('version', {
      header: t('Version'),
      meta: {
        label: t('Version'),
      },
      maxSize: 170,
      cell: ({ row }) => {
        const { projects, name, version } = row.original;
        return (
          <Select
            defaultValue={version}
            onValueChange={async (newVersion) => {
              try {
                const newGroups = [...groups];
                newGroups[row.index].version = newVersion;
                await Promise.all([
                  updateGroupVersion(name, newVersion),
                  batchUpdateProjectVersion(projects, newVersion),
                ]);

                setGroups(newGroups);
                toast.success(
                  t('Restart-Terminal', { version: `v${newVersion}` }),
                );
              } catch (err) {
                toast.error(err);
              }
            }}
          >
            <SelectTrigger className='w-full'>
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
    }),
    columnHelper.accessor('projects', {
      header: t('Projects'),
      meta: {
        label: t('Projects'),
      },
      maxSize: 240,
      cell: ({ row }) => {
        const { name, projects: defaultProjects, version } = row.original;
        return (
          <MultiSelectProject
            value={defaultProjects}
            name={name}
            version={version}
            projects={projects}
            groups={groups}
            onSubmit={(newProjects, newGroups) => {
              setProjects(newProjects);
              setGroups(newGroups);
            }}
          />
        );
      },
    }),
    columnHelper.accessor(() => undefined, {
      header: t('Operation'),
      maxSize: 120,
      enableHiding: false,
      meta: {
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { name, projects: groupProjects } = row.original;
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
                  {t('Group-Delete')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant='outline'>
                  {t('Cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant='destructive'
                  onClick={async () => {
                    const [newProjects, newGroups] = await Promise.all([
                      (async () => {
                        const newProjects = [...projects];
                        newProjects.forEach((project) => {
                          if (groupProjects.includes(project.path)) {
                            project.version = '';
                          }
                        });

                        await Promise.all([
                          batchUpdateProjectVersion(groupProjects, ''),
                          updateProjectsWithoutTray(newProjects),
                        ]);

                        return newProjects;
                      })(),
                      (async () => {
                        const newGroups = [...groups].filter(
                          ({ name: groupName }) => name !== groupName,
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
    }),
  ]);

  const dataIds: UniqueIdentifier[] = groups?.map(({ name }) => name);

  const reorderRow = (draggedRowIndex: number, targetRowIndex: number) => {
    setGroups((previous) => {
      const newGroups = [...previous];
      const [draggedGroup] = newGroups.splice(draggedRowIndex, 1);
      if (!draggedGroup) return previous;

      newGroups.splice(targetRowIndex, 0, draggedGroup);
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
          const newProjects = [...projects],
            paths: string[] = [];
          newProjects.forEach((project) => {
            if (groupProjects.includes(project.path)) {
              needUpdate = true;
              project.version = name;
              paths.push(project.path);
            }
          });

          if (needUpdate) {
            // todo update
            await Promise.all([
              updateProjectsWithoutTray(newProjects),
              batchUpdateProjectVersion(paths, version),
            ]);

            return newProjects;
          }
        }

        return Promise.resolve(undefined);
      })(),
      // update groups
      (async () => {
        // If the project is already in another group, you need to remove it from the group.
        if (projects && projects.length) {
          const dGroups = [...groups];
          dGroups.forEach((group) => {
            const gProjects = [...group.projects];
            group.projects = gProjects.filter((project) => {
              return !groupProjects.includes(project);
            });
          });

          const newGroups = [group, ...dGroups];
          await updateGroups(newGroups);
          return newGroups;
        }

        return Promise.resolve(undefined);
      })(),
    ]);

    if (newProjects) setProjects(newProjects);
    if (newGroups) setGroups(newGroups);
  };

  return (
    <div className='h-full flex flex-col space-y-2'>
      <DataDndTable
        key='page-groups-table'
        columns={columns}
        data={groups}
        items={dataIds}
        loading={loading}
        toolbar={(table) => (
          <div className='flex items-center gap-2'>
            <DataTableToolbar
              key='page-groups-table-tool'
              table={table}
              filterName='Group-Name'
              status={false}
            />
            <div className='flex items-center gap-2'>
              <Button size='sm' disabled={loading} onClick={onPageReload}>
                <FolderSync />
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
        getRowId={(row) => row.name}
        reorderRow={reorderRow}
      />
    </div>
  );
};

Component.displayName = 'Groups';

function MultiSelectProject({
  value = [],
  version,
  name,
  projects = [],
  groups = [],
  onSubmit,
}: {
  value?: string[];
  name: string;
  version: string;
  projects?: Nvmd.Project[];
  groups?: Nvmd.Group[];
  onSubmit?: (projects: Nvmd.Project[], groups: Nvmd.Group[]) => void;
}) {
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      autoHighlight
      defaultValue={value}
      items={projects.map((p) => p.path)}
      onValueChange={async (projectsPaths) => {
        const { added, removed } = compareArray(value, projectsPaths);
        const [newProjects, newGroups] = await Promise.all([
          (async () => {
            const newProjects: Nvmd.Project[] = [...projects],
              addedPaths: string[] = [],
              removedPaths: string[] = [];

            newProjects.forEach((project) => {
              // Need addition
              if (added.length && added.includes(project.path)) {
                project.version = name;
                addedPaths.push(project.path);
              }

              // Need remove
              if (removed.length && removed.includes(project.path)) {
                project.version = '';
                removedPaths.push(project.path);
              }
            });

            await Promise.all([
              addedPaths.length
                ? batchUpdateProjectVersion(addedPaths, version)
                : Promise.resolve(undefined),
              removedPaths.length
                ? batchUpdateProjectVersion(removedPaths, '')
                : Promise.resolve(undefined),
              updateProjectsWithoutTray(newProjects),
            ]);

            return newProjects;
          })(),
          (async () => {
            const newGroups = [...groups];
            newGroups.forEach((group) => {
              // If the project is already in other groups, you need to remove it from the original group.
              const repeatProjects = group.projects.filter((path) =>
                projectsPaths.includes(path),
              );
              if (added.length && repeatProjects.length) {
                const groupProjects = [...group.projects];
                group.projects = groupProjects.filter(
                  (path) => !repeatProjects.includes(path),
                );
              }

              if (group.name === name) {
                group.projects = projectsPaths;
              }
            });
            await updateGroups(newGroups);
            return newGroups;
          })(),
        ]);
        onSubmit?.(newProjects, newGroups);
      }}
    >
      <ComboboxChips ref={anchor} className='w-full max-h-14 overflow-y-auto'>
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value: string) => (
                <ComboboxChip key={value}>
                  {projects.find((p) => p.path === value)?.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={values.length === 0 ? 'Select projects' : void 0}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor} className='isolate z-100'>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {projects.find((p) => p.path === item)?.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
