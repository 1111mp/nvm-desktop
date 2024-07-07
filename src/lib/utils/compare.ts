import semver from 'semver';

export function checkSupportive(files: string[]): boolean {
  const name =
    OS_PLATFORM === 'darwin'
      ? `osx-${OS_ARCH}`
      : OS_PLATFORM === 'win32'
      ? `win-${OS_ARCH}`
      : `${OS_PLATFORM}-${OS_ARCH}`;

  return !!files.find((file) => file.includes(name));
}

export function compareVersion(version1: string, version2: string): number {
  version1 = version1.slice(1);
  version2 = version2.slice(1);

  return semver.gt(version2, version1) ? -1 : 1;
}

type CompareObj = {
  [key: string]: any;
};
export function shallowEqual(obj1: CompareObj, obj2: CompareObj) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    const areObjects = isObject(val1) && isObject(val2);

    if (
      (areObjects && !shallowEqual(val1, val2)) ||
      (!areObjects && val1 !== val2)
    ) {
      return false;
    }
  }

  return true;
}

function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object';
}
