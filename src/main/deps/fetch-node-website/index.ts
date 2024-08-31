/**
 * https://github.com/ehmicky/fetch-node-website
 */

import { got } from "got";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getDefaultMirror } from "./mirror";

import type { Request, Delays } from "got";

const LEADING_SLASH_REGEXP = /^\//u;

export interface Options {
  /**
   * Base URL.
   * Can be customized (for example `https://npmmirror.com/mirrors/node`).
   *
   * The following environment variables can also be used: `NODE_MIRROR`,
   * `NVM_NODEJS_ORG_MIRROR`, `N_NODE_MIRROR` or `NODIST_NODE_MIRROR`.
   *
   * @default 'https://nodejs.org/dist'
   */
  mirror?: string;

  /**
   * Cancels the release download when the signal is aborted.
   */
  signal?: AbortSignal;

  /**
   * Milliseconds to wait for the server to end the response before aborting the request with `got.TimeoutError` error (a.k.a. `request` property).
   */
  timeout?: Delays;

  /**
   * Proxy server configuration
   */
  proxy?: Nvmd.Proxy;
}

/**
 * Download release files available on
 * [`https://nodejs.org/dist/`](https://nodejs.org/dist/).
 *
 * @example
 * ```js
 * const stream = await fetchNodeWebsite('v12.8.0/node-v12.8.0-linux-x64.tar.gz')
 *
 * // Example with options
 * const otherStream = await fetchNodeWebsite(
 *   'v12.8.0/node-v12.8.0-linux-x64.tar.gz',
 *   {
 *     progress: true,
 *     mirror: 'https://npmmirror.com/mirrors/node',
 *   },
 * )
 * ```
 */
export const fetchNodeWebsite = async (path: string, opts?: Options): Promise<Request> => {
  const { mirror = getDefaultMirror(), signal, timeout = {}, proxy } = opts || {};

  const pathA = path.replace(LEADING_SLASH_REGEXP, "");
  // Configure proxy if provided
  let agent;
  if (proxy?.enabled) {
    const proxyOptions = `http://${proxy.ip}:${proxy.port}`;
    agent = {
      http: new HttpProxyAgent(proxyOptions),
      https: new HttpsProxyAgent(proxyOptions)
    };
  }

  const response = got.stream(pathA, {
    prefixUrl: mirror,
    signal,
    timeout,
    agent
  });

  return response;
};

export default fetchNodeWebsite;
