'use strict';

let program = `
foo: {
  for (let i = 0; i < 2; ++i) {
    break foo;
  }
  42;
}
`;

let ast = require('shift-parser').parseScript(program);

const EMPTY = {};

console.log(EndsInIterationOrDeclaration(ast.statements, [], true));



function EndsInIterationOrDeclaration(node, labelSet, isLast) {
  if (Array.isArray(node)) {
    // i.e. StatementList
    if (node.length === 0) {
      throw new Error('unreachable: empty statement list');
    } else if (node.length === 1) {
      return EndsInIterationOrDeclaration(node[0], labelSet, isLast);
    } else {
      let StatementListItem = node[node.length - 1];
      let StatementList = node.slice(0, -1);
      if (IsEmpty(StatementListItem, [])) {
        return EndsInIterationOrDeclaration(StatementList, labelSet, isLast);
      }
      if (IsBreak(StatementListItem, labelSet)) {
        return EndsInIterationOrDeclaration(StatementList, labelSet, true);
      }
      if (EndsInIterationOrDeclaration(StatementList, labelSet, false)) {
        return true;
      }
      return EndsInIterationOrDeclaration(StatementListItem, labelSet, isLast);
    }
  }

  switch (node.type) {
    case 'VariableDeclarationStatement':
    case 'FunctionDeclaration':
    case 'ClassDeclaration': {
      return isLast;
    }
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement': {
      if (isLast) {
        return true;
      }
      if (IsBreak(node.body, labelSet)) {
        return true;
      }
      return EndsInIterationOrDeclaration(node.body, labelSet, false);
    }
    case 'EmptyStatement':
    case 'ExpressionStatement':
    case 'ContinueStatement':
    case 'BreakStatement':
    case 'ReturnStatement':
    case 'ThrowStatement':
    case 'DebuggerStatement': {
      return false;
    }
    case 'LabeledStatement': {
      if (node.body.type === 'FunctionDeclaration') {
        return isLast;
      } else {
        if (isLast) {
          let newLabelSet = labelSet.concat([node.label]);
          return EndsInIterationOrDeclaration(node.body, newLabelSet, true);
        }
        return EndsInIterationOrDeclaration(node.body, labelSet, isLast);
      }
    }
    case 'BlockStatement': {
      return EndsInIterationOrDeclaration(node.block, labelSet, isLast);
    }
    case 'Block': {
      if (node.statements.length === 0) {
        return false;
      }
      return EndsInIterationOrDeclaration(node.statements, labelSet, isLast);
    }
    case 'IfStatement': {
      if (node.alternate == null) {
        return EndsInIterationOrDeclaration(node.consequent, labelSet, isLast);
      } else {
        let first = EndsInIterationOrDeclaration(node.consequent, labelSet, isLast);
        if (first) {
          return true;
        }
        return EndsInIterationOrDeclaration(node.alternate, labelSet, isLast);
      }
    }
    case 'WithStatement': {
      return EndsInIterationOrDeclaration(node.body, labelSet, isLast);
    }
    case 'SwitchStatement': {
      let newLabelSet;
      if (isLast) {
        newLabelSet = labelSet.concat([EMPTY]);
      } else {
        newLabelSet = labelSet.filter(l => l !== EMPTY);
      }
      let clauses = node.cases;
      for (let clause of clauses.reverse()) {
        if (!IsEmpty(clause, [])) {
          if (EndsInIterationOrDeclaration(clause, newLabelSet, isLast)) {
            return true;
          }
          if (IsBreak(clause, newLabelSet)) {
            isLast = true;
          } else {
            isLast = false;
          }
        }
      }
      return false;
    }
    case 'SwitchStatementWithDefault': {
      let newLabelSet;
      if (isLast) {
        newLabelSet = labelSet.concat([EMPTY]);
      } else {
        newLabelSet = labelSet.filter(l => l !== EMPTY);
      }
      let clauses = [...node.preDefaultCases, node.defaultCase, ...node.postDefaultCases];
      for (let clause of clauses.reverse()) {
        if (!IsEmpty(clause, [])) {
          if (EndsInIterationOrDeclaration(clause, newLabelSet, isLast)) {
            return true;
          }
          if (IsBreak(clause, newLabelSet)) {
            isLast = true;
          } else {
            isLast = false;
          }
        }
      }
    }
    case 'SwitchCase':
    case 'SwitchDefault': {
      if (node.consequent.length === 0) {
        return false;
      }
      return EndsInIterationOrDeclaration(node.consequent, labelSet, isLast);
    }
    case 'TryCatchStatement': {
      return EndsInIterationOrDeclaration(node.catchClause, labelSet, isLast);
    }
    case 'TryFinallyStatement': {
      if (EndsInIterationOrDeclaration(node.body, labelSet, isLast)) {
        return true;
      }
      return node.catchClause != null && EndsInIterationOrDeclaration(node.catchClause, labelSet, isLast);
    }
    case 'CatchClause': {
      return EndsInIterationOrDeclaration(node.body, labelSet, isLast);
    }
    default: {
      throw new Error('unhandled node type ' + node.type);
    }
  }
}

function IsEmpty(node, labelSet) {
  if (Array.isArray(node)) {
    if (node.length === 0) {
      throw new Error('unreachable: empty statement list');
    } else if (node.length === 1) {
      return IsEmpty(node[0], labelSet);
    } else {
      let StatementListItem = node[node.length - 1];
      let StatementList = node.slice(0, -1);
      if (IsBreak(StatementList, labelSet)) {
        return true;
      }
      if (!IsEmpty(StatementListItem, labelSet)) {
        return false;
      }
      return IsEmpty(StatementList, labelSet);
    }
  }

  switch (node.type) {
    case 'EmptyStatement':
    case 'DebuggerStatement': {
      return true;
    }
    case 'BlockStatement': {
      return IsEmpty(node.block, labelSet);
    }
    case 'Block': {
      if (node.statements.length === 0) {
        return true;
      }
      return IsEmpty(node.statements, labelSet);
    }
    case 'VariableDeclarationStatement':
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'ExpressionStatement':
    case 'IfStatement':
    case 'SwitchStatement':
    case 'SwitchStatementWithDefault':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'ContinueStatement':
    case 'ReturnStatement':
    case 'WithStatement':
    case 'ThrowStatement':
    case 'TryStatement':
    case 'TryCatchStatement':
    case 'TryFinallyStatement': {
      return false;
    }
    case 'BreakStatement': {
      if (node.label == null) {
        if (labelSet.includes(EMPTY)) {
          return true;
        }
        return false;
      } else {
        if (labelSet.includes(node.label)) {
          return true;
        }
        return false;
      }
    }
    case 'LabeledStatement': {
      if (node.body.type === 'FunctionDeclaration') {
        return false;
      } else {
        let newLabelSet = labelSet.concat([node.label]);
        return IsEmpty(node.body, newLabelSet);
      }
    }
    case 'SwitchCase':
    case 'SwitchDefault': {
      if (node.consequent.length === 0) {
        return true;
      }
      return IsEmpty(node.consequent, labelSet);
    }
    default: {
      throw new Error('unhandled node type ' + node.type);
    }
  }
}


function IsBreak(node, labelSet) {
  if (Array.isArray(node)) {
    if (node.length === 0) {
      throw new Error('unreachable: empty statement list');
    } else if (node.length === 1) {
      return IsBreak(node[0], labelSet);
    } else {
      let StatementListItem = node[node.length - 1];
      let StatementList = node.slice(0, -1);
      if (IsBreak(StatementList, labelSet)) {
        return true;
      }
      if (!IsEmpty(StatementListItem, labelSet)) {
        return false;
      }
      return IsBreak(StatementList, labelSet);
    }
  }

  switch (node.type) {
    case 'EmptyStatement':
    case 'DebuggerStatement': {
      return true;
    }
    case 'BlockStatement': {
      return IsEmpty(node.block, labelSet);
    }
    case 'Block': {
      if (node.statements.length === 0) {
        return false;
      }
      return IsEmpty(node.statements, labelSet);
    }
    case 'VariableDeclarationStatement':
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'ExpressionStatement':
    case 'IfStatement':
    case 'SwitchStatement':
    case 'SwitchStatementWithDefault':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'ContinueStatement':
    case 'ReturnStatement':
    case 'WithStatement':
    case 'ThrowStatement':
    case 'TryStatement':
    case 'TryCatchStatement':
    case 'TryFinallyStatement': {
      return false;
    }
    case 'BreakStatement': {
      if (node.label == null) {
        if (labelSet.includes(EMPTY)) {
          return true;
        }
        return false;
      } else {
        if (labelSet.includes(node.label)) {
          return true;
        }
        return false;
      }
    }
    case 'LabeledStatement': {
      if (node.body.type === 'FunctionDeclaration') {
        return false;
      } else {
        return IsBreak(node.body, labelSet);
      }
    }
    case 'SwitchCase':
    case 'SwitchDefault': {
      if (node.consequent.length === 0) {
        return false;
      }
      return IsBreak(node.consequent, labelSet);
    }
    default: {
      throw new Error('unhandled node type ' + node.type);
    }
  }
}
