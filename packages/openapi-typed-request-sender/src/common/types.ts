/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WritableKeys } from 'ts-essentials';

type HasContent<T> = [T] extends [{ content: any }] ? T['content']['application/json'] : never;

export type AddIfNotNever<T, U> = [U] extends [never] ? T : T & U;
export type PickWritable<T extends NonNullable<unknown>> = Pick<T, WritableKeys<T>>;

export type Methods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

export type OperationsTemplate = Record<string, any>;

export type PathsTemplate = Record<
  string,
  {
    parameters: {
      query?: any;
      header?: any;
      path?: any;
      cookie?: any;
    };
  } & {
    [key in Methods]?: OperationsTemplate;
  }
>;

export type ResponseObjectToFlat<T> = [T] extends [{ responses: any }]
  ? {
      [res in keyof T['responses']]: { status: res; body: HasContent<T['responses'][res]> };
    }[keyof T['responses']]
  : never;
