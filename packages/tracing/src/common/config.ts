import { hostname } from 'os';
import ajv, { type JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { betterAjvErrors } from '@apideck/better-ajv-errors';
import { loadPackageInfo } from '../common/packageInfoLoader';

/**
 * Represents the configuration for common settings.
 */
interface CommonConfig {
  /**
   * The name of the service to put as attribute.
   * By default will be read from the package.json file.
   */
  serviceName: string;
  /**
   * The value of the hostname attribute to use, will override the hostname.
   */
  hostname: string;
  /**
   * The version of the service to put as attribute.
   * By default will be read from the package.json file.
   */
  serviceVersion: string;
}

const ajvInstance = addFormats(
  new ajv({
    useDefaults: true,
    coerceTypes: true,
    allErrors: true,
    verbose: true,
  })
);

const JSON_INDENTATION = 2;

function mergeAndValidateConfig<T extends Record<keyof T, string | boolean | undefined | null | number>>(
  inputConfig: Partial<T>,
  envConfig: Partial<Record<keyof T, string>>,
  schema: JSONSchemaType<T>
): T {
  // clean up undefined values so that they don't override the defaults
  for (const key in envConfig) {
    if (envConfig[key] === undefined) {
      delete envConfig[key];
    }
  }

  const mergedConfig = { ...inputConfig, ...envConfig };

  const isValid = ajvInstance.validate(schema, mergedConfig);

  if (!isValid) {
    const betterErrors = betterAjvErrors({
      schema: schema as Parameters<typeof betterAjvErrors>[0]['schema'],
      data: mergedConfig,
      errors: ajvInstance.errors,
    });
    throw new Error(JSON.stringify(betterErrors, null, JSON_INDENTATION));
  }

  return mergedConfig;
}

const packageJsonInfo = loadPackageInfo();

const commonConfigSchema: JSONSchemaType<CommonConfig> = {
  type: 'object',
  properties: {
    serviceName: { type: 'string', default: packageJsonInfo.name },
    hostname: { type: 'string', default: hostname() },
    serviceVersion: { type: 'string', default: packageJsonInfo.version },
  },
  required: ['serviceName', 'hostname', 'serviceVersion'],
};

const envCommonConfig: Partial<CommonConfig> = {
  serviceName: process.env.TELEMETRY_SERVICE_NAME,
  hostname: process.env.TELEMETRY_HOST_NAME,
  serviceVersion: process.env.TELEMETRY_SERVICE_VERSION,
};

let commonConfig: CommonConfig | undefined;

function getCommonConfig(options: Partial<CommonConfig>): CommonConfig {
  if (commonConfig) {
    return commonConfig;
  }

  commonConfig = mergeAndValidateConfig<CommonConfig>(options, envCommonConfig, commonConfigSchema);

  return commonConfig;
}

export { type CommonConfig, getCommonConfig, mergeAndValidateConfig };
