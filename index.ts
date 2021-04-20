import * as nearley from "https://deno.land/x/nearley@2.19.7-deno/mod.ts";
import _compiledRules from "./generated/urichk.js";
import type { Urichk } from "./ast.ts";

const compiledRules = _compiledRules as unknown as nearley.CompiledRules;

export const lexer = compiledRules.Lexer!;
export const parser = new nearley.Parser(
  nearley.Grammar.fromCompiled(compiledRules),
);
export function parse(schema: string): undefined | Urichk {
  parser.feed(schema);
  return parser.finish()[0];
}
