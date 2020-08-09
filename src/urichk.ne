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
            string: /'.*?'/,
            symbol: /[?#:'=|\[\]]/,
            regex: /\/(?:(?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/[a-z]*/,
        },
    });
%}
@lexer lexer

urichk -> (_ rule):* _ {% ([rules]) => rules.map(([, rule]) => rule) %}
_ -> (%ws | %ln | %sc | %mc):*

rule -> head _ tail {% ([head, , tail]) => ({ head, tail }) %}

head ->
      scheme:? authority path:? {% parseHead %}
    | scheme:? authority:? path {% parseHead %}
@{%
    const parseHead = ([scheme, authority, path]) => ({
        scheme,
        authority,
        path,
    });
%}

tail -> "{" (_ tail_rule):* _ "}" {% ([, rules]) => rules.map(([, rule]) => rule) %}

scheme -> %id ":" {% id %}
authority ->
    ("/" "/"):? (userinfo "@"):? host (":" port):?
    {% ([, userinfo, host, port]) => ({
        userinfo,
        host,
        port,
    }) %}
userinfo -> %id {% id %}
host -> %id {% id %}
port -> %id {% id %}
path -> "/" %id {% ([, path]) => path %}

tail_rule ->
      tail_rule_match {% id %}
    | tail_rule_form {% id %}
tail_rule_tail_type -> ("?" | "#") tail_rule_tail_type_label:? {% ([[type], label]) => ({ type, label }) %}
tail_rule_tail_type_label -> _ ":" _ %id {% ([, , , label]) => label %}
tail_rule_match ->
    tail_rule_tail_type _ "match" _ (%id | %regex) {% ([tailType, , matchType, , pattern]) => ({
        tailType,
        matchType,
        pattern,
    }) %}
tail_rule_form ->
    tail_rule_tail_type _ "form" _ tail_rule_form_pattern {% ([tailType, , matchType, , pattern]) => ({
        tailType,
        matchType,
        pattern,
    }) %}
tail_rule_form_pattern -> "{" (_ tail_rule_form_pattern_rule):* _ "}" {% ([, rules]) => rules.map(([, rule]) => rule) %}
tail_rule_form_pattern_rule ->
      tail_rule_form_pattern_rule_key {% ([key]) => ({ key, value: null, array: false }) %}
    | tail_rule_form_pattern_rule_key _ "=" _ tail_rule_form_pattern_rule_value
    {% ([key, /*_*/, /*"="*/, /*_*/, value]) => ({
        key,
        value,
        array: false,
    }) %}
    | tail_rule_form_pattern_rule_key _ "[" _ "]" _ "=" _ tail_rule_form_pattern_rule_value
    {% ([key, /*_*/, /*[*/, /*_*/, /*]*/, /*_*/, /*"="*/, /*_*/, value]) => ({
        key,
        value,
        array: true,
    }) %}
tail_rule_form_pattern_rule_key -> (%id | %string) {% ([[value]]) => value %}
tail_rule_form_pattern_rule_value ->
    ("|" _):? (tail_rule_form_pattern_rule_value_term _ "|" _):* tail_rule_form_pattern_rule_value_term
    {% ([, rules, rule]) => [...rules.map(([rule]) => rule), rule] %}
tail_rule_form_pattern_rule_value_term -> (%id | %string | %regex) {% ([[value]]) => value %}
