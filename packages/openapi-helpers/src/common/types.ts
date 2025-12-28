/* eslint-disable @typescript-eslint/no-explicit-any */
import { WritableKeys } from 'ts-essentials';

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
