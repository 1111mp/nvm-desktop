import { WorkspaceRemoveDialog } from '@/components/workspace-remove-dialog';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import {
  WorkspaceOverview,
  workspaceStyles,
} from '@/components/workspace-layout';
import {
  Button,
  DataDndTable,
  DataTableToolbar,
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
  type DataTableFeatures,
} from '@/components/ui';
import { VsCodeLogo } from '@/components/vscode-logo';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  LoaderCircle,
  RefreshCw,
  FolderPlus,
  Folder,
  Copy,
  Check,
  TriangleAlert,
} from 'lucide-react';
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
import { createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

const columnHelper = createColumnHelper<DataTableFeatures, Nvmd.Project>();

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
  const [copiedPath, copyPath] = useCopyToClipboard();
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
          toast.success(
            t('Restart-Terminal', {
              version: `v${payload}`,
            }),
          );
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

  const columns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: t('Project-Name'),
      enableHiding: false,
      meta: {
        layoutClassName: 'basis-48 grow-0 shrink-0',
        className: 'flex items-center',
      },
      cell: ({ row }) => {
        const { name } = row.original;
        return (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className='flex min-w-0 items-center gap-2.5'>
                  <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-muted-foreground'>
                    <Folder className='size-3.5' />
                  </span>
                  <span className='min-w-0 truncate text-sm font-medium'>
                    {name}
                  </span>
                  {!row.original.active && (
                    <TriangleAlert
                      className='size-3.5 shrink-0 text-destructive'
                      aria-label={t('Invalid-project-path')}
                    />
                  )}
                </span>
              }
            />
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        );
      },
    }),
    columnHelper.accessor('path', {
      header: t('Project-Path'),
      enableHiding: false,
      meta: {
        layoutClassName: 'min-w-56 flex-[1.4_1_0%]',
        className: 'flex items-center text-muted-foreground',
      },
      cell: ({ row }) => {
        const path = row.original.path;
        return (
          <div className='flex w-full min-w-0 items-center gap-1'>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type='button'
                    disabled={!row.original.active}
                    className={cn(
                      'min-w-0 flex-1 cursor-pointer truncate rounded-md text-left font-mono text-xs leading-6 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                      !row.original.active && 'line-through opacity-60',
                    )}
                    onClick={async () => {
                      try {
                        await openDir(path);
                      } catch {
                        toast.error(t('Invalid-project-path'));
                      }
                    }}
                  >
                    {path}
                  </button>
                }
              />
              <TooltipContent className='max-w-sm break-all'>
                {path}
              </TooltipContent>
            </Tooltip>
            <Button
              variant='ghost'
              size='icon-xs'
              title={t('Copy-Path')}
              aria-label={t('Copy-Path')}
              onClick={() => copyPath(path)}
              className='shrink-0 text-muted-foreground'
            >
              {copiedPath === path ? <Check /> : <Copy />}
            </Button>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    aria-label={t('open-with-vscode')}
                    onClick={async () => {
                      try {
                        await openWithVSCode(path);
                      } catch {
                        toast.error(t('VSCode-code-command-not-found'));
                      }
                    }}
                  >
                    <VsCodeLogo className='size-3.5 text-muted-foreground' />
                  </Button>
                }
              />
              <TooltipContent>{t('open-with-vscode')}</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    }),
    columnHelper.accessor('version', {
      header: t('Version'),
      meta: {
        label: t('Version'),
        layoutClassName: 'basis-44 grow-0 shrink-0',
      },
      cell: ({ row }) => {
        const { version, path } = row.original;
        return (
          <Select
            items={[
              ...installedVersions.map((value) => ({
                value,
                label: `v${value}`,
              })),
              ...groups.map(({ name }) => ({ value: name, label: name })),
            ]}
            value={version ?? ''}
            onValueChange={async (newVersion) => {
              if (newVersion === null) return;
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
                    t('Restart-Terminal', {
                      version: `v${targetVersion}`,
                    }),
                  );
                else toast.error(`Project not found, please check it`);
              } catch {
                toast.error('Something went wrong');
              }
            }}
          >
            <SelectTrigger
              className={workspaceStyles.select}
              aria-label={t('Select-Version')}
            >
              <SelectValue placeholder={t('Select-Version')} />
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              align='start'
              className={`${workspaceStyles.popover} max-h-[min(22rem,var(--available-height))] max-w-[calc(100dvw-2rem)]`}
            >
              <SelectGroup>
                <SelectLabel className='px-2 py-2 text-[0.625rem] font-medium text-muted-foreground'>
                  {t('Versions')}
                </SelectLabel>
                {installedVersions.map((version) => (
                  <SelectItem
                    key={version}
                    value={version}
                    className={`${workspaceStyles.option} font-mono`}
                  >
                    v{version}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className='px-2 py-2 text-[0.625rem] font-medium text-muted-foreground'>
                  {t('Groups')}
                </SelectLabel>
                {groups.map(({ name, desc }) => (
                  <SelectItem
                    key={name}
                    value={name}
                    title={`${name} (${desc})`}
                    className={workspaceStyles.option}
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
        const { name, path, version } = row.original;
        return (
          <WorkspaceRemoveDialog
            kind='project'
            name={name}
            details={[
              {
                label: t('Project-Path'),
                value: path,
              },
              {
                label: t('Version'),
                value: groups.find((group) => group.name === version)?.version
                  ? `${version} · v${groups.find((group) => group.name === version)!.version}`
                  : version
                    ? `v${version}`
                    : '—',
              },
            ]}
            onConfirm={async () => {
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
          />
        );
      },
    }),
  ]);

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
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex h-full min-h-0 min-w-0 flex-col gap-5'>
      <div className='flex shrink-0 flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='mb-1.5 text-2xl leading-tight font-semibold tracking-tight'>
            {t('Projects')}
          </h1>
          <p className='text-sm leading-relaxed text-muted-foreground'>
            {t('Projects-Description')}
          </p>
        </div>
        <Button
          variant='secondary'
          className={workspaceStyles.primaryAction}
          disabled={loading}
          onClick={onAddProject}
        >
          <FolderPlus className='size-4' />
          {t('Add-Project')}
        </Button>
      </div>
      <WorkspaceOverview
        projectCount={projects.length}
        groupCount={groups.length}
        installedCount={installedVersions.length}
        mode='projects'
      />
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <div className='flex flex-wrap items-baseline justify-between gap-2 pb-4'>
          <h2 className='text-sm font-semibold'>{t('Project-Catalog')}</h2>
          <span className='text-xs text-muted-foreground'>
            {t('Drag-To-Reorder')}
          </span>
        </div>
        <DataDndTable
          columns={columns}
          data={projects}
          items={dataIds}
          loading={loading}
          emptyState={
            <div className='flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-6 text-center'>
              <span className='mb-1 grid size-11 place-items-center rounded-xl bg-primary/8 text-muted-foreground'>
                <Folder className='size-5' strokeWidth={1.5} />
              </span>
              <p className='text-sm font-medium'>{t('Projects-Empty')}</p>
              <p className='max-w-72 whitespace-normal text-xs leading-relaxed text-muted-foreground'>
                {t('Projects-Empty-Description')}
              </p>
            </div>
          }
          toolbar={(table) => (
            <div className='flex shrink-0 flex-wrap items-center gap-2 pb-3'>
              <DataTableToolbar
                table={table}
                filterName='Project-Name'
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
          getRowId={(row) => row.path}
          reorderRow={reorderRow}
        />
      </div>
    </div>
  );
};

Component.displayName = 'Projects';
