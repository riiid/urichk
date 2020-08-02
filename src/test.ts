import { lexer } from '.';

const fixture = `
scheme:host {
    ? match /web-path=(?<path>.*)/
    # match id-1
    # match id-2
    # match /id-3/
}

/**
 * foo
 */
scheme:host/path/[param1]/[param2] {
    /**
     * bar
     */
    ?:label-1 form {
        '' = ''
        a
        b
        param1 = exact | match | value
        param2 = /[0-9]+/
        param3 [] = /[a-z]/i
    }
    #:label-2 match /id/
}
`;

lexer.reset(fixture);
for (const token of lexer) {
    const {type, text} = token;
    console.log(`${type.padStart(10, ' ')}: ${JSON.stringify(text)}`);
}
// parser.feed(code);
// console.log(parser.finish()[0]);
