/* eslint-disable @typescript-eslint/no-explicit-any */
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
