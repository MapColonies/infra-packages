import type { JSONSchemaType } from 'ajv';
import { type CommonConfig, getCommonConfig, mergeAndValidateConfig } from './common/config';

const DEFAULT_URL = 'http://localhost:4318/v1/traces';

/**
 * Represents the configuration options for tracing.
 */
interface BaseTracingConfig {
  /**
   * Specifies whether tracing is enabled.
   */
  isEnabled: boolean;
  /**
   * The URL to an HTTP OTLP endpoint to send the traces to.
   */
  url: string;
  /**
   * The ratio of traces to sample.
   */
  traceRatio: number;
  /**
   * Specifies whether to enable debug mode for tracing.
   * Debug mode will enable the opentelemetry debug log and log traces to the console.
   */
  debug: boolean;
}

/**
 * @public
 */
type TracingConfig = BaseTracingConfig & CommonConfig;

const tracingConfigSchema: JSONSchemaType<BaseTracingConfig> = {
  type: 'object',
  properties: {
    isEnabled: { type: 'boolean', default: false },
    url: { type: 'string', default: DEFAULT_URL, format: 'uri', pattern: '^http://|^https://' },
    traceRatio: { type: 'number', default: 1, minimum: 0, maximum: 1 },
    debug: { type: 'boolean', default: false },
  },
  required: ['isEnabled'],
};

const tracingConfigEnv: Partial<Record<keyof BaseTracingConfig, string>> = {
  isEnabled: process.env.TELEMETRY_TRACING_ENABLED,
  url: process.env.TELEMETRY_TRACING_URL,
  traceRatio: process.env.TELEMETRY_TRACING_RATIO,
  debug: process.env.TELEMETRY_TRACING_DEBUG,
};

/**
 * Retrieves the tracing configuration.
 * @returns The tracing configuration object.
 */
function getTracingConfig(options: Partial<BaseTracingConfig> & Partial<CommonConfig> = {}): TracingConfig {
  const { traceRatio, isEnabled, url, debug, ...commonConfigInput } = options;
  const commonConfig = getCommonConfig(commonConfigInput);

  const tracingConfig = mergeAndValidateConfig<BaseTracingConfig>({ traceRatio, isEnabled, url, debug }, tracingConfigEnv, tracingConfigSchema);

  return {
    ...commonConfig,
    ...tracingConfig,
  };
}

export { type TracingConfig, getTracingConfig };
