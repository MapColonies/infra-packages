import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noSwallowedArgs } from '../../../src/rules/pino-safety/no-swallowed-args.js';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

ruleTester.run('no-swallowed-args', noSwallowedArgs, {
  valid: [
    // No arguments - valid
    {
      code: 'logger.info()',
    },
    // Merge object pattern (first arg is object) - valid
    {
      code: 'logger.info({ userId: 123 }, "User logged in")',
    },
    // Single message with no placeholders and no extra args - valid
    {
      code: 'logger.info("Simple message")',
    },
    // Message with placeholder and matching argument count - valid
    {
      code: 'logger.info("User %s logged in", username)',
    },
    // Multiple placeholders with matching argument count - valid
    {
      code: 'logger.info("User %s logged in at %d", username, timestamp)',
    },
    // Different placeholder types - valid
    {
      code: 'logger.debug("Values: %s %d %f %i %j %o %O", str, int1, float, int2, json, obj1, obj2)',
    },
    // Fewer arguments than placeholders (user might be intentional) - valid
    {
      code: 'logger.warn("Expected %s and %s", onlyOne)',
    },
    // All pino log levels - valid
    {
      code: 'logger.trace("Trace %s", value)',
    },
    {
      code: 'logger.debug("Debug %s", value)',
    },
    {
      code: 'logger.error("Error %s", value)',
    },
    {
      code: 'logger.fatal("Fatal %s", value)',
    },
    // Non-pino method calls should be ignored - valid
    {
      code: 'console.log("Message", extraArg)',
    },
    {
      code: 'logger.custom("Message", extraArg)',
    },
    // Template expression (not string literal) - valid
    {
      code: 'logger.info(`User ${username} logged in`, extraData)',
    },
  ],

  invalid: [
    // String message with extra argument but no placeholder - INVALID (common mistake)
    {
      code: 'logger.info("User logged in", { userId: 123 })',
      errors: [
        {
          messageId: 'swallowedArgs' as const,
          data: { extraCount: '1' },
        },
      ],
    },
    // Message with one placeholder but two extra arguments - INVALID
    {
      code: 'logger.info("User %s", username, extraData)',
      errors: [
        {
          messageId: 'swallowedArgs' as const,
          data: { extraCount: '1' },
        },
      ],
    },
    // Message with no placeholders but multiple extra arguments - INVALID
    {
      code: 'logger.error("An error occurred", err, context, metadata)',
      errors: [
        {
          messageId: 'swallowedArgs' as const,
          data: { extraCount: '3' },
        },
      ],
    },
    // Message with two placeholders but four extra arguments - INVALID
    {
      code: 'logger.warn("Processing %s with %s", file, options, extra1, extra2)',
      errors: [
        {
          messageId: 'swallowedArgs' as const,
          data: { extraCount: '2' },
        },
      ],
    },
    // Test all log levels with invalid patterns
    {
      code: 'logger.trace("Message", extra)',
      errors: [{ messageId: 'swallowedArgs' as const, data: { extraCount: '1' } }],
    },
    {
      code: 'logger.debug("Message", extra)',
      errors: [{ messageId: 'swallowedArgs' as const, data: { extraCount: '1' } }],
    },
    {
      code: 'logger.error("Message", extra)',
      errors: [{ messageId: 'swallowedArgs' as const, data: { extraCount: '1' } }],
    },
    {
      code: 'logger.fatal("Message", extra)',
      errors: [{ messageId: 'swallowedArgs' as const, data: { extraCount: '1' } }],
    },
  ],
});
