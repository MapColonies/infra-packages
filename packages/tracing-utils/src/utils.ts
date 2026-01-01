import { IncomingMessage, RequestOptions } from 'node:http';
import { Span, SpanOptions, SpanStatusCode, Tracer, trace, context } from '@opentelemetry/api';

/**
 * Binds a parent span to a function, ensuring that the function executes within the context of the span.
 *
 * @param parentSpan - The parent span to bind.
 * @param func - The function to bind.
 * @returns The bound function.
 * @public
 */
export const contextBindingHelper = <T>(parentSpan: Span, func: T): T => {
  const ctx = trace.setSpan(context.active(), parentSpan);
  return context.bind(ctx, func);
};

/**
 * Creates a function that checks if the incoming request URL should be ignored based on the provided regular expressions.
 * The function should be used for configuring the http instrumentation.
 * @param urlsToIgnore - An array of regular expressions to match against the request URL.
 * @returns A function that takes an incoming request and returns a boolean indicating whether the request URL should be ignored.
 * @public
 */
export const ignoreIncomingRequestUrl = (urlsToIgnore: RegExp[]): ((request: IncomingMessage) => boolean) => {
  return (request): boolean => urlsToIgnore.some((regex) => regex.test(request.url ?? ''));
};

/**
 * Returns a function that checks if the outgoing request path should be ignored.
 * The function should be used for configuring the http instrumentation.
 * The function takes an array of regular expressions and returns a boolean value.
 *
 * @param pathsToIgnore - An array of regular expressions representing the paths to ignore.
 * @returns A function that takes a request and returns a boolean indicating whether the request path should be ignored.
 * @public
 */
export const ignoreOutgoingRequestPath = (pathsToIgnore: RegExp[]): ((request: RequestOptions) => boolean) => {
  return (request): boolean => pathsToIgnore.some((regex) => regex.test(request.path ?? ''));
};

/**
 * Calls the given asynchronous function with oTel tracing span instrumentation
 * @param fn - function to be called
 * @param tracer - tracer to be used
 * @param spanName - name of the span to be created
 * @param spanOptions - Options object needed for span creation with optional attributes: kind, attributes, links, startTime, root
 * @returns the result of the original function
 * @public
 */
export const asyncCallWithSpan = async <T>(
  fn: (span?: Span) => Promise<T>,
  tracer: Tracer,
  spanName: string,
  spanOptions?: SpanOptions
): Promise<T> => {
  return new Promise((resolve, reject) => {
    return tracer.startActiveSpan(spanName, spanOptions ?? {}, (span) => {
      fn(span)
        .then((result) => {
          handleSpanOnSuccess(span);
          return resolve(result);
        })
        .catch((error) => {
          handleSpanOnError(span, error);
          return reject(error as Error);
        });
    });
  });
};

/**
 * Calls the given function with oTel tracing span instrumentation
 * @param fn - function to be called
 * @param tracer - tracer to be used
 * @param spanName - name of the span to be created
 * @param spanOptions - Options object needed for span creation with optional attributes: kind, attributes, links, startTime, root
 * @returns the result of the original function
 * @public
 */
export const callWithSpan = <T>(fn: (span?: Span) => T, tracer: Tracer, spanName: string, spanOptions?: SpanOptions): T => {
  return tracer.startActiveSpan(spanName, spanOptions ?? {}, (span) => {
    try {
      const result = fn(span);
      handleSpanOnSuccess(span);
      return result;
    } catch (error) {
      handleSpanOnError(span, error);
      throw error;
    }
  });
};

/**
 * Ends the given span with status OK
 * @param span - span to be ended
 * @public
 */
export const handleSpanOnSuccess = (span: Span | undefined): void => {
  if (!span) {
    return;
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
};

/**
 * Ends the given span with status ERROR and records the error
 * @param span - span to be ended
 * @param error - error to be recorded
 * @public
 */
export const handleSpanOnError = (span: Span | undefined, error?: unknown): void => {
  if (!span) {
    return;
  }

  span.setStatus({ code: SpanStatusCode.ERROR });

  if (error instanceof Error) {
    span.recordException(error);
  }

  span.end();
};
