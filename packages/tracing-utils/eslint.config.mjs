import baseConfig, { namingConventions } from '@map-colonies/eslint-config/ts-base';
import { defineConfig } from 'eslint/config';

const SemanticConventionsExtension = {
  selector: ['objectLiteralProperty', 'typeProperty'],
  format: null,
  filter: {
    match: true,
    regex: '^(trace_id|span_id|trace_flags)$',
  },
};

const namingConvention = [...namingConventions, SemanticConventionsExtension];

const customConfig = {
  rules: {
    '@typescript-eslint/naming-convention': namingConvention,
  },
};

export default defineConfig(baseConfig, customConfig, { ignores: ['vitest.config.ts'] });
