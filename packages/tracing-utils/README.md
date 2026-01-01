# Tracing Utils

Utilities for OpenTelemetry tracing integration in MapColonies services.

## Installation

```bash
npm install @map-colonies/tracing-utils
```

## Features

- Utility functions for span creation and management
- TypeScript decorators for automatic span instrumentation (v4 and v5)
- Express middleware for trace context headers
- Pino logger mixin for trace context injection

## API Documentation

Full API documentation is available [here](https://mapcolonies.github.io/infra-packages/).

## Usage

### Utility Functions

#### Creating spans for async operations

```typescript
import { asyncCallWithSpan } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

const result = await asyncCallWithSpan(
  async (span) => {
    span?.setAttribute('custom.attribute', 'value');
    return await someAsyncOperation();
  },
  tracer,
  'operation-name'
);
```

#### Creating spans for synchronous operations

```typescript
import { callWithSpan } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

const result = callWithSpan(
  (span) => {
    span?.setAttribute('custom.attribute', 'value');
    return someSyncOperation();
  },
  tracer,
  'operation-name'
);
```

#### Manually handling spans

```typescript
import { handleSpanOnSuccess, handleSpanOnError } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');
const span = tracer.startSpan('my-operation');

try {
  // Do work
  handleSpanOnSuccess(span);
} catch (error) {
  handleSpanOnError(span, error);
  throw error;
}
```

### Decorators

#### TypeScript 5+ Decorators (Stage 3)

```typescript
import { withSpan, withSpanAsync } from '@map-colonies/tracing-utils';
import { Tracer, trace } from '@opentelemetry/api';

class MyService {
  tracer: Tracer = trace.getTracer('my-service');

  @withSpan
  syncMethod(value: string): string {
    return value.toUpperCase();
  }

  @withSpanAsync
  async asyncMethod(id: number): Promise<Data> {
    return await fetchData(id);
  }
}
```

#### Legacy Decorators (TypeScript experimentalDecorators)

For projects using `experimentalDecorators: true` in tsconfig:

```typescript
import 'reflect-metadata';
import { withSpanV4, withSpanAsyncV4 } from '@map-colonies/tracing-utils';
import { Tracer, trace } from '@opentelemetry/api';

class MyService {
  tracer: Tracer = trace.getTracer('my-service');

  @withSpanV4
  syncMethod(value: string): string {
    return value.toUpperCase();
  }

  @withSpanAsyncV4
  async asyncMethod(id: number): Promise<Data> {
    return await fetchData(id);
  }
}
```

> [!NOTE]
> V4 decorators require `reflect-metadata` to be installed and imported.

### Express Middleware

Add trace context headers to HTTP responses:

```typescript
import express from 'express';
import { getTraceContextHeaderMiddleware } from '@map-colonies/tracing-utils';

const app = express();

app.use(getTraceContextHeaderMiddleware());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});
```

The middleware adds a `traceparent` header to responses in [W3C Trace Context format](https://www.w3.org/TR/trace-context/).

### Pino Logger Mixin

Inject trace context into Pino logs:

```typescript
import pino from 'pino';
import { getOtelMixin } from '@map-colonies/tracing-utils';

const logger = pino({
  mixin: getOtelMixin(),
});

logger.info('This log will include trace_id, span_id, and trace_flags');
```

### HTTP Instrumentation Helpers

Filter requests from instrumentation:

```typescript
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ignoreIncomingRequestUrl, ignoreOutgoingRequestPath } from '@map-colonies/tracing-utils';

const httpInstrumentation = new HttpInstrumentation({
  ignoreIncomingRequestHook: ignoreIncomingRequestUrl([
    /\/health/,
    /\/metrics/,
  ]),
  ignoreOutgoingRequestHook: ignoreOutgoingRequestPath([
    /\/internal/,
  ]),
});
```

### Context Binding

Bind functions to span context:

```typescript
import { contextBindingHelper } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');
const span = tracer.startSpan('parent-span');

const boundCallback = contextBindingHelper(span, (data) => {
  // This callback will execute within the span's context
  console.log(data);
});

setTimeout(boundCallback, 1000);
span.end();
```

## Requirements

- Node.js >= 22
- `@opentelemetry/api` ^1.9.0 (peer dependency)
- `reflect-metadata` (only for v4 decorators)



