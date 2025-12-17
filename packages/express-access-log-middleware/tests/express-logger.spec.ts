import { Writable } from 'node:stream';
import { vi, describe, beforeAll, beforeEach, it, expect, Mock } from 'vitest';
import express, { Application, NextFunction, Request, Response } from 'express';
import supertest from 'supertest';
import { Logger, pino } from 'pino';
import httpLogger from '../src';

describe('#httpLogger', function () {
  let writableStream: Writable;
  let logger: Logger;
  let expressApp: Application;
  let controllerFn: Mock;

  beforeAll(function () {
    writableStream = new Writable();
    logger = pino({ formatters: { level: (label) => ({ level: label }) } }, writableStream);
    controllerFn = vi.fn();
    expressApp = express();
    expressApp.use(httpLogger({ logger }));
    expressApp.use('/avi', controllerFn);
  });

  beforeEach(function () {
    controllerFn.mockReset();
  });
  it('should log an OK message', async function () {
    controllerFn.mockImplementationOnce((req: Request, res: Response) => {
      res.json({ hello: 'avi' });
    });

    writableStream._write = (chunk, encoding, next) => {
      // eslint-disable-next-line
      const loggedObject = JSON.parse(chunk.toString());

      expect(loggedObject).toMatchObject({ msg: 'request completed', ['http.response.status_code']: 200, level: 'info' });
      next();
    };

    await supertest.agent(expressApp).get('/avi');
    expect.assertions(1);
  });

  it('should log an error message', async function () {
    controllerFn.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => {
      const err = new Error('epic failure');
      next(err);
    });

    writableStream._write = (chunk, encoding, next) => {
      // eslint-disable-next-line
      const loggedObject = JSON.parse(chunk.toString());

      expect(loggedObject).toMatchObject({ msg: 'request errored', ['http.response.status_code']: 500, level: 'error' });
      next();
    };

    await supertest.agent(expressApp).get('/avi');
    expect.assertions(1);
  });

  it('should ignore messages on ignored paths', async function () {
    const customExpressApp = express();
    customExpressApp.use(httpLogger({ logger, ignorePaths: ['/ignored'] }));
    customExpressApp.use('/avi', controllerFn);
    controllerFn.mockImplementationOnce((req: Request, res: Response) => {
      res.json({ hello: 'avi' });
    });

    writableStream._write = (chunk, encoding, next) => {
      // eslint-disable-next-line
      const loggedObject = JSON.parse(chunk.toString());

      expect(loggedObject).toMatchObject({ msg: 'request completed', ['http.response.status_code']: 200, level: 'info', ['url.full']: '/avi' });
      next();
    };

    await supertest.agent(customExpressApp).get('/avi');
    await supertest.agent(customExpressApp).get('/ignored');
    expect.assertions(1);
  });

  it('should ignore messages on ignored paths regex', async function () {
    const customExpressApp = express();
    customExpressApp.use(httpLogger({ logger, ignorePaths: [/.*ignored.*/] }));
    customExpressApp.use('/avi', controllerFn);
    controllerFn.mockImplementationOnce((req: Request, res: Response) => {
      res.json({ hello: 'avi' });
    });

    writableStream._write = (chunk, encoding, next) => {
      // eslint-disable-next-line
      const loggedObject = JSON.parse(chunk.toString());

      expect(loggedObject).toMatchObject({ msg: 'request completed', ['http.response.status_code']: 200, level: 'info', ['url.full']: '/avi' });
      next();
    };

    await supertest.agent(customExpressApp).get('/avi');
    await supertest.agent(customExpressApp).get('/ignored');
    expect.assertions(1);
  });

  it('should ignore messages if ignore is supplied', async function () {
    const customExpressApp = express();
    customExpressApp.use(httpLogger({ logger, ignore: () => true }));
    customExpressApp.use('/avi', controllerFn);
    controllerFn.mockImplementationOnce((req: Request, res: Response) => {
      res.json({ hello: 'avi' });
    });

    writableStream._write = (chunk, encoding, next) => {
      // eslint-disable-next-line
      const loggedObject = JSON.parse(chunk.toString());

      expect(loggedObject).toMatchObject({ msg: 'request completed', res: { statusCode: 200 }, level: 'info', req: { url: '/avi' } });
      next();
    };

    await supertest.agent(customExpressApp).get('/avi');
    await supertest.agent(customExpressApp).get('/ignored');
    expect.assertions(0);
  });
});
