import * as nearley from 'nearley';
import type { Lexer } from 'moo';
import * as compiledRules from './urichk';
import type { Urichk, Key, TailRuleMatch, TailRuleForm, TailRulePatternValue } from './ast';

export const lexer = compiledRules.Lexer as Lexer;
export const parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiledRules));
export function parse(schema: string): undefined | Urichk {
    parser.feed(schema);
    return parser.finish()[0];
}

export function compileSchema(schema: Urichk): string {
    const buffer: string[] = [];
    const write = (code: string) => buffer.push(code);
    write(`
        const URL = require('url').URL;
        const URLSearchParams = require('url').URLSearchParams;
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
        const { comment, head, tail } = rule;
        let _ = 0;
        comment && write(comment.text);
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
        if (tail.length) {
            write(`
                const search = parsedUri.search.substr(1);
                const hash = parsedUri.hash.substr(1);
            `);
        }
        for (const {comment, tailType, matchType, pattern} of tail) {
            comment && write(comment.text);
            const tailKey = tailType.text;
            write(`
                {
                    const tail = ${ tailType.text === '?' ? 'search' : 'hash' };
                    const tailKey = ${JSON.stringify(tailKey)};
            `);
            if (matchType.text === 'match') {
                write(`
                    if (${compileTailRulePattern('tail', pattern as Exclude<typeof pattern, TailRuleForm['pattern']>)}) {
                        result[tailKey] = tail;
                    } else {
                        // TODO
                    }
                `);
            } else if (matchType.text === 'form') {
                write(`
                    const form = new URLSearchParams(tail);
                    const formResult = {};
                `);
                for (const {comment, key, value, array} of (pattern as Exclude<typeof pattern, TailRuleMatch['pattern']>)) {
                    comment && write(comment.text);
                    if (array) {
                        write(`{
                            const values = form.getAll(${compileKeyToken(key)});
                            if (values.every(
                                value => ${compileTailRulePattern('value', value)}
                            )) {
                                formResult[${compileKeyToken(key)}] = values;
                            } else {
                                // TODO
                            }
                        }`);
                    } else {
                        if (value) {
                            write(`{
                                const value = form.get(${compileKeyToken(key)});
                                if (${compileTailRulePattern('value', value)}) {
                                    formResult[${compileKeyToken(key)}] = value;
                                } else {
                                    // TODO
                                }
                            }`);
                        } else {
                            write(`{
                                if (form.has(${compileKeyToken(key)})) {
                                    formResult[${compileKeyToken(key)}] = true;
                                } else {
                                    // TODO
                                }
                            }`);
                        }
                    }
                }
                write(`
                    result[tailKey] = formResult;
                `);
            }
            write(`
                }
            `);
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

function compileKeyToken(key: Key): string {
    switch (key.type) {
        case 'id': return JSON.stringify(key.value.text);
        case 'string': return key.value.text;
    }
}

function compileTailRulePattern(valueExp: string, pattern: TailRulePatternValue[]): string {
    return pattern.map(({ type, value }) => {
        if (type === 'id') {
            return `${valueExp} === ${JSON.stringify(value.text)}`;
        } else if (type === 'string') {
            return `${valueExp} === ${value.text}`;
        } else if (type === 'regex') {
            return `${value.text}.test(${valueExp})`;
        }
    }).map(code => `(${code})`).join('||');
}