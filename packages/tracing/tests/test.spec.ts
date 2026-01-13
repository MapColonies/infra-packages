import { beforeAll, describe, it, expect, afterEach } from 'vitest';
import { trace } from '@opentelemetry/api';
import { readPackageJsonSync } from '@map-colonies/read-pkg';
import nock, { disableNetConnect } from 'nock';
import { Tracing } from '../src';
import { TracesData } from './generated/trace';

async function initializeTracingSession() {
  const tracing = new Tracing({ isEnabled: true, serviceName: 'test-service', url: 'http://localhost:4318/v1/traces', attributes: { avi: 'avi' } });
  tracing.start();

  const tracer = trace.getTracer('default');
  const span = tracer.startSpan('test-span');
  span.end();

  await tracing.stop();
}

describe('tracing package', function () {
  beforeAll(function () {
    disableNetConnect();
  });

  afterEach(function () {
    // Unregister the global tracer provider to allow fresh registration in next test
    trace.disable();
  });
  it('should send traces correctly', async function () {
    let interceptedData: TracesData | null = null;

    nock('http://localhost:4318')
      .post('/v1/traces')
      .reply(200, function (uri, requestBody) {
        const buffer = Buffer.from(requestBody as string, 'hex');
        interceptedData = TracesData.fromBinary(buffer);
        return {};
      });

    await initializeTracingSession();

    expect(interceptedData).not.toBeNull();
    expect(interceptedData!.resourceSpans[0]?.scopeSpans[0]?.spans[0]).toHaveProperty('name', 'test-span');
  });

  it('should add service name and version to the resource attributes', async function () {
    let interceptedData: TracesData | null = null;

    nock('http://localhost:4318')
      .post('/v1/traces')
      .reply(200, function (uri, requestBody) {
        const buffer = Buffer.from(requestBody as string, 'hex');

        interceptedData = TracesData.fromBinary(buffer);
        return {};
      });

    await initializeTracingSession();

    expect(interceptedData).not.toBeNull();
    expect(interceptedData!.resourceSpans[0]?.resource?.attributes).toEqual([
      { key: 'service.name', value: { value: { oneofKind: 'stringValue', stringValue: 'test-service' } } },
      {
        key: 'service.version',
        value: {
          value: {
            oneofKind: 'stringValue',
            stringValue: readPackageJsonSync().version,
          },
        },
      },
      expect.anything(),
    ]);
  });

  it('should add custom attributes to the resource', async function () {
    let interceptedData: TracesData | null = null;

    nock('http://localhost:4318')
      .post('/v1/traces')
      .reply(200, function (uri, requestBody) {
        const buffer = Buffer.from(requestBody as string, 'hex');

        interceptedData = TracesData.fromBinary(buffer);
        return {};
      });

    await initializeTracingSession();

    expect(interceptedData).not.toBeNull();
    expect(interceptedData!.resourceSpans[0]?.resource?.attributes).toContainEqual({
      key: 'avi',
      value: { value: { oneofKind: 'stringValue', stringValue: 'avi' } },
    });
  });
});
