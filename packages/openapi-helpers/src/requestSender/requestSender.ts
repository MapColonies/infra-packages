/**
 * @module requestSender
 */
import { readFileSync } from 'node:fs';
import supertest from 'supertest';
import type express from 'express';
import oasNormalize from 'oas-normalize';
import type { OmitProperties } from 'ts-essentials';
import type { OpenAPIV3 } from 'openapi-types';
import { PathsTemplate, Methods, OperationsTemplate } from '../common/types';
import type { PathRequestOptions, RequestOptions, OperationsNames, RequestSender, RequestReturn, RequestSenderOptions } from './types';

function sendRequest<
  Paths extends PathsTemplate,
  Path extends keyof Paths,
  Method extends keyof OmitProperties<Omit<Paths[Path], 'parameters'>, undefined>,
>(
  app: express.Application,
  options: PathRequestOptions<Paths, Path, Method>,
  internalOptions: RequestSenderOptions = {}
): RequestReturn<Paths[Path][Method]> {
  const method = options.method as Methods;
  let actualPath = (internalOptions.baseUrl ?? '') + (options.path as string);

  if ('pathParams' in options && options.pathParams !== undefined) {
    actualPath = Object.entries(options.pathParams).reduce((acc, [key, value]) => acc.replace(`{${key}}`, value as string), actualPath);
  }

  /* istanbul ignore next */
  if (actualPath.includes('{') || actualPath.includes('}')) {
    throw new Error('Path params are not provided');
  }

  let request = supertest.agent(app)[method](actualPath);

  if (options.queryParams !== undefined) {
    request = request.query(options.queryParams);
  }

  if ('requestBody' in options && options.requestBody !== undefined) {
    request = request.send(options.requestBody as object);
  }

  if (options.headers !== undefined) {
    for (const [key, value] of Object.entries(options.headers)) {
      request = request.set(key, value);
    }
  }

  request = request.set('Content-Type', 'application/json');
  // @ts-expect-error whatever
  return request;
}

const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'] as const;

function getOperationsPathAndMethod<Paths extends PathsTemplate, Operations extends OperationsTemplate>(
  openapi: Awaited<ReturnType<oasNormalize['deref']>>
): Record<OperationsNames<Operations>, { path: keyof Paths; method: Methods }> {
  const result = {} as Record<OperationsNames<Operations>, { path: string; method: string }>;

  /* istanbul ignore next */
  if (openapi.paths === undefined) {
    throw new Error('No paths found in the OpenAPI file');
  }

  for (const [path, pathValue] of Object.entries(openapi.paths)) {
    /* istanbul ignore next */
    if (pathValue === undefined) {
      continue;
    }

    const pathObject = pathValue as OpenAPIV3.PathItemObject;

    for (const method of methods) {
      if (pathObject[method] !== undefined) {
        const operationId = pathObject[method].operationId;

        /* istanbul ignore next */
        if (operationId === undefined) {
          throw new Error(`OperationId is not defined for ${method} method on ${path}`);
        }

        // @ts-expect-error typescript does not allow to assign a generic index, but it is safe in this case
        // as we are iterating over all the paths and methods
        result[operationId] = {
          path,
          method,
        };
      }
    }
  }

  return result as Record<OperationsNames<Operations>, { path: keyof Paths; method: Methods }>;
}

export { RequestSender };

/**
 * Creates a request sender object that can be used to send fake HTTP requests using supertest based on an OpenAPI specification.
 * The openapi types should be generated using the openapi-typescript package.
 *
 * @template Paths - The type representing the paths defined in the OpenAPI specification.
 * @template Operations - The type representing the operations defined in the OpenAPI specification.
 * @param {string} openapiFilePath - The file path to the OpenAPI specification file.
 * @param {express.Application} app - The Express application instance.
 * @param {RequestSenderOptions} [options] - Optional configuration options for the request sender.
 * @returns {Promise<RequestSender<Paths, Operations>>} A promise that resolves to a RequestSender object.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createRequestSender } from './requestSender';
 * import type { paths, operations } from './openapi';
 *
 * const app = express();
 * const openapiFilePath = './openapi3.yaml';
 *
 * const requestSender = await createRequestSender<paths, operations>(openapiFilePath, app);
 *
 * // Using operation name
 * const response1 = await requestSender.getUsers();
 *
 * // Using path and method
 * const response2 = await requestSender.sendRequest({
 *   method: 'get',
 *   path: '/simple-request'
 * });
 * ```
 */
export async function createRequestSender<Paths extends PathsTemplate = never, Operations extends OperationsTemplate = never>(
  openapiFilePath: Operations extends never ? never : string,
  app: express.Application,
  options: RequestSenderOptions = {}
): Promise<RequestSender<Paths, Operations>> {
  const fileContent = readFileSync(openapiFilePath, 'utf-8');
  const normalized = new oasNormalize(fileContent);
  const derefed = await normalized.deref();
  const operationsPathAndMethod = getOperationsPathAndMethod(derefed);
  const baseOptions = options;

  const returnObj = {
    // eslint-disable-next-line @typescript-eslint/promise-function-async, @typescript-eslint/explicit-function-return-type
    sendRequest: <Path extends keyof Paths, Method extends keyof OmitProperties<Omit<Paths[Path], 'parameters'>, undefined>>(
      options: PathRequestOptions<Paths, Path, Method>
    ) => sendRequest(app, options, baseOptions),
  };

  for (const [operation, { path, method }] of Object.entries(operationsPathAndMethod)) {
    // @ts-expect-error as we iterate over all the operations, the operationId is always defined
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    returnObj[operation] = async (options: RequestOptions<T['operations'][keyof T['operations']]>) =>
      sendRequest(app, { path, method: method as 'get', ...options }, baseOptions);
  }

  return returnObj as RequestSender<Paths, Operations>;
}
