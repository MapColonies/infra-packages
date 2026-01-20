# Code Style Guide

## TypeScript Configuration

- **Strict mode**: All strict flags enabled + `noUncheckedIndexedAccess`
- **Module system**: `NodeNext` (supports both CommonJS and ESM)
- **Target**: ES2022
- **Return types**: Explicit return types required (enforced by ESLint)
- **Config inheritance**: Extend from `@map-colonies/tsconfig`

## Import Organization

Imports must be ordered (enforced by ESLint):

```typescript
// 1. Node built-ins (with node: prefix)
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import type { IncomingMessage } from 'node:http';

// 2. External packages
import express from 'express';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

// 3. Internal workspace packages
import { jsLogger } from '@map-colonies/js-logger';

// 4. Relative imports
import { getConfig } from './config';
import type { Options } from './types';
```

**Rules:**

- **Node built-ins must use `node:` prefix** (e.g., `node:fs`, `node:path`, `node:http`)
- Node imports come first
- First import in file
- Newline after imports
- Exports at end of file (when applicable)

## Naming Conventions

All enforced by ESLint:

```typescript
// Variables & Functions: camelCase
const baseOptions = {};
function createLogger() {}

// Constants: UPPER_CASE
const DEFAULT_PORT = 3000;
const JSON_INDENTATION = 2;

// Classes, Interfaces, Types: PascalCase
class TracingProvider {}
interface LoggerOptions {}
type Prettify<T> = { [K in keyof T]: T[K] };

// Enum members: UPPER_CASE
enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Private members: camelCase with private keyword
class Example {
  private readonly config: Config;
  private instanceId: string;
}

// Unused parameters: prefix with underscore
function handler(req, res, _next) {}

// Special: Variables ending in "Provider" use PascalCase
const MyServiceProvider = class {};
```

## File Naming

- **Source files**: `camelCase.ts` or `PascalCase.ts` for classes
- **Test files**: `*.spec.ts` (never `*.test.ts`)
- **Config files**: `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`
- **Entry points**: `index.ts`
- **Packages**: `kebab-case` (e.g., `express-access-log-middleware`)

## Formatting (Prettier)

- **Print width**: 150 characters ⚠️ (wider than default!)
- **Tab width**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing commas**: ES5 style

## No Magic Numbers

Prohibited except 0 and 1:

```typescript
// ❌ Bad
setTimeout(callback, 3000);
array.slice(5);

// ✅ Good
const TIMEOUT_MS = 3000;
setTimeout(callback, TIMEOUT_MS);

const OFFSET = 5;
array.slice(OFFSET);
```

## Documentation

### Type Assertions - Use Sparingly!

**Type assertions (`as`, `!`) hide real problems and should be avoided.**

```typescript
// ❌ BAD - Hiding incompatibility
const plugin = mapColoniesPlugin as any;

// ❌ BAD - Masking type mismatch
plugins: {
  '@map-colonies': plugin as Plugin
}

// ✅ GOOD - Fix the actual type
interface PluginConfigs extends Record<string, Linter.Config> {
  'pino-safety': Linter.Config;
}

// ✅ GOOD - Update dependency versions to match
// If @typescript-eslint/utils v8.49.0 conflicts with
// @typescript-eslint/rule-tester v8.53.0, update both to same version
```

**When type assertions are acceptable:**

1. **Type narrowing** - When TypeScript can't infer but you know better:
   ```typescript
   const element = document.getElementById('foo') as HTMLInputElement;
   ```
2. **Vendor type bugs** - Known library type issues (document why):
   ```typescript
   // @ts-expect-error - eslint-plugin-import-x has incomplete types
   // See: https://github.com/un-ts/eslint-plugin-import-x/issues/421
   importFlatConfigs.recommended;
   ```
3. **Migration** - Temporary during large refactors (add TODO)

**Before using `as any` or `@ts-expect-error`, try:**

1. Fix actual type incompatibility
2. Update dependency versions to match
3. Add proper type definitions
4. Use type guards for runtime checks
5. Extend/implement missing types

### JSDoc (Required for Public APIs)

```typescript
/**
 * Creates a logger instance with the specified options.
 *
 * @param options - Configuration for the logger.
 * @param destination - Log output destination (file path or fd). Default is 1 (stdout).
 * @returns The configured logger instance.
 * @public
 */
export function jsLogger(options?: LoggerOptions, destination: string | number = 1): Logger {
  // implementation
}

/**
 * Options for configuring the logger.
 * @public
 */
export interface LoggerOptions {
  /**
   * Determines if logging is enabled.
   */
  enabled?: boolean;
  /**
   * Specifies the logging level.
   */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}
```

**JSDoc tags:**

- `@public` - Public API (included in generated docs)
- `@internal` - Internal use only
- `@param` - Parameter description
- `@returns` - Return value description
- `@throws` - Exceptions thrown
- `@example` - Usage examples
