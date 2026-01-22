type Status = number | string;

interface Response {
  status: Status;
}

interface Expect {
  (actual: unknown): {
    toBe: (expected: unknown) => void;
  };
}

type ExpectResponseStatus = <TResponse extends Response, TStatus extends TResponse['status']>(
  res: TResponse,
  expectedStatus: TStatus
) => asserts res is Extract<TResponse, { status: TStatus }>;

/**
 * Creates a function to assert that the response status matches the expected status
 * It forces TypeScript to narrow the response type based on the expected status
 * @public
 */
export function expectResponseStatusFactory(expect: Expect): ExpectResponseStatus {
  return (res, expectedStatus) => {
    expect(res.status).toBe(expectedStatus);
  };
}
