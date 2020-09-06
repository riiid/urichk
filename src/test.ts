import { lexer, parse, compileSchema } from '.';

const fixture = `
scheme:example1.com/foo/bar/baz {
    ? match /web-path=(?<path>.*)/
    # match id-1 | id-2 | /id-3/
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
        param2 = /[0-9]+/
        param3 [] = /[a-z]/i
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
//     const {type, text} = token;
//     console.log(`${type!.padStart(10, ' ')}: ${JSON.stringify(text)}`);
// }

const schema = parse(fixture)!;
const code = compileSchema(schema);

// console.log(
//     JSON.stringify(schema, null, 4)
// );
console.log(code);
const test = 'scheme://example2.com/path/param1/param2?=&a&b&param1=exact&param2=123&param3=a&param3=a#id';
console.log(
    eval('(()=>{'+code+';return chk("'+test+'")})()')
);
