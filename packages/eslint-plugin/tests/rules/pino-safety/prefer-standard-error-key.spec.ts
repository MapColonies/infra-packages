import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { preferStandardErrorKey } from '../../../src/rules/pino-safety/prefer-standard-error-key.js';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

ruleTester.run('prefer-standard-error-key', preferStandardErrorKey, {
  valid: [
    // Using "err" key (correct) - valid
    {
      code: 'logger.error({ err: new Error("Something failed") }, "Error occurred")',
    },
    // No error object - valid
    {
      code: 'logger.info({ userId: 123 }, "User logged in")',
    },
    // Simple message with no objects - valid
    {
      code: 'logger.info("Simple message")',
    },
    // Object with other properties but no error key - valid
    {
      code: 'logger.debug({ requestId: "abc", duration: 100 }, "Request completed")',
    },
    // Multiple objects, none with "error" key - valid
    {
      code: 'logger.warn({ err: err, context: { userId: 1 } }, "Warning")',
    },
    // All pino log levels with correct "err" key - valid
    {
      code: 'logger.trace({ err: error }, "Trace")',
    },
    {
      code: 'logger.debug({ err: error }, "Debug")',
    },
    {
      code: 'logger.fatal({ err: error }, "Fatal")',
    },
    // Non-pino method calls should be ignored - valid
    {
      code: 'console.log({ error: err })',
    },
    {
      code: 'customLogger.log({ error: err })',
    },
    // Computed property keys - valid (can't statically analyze)
    {
      code: 'logger.error({ [keyName]: error }, "Dynamic key")',
    },
  ],

  invalid: [
    // Using "error" key instead of "err" - INVALID
    {
      code: 'logger.error({ error: new Error("Failed") }, "Error occurred")',
      errors: [
        {
          messageId: 'useErrKey' as const,
        },
      ],
    },
    // String literal "error" key - INVALID
    {
      code: 'logger.error({ "error": err }, "Error occurred")',
      errors: [
        {
          messageId: 'useErrKey' as const,
        },
      ],
    },
    // Multiple properties including "error" - INVALID
    {
      code: 'logger.warn({ requestId: "abc", error: err, userId: 123 }, "Warning")',
      errors: [
        {
          messageId: 'useErrKey' as const,
        },
      ],
    },
    // Error key in second argument object - INVALID
    {
      code: 'logger.info("Message", { error: err })',
      errors: [
        {
          messageId: 'useErrKey' as const,
        },
      ],
    },
    // Test all log levels with invalid "error" key
    {
      code: 'logger.trace({ error: err }, "Trace")',
      errors: [{ messageId: 'useErrKey' as const }],
    },
    {
      code: 'logger.debug({ error: err }, "Debug")',
      errors: [{ messageId: 'useErrKey' as const }],
    },
    {
      code: 'logger.info({ error: err }, "Info")',
      errors: [{ messageId: 'useErrKey' as const }],
    },
    {
      code: 'logger.warn({ error: err }, "Warn")',
      errors: [{ messageId: 'useErrKey' as const }],
    },
    {
      code: 'logger.fatal({ error: err }, "Fatal")',
      errors: [{ messageId: 'useErrKey' as const }],
    },
    // Nested case: merge object first, then message with error key object
    {
      code: 'logger.error({ userId: 1 }, "Error", { error: err })',
      errors: [{ messageId: 'useErrKey' as const }],
    },
  ],
});
