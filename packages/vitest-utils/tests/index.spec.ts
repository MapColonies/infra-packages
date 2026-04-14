import path from 'node:path';
import { describe, vi, it, expect, beforeEach, afterEach } from 'vitest';
import { getPathAlias } from '../src/pathAlias.js';
import { setupOpenapi } from '../src/openapi.js';

// ─── pathAlias ───────────────────────────────────────────────────────────────

describe('getPathAlias', function () {
  const rootDir = '/project';

  it('should map a single alias to a resolved absolute path', function () {
    const tsconfig = {
      compilerOptions: {
        paths: {
          '@app/*': ['src/app/*'],
        },
      },
    };

    const result = getPathAlias(tsconfig, rootDir);

    expect(result).toEqual({
      '@app': path.resolve(rootDir, 'src/app'),
    });
  });

  it('should strip "/*" from both the key and the value', function () {
    const tsconfig = {
      compilerOptions: {
        paths: {
          '@utils/*': ['src/utils/*'],
        },
      },
    };

    const result = getPathAlias(tsconfig, rootDir);

    expect(result['@utils']).toBe(path.resolve(rootDir, 'src/utils'));
  });

  it('should handle multiple aliases', function () {
    const tsconfig = {
      compilerOptions: {
        paths: {
          '@app/*': ['src/app/*'],
          '@lib/*': ['src/lib/*'],
          '@shared/*': ['src/shared/*'],
        },
      },
    };

    const result = getPathAlias(tsconfig, rootDir);

    expect(result).toEqual({
      '@app': path.resolve(rootDir, 'src/app'),
      '@lib': path.resolve(rootDir, 'src/lib'),
      '@shared': path.resolve(rootDir, 'src/shared'),
    });
  });

  it('should return an empty object when paths is empty', function () {
    const tsconfig = { compilerOptions: { paths: {} } };

    const result = getPathAlias(tsconfig, rootDir);

    expect(result).toEqual({});
  });

  it('should throw when an alias has an empty path array', function () {
    const tsconfig = {
      compilerOptions: {
        paths: { '@bad/*': [] as string[] },
      },
    };

    expect(() => getPathAlias(tsconfig, rootDir)).toThrow("Invalid path alias for key '@bad/*'");
  });

  it('should resolve paths relative to the provided rootDir', function () {
    const customRoot = '/custom/root';
    const tsconfig = {
      compilerOptions: {
        paths: { '@src/*': ['src/*'] },
      },
    };

    const result = getPathAlias(tsconfig, customRoot);

    expect(result['@src']).toBe(path.resolve(customRoot, 'src'));
  });
});

// ─── reporters ───────────────────────────────────────────────────────────────

describe('reporters', function () {
  it('should include "default" and "html" reporters outside CI', async function () {
    vi.stubEnv('GITHUB_ACTIONS', undefined as unknown as string);
    vi.resetModules();
    const { reporters } = await import('../src/reporters.js');

    expect(reporters).toContain('default');
    expect(reporters).toContain('html');
    expect(reporters).not.toContain('github-actions');

    vi.unstubAllEnvs();
  });

  it('should include "github-actions" reporter when GITHUB_ACTIONS is set', async function () {
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.resetModules();
    const { reporters } = await import('../src/reporters.js');

    expect(reporters).toContain('default');
    expect(reporters).toContain('html');
    expect(reporters).toContain('github-actions');

    vi.unstubAllEnvs();
  });
});

// ─── openapi ─────────────────────────────────────────────────────────────────

describe('setupOpenapi', function () {
  beforeEach(function () {
    vi.mock('jest-openapi', () => ({
      default: {
        default: vi.fn(),
      },
    }));
  });

  afterEach(function () {
    vi.restoreAllMocks();
    // @ts-expect-error - reset global expect to avoid conflicts with other test frameworks
    globalThis.expect = undefined as unknown as typeof expect;
  });

  it('should call jestOpenApi with the provided path', async function () {
    const jestOpenApi = await import('jest-openapi');
    const mockSetup = vi.mocked(jestOpenApi.default.default);

    setupOpenapi('/some/path/openapi.yaml');

    expect(mockSetup).toHaveBeenCalledWith('/some/path/openapi.yaml');
  });

  it('should reset globalThis.expect to undefined after setup', function () {
    setupOpenapi('/some/path/openapi.yaml');

    expect((globalThis as Record<string, unknown>)['expect']).toBeUndefined();
  });
});
