import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { getTraceContextHeaderMiddleware } from '../../src/middleware/traceOnHeaderMiddleware';
import { setupTracing, teardownTracing, type TracingTestContext } from '../helpers/testSetup';

describe('getTraceContextHeaderMiddleware', () => {
  let context: TracingTestContext;
  let app: Express;

  beforeEach(() => {
    context = setupTracing();
    app = express();
    app.use(getTraceContextHeaderMiddleware());
    app.get('/test', (_req, res) => {
      res.status(200).json({ success: true });
    });
  });

  afterEach(() => {
    teardownTracing(context);
  });

  it('should set traceparent header when span is active', async () => {
    expect.assertions(3);
    const tracer = trace.getTracer('test');

    await tracer.startActiveSpan('test-span', async (span) => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('traceparent');

      const traceparent = response.headers['traceparent'] as string;
      const spanContext = span.spanContext();
      const expectedTraceParent = `00-${spanContext.traceId}-${spanContext.spanId}-0${Number(spanContext.traceFlags || 0).toString(16)}`;

      expect(traceparent).toBe(expectedTraceParent);

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    });
  });

  it('should not set traceparent header when no active span', async () => {
    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.headers).not.toHaveProperty('traceparent');
  });

  it('should format traceparent correctly with W3C trace context format', async () => {
    expect.assertions(1);
    const tracer = trace.getTracer('test');

    await tracer.startActiveSpan('test-span', async (span) => {
      const response = await request(app).get('/test');

      const traceparent = response.headers['traceparent'] as string;
      expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[0-9a-f]$/);

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    });
  });

  it('should include trace context in response while maintaining normal app behavior', async () => {
    expect.assertions(3);
    const tracer = trace.getTracer('test');

    await tracer.startActiveSpan('test-span', async (span) => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(response.headers).toHaveProperty('traceparent');

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    });
  });
});
