# openapi-generators

CLI and programmatic API for generating TypeScript types and error classes from OpenAPI specifications.

## Installation

```bash
npm install --save-dev @map-colonies/openapi-generators openapi-typescript prettier
```

## CLI Usage

```bash
npx openapi-generators generate types <openapi-file> <output-file> [options]
npx openapi-generators generate errors <openapi-file> <output-file> [options]
```

### Generate Types

Generate TypeScript types from an OpenAPI schema:

```bash
npx openapi-generators generate types ./openapi.yaml ./src/types.d.ts --format --add-typed-request-handler
```

Options:

- `-f, --format`: Format the generated types using `prettier`.
- `-t, --add-typed-request-handler`: Add the `TypedRequestHandlers` type to the generated types. This requires `@map-colonies/openapi-typed-request-handler` to be installed in the project.

### Generate Errors

Generate error classes and error code mappings from an OpenAPI schema:

```bash
npx openapi-generators generate errors ./openapi.yaml ./src/errors.ts --format
```

Options:

- `-f, --format`: Format the generated code using `prettier`.
- `-e, --errors-output <all|map|classes>`: Specify what to generate (default: `all`).

## Programmatic Usage

```typescript
import { generateTypes, generateErrors } from '@map-colonies/openapi-generators';

await generateTypes('openapi.yaml', 'src/types.d.ts', {
  shouldFormat: true,
  addTypedRequestHandler: true,
});
```
