import * as ast from "../ast/index.ts";

export interface Visitor {
  visitUrichk: VisitFn<ast.Urichk>;
  visitRule: VisitFn<ast.Rule>;
  visitHead: VisitFn<ast.Head>;
  visitTail: VisitFn<ast.Tail>;
  visitScheme: VisitFn<ast.Scheme>;
  visitAuthority: VisitFn<ast.Authority>;
  visitUserinfo: VisitFn<ast.Userinfo>;
  visitHost: VisitFn<ast.Host>;
  visitPort: VisitFn<ast.Port>;
  visitPath: VisitFn<ast.Path>;
  visitPathFragment: VisitFn<ast.PathFragment>;
  visitStaticPathFragment: VisitFn<ast.StaticPathFragment>;
  visitParamPathFragment: VisitFn<ast.ParamPathFragment>;
  visitTailRule: VisitFn<ast.TailRule>;
  visitTailRuleMatch: VisitFn<ast.TailRuleMatch>;
  visitTailRuleForm: VisitFn<ast.TailRuleForm>;
  visitTailRuleFormPatternRule: VisitFn<ast.TailRuleFormPatternRule>;
  visitTailRulePatternValue: VisitFn<ast.TailRulePatternValue>;
  visitKey: VisitFn<ast.Key>;
  visitArrayToken: VisitFn<ast.Token>;
  visitTailType: VisitFn<ast.Token>;
  visitMatchType: VisitFn<ast.Token>;
  visitCommentGroup: VisitFn<ast.CommentGroup>;
  visitComment: VisitFn<ast.Comment>;
  visitToken: VisitFn<ast.Token>;
}

interface VisitFn<T> {
  (visitor: Visitor, node: T): void;
}

export const visitor: Visitor = {
  visitUrichk(visitor, node) {
    for (const rule of node) {
      visitor.visitRule(visitor, rule);
    }
  },
  visitRule(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitHead(visitor, node.head);
      visitor.visitTail(visitor, node.tail);
    });
  },
  visitHead(visitor, node) {
    visitStatementBase(visitor, node, () => {
      const { scheme, authority, path } = node;
      if (scheme) visitor.visitScheme(visitor, scheme);
      if (authority) visitor.visitAuthority(visitor, authority);
      if (path) visitor.visitPath(visitor, path);
    });
  },
  visitTail(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitToken(visitor, node.openParens);
      for (const rule of node.rules) {
        visitor.visitTailRule(visitor, rule);
      }
      visitor.visitToken(visitor, node.closeParens);
    });
  },
  visitScheme(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitAuthority(visitor, node) {
    const { userinfo, host, port } = node;
    if (userinfo) visitor.visitUserinfo(visitor, userinfo);
    visitor.visitHost(visitor, host);
    if (port) visitor.visitPort(visitor, port);
  },
  visitUserinfo(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitHost(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitPort(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitPath(visitor, node) {
    for (const pathFragment of node.fragments) {
      visitor.visitPathFragment(visitor, pathFragment);
    }
  },
  visitPathFragment(visitor, node) {
    if (node.type === "static") {
      visitor.visitStaticPathFragment(visitor, node);
    } else if (node.type === "param") {
      visitor.visitParamPathFragment(visitor, node);
    }
  },
  visitStaticPathFragment(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitParamPathFragment(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitTailRule(visitor, node) {
    if (isTailRuleMatch(node)) visitor.visitTailRuleMatch(visitor, node);
    if (isTailRuleForm(node)) visitor.visitTailRuleForm(visitor, node);
    function isTailRuleMatch(node: ast.TailRule): node is ast.TailRuleMatch {
      return node.matchType.text === "match";
    }
    function isTailRuleForm(node: ast.TailRule): node is ast.TailRuleForm {
      return node.matchType.text === "form";
    }
  },
  visitTailRuleMatch(visitor, node) {
    visitStatementBase(visitor, node, () => {
      const { tailType, matchType, pattern } = node;
      visitor.visitTailType(visitor, tailType);
      visitor.visitMatchType(visitor, matchType);
      for (const value of pattern) {
        visitor.visitTailRulePatternValue(visitor, value);
      }
    });
  },
  visitTailRulePatternValue(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitToken(visitor, node);
    });
  },
  visitTailRuleForm(visitor, node) {
    visitStatementBase(visitor, node, () => {
      const { tailType, matchType, pattern } = node;
      visitor.visitTailType(visitor, tailType);
      visitor.visitMatchType(visitor, matchType);
      for (const rule of pattern) {
        visitor.visitTailRuleFormPatternRule(visitor, rule);
      }
    });
  },
  visitTailRuleFormPatternRule(visitor, node) {
    visitStatementBase(visitor, node, () => {
      const { key, value, array } = node;
      visitor.visitKey(visitor, key);
      if (array) visitor.visitArrayToken(visitor, array);
      if (value) {
        for (const patternValue of value) {
          visitor.visitTailRulePatternValue(visitor, patternValue);
        }
      }
    });
  },
  visitKey(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitArrayToken(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitTailType(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitMatchType(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitCommentGroup(visitor, node) {
    for (const comment of node.comments) {
      visitor.visitComment(visitor, comment);
    }
  },
  visitComment(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitToken() {},
};

export function visitStatementBase<T extends ast.StatementBase>(
  visitor: Visitor,
  node: T,
  visit: () => void,
): void {
  for (const commentGroup of node.leadingComments) {
    visitor.visitCommentGroup(visitor, commentGroup);
  }
  visit();
  for (const commentGroup of node.trailingComments) {
    visitor.visitCommentGroup(visitor, commentGroup);
  }
}
