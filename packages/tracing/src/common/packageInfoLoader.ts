import { readPackageJsonSync } from '@map-colonies/read-pkg';

interface PackageInfo {
  name: string;
  version: string;
}

let packageInfo: PackageInfo | undefined = undefined;

function loadPackageInfo(): PackageInfo {
  if (packageInfo) {
    return packageInfo;
  }
  const packageJSON = readPackageJsonSync();
  packageInfo = {
    name: packageJSON.name ?? 'unknown_service',
    version: packageJSON.version ?? 'v0.0.0',
  };
  return packageInfo;
}

export { loadPackageInfo, type PackageInfo };
