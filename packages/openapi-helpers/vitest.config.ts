import { mergeConfig, defineProject } from 'vitest/config';
import sharedConfig from 'vitest-config';

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      root: __dirname,
      globalSetup: './tests/configurations/vitest.teardown.ts',
    },
  })
);
