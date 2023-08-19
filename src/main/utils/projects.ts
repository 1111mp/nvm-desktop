import { join } from 'node:path';
import {
  pathExists,
  readFile,
  readJson,
  writeJson,
  writeFile,
  remove,
} from 'fs-extra';
import { PROJECTS_JSONFILE, NVMDRC_NAME } from '../constants';

let cacheProjects: Nvmd.Project[];

export async function getProjects(load: boolean = false) {
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

export async function getVersion(path: string): Promise<string> {
  const target = join(path, NVMDRC_NAME);
  if (!(await pathExists(target))) return '';

  const version = (await readFile(target)).toString();

  return version || '';
}

export async function syncProjectVersion(path: string, version: string) {
  if (!(await pathExists(path))) return 404;

  await writeFile(join(path, NVMDRC_NAME), version);
  return 200;
}
