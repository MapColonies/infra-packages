import { readPackageJsonSync } from '@map-colonies/read-pkg';

const packageJson = readPackageJsonSync();
const PACKAGE_VERSION = packageJson.version ?? 'unknown';
export { PACKAGE_VERSION };
