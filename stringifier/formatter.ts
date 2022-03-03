import * as ast from "../ast.ts";
import { Visitor, visitor as defaultVisitor } from "../visitor/index.ts";
import { createPrinter } from "./printer.ts";

export default function format(ast: ast.Urichk): string {
  const printer = createPrinter();
  const formatter: Visitor = {
    ...defaultVisitor,
    visitToken(visitor, node) {
      printer.print(node.text);
    },
    visitHead(visitor, node) {
      defaultVisitor.visitHead(visitor, node);
      printer.print(" ");
    },
    visitUserinfo(visitor, node) {
      defaultVisitor.visitUserinfo(visitor, node);
      printer.print("@");
    },
    visitScheme(visitor, node) {
      defaultVisitor.visitScheme(visitor, node);
      printer.print(":");
    },
    visitPort(visitor, node) {
      printer.print(":");
      defaultVisitor.visitPort(visitor, node);
    },
    visitPathFragment(visitor, node) {
      printer.print("/");
      defaultVisitor.visitPathFragment(visitor, node);
    },
    visitParamPathFragment(visitor, node) {
      printer.print("[");
      defaultVisitor.visitParamPathFragment(visitor, node);
      printer.print("]");
    },
    visitTail(visitor, node) {
      printer.print("{");
      printer.indent();
      for (const rule of node) {
        printer.print("\n");
        visitor.visitTailRule(visitor, rule);
        printer.print("\n");
      }
      printer.dedent();
      printer.println("}\n");
    },
    visitTailRule(visitor, node) {
      printer.printIndent();
      defaultVisitor.visitTailRule(visitor, node);
    },
    visitTailRuleMatch(visitor, node) {
      const { matchType, pattern } = node;
      visitor.visitMatchType(visitor, matchType);
      if (pattern.length > 1) {
        printer.indent();
        for (const value of pattern) {
          printer.print("\n");
          printer.printIndent();
          printer.print("| ");
          visitor.visitTailRulePatternValue(visitor, value);
        }
        printer.dedent();
      } else {
        for (const value of pattern) {
          visitor.visitTailRulePatternValue(visitor, value);
        }
      }
    },
    visitTailRuleForm(visitor, node) {
      const { matchType, pattern } = node;
      visitor.visitMatchType(visitor, matchType);
      printer.print("{\n");
      printer.indent();
      for (const rule of pattern) {
        visitor.visitTailRuleFormPatternRule(visitor, rule);
      }
      printer.dedent();
      printer.printIndent();
      printer.print("}");
    },
    visitTailRuleFormPatternRule(visitor, node) {
      printer.printIndent();
      const { comment, key, value, array } = node;
      if (comment) visitor.visitComment(visitor, comment);
      visitor.visitKey(visitor, key);
      visitor.visitArrayToken(visitor, array);
      if (value) {
        printer.print(" ");
        printer.print("=");
        printer.print(" ");
        value.forEach((patternValue, index) => {
          if (index > 0) printer.print(" | ");
          visitor.visitTailRulePatternValue(visitor, patternValue);
        });
      }
      printer.print("\n");
    },
    visitArrayToken(visitor, node) {
      if (node === true) printer.print(" []");
    },
    visitTailType(visitor, node) {
      defaultVisitor.visitTailType(visitor, node);
      printer.print(" ");
    },
    visitMatchType(visitor, node) {
      defaultVisitor.visitMatchType(visitor, node);
      printer.print(" ");
    },
    visitComment(visitor, node) {
      defaultVisitor.visitComment(visitor, node);
      printer.print("\n");
      printer.printIndent();
    },
  };
  formatter.visitUrichk(formatter, ast);
  return printer.done();
}
