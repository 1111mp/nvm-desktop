import type { Delays } from 'got-cjs';
import type { Options as FetchNodeWebsiteOptions } from '../fetch-node-website';

export interface Options {
  /**
   * Base URL to fetch the list of available Node.js versions.
   * Can be customized (for example `https://npmmirror.com/mirrors/node`).
   *
   * The following environment variables can also be used: `NODE_MIRROR`,
   * `NVM_NODEJS_ORG_MIRROR`, `N_NODE_MIRROR` or `NODIST_NODE_MIRROR`.
   *
   * @default 'https://nodejs.org/dist'
   */
  mirror?: FetchNodeWebsiteOptions['mirror'];

  /**
   * Cancels the release download when the signal is aborted.
   */
  signal?: FetchNodeWebsiteOptions['signal'];

  /**
   * The list of available Node.js versions is cached for one hour by default.
   * If the `fetch` option is:
   *  - `true`: the cache will not be used
   *  - `false`: the cache will be used even if it's older than one hour
   *
   * @default `undefined`
   */
  fetch?: boolean | undefined;

  /**
   * Milliseconds to wait for the server to end the response before aborting the request with `got.TimeoutError` error (a.k.a. `request` property).
   */
  timeout?: Delays;

  /**
   * Progress event callback.
   *
   * @default undefined
   */
  onProgress?: (progress: Nvmd.ProgressData) => void;
}

export const getOpts = (opts: Options) => {
  const { fetch: fetchOpt = false, ...fetchNodeOpts } = opts;

  return { fetchOpt, fetchNodeOpts };
};
