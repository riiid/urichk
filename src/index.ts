import * as nearley from 'nearley';
import type { Lexer } from 'moo';
import * as compiledRules from './urichk';
import type { Urichk } from './ast';
import { URL } from 'url';

export const lexer = compiledRules.Lexer as Lexer;
export const parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiledRules));
export function parse(schema: string): undefined | Urichk {
    parser.feed(schema);
    return parser.finish()[0];
}

const url: URL = new URL('http://example.com');

export function compileSchema(schema: Urichk): string {
    const buffer: string[] = [];
    const write = (code: string) => buffer.push(code);
    write(`
        const URL = require('url').URL;
        function chk(uri) {
            for (const chkRule of chkRules) {
                const parsedUri = new URL(uri);
                const chkResult = chkRule(parsedUri);
                if (chkResult) return chkResult;
            }
            return null;
        }
        const chkRules = [
    `);
    for (const rule of schema) {
        const { head, tail } = rule;
        let _ = 0;
        write(`
            function chkRule(parsedUri) {
                const result = {};
        `);
        if (head.scheme) {
            write(`if (parsedUri.protocol.substr(0, parsedUri.protocol.length - 1) !== ${JSON.stringify(head.scheme.text)}) return null;\n`);
        }
        if (head.authority) {
            const { userinfo, host, port } = head.authority;
            if (userinfo) write(`if (parsedUri.username !== ${JSON.stringify(userinfo.text)}) return null;\n`);
            write(`if (parsedUri.hostname !== ${JSON.stringify(host.text)}) return null;\n`);
            if (port) write(`if (parsedUri.port !== ${JSON.stringify(port.text)}) return null;\n`);
        }
        if (head.path) {
            write(`
                const path = parsedUri.pathname.split('/');
                path.shift();
            `)
            for (const pathFragment of head.path) {
                if (pathFragment.type === 'static') {
                    write(`if (path.shift() !== ${JSON.stringify(pathFragment.name.text)}) return null;\n`);
                } else if (pathFragment.type === 'param') {
                    write(`
                        const _${++_} = path.shift();
                        if (_${_} == null) return null;
                        result[${JSON.stringify(pathFragment.name.text)}] = _${_};
                    `);
                }
            }
        }
        write(`
                return result;
            },
        `);
    }
    write(`
        ];
    `);
    return buffer.join('');
}
