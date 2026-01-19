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
  mapColoniesPlugin.configs['pino-safety'],
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
      '@map-colonies/pino-safety/no-swallowed-args': 'error',
      '@map-colonies/pino-safety/prefer-standard-error-key': 'warn',
    },
  },
];
```

## Rules

### Pino Safety Rules

#### `pino-safety/no-swallowed-args`

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

#### `pino-safety/prefer-standard-error-key`

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

## Configuration Presets

### `pino-safety` (recommended)

Enables all Pino safety rules with recommended severity levels:

- `pino-safety/no-swallowed-args`: `error`
- `pino-safety/prefer-standard-error-key`: `warn`

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
