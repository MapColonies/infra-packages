import { ASTUtils, ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getExpressMajorVersion } from './express-version.js';

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/MapColonies/infra-packages/tree/main/packages/eslint-plugin#${name}`);

const NEXT_PARAM_INDEX = 2;
const FIRST_ASYNC_SAFE_EXPRESS_MAJOR = 5;
const SETTINGS_KEY = '@map-colonies';
const STATEMENT_LIST_PARENTS = new Set<TSESTree.AST_NODE_TYPES>([
  TSESTree.AST_NODE_TYPES.BlockStatement,
  TSESTree.AST_NODE_TYPES.Program,
  TSESTree.AST_NODE_TYPES.StaticBlock,
  TSESTree.AST_NODE_TYPES.SwitchCase,
]);

type MessageIds = 'redundantTryCatch' | 'removeTryCatch';
type Options = [{ nextNames?: string[] }];

type FunctionNode = TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;

function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === TSESTree.AST_NODE_TYPES.FunctionDeclaration ||
    node.type === TSESTree.AST_NODE_TYPES.FunctionExpression
  );
}

/**
 * Returns the call when the catch body is exactly `next(err)` or `return next(err)`.
 */
function getSingleForwardingCall(body: TSESTree.BlockStatement): TSESTree.CallExpression | undefined {
  if (body.body.length !== 1) {
    return undefined;
  }
  const [statement] = body.body;
  if (statement?.type === TSESTree.AST_NODE_TYPES.ExpressionStatement && statement.expression.type === TSESTree.AST_NODE_TYPES.CallExpression) {
    return statement.expression;
  }
  if (statement?.type === TSESTree.AST_NODE_TYPES.ReturnStatement && statement.argument?.type === TSESTree.AST_NODE_TYPES.CallExpression) {
    return statement.argument;
  }
  return undefined;
}

function getExplicitExpressVersion(settings: Record<string, unknown>): unknown {
  const pluginSettings = settings[SETTINGS_KEY];
  if (typeof pluginSettings !== 'object' || pluginSettings === null || !('expressVersion' in pluginSettings)) {
    return undefined;
  }
  return pluginSettings.expressVersion;
}

export const noRedundantTryCatch = createRule<Options, MessageIds>({
  name: 'express/no-redundant-try-catch',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow try/catch in Express handlers whose catch only forwards the caught error to `next`',
    },
    messages: {
      redundantTryCatch:
        'Redundant try/catch: Express already forwards errors thrown in this handler to `next`. Remove the try/catch, or handle the error in the catch.',
      removeTryCatch: 'Remove the try/catch and keep the contents of the try block.',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          nextNames: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ nextNames: ['next'] }],

  create(context, [{ nextNames = ['next'] }]) {
    const { sourceCode } = context;

    function getEnclosingFunction(node: TSESTree.Node): FunctionNode | undefined {
      return sourceCode.getAncestors(node).findLast(isFunctionNode);
    }

    function isNextParamOf(call: TSESTree.CallExpression, handler: FunctionNode): boolean {
      if (call.callee.type !== TSESTree.AST_NODE_TYPES.Identifier || !nextNames.includes(call.callee.name)) {
        return false;
      }
      const nextParam = handler.params[NEXT_PARAM_INDEX];
      if (nextParam?.type !== TSESTree.AST_NODE_TYPES.Identifier || nextParam.name !== call.callee.name) {
        return false;
      }
      const variable = ASTUtils.findVariable(sourceCode.getScope(call), call.callee);
      return variable?.defs.some((def) => def.type === TSESLint.Scope.DefinitionType.Parameter && def.node === handler) ?? false;
    }

    function isForwardingCaughtError(call: TSESTree.CallExpression, param: TSESTree.Identifier): boolean {
      if (call.arguments.length !== 1) {
        return false;
      }
      const [argument] = call.arguments;
      return argument?.type === TSESTree.AST_NODE_TYPES.Identifier && argument.name === param.name;
    }

    function isCaughtByExpress(handler: FunctionNode): boolean {
      const major = getExpressMajorVersion(context.filename, getExplicitExpressVersion(context.settings));
      if (major === undefined) {
        return false;
      }
      return major >= FIRST_ASYNC_SAFE_EXPRESS_MAJOR || !handler.async;
    }

    /**
     * Builds the replacement text for the try statement: the try block's contents, de-indented
     * to the try statement's level. Kept inside braces when the try is not in a statement list.
     */
    function getUnwrappedText(node: TSESTree.TryStatement): string {
      const { block } = node;
      const [blockStart, blockEnd] = block.range;
      const inner = sourceCode.text.slice(blockStart + 1, blockEnd - 1).trim();
      const firstStatement = block.body[0];
      const indentDelta = firstStatement === undefined ? 0 : firstStatement.loc.start.column - node.loc.start.column;
      const dedented =
        indentDelta > 0 && firstStatement?.loc.start.line !== block.loc.start.line
          ? inner.replace(new RegExp(`\\n[ \\t]{0,${indentDelta}}`, 'g'), '\n')
          : inner;

      if (node.parent !== undefined && STATEMENT_LIST_PARENTS.has(node.parent.type)) {
        return dedented;
      }
      return `{ ${dedented} }`;
    }

    function removeTryCatch(node: TSESTree.TryStatement): TSESLint.ReportFixFunction {
      return (fixer) => fixer.replaceText(node, getUnwrappedText(node));
    }

    return {
      TryStatement(node: TSESTree.TryStatement): void {
        const { handler: catchClause, finalizer } = node;
        if (finalizer !== null || catchClause === null || catchClause.param?.type !== TSESTree.AST_NODE_TYPES.Identifier) {
          return;
        }

        const call = getSingleForwardingCall(catchClause.body);
        if (call === undefined || !isForwardingCaughtError(call, catchClause.param)) {
          return;
        }

        const handler = getEnclosingFunction(node);
        if (handler === undefined || !isNextParamOf(call, handler) || !isCaughtByExpress(handler)) {
          return;
        }

        context.report({ node, messageId: 'redundantTryCatch', suggest: [{ messageId: 'removeTryCatch', fix: removeTryCatch(node) }] });
      },
    };
  },
});
