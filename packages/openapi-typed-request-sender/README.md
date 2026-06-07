# openapi-typed-request-sender

Supertest-based testing utilities that provide full type safety and autocomplete based on OpenAPI specifications.

## Installation

```bash
npm install --save-dev @map-colonies/openapi-typed-request-sender supertest
```

## Usage

```typescript
import { createRequestSender, expectResponseStatusFactory } from '@map-colonies/openapi-typed-request-sender';
import type { paths, operations } from './types.d.ts';

const requestSender = await createRequestSender<paths, operations>('openapi.yaml', expressApp);

// Call API by operation name!
const response = await requestSender.getUser({ pathParams: { id: '123' } });

// Type-safe status assertion
const expectResponseStatus = expectResponseStatusFactory(expect);
expectResponseStatus(response, 200);

// response.body is now correctly typed for status 200
console.log(response.body.name);
```
