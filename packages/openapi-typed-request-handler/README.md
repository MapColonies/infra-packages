# openapi-typed-request-handler

Express request handler type utilities for building type-safe APIs based on OpenAPI specifications.

## Installation

```bash
npm install @map-colonies/openapi-typed-request-handler
```

## Usage

```typescript
import { TypedRequestHandlers } from '@map-colonies/openapi-typed-request-handler';
import type { paths, operations } from './types.d.ts';

// Initialize the TypedRequestHandlers with the paths and operations types
type MyHandlers = TypedRequestHandlers<paths, operations>;

export const getUser: MyHandlers['getUserById'] = (req, res) => {
  const id = req.params.id; // Autocomplete!
  res.status(200).json({ id, name: 'John' }); // Type-safe response body!
};

// Or using method/path mapping
export const getResource: MyHandlers['GET /resource'] = (req, res) => {
  res.status(200).json({ id: 1, name: 'name' });
};
```
