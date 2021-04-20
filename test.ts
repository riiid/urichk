import { lexer, parse } from "./index.ts";
import { compile, defaultConfigForNode } from "./compile/js-url-checker.ts";

const fixture = `
scheme:example1.com/foo/bar/baz {
  ? match /web-path=(?<path>.*)/
  # match
    | id-1
    | id-2
    | /id-3/
}

/**
 * foo
 */
scheme:example2.com/path/[param1]/[param2] {
  /**
   * bar
   */
  ? form {
    /**
     * baz
     */
    '' = ''
    a
    b
    param1 = exact | match | value
    param2 = /^[0-9]+$/
    param3 [] = /^[a-z]+$/i
  }
  # match /id/
}

scheme:username@example3.com:4321 {
  ? form {
    'a' = /.*/
    'b' = /.*/
    'c-d' = /.*/
    '/' = /.*/
    '?' = /.*/
    'f/' = /.*/
    'g' = /.*/
    'h' = /.*/
  }
}
`;

// lexer.reset(fixture);
// for (const token of lexer) {
//   const {type, text} = token;
//   console.log(`${type!.padStart(10, ' ')}: ${JSON.stringify(text)}`);
// }

const schema = parse(fixture)!;
const code = compile(schema, defaultConfigForNode);

// console.log(
//   JSON.stringify(schema, null, 4)
// );
console.log(code);
const test =
  "scheme://example2.com/path/param1/param2?=&a&b&param1=exact&param2=_123&param3=_a&param3=a#d";
console.log(
  eval("(()=>{" + code + ';return check("' + test + '")})()'),
);
