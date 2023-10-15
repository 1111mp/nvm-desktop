/**
 * https://github.com/ehmicky/all-node-versions
 */

import { getCache, getInstalledVersions, setCache } from './cache';
import { fetchIndex } from './fetch';

import type { Options } from './options';

let processCachedVersions: Nvmd.Versions, installedVersions: string[];

export const allNodeVersions = async (options: Options = {}) => {
  if (processCachedVersions !== void 0 && options.fetch !== true) {
    return processCachedVersions;
  }

  // from cache
  const cachedVersions = await getCache({ fetch: options.fetch });
  if (cachedVersions) return cachedVersions;

  const versionsInfo = await fetchIndex(options);
  await setCache(versionsInfo, options.fetch);
  processCachedVersions = versionsInfo;

  return versionsInfo;
};

export async function allInstalledNodeVersions(refresh: boolean = false) {
  if (installedVersions !== void 0 && refresh !== true)
    return installedVersions;

  const versions = await getInstalledVersions();

  installedVersions = versions;

  return versions;
}
