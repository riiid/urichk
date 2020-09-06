import * as nearley from 'nearley';
import type { Lexer } from 'moo';
import * as compiledRules from './urichk';
import type { Urichk } from './ast';

export const lexer = compiledRules.Lexer as Lexer;
export const parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiledRules));
export function parse(schema: string): undefined | Urichk {
    parser.feed(schema);
    return parser.finish()[0];
}
