import { ASTUtils, ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getExpressMajorVersion } from './express-version.js';

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/MapColonies/infra-packages/tree/master/packages/eslint-plugin#${name}`);

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
  name: 'express-no-redundant-try-catch',
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

    function isNextParamOf(call: TSESTree.CallExpression, enclosingFunction: FunctionNode): boolean {
      if (call.callee.type !== TSESTree.AST_NODE_TYPES.Identifier || !nextNames.includes(call.callee.name)) {
        return false;
      }
      const nextParam = enclosingFunction.params[NEXT_PARAM_INDEX];
      if (nextParam?.type !== TSESTree.AST_NODE_TYPES.Identifier || nextParam.name !== call.callee.name) {
        return false;
      }
      const variable = ASTUtils.findVariable(sourceCode.getScope(call), call.callee);
      return variable?.defs.some((def) => def.type === TSESLint.Scope.DefinitionType.Parameter && def.node === enclosingFunction) ?? false;
    }

    function isForwardingCaughtError(call: TSESTree.CallExpression, param: TSESTree.Identifier): boolean {
      if (call.arguments.length !== 1) {
        return false;
      }
      const [argument] = call.arguments;
      return argument?.type === TSESTree.AST_NODE_TYPES.Identifier && argument.name === param.name;
    }

    function isCaughtByExpress(enclosingFunction: FunctionNode): boolean {
      const major = getExpressMajorVersion(context.filename, getExplicitExpressVersion(context.settings));
      if (major === undefined) {
        return false;
      }
      return major >= FIRST_ASYNC_SAFE_EXPRESS_MAJOR || !enclosingFunction.async;
    }

    function hasMultiLineTemplate(block: TSESTree.BlockStatement): boolean {
      return sourceCode
        .getTokens(block)
        .some((token) => token.type === TSESTree.AST_TOKEN_TYPES.Template && token.loc.start.line !== token.loc.end.line);
    }

    /**
     * True when moving the try block's declarations into the surrounding scope would redeclare
     * or shadow a name that is already visible there.
     */
    function wouldCollideWithOuterScope(block: TSESTree.BlockStatement): boolean {
      const blockScope = sourceCode.getScope(block);
      return blockScope.variables.some(({ name }) => {
        for (let scope = blockScope.upper; scope !== null; scope = scope.upper) {
          if (scope.set.has(name)) {
            return true;
          }
        }
        return false;
      });
    }

    /**
     * Builds the replacement text for the try statement. The try block's contents are inlined and
     * de-indented when that is safe; otherwise the block itself (with its braces) is kept.
     */
    function getReplacementText(node: TSESTree.TryStatement): string {
      const { block } = node;
      const isInStatementList = node.parent !== undefined && STATEMENT_LIST_PARENTS.has(node.parent.type);
      if (!isInStatementList || hasMultiLineTemplate(block) || wouldCollideWithOuterScope(block)) {
        return sourceCode.getText(block);
      }

      const [blockStart, blockEnd] = block.range;
      const inner = sourceCode.text.slice(blockStart + 1, blockEnd - 1).trim();
      const firstStatement = block.body[0];
      const indentDelta = firstStatement === undefined ? 0 : firstStatement.loc.start.column - node.loc.start.column;
      if (indentDelta <= 0 || firstStatement?.loc.start.line === block.loc.start.line) {
        return inner;
      }
      return inner.replace(new RegExp(`\\n[ \\t]{0,${indentDelta}}`, 'g'), '\n');
    }

    function getSuggestions(node: TSESTree.TryStatement, catchClause: TSESTree.CatchClause): TSESLint.ReportSuggestionArray<MessageIds> {
      // Removing the catch would silently drop its comments, so leave that to the developer
      if (sourceCode.getCommentsInside(catchClause).length > 0) {
        return [];
      }
      return [{ messageId: 'removeTryCatch', fix: (fixer) => fixer.replaceText(node, getReplacementText(node)) }];
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

        const enclosingFunction = getEnclosingFunction(node);
        if (enclosingFunction === undefined || !isNextParamOf(call, enclosingFunction) || !isCaughtByExpress(enclosingFunction)) {
          return;
        }

        context.report({ node, messageId: 'redundantTryCatch', suggest: getSuggestions(node, catchClause) });
      },
    };
  },
});
