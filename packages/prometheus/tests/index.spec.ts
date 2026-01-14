import express from 'express';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Registry, Counter, Histogram } from 'prom-client';
import { metricsMiddleware, collectMetricsExpressMiddleware } from '../src';

describe('Prometheus Middlewares', () => {
  let app: express.Application;
  let registry: Registry;

  beforeEach(() => {
    app = express();
    registry = new Registry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('metricsMiddleware', () => {
    it('should return metrics from the registry', async () => {
      // Setup custom metric
      const counter = new Counter({
        name: 'test_counter',
        help: 'Test counter metric',
        registers: [registry],
      });
      counter.inc();

      app.get('/metrics', metricsMiddleware(registry, false));

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.text).toContain('test_counter');
      expect(response.text).toContain('# HELP test_counter Test counter metric');
      expect(response.text).toContain('# TYPE test_counter counter');
      expect(response.text).toContain('test_counter 1');
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    it('should collect default metrics when enabled', async () => {
      app.get('/metrics', metricsMiddleware(registry, true));

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      // Check for some common default metrics
      expect(response.text).toContain('process_cpu_user_seconds_total');
      expect(response.text).toContain('nodejs_heap_size_total_bytes');
    });

    it('should not collect default metrics when disabled', async () => {
      app.get('/metrics', metricsMiddleware(registry, false));

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.text).not.toContain('process_cpu_user_seconds_total');
      expect(response.text).not.toContain('nodejs_heap_size_total_bytes');
    });

    it('should apply default metrics labels when provided', async () => {
      const labels = { environment: 'test', region: 'us-east-1' };
      app.get('/metrics', metricsMiddleware(registry, true, labels));

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.text).toContain('environment="test"');
      expect(response.text).toContain('region="us-east-1"');
    });

    it('should handle multiple custom metrics', async () => {
      const counter1 = new Counter({
        name: 'custom_counter_1',
        help: 'First custom counter',
        registers: [registry],
      });

      const counter2 = new Counter({
        name: 'custom_counter_2',
        help: 'Second custom counter',
        labelNames: ['status'],
        registers: [registry],
      });

      const histogram = new Histogram({
        name: 'custom_histogram',
        help: 'Custom histogram metric',
        buckets: [0.1, 0.5, 1, 5],
        registers: [registry],
      });

      counter1.inc(5);
      counter2.labels('success').inc(10);
      counter2.labels('error').inc(2);
      histogram.observe(0.3);
      histogram.observe(0.8);
      histogram.observe(2.5);

      app.get('/metrics', metricsMiddleware(registry, false));

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.text).toContain('custom_counter_1 5');
      expect(response.text).toContain('custom_counter_2{status="success"} 10');
      expect(response.text).toContain('custom_counter_2{status="error"} 2');
      expect(response.text).toContain('custom_histogram_bucket');
      expect(response.text).toContain('custom_histogram_sum');
      expect(response.text).toContain('custom_histogram_count 3');
    });

    it('should handle errors from registry.metrics()', async () => {
      const mockRegistry = {
        metrics: vi.fn().mockRejectedValue(new Error('Registry error')),
        contentType: 'text/plain',
      } as unknown as Registry;

      app.get('/metrics', metricsMiddleware(mockRegistry, false));

      // Add error handler to catch the error
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Registry error');
    });
  });

  describe('collectMetricsExpressMiddleware', () => {
    it('should collect HTTP request metrics', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      // Make a test request
      await request(app).get('/test');

      // Check metrics
      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('http_request_duration_seconds');
      expect(metricsResponse.text).toContain('method="GET"');
      expect(metricsResponse.text).toContain('status_code="200"');
    });

    it('should include hostname and service_name labels', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('hostname=');
      expect(metricsResponse.text).toContain('service_name="@map-colonies/prometheus"');
    });

    it('should include custom labels', async () => {
      const labels = { environment: 'production', datacenter: 'dc1' };
      app.use(collectMetricsExpressMiddleware({ registry, labels, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('environment="production"');
      expect(metricsResponse.text).toContain('datacenter="dc1"');
    });

    it('should collect service version metrics', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('service_version');
      expect(metricsResponse.text).toContain('service_version_major="0"');
      expect(metricsResponse.text).toContain('service_version_minor="0"');
      expect(metricsResponse.text).toContain('service_version_patch="1"');
    });

    it('should collect service version metrics with prefix', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('service_version');
    });

    it('should collect node metrics when enabled', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: true, collectServiceVersion: false }));
      app.get('/metrics', metricsMiddleware(registry, false));

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('process_cpu_user_seconds_total');
      expect(metricsResponse.text).toContain('nodejs_heap_size_total_bytes');
    });

    it('should not collect node metrics when disabled', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).not.toContain('process_cpu_user_seconds_total');
    });

    it('should include operation id when available', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, includeOperationId: true, collectNodeMetrics: false, collectServiceVersion: false }));

      // Simulate express-openapi-validator setting operationId
      app.get(
        '/test',
        (req, res, next) => {
          (req as unknown as { openapi: { schema: { operationId: string } } }).openapi = { schema: { operationId: 'testOperation' } };
          next();
        },
        (req, res) => res.json({ success: true })
      );

      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('operation="testOperation"');
    });

    it('should handle requests without operation id', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, includeOperationId: true, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      // Should still work, just without the operation label filled
      expect(metricsResponse.text).toContain('http_request_duration_seconds');
    });

    it('should support custom transformLabels function', async () => {
      const transformLabels = vi.fn((customLabels) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        customLabels['custom_label'] = 'custom_value';
      });

      app.use(
        collectMetricsExpressMiddleware({
          registry,
          transformLabels,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          customLabels: { custom_label: null },
          collectNodeMetrics: false,
          collectServiceVersion: false,
        })
      );
      app.get('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      expect(transformLabels).toHaveBeenCalled();

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('custom_label="custom_value"');
    });

    it('should track different HTTP methods separately', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => res.json({ success: true }));
      app.post('/test', (req, res) => res.json({ success: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');
      await request(app).post('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('method="GET"');
      expect(metricsResponse.text).toContain('method="POST"');
    });

    it('should track different status codes', async () => {
      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/success', (req, res) => res.status(200).json({ success: true }));
      app.get('/created', (req, res) => res.status(201).json({ created: true }));
      app.get('/error', (req, res) => res.status(500).json({ error: true }));
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/success');
      await request(app).get('/created');
      await request(app).get('/error');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.text).toContain('status_code="200"');
      expect(metricsResponse.text).toContain('status_code="201"');
      expect(metricsResponse.text).toContain('status_code="500"');
    });

    it('should work with custom metrics in the same registry', async () => {
      const customCounter = new Counter({
        name: 'custom_requests_total',
        help: 'Total custom requests',
        labelNames: ['type'],
        registers: [registry],
      });

      app.use(collectMetricsExpressMiddleware({ registry, collectNodeMetrics: false, collectServiceVersion: false }));
      app.get('/test', (req, res) => {
        customCounter.labels('test').inc();
        res.json({ success: true });
      });
      app.get('/metrics', metricsMiddleware(registry, false));

      await request(app).get('/test');

      const metricsResponse = await request(app).get('/metrics');

      expect(metricsResponse.status).toBe(200);
      // Both middleware metrics and custom metrics should be present
      expect(metricsResponse.text).toContain('http_request_duration_seconds');
      expect(metricsResponse.text).toContain('custom_requests_total');
      expect(metricsResponse.text).toContain('type="test"');
    });
  });
});
