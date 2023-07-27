import semver from 'semver';

// Default value for `versionRange`
export const DEFAULT_VERSION_RANGE = 'latest';

// Node <0.8.6 only shipped source code for Unix. We don't want to support
// building from sources, so we can't support those very old versions.
export const checkVersion = (version: string) => {
  if (semver.lt(version, MINIMUM_VERSION)) {
    throw new Error(
      `Unsupported Node.js version: ${version}. Must be >= ${MINIMUM_VERSION}.`,
    );
  }
};

const MINIMUM_VERSION = '0.8.6';
