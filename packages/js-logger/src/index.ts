import { pino, LoggerOptions as PinoOptions, Logger, TransportSingleOptions, transport as pinoTransport, DestinationStream } from 'pino';
import { pinoCaller } from 'pino-caller';
import type { Options } from 'pino-opentelemetry-transport';
import { readPackageJsonSync } from '@map-colonies/read-pkg';

/**
 * Options for configuring the logger.
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
 */
function jsLogger(options?: LoggerOptions, destination: string | number = 1): Logger {
  let transport: TransportSingleOptions = { target: 'pino/file', options: { destination } };

  /* istanbul ignore next */
  if (options?.prettyPrint === true) {
    transport = { target: 'pino-pretty' };

    delete options.prettyPrint;
  }

  if (options?.opentelemetryOptions?.enabled === true) {
    const pkg = readPackageJsonSync();
    const otelOptions: Options = {
      loggerName: 'js-logger',
      serviceVersion: pkg.version ?? '1.0.0',
      resourceAttributes: options.opentelemetryOptions.resourceAttributes,
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
    transport = { target: 'pino-opentelemetry-transport', options: otelOptions };
  }
  const pinoOptions: PinoOptions = { ...baseOptions, ...options };
  const logger = pino(pinoOptions, pinoTransport(transport) as DestinationStream);

  if (options?.pinoCaller === true) {
    return pinoCaller(logger);
  }

  return logger;
}

export type { Logger } from 'pino';
export type { LoggerOptions };
export default jsLogger;
