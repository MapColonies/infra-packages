import { expect } from 'vitest';
import type * as matchersType from 'jest-extended';

async function importOrThrow<T extends object>(modulePath: string): Promise<T> {
  try {
    const imported = (await import(modulePath)) as T;

    if ('default' in imported) {
      return imported.default as T;
    }
    return imported;
  } catch (error) {
    throw new Error(`Failed to import optional module '${modulePath}', make sure its installed and try again`, { cause: error });
  }
}

const matchers = await importOrThrow<typeof matchersType>('jest-extended');
expect.extend(matchers);
