import express from 'express';
import { expectTypeOf } from 'expect-type';
import bodyParser from 'body-parser';
import { RequestSender } from '../../src/requestSender/types';
import { createRequestSender } from '../../src/requestSender/requestSender';
import { paths, operations } from '../types';

describe('requestSender', () => {
  let expressApp: express.Application;
  let requestSender: RequestSender<paths, operations>;

  beforeEach(async function () {
    expressApp = express();
    expressApp.use(bodyParser.json());
    requestSender = await createRequestSender<paths, operations>('tests/openapi3.yaml', expressApp);
  });

  describe('operations', () => {
    it('should send a simple request with no parameters', async () => {
      expect.assertions(4);
      expressApp.get('/simple-request', (req, res) => {
        expect(req.query).toEqual({});
        expect(req.headers).toEqual(expect.objectContaining({ 'content-type': 'application/json' }));
        expect(req.params).toEqual({});
        res.json({ message: 'Hello, World!' });
      });
      const res = await requestSender.simpleRequest();

      expect(res).toHaveProperty('status', 200);
      expectTypeOf(res.body).toEqualTypeOf<operations['simpleRequest']['responses']['200']['content']['application/json']>();
      expectTypeOf(requestSender.simpleRequest).parameter(0).toExtend<object | undefined>();
      expectTypeOf(requestSender.simpleRequest).parameter(1).toBeUndefined();
    });

    it('should work with a custom base URL', async () => {
      expect.assertions(2);
      expressApp.get('/api/simple-request', (req, res) => {
        expect(req.query).toEqual({});
        res.json({ message: 'Hello, World!' });
      });
      const customRequestSender = await createRequestSender<paths, operations>('tests/openapi3.yaml', expressApp, {
        baseUrl: '/api',
      });
      const res = await customRequestSender.simpleRequest();
      expect(res).toHaveProperty('body', { message: 'Hello, World!' });
    });

    it('should allow to add headers to the request even when none are required', async () => {
      expect.assertions(1);
      expressApp.get('/simple-request', (req, res) => {
        expect(req.headers).toEqual(expect.objectContaining({ 'x-api-key': '12345' }));

        res.json({ message: 'Hello, World!' });
      });

      await requestSender.simpleRequest({ headers: { 'x-api-key': '12345' } });
    });

    it('should not have a path parameter type when none are stated in the openapi', () => {
      expectTypeOf(requestSender.requestWithRequiredQueryParameters).parameter(0).not.toHaveProperty('pathParams');
    });

    it('should add query parameters to the request even when none are stated in the openapi', async () => {
      expect.assertions(1);
      expressApp.get('/simple-request', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await requestSender.simpleRequest({ queryParams: { name: 'John' } });
    });

    it('should require query parameters when they are stated as required in the openapi', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-required-query-parameters', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await requestSender.requestWithRequiredQueryParameters({ queryParams: { name: 'John' } });
      expectTypeOf(requestSender.requestWithRequiredQueryParameters)
        .parameter(0)
        .pick<'queryParams'>()
        .toEqualTypeOf<{ queryParams: { name: string } }>();
    });

    it('should have the entire query parameters object as optional when they are all optional in the openapi', async () => {
      expect.assertions(1);
      expressApp.post('/request-with-optional-query-parameters', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await requestSender.requestWithOptionalQueryParameters({ queryParams: { name: 'John' } });

      expectTypeOf(requestSender.requestWithOptionalQueryParameters)
        .parameter(0)
        .exclude<undefined>()
        .toHaveProperty('queryParams')
        .toEqualTypeOf<{ name?: string | undefined } | undefined>();
    });

    it('should have the entire query parameters object as required when there are both required and optional params', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-mixed-query-parameters', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await requestSender.requestWithMixedQueryParameters({ queryParams: { name: 'John' } });

      expectTypeOf(requestSender.requestWithMixedQueryParameters)
        .parameter(0)
        .toHaveProperty('queryParams')
        .toEqualTypeOf<{ name: string; age?: number }>();
    });

    it('should require path params when any are stated in the openapi', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-path-parameters/:name', (req, res) => {
        expect(req.params).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await requestSender.requestWithPathParameters({ pathParams: { name: 'John' } });
      expectTypeOf(requestSender.requestWithPathParameters).parameter(0).toHaveProperty('pathParams').not.toBeUndefined();
    });

    it('should work when the response is empty', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-empty-response', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });
        res.sendStatus(204);
      });

      const res = await requestSender.requestWithEmptyResponse();
      expectTypeOf(res).toHaveProperty('body').toBeNever();
    });

    it('should work when the request has all types of parameters', async () => {
      expect.assertions(4);
      expressApp.post('/request-with-all/:name', (req, res) => {
        expect(req.params).toEqual({ name: 'john' });
        expect(req.query).toEqual({ first: 'john' });
        expect(req.headers).toMatchObject(expect.objectContaining({ second: '123' }));

        res.status(201).json({ message: 'Hello, World!' });
      });

      const res = await requestSender.requestWithAll({
        pathParams: { name: 'john' },
        queryParams: { first: 'john' },
        headers: { second: '123' },
      });

      expect(res).toHaveProperty('body', { message: 'Hello, World!' });
      expectTypeOf(res).toHaveProperty('body').toEqualTypeOf<{ message?: string }>();
    });

    it('should work when making a post request with 201 response', async () => {
      expect.assertions(3);
      expressApp.post('/post-request', (req, res) => {
        expect(req.body).toEqual({ message: 'Hello, World!' });

        res.status(201).json({ message: 'Created' });
      });

      const res = await requestSender.postRequest({ requestBody: { message: 'Hello, World!' } });
      expect(res).toHaveProperty('body', { message: 'Created' });
      expect(res).toHaveProperty('status', 201);
    });

    it('should work when the request body is optional', async () => {
      expect.assertions(2);
      expressApp.post('/optional-request-body', (req, res) => {
        expect(req.body).toEqual({ message: 'Hello, World!' });

        res.json({ message: 'Hello, World!' });
      });

      const res = await requestSender.optionalRequestBody({ requestBody: { message: 'Hello, World!' } });
      expect(res).toHaveProperty('body', { message: 'Hello, World!' });
      expectTypeOf(requestSender.optionalRequestBody)
        .parameter(0)
        .exclude(undefined)
        .toHaveProperty('requestBody')
        .toEqualTypeOf<{ message?: string } | undefined>();
    });

    it('should work when there are multiple operations with the same path', async () => {
      expect.assertions(4);
      expressApp.get('/endpoint-with-multiple-methods', (req, res) => {
        expect(req.query).toEqual({ test: 'get' });
        res.json({ message: 'Hello get!' });
      });
      expressApp.post('/endpoint-with-multiple-methods', (req, res) => {
        expect(req.query).toEqual({ test: 'post' });
        res.status(201).json({ message: 'Hello post!' });
      });

      const resGet = await requestSender.endpointWithMultipleMethodsGet({ queryParams: { test: 'get' } });
      expect(resGet).toHaveProperty('body', { message: 'Hello get!' });
      expectTypeOf(requestSender.endpointWithMultipleMethodsGet)
        .parameter(0)
        .exclude(undefined)
        .toHaveProperty('queryParams')
        .toEqualTypeOf<{ test?: string } | undefined>();

      const resPost = await requestSender.endpointWithMultipleMethodsPost({ queryParams: { test: 'post' } });
      expect(resPost).toHaveProperty('body', { message: 'Hello post!' });
    });

    it('should work when there are multiple possible responses', async () => {
      expressApp.get('/multiple-status-codes', (req, res) => {
        res.json({ message: 'Hello, World!' });
      });

      const res = await requestSender.multipleStatusCodes();

      if (res.status === 200) {
        expectTypeOf(res.body).toEqualTypeOf<operations['multipleStatusCodes']['responses']['200']['content']['application/json']>();
      } else if (res.status === 201) {
        expectTypeOf(res.body).toEqualTypeOf<operations['multipleStatusCodes']['responses']['201']['content']['application/json']>();
      }
    });
  });

  describe('sendRequest', () => {
    it('should send a simple request with no parameters', async () => {
      expect.assertions(4);

      expressApp.get('/simple-request', (req, res) => {
        expect(req.query).toEqual({});
        expect(req.headers).toEqual(expect.objectContaining({ 'content-type': 'application/json' }));
        expect(req.params).toEqual({});
        res.json({ message: 'Hello, World!' });
      });

      const res = await requestSender.sendRequest({ method: 'get', path: '/simple-request' });

      expectTypeOf(res.body).toEqualTypeOf<operations['simpleRequest']['responses']['200']['content']['application/json']>();
      expect(res).toHaveProperty('body', { message: 'Hello, World!' });
    });

    it('should only suggest the paths present in the openapi definition', () => {
      expectTypeOf<Parameters<typeof requestSender.sendRequest>[0]['path']>().toEqualTypeOf<keyof paths>();
    });

    it('should support baseUrl in the options', async () => {
      expect.assertions(2);
      expressApp.get('/api/simple-request', (req, res) => {
        expect(req.query).toEqual({});
        res.json({ message: 'Hello, World!' });
      });

      const requestSender = await createRequestSender<paths, operations>('tests/openapi3.yaml', expressApp, {
        baseUrl: '/api',
      });

      const res = await requestSender.sendRequest({ method: 'get', path: '/simple-request' });
      expect(res).toHaveProperty('body', { message: 'Hello, World!' });
    });
  });
});
