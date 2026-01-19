# Git Workflow

## Commit Messages

Format: `type(scope): description`

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build/tooling changes

### Scopes

- Must match package directory name (e.g., `js-logger`, `eslint-config`, `tracing-utils`, `express-access-log-middleware`)
- Or `global` for monorepo-level changes
- Valid scopes are auto-detected from workspace packages by commitlint

### Examples

```
feat(js-logger): add support for custom formatters
fix(tracing): resolve memory leak in span processor
docs(prometheus): update configuration examples
chore(root): update pnpm to 10.25.0
```

## Git Hooks

- **Pre-commit**: Auto-format staged files with Prettier (via pretty-quick)
- **Commit-msg**: Validate commit message format (via commitlint)

## Quality Checks

Before creating a PR, ensure all checks pass:

```bash
# Build and type check
pnpm run build

# Code quality
pnpm run lint

# Tests
pnpm run test

# Package validation (publint + attw)
pnpm run check-dist

# Dependency analysis
pnpm run knip

# API surface validation (if package has public API)
pnpm run api:check
```

**What each tool does:**

- **publint**: Validates package.json exports and publishing config
- **attw**: Checks TypeScript types work correctly in ESM/CJS
- **knip**: Finds unused dependencies, files, and exports
- **api-extractor**: Validates public API hasn't changed unexpectedly

See [Packages Guide - Quality Checks](./packages.md#quality-checks) for details.

## Commitlint Configuration

- **Extends**: `@commitlint/config-conventional` + `@commitlint/config-pnpm-scopes`
- **Scopes**: Auto-detected from package names via pnpm-scopes config
- **Enforcement**: Via husky commit-msg hook
