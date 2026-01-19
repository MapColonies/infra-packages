# Packages Guide

## Creating a New Package

### 1. Create Package Structure

```bash
mkdir -p packages/package-name/{src,tests}
cd packages/package-name
```

### 2. Create package.json

**Choose module type:**

- **CommonJS** (default): Library packages
- **ESM**: Config packages, ESLint plugins, or when dependencies are ESM-only
- **Keep consistent**: If package A imports package B and both are configs/plugins, use same type

```json
{
  "name": "@map-colonies/package-name",
  "version": "0.0.1",
  "type": "commonjs", // or "module" for ESM
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "test": "vitest run",
    "lint": "eslint .",
    "prebuild": "pnpm run clean",
    "build": "tsc --project tsconfig.build.json",
    "clean": "rimraf dist",
    "prepack": "turbo run build",
    "check-dist": "publint && attw --pack .",
    "knip": "knip --directory ../.. --workspace packages/package-name"
  },
  "files": ["dist/**/*"],
  "devDependencies": {
    "@map-colonies/eslint-config": "workspace:^",
    "@map-colonies/tsconfig": "workspace:^",
    "@types/node": "catalog:",
    "eslint": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "vitest-config": "workspace:^",
    "publint": "catalog:",
    "@arethetypeswrong/cli": "catalog:",
    "rimraf": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 3. Update Monorepo Files

**`.release-please-manifest.json`:**

```json
{
  "packages/package-name": "0.0.1"
}
```

**`release-please-config.json`:**

```json
{
  "packages": {
    "packages/package-name": {}
  }
}
```

**`.vscode/project.code-workspace`:**

```json
{
  "folders": [{ "name": "package-name", "path": "../packages/package-name" }]
}
```

### 4. Create Config Files

**tsconfig.json:**

```json
{
  "extends": "@map-colonies/tsconfig/tsconfig-library",
  "include": ["src", "tests", "vitest.config.cts"],
  "exclude": ["dist", "node_modules"]
}
```

**tsconfig.build.json:**

```json
{
  "extends": "./tsconfig.json",
  "include": ["src"],
  "exclude": ["**/*.spec.ts"]
}
```

**vitest.config.cts:**

```typescript
import baseConfig from 'vitest-config';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(baseConfig, {});
```

**eslint.config.mjs:**

```javascript
import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import { config } from '@map-colonies/eslint-config/helpers';

export default config(tsBaseConfig);
```

### 5. Verify

```bash
pnpm install
pnpm run build && pnpm run test && pnpm run check-dist
```

## Publishing & Releasing

**IMPORTANT**: Publishing and releasing is handled automatically by CI.

- ❌ **DO NOT** manually publish packages (`npm publish`, `pnpm publish`)
- ❌ **DO NOT** manually create releases or tags
- ✅ CI handles publishing via release-please after PRs are merged
- ✅ Focus on code quality and let CI handle releases

## Package Structure

```
package-name/
├── src/
│   └── index.ts           # Main entry point
├── tests/
│   └── *.spec.ts          # Test files
├── dist/                  # Build output (gitignored)
├── tsconfig.json          # Dev config (includes tests)
├── tsconfig.build.json    # Build config (excludes tests)
├── vitest.config.ts
├── eslint.config.mjs
└── package.json
```

## Standard Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "lint": "eslint .",
    "lint:fix": "eslint --fix .",
    "prebuild": "pnpm run clean",
    "build": "tsc --project tsconfig.build.json",
    "clean": "rimraf dist",
    "prepack": "turbo run build",
    "check-dist": "publint && attw --pack .",
    "knip": "knip --directory ../.. --workspace packages/<package-name>",
    "api": "api-extractor run --local --verbose",
    "api:check": "api-extractor run --verbose"
  }
}
```

## Dependencies

### Dependency Philosophy

**Each package is independent**: Packages should only include dependencies they actually need. Don't install dependencies "just in case" - prefer simplicity.

- Only add a dependency if the package directly uses it
- Avoid pulling in heavy dependencies for single utilities
- Consider inlining simple helpers instead of adding a dependency

### Dependency Patterns

- **Workspace packages**: Use `"workspace:^"` protocol for internal packages
- **Catalog versions**: Use `"catalog:"` for common devDependencies
- **Shared configs**: Extend from `@map-colonies/*` packages (tsconfig, eslint, prettier)

See [Build System - pnpm Workspace](./build-system.md#pnpm-workspace) for catalog configuration details.

## Exports Configuration

### Single Entry Point

```json
{
  "type": "commonjs",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist/**/*"],
  "publishConfig": {
    "access": "public"
  }
}
```

### Multiple Entry Points

Example from `openapi-helpers`:

```json
{
  "exports": {
    "./requestSender": {
      "types": "./dist/requestSender/requestSender.d.ts",
      "default": "./dist/requestSender/requestSender.js"
    },
    "./typedRequestHandler": {
      "types": "./dist/typedRequestHandler/typedRequestHandler.d.ts",
      "default": "./dist/typedRequestHandler/typedRequestHandler.js"
    },
    "./generators": {
      "types": "./dist/generator/index.d.ts",
      "default": "./dist/generator/index.js"
    }
  }
}
```

## README Template

Every package must have a README with:

1. **Title** - Package name
2. **Description** - Purpose and use cases
3. **API Documentation** - Link to TypeDoc
4. **Installation** - `npm install @map-colonies/package-name`
5. **Usage** - Code examples
6. **Configuration** - Environment variables (if applicable)
7. **Related Packages** - Links to related packages

## TypeScript Configuration

```json
// tsconfig.json (development)
{
  "extends": "@map-colonies/tsconfig/tsconfig-library",
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"]
}

// tsconfig.build.json (production build)
{
  "extends": "./tsconfig.json",
  "exclude": ["tests/**"]
}
```

## Quality Checks

### publint

Validates package.json configuration for publishing:

- Checks exports field correctness
- Validates main/module/types fields
- Ensures files array includes necessary outputs

**Usage:**

```bash
pnpm run check-dist  # Runs publint + attw
```

### @arethetypeswrong/cli (attw)

Checks TypeScript types are correctly published for different module systems (ESM/CJS).

**Usage patterns:**

```json
{
  "scripts": {
    // Default: checks both ESM and CJS
    "check-dist": "publint && attw --pack .",

    // ESM-only packages
    "check-dist": "publint && attw --profile esm-only --pack .",

    // Node 16+ compatibility check
    "check-dist": "publint && attw --profile node16 --pack ."
  }
}
```

**Profiles:**

- Default: All module systems (ESM, CJS, UMD)
- `esm-only`: For packages with `"type": "module"`
- `node16`: For packages targeting Node 16+ with NodeNext module resolution

### knip

Finds unused files, dependencies, and exports across the monorepo.

**Usage:**

```bash
# Check all packages
pnpm run knip

# Check specific package (from package directory)
pnpm run knip
```

**Configuration:** `knip.config.ts` at repo root

Key features:

- Detects unused dependencies
- Finds unused exports
- Identifies unused files
- Ignores test files and type-only imports
- Per-package customization for special cases

**Example config:**

```typescript
const config: KnipConfig = {
  ignoreExportsUsedInFile: {
    interface: true, // Interfaces used in same file
    type: true, // Types used in same file
  },
  workspaces: {
    'packages/*': {
      entry: ['src/index.ts'],
      vitest: {
        config: 'vitest.config.cts',
        entry: ['tests/**/*.spec.ts'],
      },
    },
    'packages/js-logger': {
      // Ignore optional peer dependencies
      ignoreDependencies: ['pino-pretty'],
    },
  },
};
```

### API Extractor

Generates API documentation and validates public API surface.

**Purpose:**

- Generates `.api.md` files for API review
- Creates `.api.json` for documentation tools (TypeDoc)
- Validates JSDoc comments
- Enforces API release tags (`@public`, `@internal`, `@beta`)

**Usage:**

```bash
# Generate/update API reports (local mode - updates files)
pnpm run api

# Check API reports (CI mode - fails if changed)
pnpm run api:check
```

**Output:**

- `etc/<package>.api.md` - API surface report (committed to git)
- `temp/<package>.api.json` - Machine-readable API documentation

**Configuration:**

- Root config: `api-extractor.json`
- Package configs: `packages/*/api-extractor.json` (extends root)

**Multi-entry packages** (e.g., openapi-helpers):

```json
{
  "scripts": {
    "handler:api": "api-extractor run --local --config ./api-extractor.handler.json",
    "sender:api": "api-extractor run --local --config ./api-extractor.sender.json",
    "generators:api": "api-extractor run --local --config ./api-extractor.generators.json"
  }
}
```

## Pre-Merge Checklist

Before creating a PR, all checks must pass:

```bash
pnpm run build        # Compile TypeScript
pnpm run lint         # ESLint checks
pnpm run test         # Run tests
pnpm run check-dist   # publint + attw
pnpm run knip         # No unused deps/exports
pnpm run api:check    # API surface unchanged (or updated)
```

**Remember:** Publishing is handled by CI after merge. Don't manually publish!
