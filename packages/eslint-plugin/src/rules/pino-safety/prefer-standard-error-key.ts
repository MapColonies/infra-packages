import { ESLintUtils } from '@typescript-eslint/utils';
import { TSESTree } from '@typescript-eslint/utils';

const PINO_LOG_METHODS = new Set(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/MapColonies/infra-packages/tree/main/packages/eslint-plugin#${name}`);

type MessageIds = 'useErrKey';
type Options = [];

function checkObjectForErrorKey(
  objectNode: TSESTree.ObjectExpression,
  context: ReturnType<typeof createRule<Options, MessageIds>>['create'] extends (context: infer C) => unknown ? C : never
): void {
  for (const prop of objectNode.properties) {
    if (prop.type === TSESTree.AST_NODE_TYPES.Property && !prop.computed) {
      const key = prop.key;
      let keyName: string | null = null;

      if (key.type === TSESTree.AST_NODE_TYPES.Identifier) {
        keyName = key.name;
      } else if (key.type === TSESTree.AST_NODE_TYPES.Literal && typeof key.value === 'string') {
        keyName = key.value;
      }

      if (keyName === 'error') {
        context.report({
          node: key,
          messageId: 'useErrKey',
        });
      }
    }
  }
}

export const preferStandardErrorKey = createRule<Options, MessageIds>({
  name: 'pino-safety/prefer-standard-error-key',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure errors are serialized correctly by using the standard "err" key instead of "error"',
    },
    messages: {
      useErrKey: 'Use "err" instead of "error" as the property key. Pino\'s default error serializer expects the "err" key.',
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

        // Check all arguments for object literals with "error" property
        for (const arg of node.arguments) {
          if (arg.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
            checkObjectForErrorKey(arg, context);
          }
        }
      },
    };
  },
});
