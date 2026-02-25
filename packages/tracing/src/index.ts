import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations, type InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor, type SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations, type Instrumentation } from '@opentelemetry/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as api from '@opentelemetry/api';
import type { Prettify } from './common/types';
import type { TelemetryBase } from './common/interfaces';
import { getTracingConfig, type TracingConfig } from './config';

export type { TracingConfig, TelemetryBase };

/**
 * The options to configure the tracing functionality.
 * @public
 */
export interface TracingOptions extends Partial<TracingConfig> {
  /**
   * Optional array of instrumentations.
   */
  instrumentations?: Instrumentation[];
  /**
   * Optional map of auto-instrumentation configurations.
   */
  autoInstrumentationsConfigMap?: InstrumentationConfigMap;
  /**
   * Optional attributes to be added to the resource.
   */
  attributes?: api.Attributes;
  /**
   * Optional flag to enable debug mode.
   */
  debug?: boolean;
}

/**
 * Represents a Tracing instance that provides telemetry functionality.
 * @public
 */
export class Tracing implements TelemetryBase<void> {
  private provider?: NodeTracerProvider;
  private readonly config: TracingConfig;
  private readonly instrumentations?: Instrumentation[];
  private readonly autoInstrumentationsConfigMap?: InstrumentationConfigMap;
  private readonly attributes?: api.Attributes;

  /**
   * Creates a new instance of the Tracing class.
   * @param options - The options to configure the tracing functionality.
   */
  public constructor(options: Prettify<TracingOptions> = {}) {
    const { instrumentations, autoInstrumentationsConfigMap, attributes, ...config } = options;
    this.config = getTracingConfig(config);
    this.instrumentations = options.instrumentations;
    this.autoInstrumentationsConfigMap = autoInstrumentationsConfigMap;
    this.attributes = attributes;
  }

  /**
   * Starts the tracing functionality.
   */
  public start(): void {
    if (!this.config.isEnabled) {
      return;
    }
    const { serviceVersion, serviceName, traceRatio, ...exporterConfig } = this.config;

    const exporter = new OTLPTraceExporter(exporterConfig);
    const processors: SpanProcessor[] = [new BatchSpanProcessor(exporter)];

    if (this.config.debug) {
      api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.ALL);
      processors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    }

    this.provider = new NodeTracerProvider({
      spanProcessors: processors,
      sampler: new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(traceRatio),
      }),
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: serviceVersion,
        ...this.attributes,
      }),
    });

    this.provider.register();

    registerInstrumentations({
      instrumentations: [
        ...getNodeAutoInstrumentations({
          ...this.autoInstrumentationsConfigMap,
          ['@opentelemetry/instrumentation-pino']: { enabled: false },
        }),
        ...(this.instrumentations ?? []),
      ],
    });
  }

  /**
   * Stops the tracing functionality.
   * @returns A promise that resolves when the tracing is stopped.
   */
  public async stop(): Promise<void> {
    await this.provider?.shutdown();
  }
}
