/**
 * https://github.com/ehmicky/get-node
 */

import { download } from "./download";
import { getOpts } from "./options";
import { checkVersion } from "./version";

import type { Options } from "./options";

// Download the Node.js binary for a specific `versionRange`
/**
 * Download a specific version of Node.js.
 * The Node.js release is downloaded, uncompressed and untared to an executable
 * file ready to run.
 *
 * @example
 * ```js
 * // Download a specific Node.js release
 * const { path, version } = await getNode('8')
 * console.log(path) // /home/user/.cache/nve/8.17.0/node
 * console.log(version) // 8.17.0
 *
 * // Download Node.js latest release
 * const { path, version } = await getNode('latest')
 * console.log(path) // /home/user/.cache/nve/16.3.0/node
 * console.log(version) // 16.3.0
 *
 * // Any version range can be used
 * await getNode('8.12.0')
 * await getNode('<7')
 *
 * // Download latest LTS Node.js version
 * await getNode('lts')
 *
 * // Download Node.js version from `~/.nvmrc` or the current process version
 * await getNode('global')
 *
 * // Download current directory's Node.js version using its `.nvmrc` or `package.json` (`engines.node` field)
 * await getNode('local')
 *
 * // Download Node.js version from a specific file like `.nvmrc` or `package.json`
 * await getNode('/path/to/.nvmrc')
 *
 * // Specify the output directory
 * const { path } = await getNode('8', {
 *   output: '/home/user/.cache/node_releases/',
 * })
 * console.log(path) // /home/user/.cache/node_releases/13.0.1/node
 *
 * // Use a mirror website
 * await getNode('8', { mirror: 'https://npmmirror.com/mirrors/node' })
 *
 * // Specify the CPU architecture
 * await getNode('8', { arch: 'x32' })
 * ```
 */
const getNode = async (version: string, opts: Options = {}) => {
  const { output, arch, fetchOpts, onProgress } = await getOpts(opts);
  checkVersion(version);
  const nodePath = await download({
    version,
    output,
    arch,
    fetchOpts,
    onProgress
  });
  return { version, path: nodePath };
};

export default getNode;
