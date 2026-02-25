import { describe, beforeAll, vi, afterAll, it, expect, type Mock } from 'vitest';
import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import supertest from 'supertest';

import { getErrorHandlerMiddleware, type HttpError } from '../src/index';

describe('#getErrorHandlerMiddleware', function () {
  let expressApp: Application;
  let errorFn: Mock;

  beforeAll(function () {
    errorFn = vi.fn();
    expressApp = express();
    expressApp.use('/avi', errorFn);
    expressApp.use(getErrorHandlerMiddleware());
  });
  describe('production', function () {
    beforeAll(function () {
      process.env.NODE_ENV = 'production';
    });
    afterAll(function () {
      process.env.NODE_ENV = 'test';
    });
    describe('Errors with statusCode', function () {
      it('for non 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.UNPROCESSABLE_ENTITY);
      });
      it('for 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });
    });
    describe('Errors without status code', function () {
      it('for non 500 requests return 500 and Internal Server Error', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('Meow');
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      });
      it('for 500 requests return 500 and Internal Server Error', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('Meow');
          error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      });
    });
    describe('Errors with status', function () {
      it('for non 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.status = StatusCodes.UNPROCESSABLE_ENTITY;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.UNPROCESSABLE_ENTITY);
      });
      it('for 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.status = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });
    });
  });
  describe('non_production', function () {
    beforeAll(function () {
      process.env.NODE_ENV = 'non_production';
    });
    describe('Errors with statusCode', function () {
      it('for non 500 requests return the info and status code', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.statusCode = StatusCodes.IM_A_TEAPOT;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.IM_A_TEAPOT);
      });
      it('for 500 requests return the info and status code', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response).toHaveProperty('status', StatusCodes.INTERNAL_SERVER_ERROR);
        expect(response).toHaveProperty('body.stacktrace');
      });
    });
    describe('Errors without statusCode', function () {
      it('should return Internal Server Error and stacktrace', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response).toHaveProperty('status', StatusCodes.INTERNAL_SERVER_ERROR);
        expect(response).toHaveProperty('body.stacktrace');
      });
    });
    describe('Errors with status', function () {
      it('for non 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.status = StatusCodes.UNPROCESSABLE_ENTITY;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.UNPROCESSABLE_ENTITY);
      });
      it('for 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.status = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });
    });
  });
  describe('no env variable', function () {
    beforeAll(function () {
      process.env.NODE_ENV = undefined;
    });
    describe('Errors with statusCode', function () {
      it('for non 500 requests return the info and status code', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.statusCode = StatusCodes.IM_A_TEAPOT;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.IM_A_TEAPOT);
      });
      it('for 500 requests return the info and status code', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response).toHaveProperty('status', StatusCodes.INTERNAL_SERVER_ERROR);
        expect(response).toHaveProperty('body.stacktrace');
      });
    });
    describe('Errors without statusCode', function () {
      it('should return Internal Server Error and stacktrace', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response).toHaveProperty('status', StatusCodes.INTERNAL_SERVER_ERROR);
        expect(response).toHaveProperty('body.stacktrace');
      });
    });
    describe('Errors with status', function () {
      it('for non 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.status = StatusCodes.UNPROCESSABLE_ENTITY;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.UNPROCESSABLE_ENTITY);
      });
      it('for 500 requests return the info and status', async function () {
        errorFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
          const error: HttpError = new Error('meow');
          error.status = StatusCodes.INTERNAL_SERVER_ERROR;
          return next(error);
        });
        const response = await supertest.agent(expressApp).get('/avi');
        expect(response).toHaveProperty('body.message', 'meow');
        expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      });
    });
  });
});
