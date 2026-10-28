type GroupProjectChanges = {
  name: string;
  version: string;
  selected: string[];
  projects: Nvmd.Project[];
  groups: Nvmd.Group[];
};

type Persistence = {
  writeVersions: (paths: string[], version: string) => Promise<unknown>;
  clearVersions: (paths: string[]) => Promise<unknown>;
  saveProjects: (projects: Nvmd.Project[]) => Promise<unknown>;
  saveGroups: (groups: Nvmd.Group[]) => Promise<unknown>;
};

export async function saveGroupProjects(
  { name, version, selected, projects, groups }: GroupProjectChanges,
  persistence: Persistence,
) {
  const previous = groups.find((group) => group.name === name)?.projects ?? [];
  const added = selected.filter((path) => !previous.includes(path));
  const removed = previous.filter((path) => !selected.includes(path));
  const newProjects = projects.map((project) => ({
    ...project,
    version: added.includes(project.path)
      ? name
      : removed.includes(project.path)
        ? ''
        : project.version,
  }));
  const newGroups = groups.map((group) => ({
    ...group,
    projects:
      group.name === name
        ? [...selected]
        : group.projects.filter((path) => !added.includes(path)),
  }));

  // Files can fail when a project was deleted or is read-only. Never persist
  // membership (or mutate the caller's state) before these writes succeed.
  if (added.length) await persistence.writeVersions(added, version);
  if (removed.length) await persistence.clearVersions(removed);
  try {
    await persistence.saveProjects(newProjects);
    await persistence.saveGroups(newGroups);
  } catch (error) {
    // Both commands may update in-memory config before a save fails.
    await Promise.allSettled([
      persistence.saveProjects(projects),
      persistence.saveGroups(groups),
    ]);
    throw error;
  }
  return { projects: newProjects, groups: newGroups };
}
