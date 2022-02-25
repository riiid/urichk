import * as ast from "../ast.ts";

interface Visitor {
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
  visitArrayToken: VisitFn<boolean>;
  visitTailType: VisitFn<ast.Token>;
  visitMatchType: VisitFn<ast.Token>;
  visitComment: VisitFn<ast.Token>;
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
    const { head, tail } = node;
    visitor.visitHead(visitor, head);
    visitor.visitTail(visitor, tail);
  },
  visitHead(visitor, node) {
    const { scheme, authority, path } = node;
    if (scheme) visitor.visitScheme(visitor, scheme);
    if (authority) visitor.visitAuthority(visitor, authority);
    if (path) visitor.visitPath(visitor, path);
  },
  visitTail(visitor, node) {
    for (const rule of node) {
      visitor.visitTailRule(visitor, rule);
    }
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
    for (const pathFragment of node) {
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
    visitor.visitToken(visitor, node.name);
  },
  visitParamPathFragment(visitor, node) {
    visitor.visitToken(visitor, node.name);
  },
  visitTailRule(visitor, node) {
    const { comment, tailType } = node;
    if (comment) visitor.visitComment(visitor, comment);
    visitor.visitTailType(visitor, tailType);
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
    const { matchType, pattern } = node;
    visitor.visitMatchType(visitor, matchType);
    for (const value of pattern) {
      visitor.visitTailRulePatternValue(visitor, value);
    }
  },
  visitTailRulePatternValue(visitor, node) {
    visitor.visitToken(visitor, node.value);
  },
  visitTailRuleForm(visitor, node) {
    const { matchType, pattern } = node;
    visitor.visitMatchType(visitor, matchType);
    for (const rule of pattern) {
      visitor.visitTailRuleFormPatternRule(visitor, rule);
    }
  },
  visitTailRuleFormPatternRule(visitor, node) {
    const { comment, key, value, array } = node;
    if (comment) visitor.visitComment(visitor, comment);
    visitor.visitKey(visitor, key);
    visitor.visitArrayToken(visitor, array);
    for (const patternValue of value) {
      visitor.visitTailRulePatternValue(visitor, patternValue);
    }
  },
  visitKey() {},
  visitArrayToken() {},
  visitTailType(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitMatchType(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitComment(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitToken() {},
};
