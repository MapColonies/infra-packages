import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { expectResponseStatusFactory } from '../../src/requestSender/expect';

describe('expectResponseStatusFactory', () => {
  describe('logic tests', () => {
    it('should create a function that asserts response status matches expected status', function () {
      const mockExpect = vi.fn((actual: unknown) => ({
        toBe: vi.fn((expected: unknown) => {
          expect(actual).toBe(expected);
        }),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);
      const response = { status: 200 };

      expectResponseStatus(response, 200);

      expect(mockExpect).toHaveBeenCalledWith(200);
      expect(mockExpect).toHaveBeenCalledTimes(1);
    });

    it('should call toBe with the expected status', function () {
      const mockToBe = vi.fn();
      const mockExpect = vi.fn(() => ({
        toBe: mockToBe,
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);
      const response = { status: 404 };

      expectResponseStatus(response, 404);

      expect(mockToBe).toHaveBeenCalledWith(404);
      expect(mockToBe).toHaveBeenCalledTimes(1);
    });

    it('should work with string status codes', function () {
      const mockExpect = vi.fn((actual: unknown) => ({
        toBe: vi.fn((expected: unknown) => {
          expect(actual).toBe(expected);
        }),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);
      const response = { status: '200' };

      expectResponseStatus(response, '200');

      expect(mockExpect).toHaveBeenCalledWith('200');
    });

    it('should work with numeric status codes', function () {
      const mockExpect = vi.fn((actual: unknown) => ({
        toBe: vi.fn((expected: unknown) => {
          expect(actual).toBe(expected);
        }),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);
      const response = { status: 201 };

      expectResponseStatus(response, 201);

      expect(mockExpect).toHaveBeenCalledWith(201);
    });

    it('should handle multiple status checks on different responses', function () {
      const mockExpect = vi.fn((actual: unknown) => ({
        toBe: vi.fn((expected: unknown) => {
          expect(actual).toBe(expected);
        }),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      expectResponseStatus({ status: 200 }, 200);
      expectResponseStatus({ status: 404 }, 404);
      expectResponseStatus({ status: 500 }, 500);

      expect(mockExpect).toHaveBeenCalledTimes(3);
    });
  });

  describe('type tests', () => {
    it('should narrow response type based on status', function () {
      type TestResponse =
        | { status: 200; body: { success: true } }
        | { status: 404; body: { error: string } }
        | { status: 500; body: { message: string } };

      const mockExpect = vi.fn((actual: unknown) => ({
        toBe: vi.fn((expected: unknown) => {
          expect(actual).toBe(expected);
        }),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      const response: TestResponse = { status: 200, body: { success: true } };
      expectResponseStatus(response, 200);

      // After assertion, response should be narrowed to status 200
      expectTypeOf(response).toEqualTypeOf<Extract<TestResponse, { status: 200 }>>();
      expectTypeOf(response.body).toEqualTypeOf<{ success: true }>();
    });

    it('should work with union types of different status codes', function () {
      interface SuccessResponse {
        status: 200;
        body: { data: string };
      }
      interface CreatedResponse {
        status: 201;
        body: { id: number };
      }
      interface ErrorResponse {
        status: 400;
        body: { error: string };
      }
      type ApiResponse = SuccessResponse | CreatedResponse | ErrorResponse;

      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      const response: ApiResponse = { status: 201, body: { id: 42 } };
      expectResponseStatus(response, 201);

      expectTypeOf(response).toEqualTypeOf<Extract<ApiResponse, { status: 201 }>>();
      expectTypeOf(response.body).toEqualTypeOf<{ id: number }>();
    });

    it('should maintain type narrowing with string status codes', function () {
      type ResponseWithStringStatus = { status: '200'; body: { message: string } } | { status: '404'; body: { notFound: boolean } };

      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      const response: ResponseWithStringStatus = { status: '200', body: { message: 'ok' } };
      expectResponseStatus(response, '200');

      expectTypeOf(response).toEqualTypeOf<Extract<ResponseWithStringStatus, { status: '200' }>>();
      expectTypeOf(response.body).toEqualTypeOf<{ message: string }>();
    });

    it('should work with complex response objects', function () {
      type ComplexResponse =
        | {
            status: 200;
            body: { user: { id: number; name: string } };
            headers: { 'x-request-id': string };
          }
        | {
            status: 401;
            body: { unauthorized: true };
            headers: { 'www-authenticate': string };
          };

      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      const response: ComplexResponse = {
        status: 200,
        body: { user: { id: 1, name: 'John' } },
        headers: { 'x-request-id': 'abc123' },
      };

      expectResponseStatus(response, 200);

      expectTypeOf(response).toEqualTypeOf<Extract<ComplexResponse, { status: 200 }>>();
      expectTypeOf(response.body).toEqualTypeOf<{ user: { id: number; name: string } }>();
      expectTypeOf(response.headers).toEqualTypeOf<{ 'x-request-id': string }>();
    });

    it('should accept any response type that has a status property', function () {
      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      // Should work with minimal response object
      const minimalResponse = { status: 200 };
      expectResponseStatus(minimalResponse, 200);

      // Should work with response that has additional properties
      const responseWithExtras = { status: 201, body: {}, headers: {}, extra: 'data' };
      expectResponseStatus(responseWithExtras, 201);
    });

    it('should ensure status parameter is derived from response status type', function () {
      interface StrictResponse {
        status: 200 | 404;
        body: unknown;
      }

      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      const response200: StrictResponse = { status: 200, body: {} };
      const response404: StrictResponse = { status: 404, body: {} };

      // TypeScript should only allow 200 or 404 as expectedStatus
      expectResponseStatus(response200, 200);
      expectResponseStatus(response404, 404);

      // The following would be a TypeScript error (uncomment to verify):
      // expectResponseStatus(response200, 500);
    });

    it('should work as an assertion function that narrows types', function () {
      type ApiResponse = { status: 200; body: { data: string } } | { status: 500; body: { error: string } };

      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus: <TResponse extends { status: number | string }, TStatus extends TResponse['status']>(
        res: TResponse,
        expectedStatus: TStatus
      ) => asserts res is Extract<TResponse, { status: TStatus }> = expectResponseStatusFactory(mockExpect);

      function handleResponse(response: ApiResponse): string {
        expectResponseStatus(response, 200);
        // After assertion, TypeScript knows response.status is 200
        // Type narrowing allows us to safely access response.body.data
        return response.body.data;
      }

      const response: ApiResponse = { status: 200, body: { data: 'test' } };
      const result = handleResponse(response);
      expectTypeOf(result).toBeString();
    });

    it('should return a function with correct signature', function () {
      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      const expectResponseStatus = expectResponseStatusFactory(mockExpect);

      // Check that the returned function has the correct type signature
      expectTypeOf(expectResponseStatus).toBeFunction();
      expectTypeOf(expectResponseStatus).parameters.toEqualTypeOf<[res: { status: number | string }, expectedStatus: number | string]>();
    });

    it('should preserve the type of the factory function', function () {
      const mockExpect = vi.fn(() => ({
        toBe: vi.fn(),
      }));

      // The factory should accept an Expect interface
      expectTypeOf(expectResponseStatusFactory).toBeCallableWith(mockExpect);

      // The factory should return a function with assertion signature
      const result = expectResponseStatusFactory(mockExpect);
      expectTypeOf(result).toBeFunction();
    });
  });
});
