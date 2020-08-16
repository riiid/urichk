@{%
    const moo = require('moo');
    const commonTokenRules = {
        num: /[0-9]+/,
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
ident => %id {% id %} | %num {% id %}

rule -> head _ tail {% ([head, , tail]) => ({ head, tail }) %}

head ->
      scheme authority path:? {% parseHead %}
    | scheme:? authority:? path {% parseHead %}
@{%
    const parseHead = ([scheme, authority, path]) => ({
        scheme,
        authority,
        path,
    });
%}

tail -> "{" (_ tail_rule):* _ "}" {% ([, rules]) => rules.map(([, rule]) => rule) %}

scheme -> ident ":" {% id %}
authority ->
    ("/" "/"):? userinfo:? ident port:?
    {% ([, userinfo, host, port]) => ({
        userinfo,
        host,
        port,
    }) %}
userinfo -> ident "@" {% id %}
host -> ident {% id %}
port -> ":" %num {% ([, port]) => port %}
path ->
      "/" {% () => [] %}
    | ("/" path_fragment):+ "/":? {% ([fragments]) => fragments.map(([, fragment]) => fragment) %}
path_fragment ->
      ident {% ([name]) => ({ type: 'static', name }) %}
    | "[" _ ident _ "]" {% ([, , name]) => ({ type: 'param', name }) %}

tail_rule ->
      tail_rule_match {% id %}
    | tail_rule_form {% id %}
tail_rule_tail_type -> ("?" | "#") tail_rule_tail_type_label:? {% ([[type], label]) => ({ type, label }) %}
tail_rule_tail_type_label -> _ ":" _ ident {% ([, , , label]) => label %}
tail_rule_match ->
    tail_rule_tail_type _ "match" _ tail_rule_match_pattern {% ([tailType, , matchType, , pattern]) => ({
        tailType,
        matchType,
        pattern,
    }) %}
tail_rule_match_pattern ->
      ident {% ([value]) => ({ type: 'id', value }) %}
    | %regex {% ([value]) => ({ type: 'regex', value }) %}
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
tail_rule_form_pattern_rule_key ->
      ident {% ([value]) => ({ type: 'id', value }) %}
    | %string {% ([value]) => ({ type: 'string', value }) %}
tail_rule_form_pattern_rule_value ->
    ("|" _):? (tail_rule_form_pattern_rule_value_term _ "|" _):* tail_rule_form_pattern_rule_value_term
    {% ([, rules, rule]) => [...rules.map(([rule]) => rule), rule] %}
tail_rule_form_pattern_rule_value_term ->
      ident {% ([value]) => ({ type: 'id', value }) %}
    | %string {% ([value]) => ({ type: 'string', value }) %}
    | %regex {% ([value]) => ({ type: 'regex', value }) %}
