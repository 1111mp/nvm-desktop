import { platform } from 'node:process';

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
  | 'x64';

const PLATFORMS: { [kek: string]: string } = {
  arm: 'armv7l',
  arm64: 'arm64',
  ia32: 'x64',
  ppc: 'ppc64le',
  ppc64: 'ppc64le',
  s390: 's390x',
  s390x: 's390x',
  x32: 'x86',
  x64: 'x64',
};

// Validate `arch` option
export const validateArch = (arch: Arch) => {
  if (arch in PLATFORMS) {
    return;
  }

  const availableArch = Object.keys(PLATFORMS).join(', ');
  throw new TypeError(
    `Option "arch" must not be ${arch} but one of: ${availableArch}`,
  );
};

// Retrieve the CPU architecture as used in binary filenames.
// Can be changed with the `arch` option.
export const getArch = (arch: Arch): string => {
  /* c8 ignore start */
  if (platform === 'aix') {
    return 'ppc64';
  }
  /* c8 ignore stop */

  return PLATFORMS[arch];
};
