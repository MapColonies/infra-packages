# Common Patterns

## Error Handling

### Standard Errors

Prefer standard `Error` over custom error classes:

```typescript
// Throw standard Error with descriptive message
throw new Error('Configuration validation failed: missing required field "serviceName"');

// For validation, use ajv + better-ajv-errors
const isValid = ajv.validate(schema, config);
if (!isValid) {
  const errors = betterAjvErrors({ schema, data: config, errors: ajv.errors });
  throw new Error(JSON.stringify(errors, null, 2));
}
```

### Express Error Handling

```typescript
// Use interface to extend Error
export interface HttpError extends Error {
  statusCode?: StatusCodes;
  status?: StatusCodes;
}

// Error middleware
export function getErrorHandlerMiddleware(): ErrorRequestHandler {
  return (err: HttpError, req, res, next): void => {
    const statusCode = err.statusCode ?? err.status ?? 500;
    const message = statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

    res.status(statusCode).json({ message });
  };
}
```

**Key principles:**

- Prefer standard `Error` over custom error classes
- Use interfaces to extend Error when needed
- Hide stack traces in production for 5xx errors
- Pass errors to Express `next()` middleware

## Configuration Merging

Pattern: options -> env vars -> defaults (with validation)

```typescript
export function getConfig(options: Partial<Config> = {}): Config {
  const envConfig: Partial<Config> = {
    serviceName: process.env.TELEMETRY_SERVICE_NAME,
    enabled: process.env.TELEMETRY_ENABLED === 'true',
  };

  // Clean up undefined values
  for (const key in envConfig) {
    if (envConfig[key] === undefined) {
      delete envConfig[key];
    }
  }

  const merged = { ...DEFAULT_CONFIG, ...envConfig, ...options };
  return validateConfig(merged);
}
```

**Validation pattern:**

```typescript
import Ajv, { type JSONSchemaType } from 'ajv';

const ajv = new Ajv({
  coerceTypes: true,
  useDefaults: true,
});

const schema: JSONSchemaType<Config> = {
  type: 'object',
  properties: {
    serviceName: { type: 'string' },
    enabled: { type: 'boolean' },
  },
  required: ['serviceName'],
};

function validateConfig(config: Config): Config {
  const isValid = ajv.validate(schema, config);
  if (!isValid) {
    const errors = betterAjvErrors({ schema, data: config, errors: ajv.errors });
    throw new Error(JSON.stringify(errors, null, 2));
  }
  return config;
}
```

## Singleton Pattern

```typescript
let cachedInstance: SomeType | undefined = undefined;

export function getInstance(): SomeType {
  if (cachedInstance !== undefined) {
    return cachedInstance;
  }

  cachedInstance = createInstance();
  return cachedInstance;
}
```

## Type Utilities

### Using ts-essentials

Many packages use the `ts-essentials` npm package for common type utilities:

```typescript
import type { Prettify, OptionalKeys, RequiredKeys, WritableKeys } from 'ts-essentials';
```

### Custom Type Utilities

When needed, define package-specific utilities:

```typescript
// Better type display (tracing package defines this locally)
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Pick writable properties (openapi-helpers)
export type PickWritable<T extends NonNullable<unknown>> = Pick<T, WritableKeys<T>>;

// Conditional types for API typing (openapi-helpers)
type HasRequestBody<T> = T extends { requestBody: any } ? T['requestBody']['content']['application/json'] : undefined;
```

**Pattern**: Prefer `ts-essentials` imports over duplicating type utilities.

## Express Middleware Factory Pattern

All Express middleware are created via factory functions (not direct exports):

```typescript
// ❌ Don't export middleware directly
export const myMiddleware: RequestHandler = (req, res, next) => { ... };

// ✅ Use factory function
export function getMyMiddleware(options: Options): RequestHandler {
  return (req, res, next): void => {
    // Use options here
    next();
  };
}

// Usage
app.use(getMyMiddleware({ ... }));
```

**Examples:**

- `getErrorHandlerMiddleware()` - Error handler
- `httpLogger({ logger })` - Access log middleware
- `collectMetricsExpressMiddleware({ registry })` - Prometheus metrics
- `getTraceContextHeaderMiddleware()` - Trace context propagation

## Export Patterns

- **Named exports**: Use for all functions, classes, types, interfaces
- **Default exports**: ONLY for config files (`vitest.config.ts`, `eslint.config.mjs`)
- **Barrel exports**: Re-export in `index.ts` using `export { ... } from '...'`
- **Type-only exports**: Use `export type { ... }` when exporting only types

```typescript
// ✅ Good
export function myFunction() {}
export class MyClass {}
export type { MyType };
export { helperFunction } from './utils';

// ❌ Avoid (except in config files)
export default function myFunction() {}
```

## Class Patterns

### Readonly Properties

Use `private readonly` for class properties that shouldn't change:

```typescript
class MyService {
  private readonly config: Config;
  private readonly logger: Logger;

  public constructor(config: Config) {
    this.config = config;
    this.logger = jsLogger();
  }
}
```

### Setup Guard Pattern

For classes requiring initialization before use:

```typescript
class MyRouter {
  private isSetup = false;
  private router?: Router;

  public setup(): void {
    if (this.isSetup) {
      throw new Error("Can't call setup twice");
    }
    this.router = express.Router();
    this.isSetup = true;
  }

  public getRouter(): Router {
    if (!this.isSetup) {
      throw new Error('Must call setup() before getRouter()');
    }
    return this.router;
  }
}
```

## Common Gotchas

1. **Print width is 150**: Don't manually break lines at 80 characters
2. **Magic numbers prohibited**: Define constants instead (except 0, 1)
3. **Explicit return types required**: Functions must declare return type
4. **Node 24+ required**: Check your Node version
5. **pnpm only**: Don't use npm or yarn
6. **Build before pack**: Always run `turbo run build` before publishing
