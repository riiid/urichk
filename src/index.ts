import * as nearley from 'nearley';
import * as compiledRules from './urichk';

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiledRules));

parser.feed('scheme://example.com/path');
console.log(parser.results[0]);
