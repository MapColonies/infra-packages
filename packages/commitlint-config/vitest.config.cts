import { mergeConfig, defineProject } from 'vitest/config';
import sharedConfig from 'vitest-config';

// Each test spawns `npx commitlint`, which gets slow when Turbo runs every package's tests in parallel.
const TEST_TIMEOUT_MS = 30_000;

export default mergeConfig(sharedConfig, defineProject({ test: { testTimeout: TEST_TIMEOUT_MS } }));
