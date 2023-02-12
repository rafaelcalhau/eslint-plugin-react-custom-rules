module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforces the practice of not creating variables after useEffect calls.'
    },
    schema: [] // no options
  },
  create: function (context) {
    return {
      FunctionDeclaration: function (node) {
        const moduleFunctionNodes = context
          .getDeclaredVariables(node)
          .filter(({ scope }) => scope.type === 'module');

        if (moduleFunctionNodes === 0) {
          return;
        }

        /*
          Rules:
          - useEffect calls should be declared always immediately before return statement
          - variables should never be declared between useEffect calls
        */

        const StatementTypes = {
          FunctionDeclaration: 'FunctionDeclaration',
          ExpressionStatement: 'ExpressionStatement',
          ReturnStatement: 'ReturnStatement',
          VariableDeclaration: 'VariableDeclaration'
        };

        const assertDeclarations = (functionDeclarations) => {
          functionDeclarations.forEach(fn => {
            const declarations = fn.node.body.body;

            if (declarations.length > 1) {
              for (let i = 0; i < declarations.length - 1; i++) {
                // declarations before the return statement
                const currentDeclaration = declarations[i];
                const nextDeclaration = declarations[i + 1];

                if (isUseEffectCall(currentDeclaration) &&
                  (!isUseEffectCall(nextDeclaration) && !isReturnCall(nextDeclaration))) {
                  context.report({
                    node: nextDeclaration,
                    message: 'No variables should be declared after and between useEffect calls.'
                  });
                }
              }
            }
          });
        }

        const isReturnCall = (node) => {
          return node.type === StatementTypes.ReturnStatement;
        };
        const isUseEffectCall = (node) => {
          return node.type === StatementTypes.ExpressionStatement && node.expression.callee.name === 'useEffect';
        };

        moduleFunctionNodes.forEach(moduleFunction => {
          const functionDeclarations = moduleFunction.defs
            .filter(def => def.node.type === StatementTypes.FunctionDeclaration);

          if (functionDeclarations.length > 0) assertDeclarations(functionDeclarations)
        });
      }
    };
  }
};
