import { NextFunction, ErrorRequestHandler } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

/**
 * Represents an HTTP error that extends the standard Error object.
 * Includes optional status code properties for HTTP response handling.
 *
 * @interface HttpError
 * @extends {Error}
 * @property {StatusCodes} [statusCode] - The HTTP status code for the error response
 * @property {StatusCodes} [status] - Alternative property for HTTP status code
 */
export interface HttpError extends Error {
  statusCode?: StatusCodes;
  status?: StatusCodes;
}

/**
 * Represents the structure of the error returned by the middleware.
 * stacktrace is only included in the response in development mode.
 */
export interface ErrorResponse {
  message: string;
  stacktrace?: string;
}

/**
 * Creates an Express error-handling middleware function.
 *
 * This middleware function handles errors that occur during the processing of requests.
 * It formats the error response and sets the appropriate HTTP status code.
 *
 * @returns {ErrorRequestHandler} An Express error-handling middleware function.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { getErrorHandlerMiddleware } from './path/to/this/module';
 *
 * const app = express();
 *
 * // Other middleware and routes
 *
 * // Error handling middleware should be added last
 * app.use(getErrorHandlerMiddleware());
 *
 * app.listen(3000, () => {
 *   console.log('Server is running on port 3000');
 * });
 * ```
 */
export function getErrorHandlerMiddleware(): ErrorRequestHandler {
  const mapColoniesErrorExpressHandler: ErrorRequestHandler = (
    err: HttpError,
    req,
    res,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
  ): void => {
    const errorResponse: ErrorResponse = {
      message: err.message,
    };
    const responseStatusCode = err.statusCode ?? err.status ?? StatusCodes.INTERNAL_SERVER_ERROR;

    if (responseStatusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
      //@ts-expect-error pino-http looks for this property for error info
      res.err = err;
      if (process.env.NODE_ENV === 'production') {
        errorResponse.message = getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR);
      } else {
        errorResponse.stacktrace = err.stack;
      }
    }
    res.status(responseStatusCode).json(errorResponse);
  };

  return mapColoniesErrorExpressHandler;
}
