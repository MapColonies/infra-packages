type Status = number | string;

interface Response {
  status: Status;
}

interface Expect {
  (actual: unknown): {
    toBe: (expected: unknown) => void;
  };
}

/**
 * Type for the assertion function returned by expectResponseStatusFactory
 * @public
 */
export type ExpectResponseStatus = <TResponse extends Response, TStatus extends TResponse['status']>(
  res: TResponse,
  expectedStatus: TStatus
) => asserts res is Extract<TResponse, { status: TStatus }>;

/**
 * Creates a function to assert that the response status matches the expected status
 * It forces TypeScript to narrow the response type based on the expected status
 *
 * @example
 * ```typescript
 * import { expectResponseStatusFactory } from '@map-colonies/openapi-helpers/requestSender';
 * import type { ExpectResponseStatus } from '@map-colonies/openapi-helpers/requestSender';
 * import { expect } from 'vitest';
 *
 * const expectResponseStatus: ExpectResponseStatus = expectResponseStatusFactory(expect);
 *
 * // Now use it in tests
 * const response = await requestSender.getUser({ pathParams: { id: '123' } });
 * expectResponseStatus(response, 200);
 * // TypeScript now knows response is the 200 response type
 * ```
 * @public
 */
export function expectResponseStatusFactory(expect: Expect): ExpectResponseStatus {
  return (res, expectedStatus) => {
    expect(res.status).toBe(expectedStatus);
  };
}
