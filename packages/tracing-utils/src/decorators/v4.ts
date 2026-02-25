/* eslint-disable @typescript-eslint/no-explicit-any , @typescript-eslint/no-unsafe-return */

import type { Tracer } from '@opentelemetry/api';
import { asyncCallWithSpan, callWithSpan } from '../utils';

/**
 * Decorator that creates a trace span for the decorated method logic.
 * using the typescript decorators stage 2.
 * requires the "experimentalDecorators" compiler option to be true.
 * It also requires the class to have a 'tracer' property of type Tracer.
 * @param _target - the class prototype
 * @param propertyKey - the name of the decorated method
 * @param descriptor - the method descriptor
 * @returns the decorated descriptor
 * @public
 */
export function withSpanV4<Args extends unknown[]>(
  _target: unknown,
  propertyKey: string | symbol,
  descriptor?: TypedPropertyDescriptor<(this: unknown, ...args: Args) => any>
): TypedPropertyDescriptor<(this: any, ...args: Args) => any> {
  if (descriptor === undefined) {
    throw new Error('Decorated method is undefined');
  }

  const originalMethod = descriptor.value;

  if (originalMethod === undefined) {
    throw new Error('Decorated method is undefined');
  }

  descriptor.value = function (this: unknown, ...args: Args): any {
    const tracer = (this as { tracer: Tracer } | undefined)?.tracer;
    if (!tracer) {
      throw new Error('Tracer not found on class instance');
    }
    return callWithSpan(() => originalMethod.call(this, ...args), tracer, String(propertyKey));
  };

  return descriptor;
}

/**
 * Decorator that creates a trace span for the decorated async method logic.
 * using the typescript decorators stage 2.
 * requires the "experimentalDecorators" compiler option to be true.
 * It also requires the class to have a 'tracer' property of type Tracer.
 * @param _target - the class prototype
 * @param propertyKey - the name of the decorated async method
 * @param descriptor - the async method descriptor
 * @returns the decorated descriptor
 * @public
 */
export function withSpanAsyncV4<Args extends unknown[]>(
  _target: unknown,
  propertyKey: string | symbol,
  descriptor?: TypedPropertyDescriptor<(this: unknown, ...args: Args) => Promise<any>>
): TypedPropertyDescriptor<(this: unknown, ...args: Args) => Promise<any>> {
  if (descriptor === undefined) {
    throw new Error('Decorated method is undefined');
  }

  const originalMethod = descriptor.value;

  if (originalMethod === undefined) {
    throw new Error('Decorated method is undefined');
  }

  descriptor.value = async function (this: unknown, ...args: Args): Promise<any> {
    const tracer = (this as { tracer: Tracer } | undefined)?.tracer;
    if (!tracer) {
      throw new Error('Tracer not found on class instance');
    }
    return asyncCallWithSpan(async () => originalMethod.call(this, ...args), tracer, String(propertyKey));
  };

  return descriptor;
}
