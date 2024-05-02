import { join } from "node:path";
import { pathExists, readFile, readJson, writeJson, writeFile, remove } from "fs-extra";
import { GROUPS_JSONFILE, NVMDRC_NAME } from "../constants";
import { syncProjectVersion, updateProjectAndSyncVersion } from "./projects";

let cacheGroups: Nvmd.Group[];

export async function getGroups(load: boolean = false): Promise<Nvmd.Group[]> {
  if (cacheGroups !== void 0 && !load) {
    return cacheGroups;
  }

  if (!(await pathExists(GROUPS_JSONFILE))) {
    cacheGroups = [];
    return cacheGroups;
  }

  const groups = (await readJson(GROUPS_JSONFILE, { throws: false })) || [];

  cacheGroups = groups;

  return groups;
}

export async function createGroup(group: Nvmd.Group) {
  const { projects, version } = group;

  // * Need to update the version of the project
  if (projects && projects.length && version) {
    // * projects saves the path of the project
    await updateProjectAndSyncVersion({
      projects,
      groupName: group.name,
      version
    });
  }

  if (projects && projects.length) {
    // If the project is already in another group, you need to remove it from the group.
    cacheGroups.forEach((cacheGroup) => {
      const { projects } = cacheGroup;
      cacheGroup.projects = projects.filter((project) => !projects.includes(project));
    });
  }

  const newGroups = [group, ...cacheGroups];

  await writeJson(GROUPS_JSONFILE, newGroups);
  cacheGroups = newGroups;
  return;
}

export async function updateGroups(groups: Nvmd.Group[], path?: string) {
  if (path && (await pathExists(join(path, NVMDRC_NAME)))) {
    await remove(join(path, NVMDRC_NAME));
  }

  await writeJson(GROUPS_JSONFILE, groups);
  cacheGroups = groups;
  return;
}

export async function updateGroupVersion(group: Nvmd.Group, version: string) {
  const { projects, name } = group;
  await Promise.all(projects.map((projectPath) => syncProjectVersion(projectPath, version)));

  const newGroups = [...cacheGroups];
  newGroups.forEach((group) => {
    if (group.name === name) {
      group.version = version;
    }
  });

  cacheGroups = newGroups;
  await writeJson(GROUPS_JSONFILE, newGroups);
  return cacheGroups;
}
