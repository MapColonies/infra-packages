import type { UserConfig } from '@commitlint/types';

const ERROR = 2;

const commitlintConfig = <UserConfig>{
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      ERROR,
      'always',
      ['deps', 'devdeps', 'helm', 'build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'],
    ],
  },
};

export = commitlintConfig;
