import { $ } from 'zx';
import { describe, it, expect } from 'vitest';

describe('commitlint', function () {
  it('should run without errors if ', async function () {
    const result = await $({ input: 'chore: avi', nothrow: true, cwd: __dirname })`npx commitlint`;

    expect(result).toHaveProperty('exitCode', 0);
  });

  it('should fail if the commit message is not formatted correctly', async function () {
    const result = await $({ input: 'avi', nothrow: true, cwd: __dirname })`npx commitlint`;

    expect(result).toHaveProperty('exitCode', 1);
    expect(result.stdout).toMatch(/type may not be empty/);
    expect(result.stdout).toMatch(/subject may not be empty/);
  });
});
