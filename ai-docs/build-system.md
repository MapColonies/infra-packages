# Build System

## Turborepo

Turborepo orchestrates builds across the monorepo with:

- **Smart caching**: Skips rebuilding unchanged packages
- **Parallel execution**: Builds independent packages simultaneously
- **Dependency awareness**: Builds dependencies before dependents

### Build Commands

```bash
# Build all packages (uses Turborepo cache)
pnpm run build

# Build specific package (and its dependencies)
turbo run build --filter=@map-colonies/js-logger

# Build without cache
turbo run build --force

# Clean and rebuild
turbo run clean && turbo run build
```

### Turborepo Configuration

Defined in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**"], // Cache dist folder
      "outputLogs": "errors-only"
    },
    "test": {
      "dependsOn": [] // Tests run independently
    }
  }
}
```

**Key behaviors:**

- `"dependsOn": ["^build"]` - Build workspace dependencies first
- `"outputs": ["dist/**"]` - Cache compiled output
- Tests don't depend on builds (Vitest runs TypeScript directly)

## pnpm Workspace

### Catalog Dependencies

Common devDependencies are centralized in `pnpm-workspace.yaml`:

```yaml
catalog:
  typescript: 5.9.3
  vitest: ^4.0.15
  eslint: ^9.39.1
  rimraf: ^6.1.2
  '@types/node': 24.0.0
  # ... more common deps
```

**In package.json**, reference catalog versions:

```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:",
    "@types/node": "catalog:"
  }
}
```

**Benefits:**

- Single source of truth for common dep versions
- Easy to update versions across all packages
- Consistency across the monorepo

### Workspace Protocol

For internal packages, use `workspace:^`:

```json
{
  "dependencies": {
    "@map-colonies/js-logger": "workspace:^"
  }
}
```

This ensures packages always use the local workspace version during development.
