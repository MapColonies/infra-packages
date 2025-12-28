import { KnipConfig } from 'knip';

type UnwrapConfig<T> = T extends (...args: any[]) => infer R // 1. Is it a function? Get the return type.
  ? UnwrapConfig<R> // 2. Recurse (in case it's () => Promise<config>)
  : T extends Promise<infer P> // 3. Is it a Promise? Get the resolved type.
    ? UnwrapConfig<P> // 4. Recurse
    : T;

type PackageConfig = Exclude<UnwrapConfig<KnipConfig>['workspaces'], undefined>[string];

const basePackageConfig: PackageConfig = {
  entry: ['src/index.ts'],
  vitest: { config: 'vitest.config.cts', entry: ['tests/**/*.spec.ts'] },
  typescript: {
    config: ['tsconfig.json', 'tsconfig.build.json'],
  },
};

const config: KnipConfig = {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
  workspaces: {
    'packages/*': {
      ...basePackageConfig,
    },
    'packages/commitlint-config': {
      ...basePackageConfig,
      ignore: 'commitlint.config.js',
      ignoreDependencies: ['@commitlint/config-conventional'],
    },
    'packages/eslint-config': {
      ...basePackageConfig,
      entry: ['src/configs/**'],
      ignoreDependencies: ['eslint-plugin-react-hooks', 'eslint-plugin-jest', 'eslint-plugin-react'],
    },
    'packages/typescript-config': {
      entry: [],
    },
    'packages/prettier-config': {
      entry: [],
    },
  },
  tags: ['-lintignore'],
};

export default config;
