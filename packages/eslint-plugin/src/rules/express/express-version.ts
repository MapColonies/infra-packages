import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const majorVersionByDirectory = new Map<string, number | undefined>();

// Accepts a version or simple range such as `5`, `5.2.1`, `v5`, `^5.0.0` or `~4.21.0`
const VERSION_REGEX = /^\s*[v^~=]*\s*(\d+)/;

function parseMajorVersion(version: unknown): number | undefined {
  if (typeof version === 'number') {
    return Number.isFinite(version) ? Math.trunc(version) : undefined;
  }
  if (typeof version !== 'string') {
    return undefined;
  }
  const match = VERSION_REGEX.exec(version);
  return match?.[1] === undefined ? undefined : Number.parseInt(match[1], 10);
}

/**
 * Walks up from `directory` looking for `node_modules/express/package.json`, mirroring Node's
 * lookup but deliberately ignoring `NODE_PATH` (pnpm bin shims point it at unrelated packages).
 */
function findExpressPackageJson(directory: string): string | undefined {
  let current = directory;
  for (;;) {
    const candidate = join(current, 'node_modules', 'express', 'package.json');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

function detectMajorVersion(directory: string): number | undefined {
  const packageJsonPath = findExpressPackageJson(directory);
  if (packageJsonPath === undefined) {
    return undefined;
  }
  try {
    const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (typeof packageJson !== 'object' || packageJson === null || !('version' in packageJson)) {
      return undefined;
    }
    return parseMajorVersion(packageJson.version);
  } catch {
    return undefined;
  }
}

/**
 * Resolves the major version of Express used by the linted file.
 * An explicit version (from the plugin settings) wins; otherwise the version is detected
 * by locating the `express` package installed for the file's directory. Returns `undefined` when unknown.
 */
export function getExpressMajorVersion(filename: string, explicitVersion: unknown): number | undefined {
  if (explicitVersion !== undefined) {
    return parseMajorVersion(explicitVersion);
  }

  const directory = dirname(filename);
  if (!majorVersionByDirectory.has(directory)) {
    majorVersionByDirectory.set(directory, detectMajorVersion(directory));
  }
  return majorVersionByDirectory.get(directory);
}
