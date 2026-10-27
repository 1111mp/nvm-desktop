import { WorkspaceRemoveDialog } from '@/components/workspace-remove-dialog';
import {
  WorkspaceOverview,
  workspaceStyles,
} from '@/components/workspace-layout';
import {
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
import { LoaderCircle, RefreshCw, Boxes } from 'lucide-react';
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
      enableHiding: false,
      meta: {
        layoutClassName: 'basis-40 grow-0 shrink-0',
        className: 'flex items-center',
      },
      cell: ({ row }) => (
        <span className='flex min-w-0 items-center gap-2.5'>
          <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-muted-foreground'>
            <Boxes className='size-3.5' />
          </span>
          <span
            className='truncate text-sm font-medium'
            title={row.original.name}
          >
            {row.original.name}
          </span>
        </span>
      ),
    }),
    columnHelper.accessor('desc', {
      header: t('Group-Desc'),
      meta: {
        layoutClassName: 'min-w-40 flex-1',
        className: 'flex items-center text-muted-foreground',
      },
      enableHiding: false,
      cell: ({ getValue }) => {
        const desc = getValue() as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className='min-w-0 truncate text-xs leading-relaxed'
                title={desc}
              >
                {desc || '—'}
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
        layoutClassName: 'basis-36 grow-0 shrink-0',
      },
      cell: ({ row }) => {
        const { projects, name, version } = row.original;
        return (
          <Select
            value={version}
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
            <SelectTrigger
              className={workspaceStyles.select}
              aria-label={t('Select-Version')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position='popper'
              align='start'
              className={`${workspaceStyles.popover} max-h-[min(22rem,var(--radix-select-content-available-height))] max-w-[calc(100dvw-2rem)]`}
            >
              {installedVersions.map((version) => (
                <SelectItem
                  key={version}
                  value={version}
                  className={`${workspaceStyles.option} font-mono`}
                >
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
        layoutClassName: 'min-w-56 flex-[1.4_1_0%]',
      },
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
      enableHiding: false,
      meta: {
        layoutClassName: 'basis-28 grow-0 shrink-0',
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { name, version, projects: groupProjects } = row.original;
        return (
          <WorkspaceRemoveDialog
            kind='group'
            name={name}
            details={[
              { label: t('Version'), value: `v${version}` },
              {
                label: t('Projects'),
                value: t('Project-Count', { count: groupProjects.length }),
              },
            ]}
            onConfirm={async () => {
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
          />
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
    } catch (error) {
      toast.error(error);
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
        // Persist even without projects, so a group can be created from an empty workspace.
        const newGroups = [
          group,
          ...groups.map((existing) => ({
            ...existing,
            projects: existing.projects.filter(
              (path) => !groupProjects.includes(path),
            ),
          })),
        ];
        await updateGroups(newGroups);
        return newGroups;
      })(),
    ]);

    if (newProjects) setProjects(newProjects);
    if (newGroups) setGroups(newGroups);
  };

  return (
    <div className='flex h-full min-h-0 min-w-0 flex-col gap-5'>
      <div className='flex shrink-0 flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='mb-1.5 text-2xl leading-tight font-semibold tracking-tight'>
            {t('Groups')}
          </h1>
          <p className='text-sm leading-relaxed text-muted-foreground'>
            {t('Groups-Description')}
          </p>
        </div>
        <GroupCreator
          projects={projects}
          groups={groups}
          versions={installedVersions}
          onSubmit={onSubmit}
          disabled={loading}
        />
      </div>
      <WorkspaceOverview
        projectCount={projects.length}
        groupCount={groups.length}
        installedCount={installedVersions.length}
        mode='groups'
      />
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div className='flex flex-wrap items-baseline justify-between gap-2 pb-4'>
          <h2 className='text-sm font-semibold'>{t('Group-Catalog')}</h2>
          <span className='text-xs text-muted-foreground'>
            {t('Drag-To-Reorder')}
          </span>
        </div>
        <DataDndTable
          key='page-groups-table'
          columns={columns}
          data={groups}
          items={dataIds}
          loading={loading}
          emptyState={
            <div className='flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-6 text-center'>
              <span className='mb-1 grid size-11 place-items-center rounded-xl bg-primary/8 text-muted-foreground'>
                <Boxes className='size-5' strokeWidth={1.5} />
              </span>
              <p className='text-sm font-medium'>{t('Groups-Empty')}</p>
              <p className='max-w-72 whitespace-normal text-xs leading-relaxed text-muted-foreground'>
                {t('Groups-Empty-Description')}
              </p>
            </div>
          }
          toolbar={(table) => (
            <div className='flex shrink-0 flex-wrap items-center gap-2 pb-3'>
              <DataTableToolbar
                key='page-groups-table-tool'
                table={table}
                filterName='Group-Name'
                status={false}
              />
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='ghost'
                  className={workspaceStyles.refreshAction}
                  aria-busy={loading}
                  disabled={loading}
                  onClick={onPageReload}
                >
                  {loading ? (
                    <LoaderCircle className='size-3.5 animate-spin motion-reduce:animate-none' />
                  ) : (
                    <RefreshCw className='size-3.5 transition-transform group-hover:rotate-45 motion-reduce:transition-none' />
                  )}
                  {t('Page-Reload')}
                </Button>
              </div>
            </div>
          )}
          getRowId={(row) => row.name}
          reorderRow={reorderRow}
        />
      </div>
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
  const { t } = useTranslation();

  return (
    <Combobox
      multiple
      autoHighlight
      value={value}
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
      <ComboboxChips
        ref={anchor}
        className='w-full max-h-20 overflow-y-auto rounded-lg border-0 bg-muted/50 text-xs shadow-none'
      >
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value: string) => (
                <ComboboxChip
                  key={value}
                  className='max-w-full gap-1 rounded-md bg-primary/8 text-xs [&>button]:shrink-0'
                >
                  <span className='max-w-28 truncate'>
                    {projects.find((p) => p.path === value)?.name ?? value}
                  </span>
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={
                  values.length === 0 ? t('Select-Projects') : void 0
                }
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent
        anchor={anchor}
        className={`${workspaceStyles.popover} isolate z-100`}
      >
        <ComboboxEmpty>{t('No-results')}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem
              key={item}
              value={item}
              className={workspaceStyles.option}
            >
              <span className='flex min-w-0 flex-col gap-1'>
                <span className='truncate font-medium'>
                  {projects.find((p) => p.path === item)?.name}
                </span>
                <span className='truncate font-mono text-[0.625rem] text-muted-foreground'>
                  {item}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
