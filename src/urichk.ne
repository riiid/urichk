@{%
    const moo = require('moo');
    const commonTokenRules = {
        ln: { match: /\r?\n/, lineBreaks: true },
        ws: /[ \t]+/,
        id: /(?:[a-zA-Z0-9\-._~]|%[0-9a-fA-F]{2})+/,
        sc: /\/\/[^\r\n]*\r?\n/,
        mc: /\/\*(?:\*(?!\/)|[^*])*\*\//,
    };
    const lexer = moo.states({
        root: {
            ...commonTokenRules,
            lcb: { match: '{', push: 'block' },
            reserved: /[:/?#\[\]@]/,
            permitted: /[!$&'()*+,;=]/,
        },
        block: {
            ...commonTokenRules,
            lcb: { match: '{', push: 'block' },
            rcb: { match: '}', pop: 1 },
            symbol: /[?#:'=|\[\]]/,
            regex: /\/(?:(?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/[a-z]*/,
        },
    });
%}
@lexer lexer

urichk -> (_ rule):* _ {% ([rules]) => rules.map(([, rule]) => rule) %}
_ -> null | %ws | %ln
# TODO: query, fragment checker
rule -> uri {% id %}
uri ->
    scheme ":" ("/" "/"):? authority:? path:? ("?" query):? ("#" fragment):?
    {% ([scheme, , , authority, path, query, fragment]) => ({
        scheme,
        authority,
        path,
        query,
        fragment,
    }) %}
scheme -> %id {% id %}
authority ->
    (userinfo "@"):? host (":" port):?
    {% ([userinfo, host, port]) => ({
        userinfo,
        host,
        port,
    }) %}
userinfo -> %id {% id %}
host -> %id {% id %}
port -> %id {% id %}
path -> "/" %id {% ([, path]) => path %}
query -> %id {% id %}
fragment -> %id {% id %}
