import { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp, Options as PinoHttpOptions, HttpLogger, AutoLoggingOptions, stdSerializers } from 'pino-http';
import statusCodes from 'http-status-codes';
import { Logger } from 'pino';
import {
  ATTR_EXCEPTION_MESSAGE,
  ATTR_EXCEPTION_STACKTRACE,
  ATTR_EXCEPTION_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_URL_FULL,
} from '@opentelemetry/semantic-conventions';

/**
 * Options for configuring the access log middleware.
 * @public
 */
interface Options {
  /**
   * A Logger instance used for logging requests and responses.
   */
  logger: Logger;
  /**
   * Array of paths or regular expressions to ignore from logging.
   */
  ignorePaths?: (string | RegExp)[];
  /**
   * Custom ignore options for automatic logging.
   */
  ignore?: AutoLoggingOptions['ignore'];
  /**
   * Custom function to determine log level based on request, response and error.
   */
  customLogLevel?: PinoHttpOptions['customLogLevel'];
  /**
   * Custom function to generate error messages.
   */
  customErrorMessage?: PinoHttpOptions['customErrorMessage'];
  /**
   * Custom function to generate success messages.
   */
  customSuccessMessage?: PinoHttpOptions['customSuccessMessage'];
  /**
   * Custom function to modify the success log object.
   */
  customSuccessObject?: PinoHttpOptions['customSuccessObject'];
  /**
   * Custom function to modify the error log object.
   */
  customErrorObject?: PinoHttpOptions['customErrorObject'];
}

function createRequestAttributes(req: IncomingMessage, res: ServerResponse): Record<string, unknown> {
  const serializedReq = stdSerializers.req(req);
  const attributes: Record<string, unknown> = {
    [ATTR_HTTP_REQUEST_METHOD]: serializedReq.method,
    [ATTR_HTTP_RESPONSE_STATUS_CODE]: res.statusCode,
    ['http.request.id']: serializedReq.id,
    [ATTR_URL_FULL]: serializedReq.url,
  };

  const bannedHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization', 'www-authenticate'];

  Object.keys(req.headers).forEach((header) => {
    if (!bannedHeaders.includes(header.toLowerCase())) {
      attributes[`http.request.header.${header}`] = req.headers[header];
    }
  });

  Object.keys(serializedReq.params).forEach((param) => {
    attributes[`http.request.param.${param}`] = serializedReq.params[param];
  });

  Object.keys(serializedReq.query).forEach((queryParam) => {
    if (queryParam !== 'token') {
      attributes[`http.request.query.${queryParam}`] = serializedReq.query[queryParam];
    }
  });

  Object.keys(res.getHeaders()).forEach((header) => {
    if (!bannedHeaders.includes(header.toLowerCase())) {
      attributes[`http.response.header.${header}`] = res.getHeader(header);
    }
  });
  return attributes;
}

const ignorePathFunc = (ignoredPaths: (string | RegExp)[]): AutoLoggingOptions['ignore'] => {
  return (req) => {
    const { url } = req;
    if (url === undefined) {
      return false;
    }
    return ignoredPaths.some((ignorePath) => {
      if (ignorePath instanceof RegExp) {
        return ignorePath.test(url);
      }
      return ignorePath === req.url;
    });
  };
};

const basePinoHttpOptions: PinoHttpOptions = {
  customLogLevel: (req, res, err) =>
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    err !== undefined || (res.statusCode !== undefined && res.statusCode >= statusCodes.BAD_REQUEST) ? 'error' : 'info',
};

/**
 * Creates an HTTP logger middleware for Express using pino-http
 *
 * @param options - Configuration options for the HTTP logger
 * @returns Express middleware that logs HTTP requests and responses
 *
 * @example
 * ```ts
 * app.use(httpLogger({
 *   ignorePaths: ['/health', '/metrics'],
 *   // other pino-http options
 * }));
 * ```
 * @public
 */
export function httpLogger(options?: Options): HttpLogger {
  const { ignorePaths, ...httpOptions } = { ...basePinoHttpOptions, ...options, customAttributeKeys: { responseTime: 'http.response.duration' } };
  let ignore: AutoLoggingOptions['ignore'] | undefined = undefined;

  if (options?.ignore !== undefined) {
    ignore = options.ignore;
  }

  if (ignorePaths !== undefined && ignorePaths.length > 0) {
    ignore = ignorePathFunc(ignorePaths);
  }

  const moreOptions: PinoHttpOptions = {
    serializers: {
      req: () => undefined,
      res: () => undefined,
      err: () => undefined,
    },
    customSuccessObject: (req, res, val: object) => {
      const attributes: Record<string, unknown> = createRequestAttributes(req, res);

      return { ...val, ...attributes };
    },
    customErrorObject: (req, res, err, val: object) => {
      const attributes: Record<string, unknown> = createRequestAttributes(req, res);

      const serializedError = stdSerializers.err(err);
      return {
        ...val,
        ...attributes,
        [ATTR_EXCEPTION_TYPE]: serializedError.type,
        [ATTR_EXCEPTION_MESSAGE]: serializedError.message,
        [ATTR_EXCEPTION_STACKTRACE]: serializedError.stack,
      };
    },
  };

  httpOptions.autoLogging = { ignore };
  return pinoHttp({ ...moreOptions, ...httpOptions });
}

export type { Options };
