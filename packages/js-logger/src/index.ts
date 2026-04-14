import pino, {
  type ThreadStream,
  type LoggerOptions as PinoOptions,
  type Logger,
  type TransportSingleOptions,
  transport as pinoTransport,
  type DestinationStream,
} from 'pino';
import { detectResources } from '@opentelemetry/resources';
import { containerDetector } from '@opentelemetry/resource-detector-container';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_K8S_POD_UID } from '@opentelemetry/semantic-conventions/incubating';
import { pinoCaller } from 'pino-caller';
import type { Options } from 'pino-opentelemetry-transport';
import { readPackageJsonSync } from '@map-colonies/read-pkg';
import { PACKAGE_VERSION } from './version';

/**
 * Options for configuring the logger.
 * @public
 */
interface LoggerOptions {
  /**
   * Determines if logging is enabled.
   */
  enabled?: PinoOptions['enabled'];
  /**
   * Specifies the logging level.
   */
  level?: PinoOptions['level'];
  /**
   * Defines paths to redact from log output.
   */
  redact?: PinoOptions['redact'];
  /**
   * Hooks for customizing log behavior.
   */
  hooks?: PinoOptions['hooks'];
  /**
   * Base properties to include in log output.
   */
  base?: PinoOptions['base'];
  /**
   * Function to add custom properties to log output.
   */
  mixin?: PinoOptions['mixin'];
  /**
   * Enables pretty-printing of log output.
   */
  prettyPrint?: boolean;
  /**
   * Includes the caller's file and line number in log output.
   */
  pinoCaller?: boolean;

  /**
   * Options for OpenTelemetry integration.
   */
  opentelemetryOptions?: {
    /**
     * Enables OpenTelemetry logging.
     */
    enabled?: boolean;
    /**
     * The URL for the OpenTelemetry collector.
     */
    url?: string;
    /**
     * Additional resource attributes for OpenTelemetry.
     * */
    resourceAttributes?: Record<string, string>;
  };
}

const baseOptions: PinoOptions = {
  formatters: {
    level(label): Record<string, string> {
      return { level: label };
    },
  },
};

/**
 * Creates a logger instance with the specified options and destination.
 *
 * @param options - Optional configuration for the logger.
 * @param destination - The destination for the log output. Can be a file path or a file descriptor number. Default is 1.
 * @returns The configured logger instance.
 * @public
 */
export async function jsLogger(options?: LoggerOptions, destination: string | number = 1): Promise<Logger> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let transport: ThreadStream = pinoTransport({ target: 'pino/file', options: { destination } });

  /* istanbul ignore next */
  if (options?.prettyPrint === true) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    transport = pinoTransport({ target: 'pino-pretty' });

    delete options.prettyPrint;
  }

  if (options?.opentelemetryOptions?.enabled === true) {
    const pkg = readPackageJsonSync();

    const detectedResources = detectResources({ detectors: [containerDetector] });
    await detectedResources.waitForAsyncAttributes?.();

    const otelOptions: Options = {
      loggerName: 'js-logger',
      serviceVersion: PACKAGE_VERSION,
      resourceAttributes: {
        ...detectedResources.attributes,
        [ATTR_SERVICE_NAME]: pkg.name,
        [ATTR_SERVICE_VERSION]: pkg.version,
        [ATTR_K8S_POD_UID]: process.env.K8S_POD_UID,
        ...options.opentelemetryOptions.resourceAttributes,
      },
      logRecordProcessorOptions: [
        {
          recordProcessorType: 'simple',
          exporterOptions: {
            protocol: 'console',
          },
        },
        {
          recordProcessorType: 'batch',
          exporterOptions: { protocol: 'grpc', grpcExporterOptions: { url: options.opentelemetryOptions.url ?? 'http://localhost:4317' } },
        },
      ],
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    transport = pinoTransport({ target: 'pino-opentelemetry-transport', options: otelOptions });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    transport.on('error', (err: unknown) => {
      console.error('OpenTelemetry transport error:', err);
    });

    delete baseOptions.formatters;
  }
  const pinoOptions: PinoOptions = { ...baseOptions, ...options };
  const logger = pino(pinoOptions, transport as DestinationStream);

  if (options?.pinoCaller === true) {
    return pinoCaller(logger);
  }

  return logger;
}

export type { Logger } from 'pino';
export type { LoggerOptions };
