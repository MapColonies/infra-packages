# @map-colonies/eslint-plugin

Custom ESLint rules for MapColonies projects. This plugin provides specialized rules to enforce best practices and prevent common mistakes.

## Installation

```bash
npm install --save-dev @map-colonies/eslint-plugin
```

## Usage

### Quick Start with Recommended Config

Add the plugin to your ESLint configuration:

```javascript
// eslint.config.mjs
import mapColoniesPlugin from '@map-colonies/eslint-plugin';

export default [
  mapColoniesPlugin.configs.recommended,
  // ... your other configs
];
```

### Manual Configuration

Or configure rules individually:

```javascript
// eslint.config.mjs
import mapColoniesPlugin from '@map-colonies/eslint-plugin';

export default [
  {
    plugins: {
      '@map-colonies': mapColoniesPlugin,
    },
    rules: {
      '@map-colonies/pino-safety-no-swallowed-args': 'error',
      '@map-colonies/pino-safety-prefer-standard-error-key': 'warn',
      '@map-colonies/express-no-redundant-try-catch': 'error',
    },
  },
];
```

## Rules

### Pino Safety Rules

#### `pino-safety-no-swallowed-args`

Prevents Pino from silently swallowing objects when arguments don't match the message format placeholders.

**Problem:** Pino uses printf-style formatting. If you pass extra arguments without corresponding placeholders (`%s`, `%d`, etc.), they are silently ignored.

**Examples:**

```javascript
// ❌ Bad - object is swallowed (no placeholder)
logger.info('User logged in', { userId: 123 });

// ❌ Bad - second argument is swallowed (only one %s placeholder)
logger.info('User %s logged in', username, { extra: 'data' });

// ✅ Good - merge object pattern (object first)
logger.info({ userId: 123 }, 'User logged in');

// ✅ Good - placeholders match argument count
logger.info('User %s logged in at %d', username, timestamp);

// ✅ Good - no extra arguments
logger.info('Simple message');
```

**Supported placeholders:** `%s`, `%d`, `%f`, `%i`, `%j`, `%o`, `%O`

#### `pino-safety-prefer-standard-error-key`

Ensures errors are serialized correctly by using Pino's standard `err` key instead of `error`.

**Problem:** Pino's default error serializer looks for the `err` key. Using `error` means the error won't be properly serialized with stack traces.

**Examples:**

```javascript
// ❌ Bad - "error" key won't be serialized properly
logger.error({ error: new Error('Failed') }, 'Operation failed');

// ✅ Good - "err" key uses Pino's error serializer
logger.error({ err: new Error('Failed') }, 'Operation failed');

// ✅ Good - other property names are fine
logger.info({ userId: 123, status: 'active' }, 'User info');
```

### Express Rules

#### `express-no-redundant-try-catch`

Disallows a try/catch in an Express handler when the catch does nothing but pass the caught error, unchanged, to `next`.

**Problem:** Express already forwards errors thrown in a handler to `next`: synchronous throws in every version, and rejected promises from `async` handlers since Express 5. A try/catch that only calls `next(error)` adds nesting without adding behaviour.

**Examples:**

```typescript
// ❌ Bad - Express 5 already forwards the rejection to next
public getItem: Handler = async (req, res, next) => {
  try {
    res.json(await this.manager.getItem(req.params.id));
  } catch (error) {
    next(error);
  }
};

// ✅ Good - let Express forward the error
public getItem: Handler = async (req, res) => {
  res.json(await this.manager.getItem(req.params.id));
};

// ✅ Good - the catch actually handles the error
public getItem: Handler = async (req, res, next) => {
  try {
    res.json(await this.manager.getItem(req.params.id));
  } catch (error) {
    next(new ItemFetchError(req.params.id, { cause: error }));
  }
};
```

**What is reported:** the catch body is exactly `next(err)` or `return next(err)` with the catch's own parameter, the try has no `finally`, and the nearest enclosing function has `next` as its third parameter. A try inside a nested callback (e.g. `setTimeout`) is never reported, since Express cannot catch errors thrown there. Error middleware (`(err, req, res, next)`) is not checked.

**Express version:**

- Express 5+: sync and `async` handlers are reported.
- Express 4: only non-`async` handlers are reported (Express 4 does not forward rejected promises).
- Express not found: nothing is reported.

The version is detected automatically (see [Settings](#settings)).

**Options:**

- `nextNames` (default `['next']`): names accepted for the handler's `next` parameter.

```javascript
'@map-colonies/express-no-redundant-try-catch': ['error', { nextNames: ['next', 'nextFn'] }]
```

**Fix:** an editor suggestion removes the try/catch and keeps the contents of the try block. It is not applied by `--fix`. When inlining the contents would be unsafe (a declaration would clash with or shadow an outer name, or the block contains a multi-line template literal), the block is kept with its braces. No suggestion is offered when the catch contains comments, so they are not silently dropped.

## Settings

Shared settings live under the `@map-colonies` key. All settings are optional.

| Setting          | Description                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expressVersion` | The Express version to assume (e.g. `'5'` or `'5.2.1'`). When omitted, the version is detected from the `express` package installed for each linted file. A value that cannot be parsed is treated as unknown, which disables Express-version-dependent rules. Set it only if detection fails, for example when Express is reached through a wrapper package. |

```javascript
// eslint.config.mjs
export default [
  mapColoniesPlugin.configs.recommended,
  {
    settings: {
      '@map-colonies': { expressVersion: '5' },
    },
  },
];
```

## Configuration Presets

### `recommended`

Enables all rules below.

### `pino-safety`

Enables all Pino safety rules with recommended severity levels:

- `pino-safety-no-swallowed-args`: `error`
- `pino-safety-prefer-standard-error-key`: `warn`

### `express`

Enables all Express rules:

- `express-no-redundant-try-catch`: `error`

## Development

### Building

```bash
pnpm run build
```

### Testing

```bash
pnpm run test
```

### Linting

```bash
pnpm run lint
```

## Related Packages

- [@map-colonies/js-logger](../js-logger) - Pino-based logger for MapColonies services
- [@map-colonies/eslint-config](../eslint-config) - Base ESLint configuration

## License

MIT
