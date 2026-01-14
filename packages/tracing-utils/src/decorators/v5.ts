import { Tracer } from '@opentelemetry/api';
import { asyncCallWithSpan, callWithSpan } from '../utils';

/**
 * Decorator that creates a trace span for the decorated method logic.
 * using the typescript decorators stage 3, which available in typescript v5 and above.
 * requires the "experimentalDecorators" compiler option to be false.
 * @param target - the method to decorate
 * @param context - the class method decorator context
 * @returns the decorated method
 * @public
 */
export function withSpan<Args extends unknown[], Return>(
  target: (this: unknown, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<unknown, (this: unknown, ...args: Args) => Return>
) {
  return function (this: unknown, ...args: Args): Return {
    const tracer = (this as { tracer: Tracer } | undefined)?.tracer;
    if (!tracer) {
      throw new Error('Tracer not found on class instance');
    }
    return callWithSpan(() => target.call(this, ...args), tracer, String(context.name));
  };
}

/**
 * Decorator that creates a trace span for the decorated async method logic.
 * using the typescript decorators stage 3, which available in typescript v5 and above.
 * requires the "experimentalDecorators" compiler option to be false.
 * @param target - the async method to decorate
 * @param context - the class method decorator context
 * @returns the decorated async method
 * @public
 */
export function withSpanAsync<Args extends unknown[], Return>(
  target: (this: unknown, ...args: Args) => Promise<Return>,
  context: ClassMethodDecoratorContext<unknown, (this: unknown, ...args: Args) => Promise<Return>>
) {
  return async function (this: unknown, ...args: Args): Promise<Return> {
    const tracer = (this as { tracer: Tracer } | undefined)?.tracer;
    if (!tracer) {
      throw new Error('Tracer not found on class instance');
    }
    return asyncCallWithSpan(async () => target.call(this, ...args), tracer, String(context.name));
  };
}
