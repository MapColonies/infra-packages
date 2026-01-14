import { context, trace, TraceFlags } from '@opentelemetry/api';
import type { Handler } from 'express';

const VERSION = '00';
const RADIX = 16;

/**
 * Returns a express middleware handler that sets the trace context header.
 * @returns The middleware handler.
 * @public
 */
export function getTraceContextHeaderMiddleware(): Handler {
  const traceContextHeaderMiddleware: Handler = (req, res, next): void => {
    const spanContext = trace.getSpanContext(context.active());
    if (spanContext) {
      const traceParent = `${VERSION}-${spanContext.traceId}-${spanContext.spanId}-0${Number(spanContext.traceFlags || TraceFlags.NONE).toString(
        RADIX
      )}`;
      res.setHeader('traceparent', traceParent);
    }
    return next();
  };
  return traceContextHeaderMiddleware;
}
