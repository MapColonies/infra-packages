import fs from 'node:fs';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { readPackageJsonSync } from '../src';

vi.mock('fs');

describe('#readPackageJsonSync', function () {
  const readFileSyncSpy = vi.spyOn(fs, 'readFileSync');
  beforeEach(() => {
    readFileSyncSpy.mockClear();
  });
  it('should read file with default values.', function () {
    const name = '@map-colonies/some-name';
    readFileSyncSpy.mockReturnValue(JSON.stringify({ name }));

    const packageJson = readPackageJsonSync();
    expect(packageJson).toHaveProperty('name', name);
    expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(readFileSyncSpy).toHaveBeenCalledWith('./package.json', 'utf-8');
  });
  it('should read file with given values.', function () {
    const name = '@map-colonies/some-name';
    const path = 'avi';
    const encoding = 'utf8';
    const packageJsonFile = { name, directories: ['some-directory'] };
    readFileSyncSpy.mockReturnValue(JSON.stringify(packageJsonFile));

    const packageJson = readPackageJsonSync(path, encoding);
    expect(packageJson).toEqual(packageJsonFile);
    expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(readFileSyncSpy).toHaveBeenCalledWith(path, encoding);
  });
  it('Should throw an error when readFileSync failed', function () {
    const path = 'avi';
    const encoding = 'utf8';
    readFileSyncSpy.mockImplementationOnce(() => {
      throw new Error('Some Error');
    });

    expect(() => readPackageJsonSync(path, encoding)).toThrow();
    expect(readFileSyncSpy).toHaveBeenCalledWith(path, encoding);
  });
});
