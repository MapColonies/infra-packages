/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, it, describe } from 'vitest';
import type { TypedRequestHandlers } from '../../src/typedRequestHandler/typedRequestHandler';
import type { paths, operations } from '../types';

describe('typedRequestHandler', () => {
  type MyHandlers = TypedRequestHandlers<paths, operations>;
  it('should type the query parameters correctly', () => {
    const handler: MyHandlers['requestWithRequiredQueryParameters'] = (req, res) => {
      expectTypeOf(req.query).toEqualTypeOf<operations['requestWithRequiredQueryParameters']['parameters']['query']>();
    };
  });

  it('should type the path parameters correctly', () => {
    const handler: MyHandlers['requestWithPathParameters'] = (req, res) => {
      expectTypeOf(req.params).toEqualTypeOf<operations['requestWithPathParameters']['parameters']['path']>();
    };
  });

  it('should type the request body correctly', () => {
    const handler: MyHandlers['POST /post-request'] = (req, res) => {
      expectTypeOf(req.body).toEqualTypeOf<operations['postRequest']['requestBody']['content']['application/json']>();
    };
  });

  it('should mark the request body as optional if it is not required in the openapi', () => {
    const handler: MyHandlers['POST /optional-request-body'] = (req, res) => {
      expectTypeOf(req.body).toEqualTypeOf<
        Exclude<operations['optionalRequestBody']['requestBody'], undefined>['content']['application/json'] | undefined
      >();
    };
  });

  it('should type the response correctly', () => {
    const handler: MyHandlers['GET /simple-request'] = (req, res) => {
      expectTypeOf(res.json).parameter(0).toEqualTypeOf<operations['simpleRequest']['responses']['200']['content']['application/json'] | undefined>();
    };
  });
});
