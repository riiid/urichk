const fs = require('fs');
const nearley = require('nearley/lib/nearley.js');
const Compile = require('nearley/lib/compile.js');
const StreamWrapper = require('nearley/lib/stream.js');
const version = require('nearley/package.json').version;

const input = fs.createReadStream('urichk.ne');
const output = fs.createWriteStream('generated/urichk.js');

const parserGrammar = nearley.Grammar.fromCompiled(require('nearley/lib/nearley-language-bootstrapped.js'));
const parser = new nearley.Parser(parserGrammar);
const generate = require('nearley/lib/generate.js');

generate.urichk = (parser, exportName) => {
  return `
    // nearley version: ${parser.version}
    // export name: ${exportName}
    ${parser.body.join('\n')}
    function id(x) { return x[0]; }
    export default {
      Lexer: ${parser.config.lexer},
      ParserRules: [${
        parser.rules.map(rule => {
          const name = JSON.stringify(rule.name);
          const symbols = `[${rule.symbols.map(symbol => (
            symbol instanceof RegExp ? symbol.toString() :
            symbol.token ? symbol.token :
            JSON.stringify(symbol)
          )).join(',')}]`;
          if (rule.postprocess) {
            const postprocessors = generate.javascript.builtinPostprocessors;
            const postprocess = rule.postprocess.builtin ? postprocessors[rule.postprocess.builtin] : rule.postprocess;
            return `{name: ${name}, symbols: ${symbols}, postprocess: ${postprocess}}`;
          } else {
            return `{name: ${name}, symbols: ${symbols}}`;
          }
        })
      }],
      ParserStart: ${JSON.stringify(parser.start)},
    };
  `;
};

input
  .pipe(new StreamWrapper(parser))
  .on('finish', () => {
    parser.feed('\n');
    output.write(
      generate(
        Compile(parser.results[0], { version }),
        'urichk'
      )
    );
  });
