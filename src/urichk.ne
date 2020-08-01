@{%
    const moo = require('moo');
    const lexer = moo.compile({
        ln: { match: /\r?\n/, lineBreaks: true },
        ws: /[ \t]+/,
        reserved: /[:/?#\[\]@]/,
        permitted: /[!$&'()*+,;=]/,
        id: /(?:[a-zA-Z0-9\-._~]|%[0-9a-fA-F]{2})+/,
        regex: /\/(?:(?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/[gmi]?/
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
