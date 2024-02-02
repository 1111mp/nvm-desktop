import { rename, rm } from 'node:fs/promises';

import { extract as tarExtract } from 'tar-fs';

// Extract .tar.gz and .tar.xz archive
export const untar = (tmpFile: string) => tarExtract(tmpFile);

// As a performance optimization, we only unpack the node binary, not the other
// files.
// const shouldExclude = (path: string) => !path.endsWith('/node');

// The archive is extracted to a temporary directory with a single file in it.
// That directory should be cleaned up after moving the single file, so we
// remove it right away.
export const moveTar = async (tmpFile: string) => {
  const intermediateFile = `${tmpFile}-${Math.random()}`;
  await rename(`${tmpFile}`, intermediateFile);
  await rm(tmpFile, { recursive: true });
  await rename(intermediateFile, tmpFile);
};
