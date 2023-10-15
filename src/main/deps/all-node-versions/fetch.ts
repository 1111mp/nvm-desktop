import { json } from 'node:stream/consumers';
import { fetchNodeWebsite } from '../fetch-node-website';

import type { Options } from './options';

export const fetchIndex = async ({
  fetch,
  onProgress,
  ...fetchNodeOpts
}: Options): Promise<Nvmd.Versions> => {
  const response = await fetchNodeWebsite(INDEX_PATH, {
    ...fetchNodeOpts,
  });

  onProgress &&
    response.on('downloadProgress', (data) => {
      onProgress(data);
    });

  const index = (await json(
    response as NodeJS.ReadableStream,
  )) as Nvmd.Versions;
  return index;
};

const INDEX_PATH = 'index.json';
