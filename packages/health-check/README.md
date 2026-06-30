# @map-colonies/health-check

A wrapper around `@godaddy/terminus` to manage health checks (liveness/readiness) and graceful shutdown for Node.js applications. It abstracts the complexity of Terminus into a clean, object-oriented API while preserving the ability to pass advanced configuration when needed.

## Installation

```bash
npm install @map-colonies/health-check
```

## Usage

Whether your application is a REST API or a background worker, `HealthCheckManager` requires an `http.Server` to expose the Kubernetes probes.

```typescript
import http from 'http';
import { HealthCheckManager } from '@map-colonies/health-check';

// If this is a worker without an existing API, simply create a lightweight server:
// const server = http.createServer();
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello MapColonies!');
});

// Using a standard @map-colonies/js-logger
const logger = myLogger;

const healthCheckManager = new HealthCheckManager(server, logger, {
  timeout: 5000,
  signals: ['SIGINT', 'SIGTERM'],
});

// 1. Setup Liveness Check (e.g. memory limits)
healthCheckManager.registerLivenessCheck('memory', async () => {
  const memUsage = process.memoryUsage();
  if (memUsage.rss > 500 * 1024 * 1024) {
    throw new Error('Memory usage exceeded 500MB');
  }
});

// 2. Setup Readiness Check (e.g. Postgres or S3 connectivity)
healthCheckManager.registerReadinessCheck('database', async () => {
  // DB ping logic
});

// 3. Setup Graceful Shutdown
healthCheckManager.registerShutdownHook('database', async () => {
  logger.info('Closing database connection...');
  // e.g., await connection.close();
});

server.listen(8080, () => {
  logger.info('Server is listening on port 8080');
});
```
