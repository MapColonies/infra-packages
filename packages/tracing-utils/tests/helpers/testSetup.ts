import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';

export interface TracingTestContext {
  exporter: InMemorySpanExporter;
  provider: NodeTracerProvider;
}

export function setupTracing(): TracingTestContext {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register();

  return { exporter, provider };
}

export function teardownTracing(context: TracingTestContext): void {
  trace.disable();
  context.exporter.reset();
}
