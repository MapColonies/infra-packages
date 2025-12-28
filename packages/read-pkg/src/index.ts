import { readFileSync } from 'node:fs';
import { PackageJson } from 'type-fest';

/**
 * Synchronously reads and parses a package.json file.
 * @param path - The path to the package.json file. Defaults to './package.json'.
 * @param encoding - The encoding to use when reading the file. Defaults to 'utf-8'.
 * @returns The parsed package.json content as a PackageJson object.
 * @public
 */
export function readPackageJsonSync(path = './package.json', encoding: BufferEncoding = 'utf-8'): PackageJson {
  return JSON.parse(readFileSync(path, encoding)) as PackageJson;
}
