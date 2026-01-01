import type { IncomingMessage, RequestOptions } from 'node:http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import {
  contextBindingHelper,
  ignoreIncomingRequestUrl,
  ignoreOutgoingRequestPath,
  asyncCallWithSpan,
  callWithSpan,
  handleSpanOnSuccess,
  handleSpanOnError,
} from '../src/utils';
import { setupTracing, teardownTracing, type TracingTestContext } from './helpers/testSetup';

describe('tracing-utils', () => {
  let context: TracingTestContext;

  beforeEach(() => {
    context = setupTracing();
  });

  afterEach(() => {
    teardownTracing(context);
  });

  describe('contextBindingHelper', () => {
    it('should bind function to span context', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('parent');

      let executedInContext = false;
      const boundFunc = contextBindingHelper(span, () => {
        executedInContext = true;
      });

      boundFunc();
      span.end();

      expect(executedInContext).toBe(true);
    });
  });

  describe('ignoreIncomingRequestUrl', () => {
    it('should return true when URL matches regex', () => {
      const ignore = ignoreIncomingRequestUrl([/\/health/, /\/metrics/]);
      const request = { url: '/health' } as IncomingMessage;

      expect(ignore(request)).toBe(true);
    });

    it('should return false when URL does not match any regex', () => {
      const ignore = ignoreIncomingRequestUrl([/\/health/, /\/metrics/]);
      const request = { url: '/api/users' } as IncomingMessage;

      expect(ignore(request)).toBe(false);
    });

    it('should handle missing URL', () => {
      const ignore = ignoreIncomingRequestUrl([/\/health/]);
      const request = {} as IncomingMessage;

      expect(ignore(request)).toBe(false);
    });
  });

  describe('ignoreOutgoingRequestPath', () => {
    it('should return true when path matches regex', () => {
      const ignore = ignoreOutgoingRequestPath([/\/health/, /\/metrics/]);
      const request = { path: '/health' } as RequestOptions;

      expect(ignore(request)).toBe(true);
    });

    it('should return false when path does not match any regex', () => {
      const ignore = ignoreOutgoingRequestPath([/\/health/, /\/metrics/]);
      const request = { path: '/api/users' } as RequestOptions;

      expect(ignore(request)).toBe(false);
    });

    it('should handle missing path', () => {
      const ignore = ignoreOutgoingRequestPath([/\/health/]);
      const request = {} as RequestOptions;

      expect(ignore(request)).toBe(false);
    });
  });

  describe('asyncCallWithSpan', () => {
    it('should create span and resolve with result on success', async () => {
      const tracer = trace.getTracer('test');
      const result = await asyncCallWithSpan(async () => Promise.resolve('success'), tracer, 'test-span');

      expect(result).toBe('success');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('test-span');
      expect(spans[0]!.status.code).toBe(SpanStatusCode.OK);
    });

    it('should provide span to function', async () => {
      const tracer = trace.getTracer('test');
      let receivedSpan = false;

      await asyncCallWithSpan(
        async (span) => {
          receivedSpan = span !== undefined;
          return Promise.resolve();
        },
        tracer,
        'test-span'
      );

      expect(receivedSpan).toBe(true);
    });

    it('should set span status to ERROR and reject on failure', async () => {
      const tracer = trace.getTracer('test');
      const error = new Error('test error');

      await expect(
        asyncCallWithSpan(
          async () => {
            return Promise.reject(error);
          },
          tracer,
          'test-span'
        )
      ).rejects.toThrow('test error');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0]!.events).toHaveLength(1);
      expect(spans[0]!.events[0]!.name).toBe('exception');
    });

    it('should accept span options', async () => {
      const tracer = trace.getTracer('test');
      await asyncCallWithSpan(async () => Promise.resolve('success'), tracer, 'test-span', { attributes: { testAttr: 'value' } });

      const spans = context.exporter.getFinishedSpans();
      expect(spans[0]!.attributes).toHaveProperty('testAttr', 'value');
    });
  });

  describe('callWithSpan', () => {
    it('should create span and return result on success', () => {
      const tracer = trace.getTracer('test');
      const result = callWithSpan(() => 'success', tracer, 'test-span');

      expect(result).toBe('success');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('test-span');
      expect(spans[0]!.status.code).toBe(SpanStatusCode.OK);
    });

    it('should provide span to function', () => {
      const tracer = trace.getTracer('test');
      let receivedSpan = false;

      callWithSpan(
        (span) => {
          receivedSpan = span !== undefined;
        },
        tracer,
        'test-span'
      );

      expect(receivedSpan).toBe(true);
    });

    it('should set span status to ERROR and throw on failure', () => {
      const tracer = trace.getTracer('test');
      const error = new Error('test error');

      expect(() =>
        callWithSpan(
          () => {
            throw error;
          },
          tracer,
          'test-span'
        )
      ).toThrow('test error');

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.status.code).toBe(SpanStatusCode.ERROR);
      expect(spans[0]!.events).toHaveLength(1);
      expect(spans[0]!.events[0]!.name).toBe('exception');
    });

    it('should accept span options', () => {
      const tracer = trace.getTracer('test');
      callWithSpan(() => 'success', tracer, 'test-span', { attributes: { testAttr: 'value' } });

      const spans = context.exporter.getFinishedSpans();
      expect(spans[0]!.attributes).toHaveProperty('testAttr', 'value');
    });
  });

  describe('handleSpanOnSuccess', () => {
    it('should set status to OK and end span', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-span');

      handleSpanOnSuccess(span);

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.status.code).toBe(SpanStatusCode.OK);
    });

    it('should handle undefined span gracefully', () => {
      expect(() => handleSpanOnSuccess(undefined)).not.toThrow();
    });
  });

  describe('handleSpanOnError', () => {
    it('should set status to ERROR and end span', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-span');

      handleSpanOnError(span);

      const spans = context.exporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0]!.status.code).toBe(SpanStatusCode.ERROR);
    });

    it('should record exception when error is provided', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-span');
      const error = new Error('test error');

      handleSpanOnError(span, error);

      const spans = context.exporter.getFinishedSpans();
      expect(spans[0]!.events).toHaveLength(1);
      expect(spans[0]!.events[0]!.name).toBe('exception');
    });

    it('should not record exception when error is not an Error instance', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-span');

      handleSpanOnError(span, 'string error');

      const spans = context.exporter.getFinishedSpans();
      expect(spans[0]!.events).toHaveLength(0);
    });

    it('should handle undefined span gracefully', () => {
      expect(() => handleSpanOnError(undefined)).not.toThrow();
      expect(() => handleSpanOnError(undefined, new Error('test'))).not.toThrow();
    });
  });
});
