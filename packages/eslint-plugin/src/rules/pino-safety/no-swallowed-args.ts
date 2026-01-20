import { ESLintUtils } from '@typescript-eslint/utils';
import { TSESTree } from '@typescript-eslint/utils';

const PINO_LOG_METHODS = new Set(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
const PRINTF_PLACEHOLDER_REGEX = /%[sdifjoO]/g;

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/MapColonies/infra-packages/tree/main/packages/eslint-plugin#${name}`);

type MessageIds = 'swallowedArgs';
type Options = [];

export const noSwallowedArgs = createRule<Options, MessageIds>({
  name: 'pino-safety/no-swallowed-args',
  meta: {
    type: 'problem',
    docs: {
      description: "Prevent Pino from swallowing objects when the arguments don't match the message format",
    },
    messages: {
      swallowedArgs:
        'Pino call has {{extraCount}} extra argument(s) with no placeholders. Arguments beyond placeholders are silently ignored. Add placeholders (%s, %d, etc.) or use a merge object as the first argument.',
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    /**
     * Count printf-style placeholders in a message string
     */
    function countPlaceholders(message: string): number {
      const placeholders = message.match(PRINTF_PLACEHOLDER_REGEX);
      return placeholders?.length ?? 0;
    }

    /**
     * Report swallowed arguments error
     */
    function reportSwallowedArgs(node: TSESTree.CallExpression, extraCount: number): void {
      context.report({
        node,
        messageId: 'swallowedArgs',
        data: {
          extraCount: extraCount.toString(),
        },
      });
    }

    /**
     * Validate arguments against message placeholders
     */
    function validateMessageArgs(node: TSESTree.CallExpression, message: string, argCountAfterMessage: number): void {
      const placeholderCount = countPlaceholders(message);
      if (argCountAfterMessage > placeholderCount) {
        reportSwallowedArgs(node, argCountAfterMessage - placeholderCount);
      }
    }

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Check if this is a pino method call (logger.info, logger.error, etc.)
        if (node.callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const { property, object } = node.callee;
        if (property.type !== TSESTree.AST_NODE_TYPES.Identifier || !PINO_LOG_METHODS.has(property.name)) {
          return;
        }

        // Skip known non-Pino objects (console, process, etc.)
        if (object.type === TSESTree.AST_NODE_TYPES.Identifier && object.name === 'console') {
          return;
        }

        // Only apply rule to likely logger instances (heuristic):
        // - Named 'logger', 'log', or ends with 'Logger' (case-insensitive)
        // - Or member expressions like 'this.logger', 'req.log', etc.
        if (object.type === TSESTree.AST_NODE_TYPES.Identifier) {
          const objectName = object.name.toLowerCase();
          const isLikelyLogger = objectName === 'logger' || objectName === 'log' || objectName.endsWith('logger');
          if (!isLikelyLogger) {
            return;
          }
        }

        const args = node.arguments;
        if (args.length === 0) {
          return;
        }

        const firstArg = args[0];
        if (!firstArg) {
          return;
        }

        // Skip validation for template literals - we can't statically analyze them
        if (firstArg.type === TSESTree.AST_NODE_TYPES.TemplateLiteral) {
          return;
        }

        // Case 1: First argument is a merge object (or other non-string-literal expression)
        if (firstArg.type !== TSESTree.AST_NODE_TYPES.Literal || typeof firstArg.value !== 'string') {
          // Merge objects can have a second string argument for the message, but no additional args
          // Example: logger.info({ userId: 123 }, "message") - valid
          // Example: logger.info({ msg: "message" }, extraArg) - INVALID (extraArg is swallowed)
          const secondArg = args[1];
          const hasStringMessage = secondArg?.type === TSESTree.AST_NODE_TYPES.Literal && typeof secondArg.value === 'string';

          if (hasStringMessage) {
            // Pattern: logger.info({ ... }, "message with %s", arg1, ...)
            validateMessageArgs(node, secondArg.value, args.length - 2);
          } else if (args.length > 1) {
            // Pattern: logger.info({ msg: "..." }, extraArg) - all args after merge object are swallowed
            reportSwallowedArgs(node, args.length - 1);
          }

          return;
        }

        // Case 2: First argument is a string literal message
        validateMessageArgs(node, firstArg.value, args.length - 1);
      },
    };
  },
});
