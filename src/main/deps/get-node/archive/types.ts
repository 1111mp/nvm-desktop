import type { Options as FetchNodeOptions } from '../../fetch-node-website';

/**
 * CPU architecture
 */
export type Arch =
  | 'arm'
  | 'arm64'
  | 'ia32'
  | 'mips'
  | 'mipsel'
  | 'ppc'
  | 'ppc64'
  | 's390'
  | 's390x'
  | 'x64'
  | 'riscv64';

export interface Options {
  version: string;
  tmpFile: string;
  arch: Arch;
  fetchOpts: FetchNodeOptions;
  onProgress?: (data: Nvmd.ProgressData) => void;
}
