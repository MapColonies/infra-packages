import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { getOtelMixin } from '../src/mixin';
import { setupTracing, teardownTracing, type TracingTestContext } from './helpers/testSetup';

describe('getOtelMixin', () => {
  let context: TracingTestContext;

  beforeEach(() => {
    context = setupTracing();
  });

  afterEach(() => {
    teardownTracing(context);
  });

  it('should return trace information when span is active', () => {
    expect.assertions(4);
    const tracer = trace.getTracer('test');
    const mixin = getOtelMixin();

    tracer.startActiveSpan('test-span', (span) => {
      const result = mixin({}, 30);

      expect(result).toHaveProperty('trace_id');
      expect(result).toHaveProperty('span_id');
      expect(result).toHaveProperty('trace_flags');

      const spanContext = span.spanContext();
      expect(result).toEqual({
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
        trace_flags: `0${spanContext.traceFlags.toString(16)}`,
      });

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    });
  });

  it('should return empty object when no active span', () => {
    const mixin = getOtelMixin();
    const result = mixin({}, 30);

    expect(result).toEqual({});
  });

  it('should return empty object when span context is invalid', () => {
    const tracer = trace.getTracer('test');
    const mixin = getOtelMixin();

    const span = tracer.startSpan('test-span');
    span.end();

    const result = mixin({}, 30);
    expect(result).toEqual({});
  });

  it('should format trace flags correctly', () => {
    expect.assertions(1);
    const tracer = trace.getTracer('test');
    const mixin = getOtelMixin();

    tracer.startActiveSpan('test-span', (span) => {
      const result = mixin({}, 30) as { trace_flags: string };

      expect(result.trace_flags).toMatch(/^0[0-9a-f]$/);

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    });
  });
});
