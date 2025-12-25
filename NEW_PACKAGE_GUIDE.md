# Adding a New Package to infra-packages

This guide walks you through all the steps needed to add a new package to this monorepo.

## 📦 New Package Checklist

### 1. Package Structure

- [ ] Create folder in `packages/<package-name>/`
- [ ] Create `package.json` with proper metadata
- [ ] Create `README.md` with package description
- [ ] Add `src/` directory with source code
- [ ] Add `tests/` directory with test files

### 2. Configuration Files

- [ ] Add `tsconfig.json` (base config)
- [ ] Add `tsconfig.build.json` (build config)
- [ ] Add `eslint.config.mjs` - see [example](packages/error-express-handler/eslint.config.mjs)
- [ ] Add `vitest.config.ts` or `vitest.config.cts` - see [example](packages/error-express-handler/vitest.config.ts)
- [ ] Add `api-extractor.json` (extends root config) - see [example](packages/error-express-handler/api-extractor.json)
- [ ] Add `typedoc.json` if package needs custom docs - see [example](packages/error-express-handler/typedoc.json)

### 3. package.json Setup

- [ ] Set package name as `@map-colonies/<package-name>`
- [ ] Configure `exports` field for proper module resolution
- [ ] Add required scripts: `build`, `test`, `lint`, `lint:fix`, `clean`, `check-dist`, `knip`, `api`, `api:check`
- [ ] Set `files` field to include only `dist/**/*`
- [ ] Add `publishConfig.access: "public"`
- [ ] Set `engines.node >= 20` (or current minimum)
- [ ] Add workspace dependencies using `workspace:^`
- [ ] Add catalog dependencies using `catalog:`
- [ ] See [complete example](packages/error-express-handler/package.json)

### 4. Workspace Integration

- [ ] Add package to [.vscode/project.code-workspace](.vscode/project.code-workspace) folders array
- [ ] Add package to [release-please-config.json](release-please-config.json) packages section
- [ ] Verify [pnpm-workspace.yaml](pnpm-workspace.yaml) covers the package path (should be automatic with `packages/*`)

### 5. Documentation

- [ ] Write comprehensive README.md with:
  - Package description and purpose
  - Installation instructions
  - Usage examples
  - API documentation or reference
- [ ] Create `etc/` directory for API Extractor output

### 6. Testing & Quality

- [ ] Write unit tests
- [ ] Ensure tests pass: `pnpm test`
- [ ] Verify lint passes: `pnpm lint`
- [ ] Run `pnpm build` successfully
- [ ] Run `pnpm check-dist` (publint + attw)
- [ ] Run `pnpm api` to generate API documentation
- [ ] Run `pnpm api:check` to validate API surface

### 7. Final Checks

- [ ] Run `pnpm install` at root to update lockfile
- [ ] Verify package builds in Turbo: `pnpm build`
- [ ] Check Knip for unused dependencies: `pnpm knip`
- [ ] Test package can be imported by consumers
- [ ] Commit all files including generated `etc/` folder

## 🎯 Quick Start Template

Use an existing package as a template:

```bash
# Copy structure from an existing package
cp -r packages/error-express-handler packages/<new-package-name>

# Update package.json name and details
# Clean up src/ and tests/ to start fresh
```

## 🚀 After Creation

1. **Install dependencies**: `pnpm install`
2. **Build all packages**: `pnpm build`
3. **Run tests**: `pnpm test`
4. **Generate API docs**: `pnpm api`
5. **Create initial commit**: Follow conventional commits format
6. **Open PR**: Let release-please handle versioning

## 💡 Tips

- **Reference existing packages** like [error-express-handler](packages/error-express-handler) or [express-access-log-middleware](packages/express-access-log-middleware) for structure
- **Keep packages focused** - one responsibility per package
- **Document thoroughly** - good docs reduce support burden
- **Test extensively** - include unit tests and integration tests where applicable
- **Use workspace dependencies** for internal packages to ensure monorepo consistency

## 🆘 Troubleshooting

**Build fails?**

- Check TypeScript errors: `pnpm build` in package directory
- Verify tsconfig paths are correct

**Tests fail?**

- Ensure vitest config is properly set up
- Check test imports and dependencies

**API Extractor fails?**

- Verify `api-extractor.json` extends root config
- Check TypeScript declarations are being generated

**Knip reports issues?**

- Review unused dependencies
- Add exceptions to [knip.config.ts](knip.config.ts) if needed
