import { join } from "node:path";
import { pathExists, readFile, readJson, writeJson, writeFile, remove } from "fs-extra";
import { PROJECTS_JSONFILE, NVMDRC_NAME } from "../constants";

let cacheProjects: Nvmd.Project[];

export async function getProjects(load: boolean = false): Promise<Nvmd.Project[]> {
  if (cacheProjects !== void 0 && !load) {
    return cacheProjects;
  }

  if (!(await pathExists(PROJECTS_JSONFILE))) return [];

  const projects = (await readJson(PROJECTS_JSONFILE, { throws: false })) || [];

  cacheProjects = projects;

  return projects;
}

export async function updateProjects(projects: Nvmd.Project[], path?: string) {
  if (path && (await pathExists(join(path, NVMDRC_NAME)))) {
    await remove(join(path, NVMDRC_NAME));
  }

  await writeJson(PROJECTS_JSONFILE, projects);
  cacheProjects = projects;
  return;
}

export async function updateProjectsAndSync(projects: Nvmd.Project[], sync: boolean = false) {
  const syncProject = async ({ path, version }: Nvmd.Project, index: number) => {
    if (!(await pathExists(path))) {
      projects[index].active = false;
      return;
    }

    sync && (await writeFile(join(path, NVMDRC_NAME), version));
    return;
  };

  await Promise.all(projects.map((project, index) => syncProject(project, index)));
  cacheProjects = projects;
  await writeJson(PROJECTS_JSONFILE, projects);
}

export async function getVersion(path: string): Promise<string> {
  const target = join(path, NVMDRC_NAME);
  if (!(await pathExists(target))) return "";

  const version = (await readFile(target)).toString();

  return version || "";
}

export async function syncProjectVersion(path: string, version: string) {
  if (!(await pathExists(path))) return 404;

  await writeFile(join(path, NVMDRC_NAME), version);
  return 200;
}

type UpdateByGroup = {
  projects: string[];
  groupName: string;
  version: string;
};

export async function updateProjectAndSyncVersion({ projects, groupName, version }: UpdateByGroup) {
  const asyncVerions: Promise<any>[] = [],
    newProjects = [...cacheProjects];
  projects.forEach((projectPath) => {
    // update projectpath/.nvmdrc
    asyncVerions.push(syncProjectVersion(projectPath, version));

    // update $HOMEPATH/.nvmd/projects.json
    // await updateProjectFromGroup({ groupName });
    newProjects.forEach((project) => {
      if (project.path === projectPath) {
        project.version = groupName;
      }
    });
  });

  cacheProjects = newProjects;
  asyncVerions.push(writeJson(PROJECTS_JSONFILE, newProjects));

  await Promise.all(asyncVerions);
  return cacheProjects;
}
