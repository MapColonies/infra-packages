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
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        // Check if this is a pino method call (logger.info, logger.error, etc.)
        if (node.callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const { property } = node.callee;
        if (property.type !== TSESTree.AST_NODE_TYPES.Identifier || !PINO_LOG_METHODS.has(property.name)) {
          return;
        }

        const args = node.arguments;
        if (args.length === 0) {
          return;
        }

        const firstArg = args[0];
        if (!firstArg) {
          return;
        }

        // If first argument is NOT a string literal, it's likely a merge object (valid pattern)
        if (firstArg.type !== TSESTree.AST_NODE_TYPES.Literal || typeof firstArg.value !== 'string') {
          return;
        }

        // Count printf-style placeholders in the message
        const message = firstArg.value;
        const placeholders = message.match(PRINTF_PLACEHOLDER_REGEX);
        const placeholderCount = placeholders?.length ?? 0;

        // Count remaining arguments (excluding the first message argument)
        const argCount = args.length - 1;

        // Report if there are more arguments than placeholders
        if (argCount > placeholderCount) {
          const extraCount = argCount - placeholderCount;
          context.report({
            node,
            messageId: 'swallowedArgs',
            data: {
              extraCount: extraCount.toString(),
            },
          });
        }
      },
    };
  },
});
