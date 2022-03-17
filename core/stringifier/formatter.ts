import * as ast from "../ast/index.ts";
import {
  Visitor,
  visitor as defaultVisitor,
  visitStatementBase,
} from "../visitor/index.ts";
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
      visitStatementBase(visitor, node, () => {
        printer.print("{");
        printer.indent();
        for (const rule of node.rules) {
          printer.print("\n");
          visitor.visitTailRule(visitor, rule);
          printer.print("\n");
        }
        printer.dedent();
        printer.println("}\n");
      });
    },
    visitTailRule(visitor, node) {
      defaultVisitor.visitTailRule(visitor, node);
    },
    visitTailRuleMatch(visitor, node) {
      visitStatementBase(visitor, node, () => {
        printer.printIndent();
        const { tailType, matchType, pattern } = node;
        visitor.visitTailType(visitor, tailType);
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
      });
    },
    visitTailRuleForm(visitor, node) {
      visitStatementBase(visitor, node, () => {
        printer.printIndent();
        const { tailType, matchType, pattern } = node;
        visitor.visitTailType(visitor, tailType);
        visitor.visitMatchType(visitor, matchType);
        printer.print("{\n");
        printer.indent();
        for (const rule of pattern) {
          visitor.visitTailRuleFormPatternRule(visitor, rule);
        }
        printer.dedent();
        printer.printIndent();
        printer.print("}");
      });
    },
    visitTailRuleFormPatternRule(visitor, node) {
      visitStatementBase(visitor, node, () => {
        printer.printIndent();
        const { key, value, array } = node;
        visitor.visitKey(visitor, key);
        if (array) visitor.visitArrayToken(visitor, array);
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
      });
    },
    visitTailRulePatternValue(visitor, node) {
      defaultVisitor.visitTailRulePatternValue(visitor, node);
    },
    visitArrayToken(visitor, node) {
      printer.print(" ");
      visitor.visitToken(visitor, node);
    },
    visitTailType(visitor, node) {
      defaultVisitor.visitTailType(visitor, node);
      printer.print(" ");
    },
    visitMatchType(visitor, node) {
      defaultVisitor.visitMatchType(visitor, node);
      printer.print(" ");
    },
    visitCommentGroup(visitor, node) {
      printer.printIndent();
      for (const comment of node.comments) {
        visitor.visitComment(visitor, comment);
        printer.print("\n");
      }
    },
    visitComment(visitor, node) {
      if (node.type === "document-comment") {
        node.text.split("\n").map((line, index) => {
          const trimed = line.trimStart();
          if (index) {
            printer.println("");
            printer.printIndent();
            printer.print(" ");
          }
          printer.print(trimed);
        });
      } else {
        visitor.visitToken(visitor, node);
      }
    },
  };
  formatter.visitUrichk(formatter, ast);
  return printer.done();
}
