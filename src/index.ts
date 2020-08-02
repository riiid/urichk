import * as nearley from 'nearley';
import type { Lexer } from 'moo';
import * as compiledRules from './urichk';

export const lexer = compiledRules.Lexer as Lexer;
export const parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiledRules));
