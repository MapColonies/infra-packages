import baseConfig from './dist/configs/ts-base.mjs';
import { defineConfig } from 'eslint/config';

export default defineConfig(baseConfig, { ignores: ['vitest.config.ts'] });
