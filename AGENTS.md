# infra-packages

Turborepo + pnpm monorepo containing shared infrastructure packages for MapColonies services.

## Package Manager & Build System

- **REQUIRED**: Use `pnpm` (version defined in `package.json`). npm and yarn are blocked.
- **Build orchestration**: Turborepo with caching (automatically runs via pnpm scripts). command are visible at `turbo.json`
- **Catalog deps**: Common devDependencies centralized in `pnpm-workspace.yaml`

## Essential Commands

```bash
# Build all packages
pnpm run build

# Run tests
pnpm run test

# Lint and format
pnpm run lint && pnpm run format:fix

# Single test file
pnpm --filter @map-colonies/package-name test tests/file.spec.ts
```

## Project Structure

```
packages/      # Public @map-colonies/* packages
internal/      # Private shared configs (not published)
```

## Quick Reference

- **[Build System](./ai-docs/build-system.md)** - Turborepo, pnpm workspace, catalog deps
- **[Code Style](./ai-docs/code-style.md)** - TypeScript, imports, naming, formatting
- **[Testing Guide](./ai-docs/testing.md)** - Vitest patterns, test structure, tooling
- **[Packages Guide](./ai-docs/packages.md)** - Package setup, exports, quality tools
- **[Git Workflow](./ai-docs/git-workflow.md)** - Commits, hooks, quality checks
- **[Common Patterns](./ai-docs/common-patterns.md)** - Config merging, singletons, error handling

## Critical Rules

1. **No manual publishing**: CI handles all releases - never run `pnpm publish`
2. **Node imports**: Use `node:` prefix (e.g., `node:fs`, `node:path`)
3. **Test files**: `*.spec.ts` only (never `*.test.ts`)
4. **Print width**: 150 characters (not 80)
5. **Test functions**: Use `function()` syntax (not arrow functions)
6. **Return types**: Required on all functions
7. **Magic numbers**: Prohibited (except 0, 1)
8. **Type assertions**: Avoid `as any` and `as Type` - fix actual type issues instead
9. **Module consistency**: When creating config/plugin packages, match module type (ESM/CommonJS) with consumer

## Creating New Packages

When creating a new package, you MUST update these files:

1. `.release-please-manifest.json` - Add package with version "0.0.1"
2. `release-please-config.json` - Add to `packages` object
3. `.vscode/project.code-workspace` - Add folder entry

**Module type selection:**

- CommonJS (default): Library packages
- ESM: Config packages, ESLint plugins, when consuming ESM-only deps
- Keep module type consistent between related config/plugin packages

See [Packages Guide](./ai-docs/packages.md) for detailed setup steps.
