import { buffer } from 'node:stream/consumers';
import { pipeline } from 'node:stream/promises';

import jszip from 'jszip';
import semver from 'semver';

import { fetchNodeUrl, writeNodeBinary, promiseOrFetchError } from '../fetch';

// .zip Node binaries for Windows were added in Node 4.5.0 and 6.2.1
export const shouldUseZip = (version) =>
  semver.satisfies(version, ZIP_VERSION_RANGE);

const ZIP_VERSION_RANGE = '^4.5.0 || >=6.2.1';

// Download the Node binary .zip archive and return it as a stream
// `jszip` does not allow streaming with `loadAsync()` so we need to wait for
// the HTTP request to complete before starting unzipping.
// However we can stream the file unzipping with the file writing.
export const downloadZip = async ({ version, tmpFile, arch, fetchOpts }) => {
  const filepath = getZipFilepath(version, arch);
  const { response, checksumError } = await fetchNodeUrl(
    version,
    `${filepath}.zip`,
    fetchOpts,
  );
  const zipContent = await buffer(response);
  const zipStream = await getZipStream(zipContent, filepath);
  const promise = pipeline(zipStream, writeNodeBinary(tmpFile));

  await promiseOrFetchError(promise, response);

  return checksumError;
};

const getZipFilepath = (version, arch) => `node-v${version}-win-${arch}`;

const getZipStream = async (zipContent, filepath) => {
  const archive = await jszip.loadAsync(zipContent, JSZIP_OPTIONS);
  const file = archive.file(`${filepath}/node.exe`);
  const zipStream = file.nodeStream('nodebuffer');
  return zipStream;
};

const JSZIP_OPTIONS = { checkCRC32: true, createFolders: false };
