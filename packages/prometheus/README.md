# @map-colonies/prometheus

## Overview

This package provides Express middleware for integrating Prometheus metrics into Node.js applications, making it easy to collect and expose application and request metrics.

Built on top of [express-prom-bundle](https://github.com/jochen-schweizer/express-prom-bundle) and [prom-client](https://github.com/siimon/prom-client), this package provides a simplified, opinionated configuration for MapColonies services.

## Installation

```bash
npm install @map-colonies/prometheus prom-client
```

or

```bash
pnpm add @map-colonies/prometheus prom-client
```

> [!NOTE]
> `prom-client` is a peer dependency and must be installed alongside this package.

## Usage

### Basic Setup

The simplest way to get started is to use both the metrics collection and endpoint middlewares:

```typescript
import { collectMetricsExpressMiddleware, metricsMiddleware } from '@map-colonies/prometheus';
import express from 'express';
import { Registry } from 'prom-client';

const app = express();
const registry = new Registry();

// Collect metrics from all requests
app.use(collectMetricsExpressMiddleware({ registry }));

// Expose metrics at /metrics endpoint
app.get('/metrics', metricsMiddleware(registry));

// Your application routes
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(8080, () => console.log('Server listening on port 8080'));
```

### Collect Metrics Middleware

The `collectMetricsExpressMiddleware` automatically measures request duration and counts, optionally collecting Node.js runtime metrics and service version information.

```typescript
import { collectMetricsExpressMiddleware } from '@map-colonies/prometheus';
import express from 'express';
import { Registry } from 'prom-client';

const app = express();

const metricsMiddleware = collectMetricsExpressMiddleware({ 
  registry: new Registry(), 
  labels: { environment: 'production', team: 'platform' },
  collectNodeMetrics: true,
  collectServiceVersion: true
});

app.use(metricsMiddleware);
```

### Metrics Endpoint Middleware

The `metricsMiddleware` provides a simple handler to expose collected metrics:

```typescript
import { metricsMiddleware } from '@map-colonies/prometheus';
import { Registry } from 'prom-client';

const registry = new Registry();

// Use as a route handler (with default metrics collection)
app.get('/metrics', metricsMiddleware(registry));

// Or disable default metrics collection at the endpoint
app.get('/metrics', metricsMiddleware(registry, false));

// Or add labels to default metrics
app.get('/metrics', metricsMiddleware(registry, true, { environment: 'production' }));
```

## Configuration Options

### `collectMetricsExpressMiddleware(options)`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `registry` | `Registry` | Yes | - | The Prometheus registry to use for metrics |
| `collectNodeMetrics` | `boolean` | No | `true` | Whether to collect Node.js runtime metrics (CPU, memory, event loop, etc.) |
| `collectServiceVersion` | `boolean` | No | `true` | Whether to collect service version metrics from package.json |
| `includeOperationId` | `boolean` | No | `true` | Add operation ID based on OpenAPI operationId to the metrics |
| `labels` | `Record<string, string>` | No | `{}` | Additional static labels to attach to all metrics |
| `customLabels` | `object` | No | `undefined` | Object containing extra labels, useful together with `transformLabels` |
| `transformLabels` | `function` | No | `undefined` | Function to transform labels with request and response objects |

> [!NOTE]
> If you are not running the `express-openapi-validator` middleware, it's recommended to turn off the `includeOperationId` option as the operation label will always be null.

### `metricsMiddleware(registry, shouldCollectDefaultMetrics?, defaultMetricsLabels?)`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `registry` | `Registry` | Yes | - | The Prometheus registry containing the metrics to expose |
| `shouldCollectDefaultMetrics` | `boolean` | No | `true` | Whether to collect Node.js default metrics when exposing the endpoint |
| `defaultMetricsLabels` | `Record<string, string>` | No | `undefined` | Labels to add to the default metrics |

## Default Labels

The middleware automatically adds the following labels to all metrics:

- **`hostname`**: The system hostname (from `os.hostname()`)
- **`service_name`**: The service name from package.json

Additional labels can be provided via the `labels` option.

## Collected Metrics

The middleware automatically collects the following metrics:

### Request Metrics
- **`http_request_duration_seconds`** (Histogram): Time taken to process requests, labeled by:
  - `method`: HTTP method (GET, POST, etc.)
  - `status_code`: HTTP response status code
  - `operation`: OpenAPI operation ID (if `includeOperationId` is enabled and express-openapi-validator is used)

### Node.js Runtime Metrics
When `collectNodeMetrics` is enabled, the following metrics are collected:
- Process CPU usage
- Process memory usage (heap, external, RSS)
- Event loop lag
- Active handles and requests
- Garbage collection statistics

### Service Information
When `collectServiceVersion` is enabled:
- **`service_version`** (Gauge): Service version information from package.json, labeled by:
  - `service_version_major`: Major version number
  - `service_version_minor`: Minor version number
  - `service_version_patch`: Patch version number
  - `service_version_prerelease`: Prerelease version (if applicable)

## Advanced Examples

### Custom Labels

```typescript
import { collectMetricsExpressMiddleware } from '@map-colonies/prometheus';
import { Registry } from 'prom-client';

const registry = new Registry();

const middleware = collectMetricsExpressMiddleware({
  registry,
  labels: {
    environment: process.env.NODE_ENV || 'development',
    region: process.env.AWS_REGION || 'us-east-1',
    version: process.env.APP_VERSION || '1.0.0'
  }
});

app.use(middleware);
```

### Transform Labels Based on Request

```typescript
import { collectMetricsExpressMiddleware } from '@map-colonies/prometheus';
import { Registry } from 'prom-client';

const registry = new Registry();

const middleware = collectMetricsExpressMiddleware({
  registry,
  customLabels: {
    tenant: '',
    user_type: ''
  },
  transformLabels: (labels, req, res) => {
    // Add dynamic labels based on request
    labels.tenant = req.headers['x-tenant-id'] || 'unknown';
    labels.user_type = req.user?.type || 'anonymous';
    return labels;
  }
});

app.use(middleware);
```

### Selective Metric Collection

```typescript
import { collectMetricsExpressMiddleware } from '@map-colonies/prometheus';
import { Registry } from 'prom-client';

const registry = new Registry();

const middleware = collectMetricsExpressMiddleware({
  registry,
  collectNodeMetrics: true, 
  collectServiceVersion: true,
  includeOperationId: false // No OpenAPI validator
});

app.use(middleware);
```

## Best Practices

1. **Use a single registry**: Share one `Registry` instance across your application to avoid duplicate metric collection.

2. **Add meaningful labels**: Use the `labels` option to add context-specific information (environment, region, etc.).

3. **Avoid high-cardinality labels**: Don't use user IDs, timestamps, or other high-cardinality values as labels, as this can cause memory issues.


4. **Monitor metric cardinality**: Regularly check the number of unique label combinations to prevent cardinality explosions.

## Integration with Prometheus

To scrape metrics from your application, configure Prometheus with a scrape config:

```yaml
scrape_configs:
  - job_name: 'my-nodejs-app'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
```

