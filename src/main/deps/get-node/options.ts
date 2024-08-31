import { arch as processArch } from "node:process";

import isPlainObj from "is-plain-obj";

import { validateArch } from "./arch";
import { getDefaultOutput, validateOutput } from "./output";

import type { Arch } from "./archive/types";

export interface NodeBinary {
  /**
   * Absolute path to the `node` executable
   */
  path: string;

  /**
   * Normalized Node.js version
   */
  version: string;
}

export type Options = Partial<{
  /**
   * Output directory for the `node` executable.
   * It the directory already has a `node` executable, no download is
   * performed. This enables caching.
   *
   * @default Global cache directory such as `/home/user/.cache/nve/`
   */
  output: string;

  /**
   * Base URL to retrieve Node.js binaries.
   * Can be customized (for example `https://npmmirror.com/mirrors/node`).
   * The following environment variables can also be used: `NODE_MIRROR`,
   * `NVM_NODEJS_ORG_MIRROR`, `N_NODE_MIRROR` or `NODIST_NODE_MIRROR`.
   *
   * @default "https://nodejs.org/dist"
   */
  mirror?: string;

  /**
   * Cancels when the signal is aborted.
   */
  signal?: AbortSignal;

  /**
   * The list of available Node.js versions is cached for one hour by default.
   * If the `fetch` option is:
   *  - `true`: the cache will not be used
   *  - `false`: the cache will be used even if it's older than one hour
   *
   * @default undefined
   */
  fetch?: boolean;

  /**
   * Progress event callback.
   *
   * @default undefined
   */
  onProgress?: (progress: Nvmd.ProgressData) => void;

  /**
   * Node.js binary's CPU architecture. This is useful for example when you're
   * on x64 but would like to run Node.js x32.
   * All the values from
   * [`process.arch`](https://nodejs.org/api/process.html#process_process_arch)
   * are allowed except `mips` and `mipsel`.
   *
   * @default `process.arch`
   */
  arch?: Arch;

  /**
   * Proxy server configuration
   */
  proxy?: Nvmd.Proxy;
}>;

// Validate input parameters and assign default values.
// `versionRange` can start with `v` or not.
export const getOpts = async (opts: Options = {}) => {
  if (!isPlainObj(opts)) {
    throw new TypeError(`Options must be a plain object: ${opts}`);
  }

  const {
    output = await getDefaultOutput(),
    arch = processArch as Arch,
    mirror = DEFAULT_MIRROR,
    proxy = undefined,
    signal,
    onProgress
  } = opts;

  validateOutput(output);
  validateArch(arch);

  const fetchOpts = { mirror, signal, proxy };
  return {
    output,
    arch,
    fetchOpts,
    onProgress
  };
};

const DEFAULT_MIRROR = "https://nodejs.org/dist";
