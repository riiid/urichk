
    // nearley version: 2.20.1
    // export name: urichk
    
  import moo from "https://deno.land/x/moo@0.5.1-deno.2/mod.ts";
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


  const parseHead = ([scheme, authority, path]) => ({
    scheme,
    authority,
    path,
  });

    function id(x) { return x[0]; }
    export default {
      Lexer: lexer,
      ParserRules: [{name: "urichk$ebnf$1", symbols: []},{name: "urichk$ebnf$1", symbols: ["urichk$ebnf$1","rule"], postprocess: function arrpush(d) {return d[0].concat([d[1]]);}},{name: "urichk", symbols: ["urichk$ebnf$1","_"], postprocess:  id },{name: "_$ebnf$1", symbols: []},{name: "_$ebnf$1$subexpression$1", symbols: [(lexer.has("ws") ? {type: "ws"} : ws)]},{name: "_$ebnf$1$subexpression$1", symbols: [(lexer.has("ln") ? {type: "ln"} : ln)]},{name: "_$ebnf$1$subexpression$1", symbols: [(lexer.has("sc") ? {type: "sc"} : sc)]},{name: "_$ebnf$1$subexpression$1", symbols: [(lexer.has("mc") ? {type: "mc"} : mc)]},{name: "_$ebnf$1", symbols: ["_$ebnf$1","_$ebnf$1$subexpression$1"], postprocess: function arrpush(d) {return d[0].concat([d[1]]);}},{name: "_", symbols: ["_$ebnf$1"], postprocess: 
  ([tokens]) => {
    let result = undefined;
    for (const [token] of tokens) {
      if (token.type === 'mc') result = token;
    }
    return result;
  }
},{name: "ident", symbols: [(lexer.has("id") ? {type: "id"} : id)], postprocess:  id },{name: "ident", symbols: [(lexer.has("num") ? {type: "num"} : num)], postprocess:  id },{name: "rule", symbols: ["_","head","_","tail"], postprocess:  ([comment, head, , tail]) => ({ comment, head, tail }) },{name: "head$ebnf$1", symbols: ["path"], postprocess: id},{name: "head$ebnf$1", symbols: [], postprocess: function(d) {return null;}},{name: "head", symbols: ["scheme","authority","head$ebnf$1"], postprocess:  parseHead },{name: "head$ebnf$2", symbols: ["scheme"], postprocess: id},{name: "head$ebnf$2", symbols: [], postprocess: function(d) {return null;}},{name: "head$ebnf$3", symbols: ["authority"], postprocess: id},{name: "head$ebnf$3", symbols: [], postprocess: function(d) {return null;}},{name: "head", symbols: ["head$ebnf$2","head$ebnf$3","path"], postprocess:  parseHead },{name: "tail$ebnf$1", symbols: []},{name: "tail$ebnf$1$subexpression$1", symbols: ["_","tail_rule"]},{name: "tail$ebnf$1", symbols: ["tail$ebnf$1","tail$ebnf$1$subexpression$1"], postprocess: function arrpush(d) {return d[0].concat([d[1]]);}},{name: "tail", symbols: [{"literal":"{"},"tail$ebnf$1","_",{"literal":"}"}], postprocess:  ([, rules]) => rules.map(([comment, rule]) => ({ comment, ...rule })) },{name: "scheme", symbols: ["ident",{"literal":":"}], postprocess:  id },{name: "authority$ebnf$1$subexpression$1", symbols: [{"literal":"/"},{"literal":"/"}]},{name: "authority$ebnf$1", symbols: ["authority$ebnf$1$subexpression$1"], postprocess: id},{name: "authority$ebnf$1", symbols: [], postprocess: function(d) {return null;}},{name: "authority$ebnf$2", symbols: ["userinfo"], postprocess: id},{name: "authority$ebnf$2", symbols: [], postprocess: function(d) {return null;}},{name: "authority$ebnf$3", symbols: ["port"], postprocess: id},{name: "authority$ebnf$3", symbols: [], postprocess: function(d) {return null;}},{name: "authority", symbols: ["authority$ebnf$1","authority$ebnf$2","ident","authority$ebnf$3"], postprocess:  ([, userinfo, host, port]) => ({
    userinfo,
    host,
    port,
  }) },{name: "userinfo", symbols: ["ident",{"literal":"@"}], postprocess:  id },{name: "host", symbols: ["ident"], postprocess:  id },{name: "port", symbols: [{"literal":":"},(lexer.has("num") ? {type: "num"} : num)], postprocess:  ([, port]) => port },{name: "path", symbols: [{"literal":"/"}], postprocess:  () => [] },{name: "path$ebnf$1$subexpression$1", symbols: [{"literal":"/"},"path_fragment"]},{name: "path$ebnf$1", symbols: ["path$ebnf$1$subexpression$1"]},{name: "path$ebnf$1$subexpression$2", symbols: [{"literal":"/"},"path_fragment"]},{name: "path$ebnf$1", symbols: ["path$ebnf$1","path$ebnf$1$subexpression$2"], postprocess: function arrpush(d) {return d[0].concat([d[1]]);}},{name: "path$ebnf$2", symbols: [{"literal":"/"}], postprocess: id},{name: "path$ebnf$2", symbols: [], postprocess: function(d) {return null;}},{name: "path", symbols: ["path$ebnf$1","path$ebnf$2"], postprocess:  ([fragments]) => fragments.map(([, fragment]) => fragment) },{name: "path_fragment", symbols: ["ident"], postprocess:  ([name]) => ({ type: 'static', name }) },{name: "path_fragment", symbols: [{"literal":"["},"_","ident","_",{"literal":"]"}], postprocess:  ([, , name]) => ({ type: 'param', name }) },{name: "tail_rule", symbols: ["tail_rule_match"], postprocess:  id },{name: "tail_rule", symbols: ["tail_rule_form"], postprocess:  id },{name: "tail_rule_tail_type", symbols: [{"literal":"?"}], postprocess:  id },{name: "tail_rule_tail_type", symbols: [{"literal":"#"}], postprocess:  id },{name: "tail_rule_match", symbols: ["tail_rule_tail_type","_",{"literal":"match"},"_","tail_rule_pattern_value"], postprocess:  ([tailType, , matchType, , pattern]) => ({
    tailType,
    matchType,
    pattern,
  }) },{name: "tail_rule_form", symbols: ["tail_rule_tail_type","_",{"literal":"form"},"_","tail_rule_form_pattern"], postprocess:  ([tailType, , matchType, , pattern]) => ({
    tailType,
    matchType,
    pattern,
  }) },{name: "tail_rule_form_pattern$ebnf$1", symbols: []},{name: "tail_rule_form_pattern$ebnf$1$subexpression$1", symbols: ["_","tail_rule_form_pattern_rule"]},{name: "tail_rule_form_pattern$ebnf$1", symbols: ["tail_rule_form_pattern$ebnf$1","tail_rule_form_pattern$ebnf$1$subexpression$1"], postprocess: function arrpush(d) {return d[0].concat([d[1]]);}},{name: "tail_rule_form_pattern", symbols: [{"literal":"{"},"tail_rule_form_pattern$ebnf$1","_",{"literal":"}"}], postprocess:  ([, rules]) => rules.map(([comment, rule]) => ({ comment, ...rule })) },{name: "tail_rule_form_pattern_rule", symbols: ["tail_rule_form_pattern_rule_key"], postprocess:  ([key]) => ({ key, value: null, array: false }) },{name: "tail_rule_form_pattern_rule", symbols: ["tail_rule_form_pattern_rule_key","_",{"literal":"="},"_","tail_rule_pattern_value"], postprocess:  ([key, /*_*/, /*"="*/, /*_*/, value]) => ({
    key,
    value,
    array: false,
  }) },{name: "tail_rule_form_pattern_rule", symbols: ["tail_rule_form_pattern_rule_key","_",{"literal":"["},"_",{"literal":"]"},"_",{"literal":"="},"_","tail_rule_pattern_value"], postprocess:  ([key, /*_*/, /*[*/, /*_*/, /*]*/, /*_*/, /*"="*/, /*_*/, value]) => ({
    key,
    value,
    array: true,
  }) },{name: "tail_rule_form_pattern_rule_key", symbols: ["ident"], postprocess:  ([value]) => ({ type: 'id', value }) },{name: "tail_rule_form_pattern_rule_key", symbols: [(lexer.has("string") ? {type: "string"} : string)], postprocess:  ([value]) => ({ type: 'string', value }) },{name: "tail_rule_pattern_value$ebnf$1$subexpression$1", symbols: [{"literal":"|"},"_"]},{name: "tail_rule_pattern_value$ebnf$1", symbols: ["tail_rule_pattern_value$ebnf$1$subexpression$1"], postprocess: id},{name: "tail_rule_pattern_value$ebnf$1", symbols: [], postprocess: function(d) {return null;}},{name: "tail_rule_pattern_value$ebnf$2", symbols: []},{name: "tail_rule_pattern_value$ebnf$2$subexpression$1", symbols: ["tail_rule_pattern_value_term","_",{"literal":"|"},"_"]},{name: "tail_rule_pattern_value$ebnf$2", symbols: ["tail_rule_pattern_value$ebnf$2","tail_rule_pattern_value$ebnf$2$subexpression$1"], postprocess: function arrpush(d) {return d[0].concat([d[1]]);}},{name: "tail_rule_pattern_value", symbols: ["tail_rule_pattern_value$ebnf$1","tail_rule_pattern_value$ebnf$2","tail_rule_pattern_value_term"], postprocess:  ([, rules, rule]) => [...rules.map(([rule]) => rule), rule] },{name: "tail_rule_pattern_value_term", symbols: ["ident"], postprocess:  ([value]) => ({ type: 'id', value }) },{name: "tail_rule_pattern_value_term", symbols: [(lexer.has("string") ? {type: "string"} : string)], postprocess:  ([value]) => ({ type: 'string', value }) },{name: "tail_rule_pattern_value_term", symbols: [(lexer.has("regex") ? {type: "regex"} : regex)], postprocess:  ([value]) => ({ type: 'regex', value }) }],
      ParserStart: "urichk",
    };
  