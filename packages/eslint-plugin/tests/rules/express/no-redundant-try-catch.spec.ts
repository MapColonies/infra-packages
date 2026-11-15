import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noRedundantTryCatch } from '../../../src/rules/express/no-redundant-try-catch.js';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.describe = describe;

const fixturesRoot = mkdtempSync(join(tmpdir(), 'express-no-redundant-try-catch-'));

function createProject(name: string, expressVersion?: string): string {
  const projectDir = join(fixturesRoot, name);
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  if (expressVersion !== undefined) {
    const expressDir = join(projectDir, 'node_modules', 'express');
    mkdirSync(expressDir, { recursive: true });
    writeFileSync(join(expressDir, 'package.json'), JSON.stringify({ name: 'express', version: expressVersion }));
  }
  return join(projectDir, 'src', 'controller.ts');
}

const express5File = createProject('express-5', '5.2.1');
const express4File = createProject('express-4', '4.22.2');
const noExpressFile = createProject('no-express');

afterAll(function () {
  rmSync(fixturesRoot, { recursive: true, force: true });
});

const ruleTester = new RuleTester();

const redundantAsyncHandler = `
const handler = async (req, res, next) => {
  try {
    const data = await service.get();
    res.json(data);
  } catch (error) {
    next(error);
  }
};`;

const unwrappedAsyncHandler = `
const handler = async (req, res, next) => {
  const data = await service.get();
  res.json(data);
};`;

const redundantSyncHandler = `
function handler(req, res, next) {
  try {
    res.json(service.getSync());
  } catch (err) {
    return next(err);
  }
}`;

const unwrappedSyncHandler = `
function handler(req, res, next) {
  res.json(service.getSync());
}`;

function removeSuggestion(output: string): [{ messageId: 'removeTryCatch'; output: string }] {
  return [{ messageId: 'removeTryCatch', output }];
}

ruleTester.run('no-redundant-try-catch', noRedundantTryCatch, {
  valid: [
    {
      name: 'should allow a catch that wraps the error before forwarding it',
      filename: express5File,
      code: `const handler = async (req, res, next) => { try { await work(); } catch (error) { next(new InternalError(error)); } };`,
    },
    {
      name: 'should allow a catch that logs before forwarding',
      filename: express5File,
      code: `const handler = async (req, res, next) => { try { await work(); } catch (error) { logger.error({ err: error }); next(error); } };`,
    },
    {
      name: 'should allow a catch that mutates the error before forwarding',
      filename: express5File,
      code: `const handler = async (req, res, next) => { try { await work(); } catch (error) { if (error instanceof NotFoundError) { error.status = 404; } next(error); } };`,
    },
    {
      name: 'should allow a catch that calls next without the error',
      filename: express5File,
      code: `const handler = async (req, res, next) => { try { await work(); } catch (error) { next(); } };`,
    },
    {
      name: 'should allow a catch that forwards a different variable',
      filename: express5File,
      code: `const handler = async (req, res, next) => { const other = new Error(); try { await work(); } catch (error) { next(other); } };`,
    },
    {
      name: 'should allow a catch without a binding',
      filename: express5File,
      code: `const handler = async (req, res, next) => { try { await work(); } catch { next(); } };`,
    },
    {
      name: 'should allow a try with a finally block',
      filename: express5File,
      code: `const handler = async (req, res, next) => { try { await work(); } catch (error) { next(error); } finally { release(); } };`,
    },
    {
      name: 'should allow a try inside a nested callback that Express cannot catch',
      filename: express5File,
      code: `const handler = (req, res, next) => { setTimeout(() => { try { work(); } catch (error) { next(error); } }); };`,
    },
    {
      name: 'should allow a node-style callback function',
      filename: express5File,
      code: `function readConfig(path, opts, cb) { try { cb(null, parse(path)); } catch (e) { cb(e); } }`,
    },
    {
      name: 'should allow a handler whose third parameter has a different name',
      filename: express5File,
      code: `const handler = async (req, res, done) => { try { await work(); } catch (error) { done(error); } };`,
    },
    {
      name: 'should allow a function where next is not the third parameter',
      filename: express5File,
      code: `const handler = async (req, next) => { try { await work(); } catch (error) { next(error); } };`,
    },
    {
      name: 'should not check error middleware',
      filename: express5File,
      code: `const handler = async (err, req, res, next) => { try { await work(); } catch (error) { next(error); } };`,
    },
    {
      name: 'should allow an async handler on express 4',
      filename: express4File,
      code: redundantAsyncHandler,
    },
    {
      name: 'should report nothing when express cannot be found',
      filename: noExpressFile,
      code: redundantSyncHandler,
    },
    {
      name: 'should prefer an explicit express 4 setting over detected express 5',
      filename: express5File,
      settings: { '@map-colonies': { expressVersion: '4' } },
      code: redundantAsyncHandler,
    },
    {
      name: 'should treat an unparsable express version setting as unknown',
      filename: express5File,
      settings: { '@map-colonies': { expressVersion: 'abc5' } },
      code: redundantSyncHandler,
    },
  ],
  invalid: [
    {
      name: 'should report an async handler that only forwards the caught error to next on express 5',
      filename: express5File,
      code: redundantAsyncHandler,
      errors: [{ messageId: 'redundantTryCatch', suggestions: removeSuggestion(unwrappedAsyncHandler) }],
    },
    {
      name: 'should report a sync handler with return next(err) on express 5',
      filename: express5File,
      code: redundantSyncHandler,
      errors: [{ messageId: 'redundantTryCatch', suggestions: removeSuggestion(unwrappedSyncHandler) }],
    },
    {
      name: 'should accept a semver range as the express version setting',
      filename: noExpressFile,
      settings: { '@map-colonies': { expressVersion: '^5.0.0' } },
      code: redundantAsyncHandler,
      errors: [{ messageId: 'redundantTryCatch', suggestions: removeSuggestion(unwrappedAsyncHandler) }],
    },
    {
      name: 'should report a sync handler on express 4',
      filename: express4File,
      code: redundantSyncHandler,
      errors: [{ messageId: 'redundantTryCatch', suggestions: removeSuggestion(unwrappedSyncHandler) }],
    },
    {
      name: 'should report a class property handler with typed parameters',
      filename: express5File,
      code: `
class Controller {
  public get: Handler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.manager.get());
    } catch (error) {
      next(error);
    }
  };
}`,
      errors: [
        {
          messageId: 'redundantTryCatch',
          suggestions: removeSuggestion(`
class Controller {
  public get: Handler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.json(await this.manager.get());
  };
}`),
        },
      ],
    },
    {
      name: 'should report a custom next name from the nextNames option',
      filename: express5File,
      options: [{ nextNames: ['nextFn'] }],
      code: `const handler = async (req, res, nextFn) => { try { await work(); } catch (error) { nextFn(error); } };`,
      errors: [{ messageId: 'redundantTryCatch', suggestions: removeSuggestion(`const handler = async (req, res, nextFn) => { await work(); };`) }],
    },
    {
      name: 'should use an explicit express 5 setting when express cannot be found',
      filename: noExpressFile,
      settings: { '@map-colonies': { expressVersion: '5' } },
      code: redundantAsyncHandler,
      errors: [{ messageId: 'redundantTryCatch', suggestions: removeSuggestion(unwrappedAsyncHandler) }],
    },
    {
      name: 'should not change multi-line template literals when unwrapping',
      filename: express5File,
      code: `
function handler(req, res, next) {
  try {
    res.send(\`a
    b\`);
  } catch (e) {
    next(e);
  }
}`,
      errors: [
        {
          messageId: 'redundantTryCatch',
          suggestions: removeSuggestion(`
function handler(req, res, next) {
  {
    res.send(\`a
    b\`);
  }
}`),
        },
      ],
    },
    {
      name: 'should keep the block when unwrapping would redeclare a variable',
      filename: express5File,
      code: `
function handler(req, res, next) {
  const data = 1;
  try {
    const data = 2;
    res.json(data);
  } catch (e) {
    next(e);
  }
}`,
      errors: [
        {
          messageId: 'redundantTryCatch',
          suggestions: removeSuggestion(`
function handler(req, res, next) {
  const data = 1;
  {
    const data = 2;
    res.json(data);
  }
}`),
        },
      ],
    },
    {
      name: 'should keep the block when unwrapping would shadow a handler parameter',
      filename: express5File,
      code: `function handler(req, res, next) { try { const req = 1; work(req); } catch (e) { next(e); } }`,
      errors: [
        { messageId: 'redundantTryCatch', suggestions: removeSuggestion(`function handler(req, res, next) { { const req = 1; work(req); } }`) },
      ],
    },
    {
      name: 'should not offer a suggestion when the catch contains comments',
      filename: express5File,
      code: `function handler(req, res, next) { try { work(); } catch (e) { // forwarded on purpose
next(e); } }`,
      errors: [{ messageId: 'redundantTryCatch', suggestions: [] }],
    },
    {
      name: 'should keep the original block when the try is the body of an if statement',
      filename: express5File,
      code: `
function handler(req, res, next) {
  if (req.body) try {
    a();
    b();
  } catch (e) {
    next(e);
  }
}`,
      errors: [
        {
          messageId: 'redundantTryCatch',
          suggestions: removeSuggestion(`
function handler(req, res, next) {
  if (req.body) {
    a();
    b();
  }
}`),
        },
      ],
    },
    {
      name: 'should keep a block when unwrapping a try that is the body of an if statement',
      filename: express5File,
      code: `function handler(req, res, next) { if (req.body) try { work(); save(); } catch (e) { next(e); } }`,
      errors: [
        { messageId: 'redundantTryCatch', suggestions: removeSuggestion(`function handler(req, res, next) { if (req.body) { work(); save(); } }`) },
      ],
    },
  ],
});
