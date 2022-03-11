import {
  createRecursiveDescentParser,
  Pattern,
  RecursiveDescentParser,
  Span,
  SyntaxError,
  Token,
} from "https://deno.land/x/pbkit@v0.0.39/core/parser/recursive-descent-parser.ts";
import * as ast from "../ast/index.ts";

export interface ParseResult<T = ast.Urichk> {
  ast: T;
  parser: RecursiveDescentParser;
}

export function parse(text: string): ParseResult {
  const parser = createRecursiveDescentParser(text);
  const rules = acceptRules(parser);
  return { ast: rules, parser };
}

function acceptRules(
  parser: RecursiveDescentParser,
) {
  const statements: ast.Rule[] = [];
  statements:
  while (true) {
    const { commentGroups, trailingNewline } = skipWsAndSweepComments(parser);
    let leadingComments: ast.CommentGroup[];
    let leadingDetachedComments: ast.CommentGroup[];
    if (trailingNewline) {
      leadingComments = [];
      leadingDetachedComments = commentGroups;
    } else {
      if (commentGroups.length < 1) {
        leadingComments = [];
        leadingDetachedComments = [];
      } else {
        leadingComments = [commentGroups.pop()!];
        leadingDetachedComments = commentGroups;
      }
    }
    const statement = acceptRule(
      parser,
      leadingComments,
      leadingDetachedComments,
    );
    if (statement) {
      statements.push(statement);
      continue statements;
    }
    break;
  }
  return statements;
}

function acceptRule(
  parser: RecursiveDescentParser,
  leadingComments: ast.CommentGroup[],
  leadingDetachedComments: ast.CommentGroup[],
): ast.Rule | undefined {
  const head = acceptHead(parser);
  if (!head) return;
  skipWsAndComments(parser);
  const tail = acceptTail(parser);
  if (!tail) return;
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      head,
      tail,
      leadingComments,
      leadingDetachedComments,
      trailingComments,
    ]),
    head,
    tail,
    leadingComments,
    leadingDetachedComments,
    trailingComments,
  };
}

// @TODO: https://datatracker.ietf.org/doc/html/rfc3986#section-3
function acceptHead(parser: RecursiveDescentParser): ast.Head | undefined {
  const schemeOrAuthority = acceptSchemeOrAuthority(parser);
  if (!schemeOrAuthority) return;
  const { scheme, authority } = schemeOrAuthority;
  const path = acceptPath(parser);
  return { ...mergeSpans([scheme, authority, path]), scheme, authority, path };
  function acceptSchemeOrAuthority(parser: RecursiveDescentParser) {
    const loc = parser.loc;
    return acceptPatternAndThen(schemePattern, (token) => {
      const isSchemeExist = parser.accept(":");
      if (!isSchemeExist) parser.loc = loc;
      return isSchemeExist
        ? { scheme: token, authority: acceptAuthority(parser) }
        : { authority: acceptAuthority(parser) };
    })(parser);
  }
}

function acceptAuthority(
  parser: RecursiveDescentParser,
): ast.Authority | undefined {
  const slash = parser.accept(/^\/\//);
  const userinfoAndHost = acceptUserinfoAndHost(parser);
  if (!userinfoAndHost) return;
  const { userinfo, host } = userinfoAndHost;
  const port = parser.accept(":") && parser.accept(identPattern);
  return {
    ...mergeSpans([slash, userinfo, host, port]),
    userinfo,
    host,
    port,
  };
  function acceptUserinfoAndHost(parser: RecursiveDescentParser) {
    return acceptPatternAndThen(identPattern, (token) => {
      const isUserinfoExist = parser.accept("@");
      return isUserinfoExist
        ? { userinfo: token, host: parser.expect(identPattern) }
        : { host: token };
    })(parser);
  }
}

function acceptPath(parser: RecursiveDescentParser): ast.Path | undefined {
  const fragments: ast.PathFragment[] = [];
  while (parser.accept("/")) {
    const fragment = acceptPathFragment(parser);
    if (fragment) fragments.push(fragment);
  }
  if (fragments.length === 0) return;
  return {
    ...mergeSpans(fragments),
    fragments,
  };
}

// @TODO: https://datatracker.ietf.org/doc/html/rfc3986#section-3.3
function acceptPathFragment(
  parser: RecursiveDescentParser,
): ast.PathFragment | undefined {
  const isParamPathFragment = Boolean(parser.accept("["));
  const path = parser.accept(identPattern);
  isParamPathFragment && parser.expect("]");
  if (!path) return;
  return { type: isParamPathFragment ? "param" : "static", ...path };
}

function acceptTail(parser: RecursiveDescentParser): ast.Tail | undefined {
  const openParens = parser.expect("{");
  skipWsAndComments(parser);
  const rules = acceptTailRules(parser);
  skipWsAndComments(parser);
  const closeParens = parser.expect("}");
  return {
    ...mergeSpans([openParens, closeParens]),
    openParens,
    rules,
    closeParens,
  };
}

function acceptTailRules(parser: RecursiveDescentParser): ast.TailRule[] {
  const tailRules: ast.TailRule[] = [];
  while (true) {
    const tailRule = acceptTailRule(parser);
    if (!tailRule) break;
    tailRules.push(tailRule);
    skipWsAndComments(parser);
  }
  return tailRules;
}

function acceptTailRule(
  parser: RecursiveDescentParser,
): ast.TailRule | undefined {
  const tailType = parser.accept(/^(\?|#)/) as ast.Token<"?" | "#">;
  if (!tailType) return;
  skipWsAndComments(parser);
  const matchType = parser.accept(/^(form|match)/) as ast.Token<
    "match" | "form"
  >;
  if (!matchType) return;
  skipWsAndComments(parser);
  switch (matchType.text) {
    case "form":
      const openParens = parser.accept("{");
      skipWsAndComments(parser);
      const pattern = acceptTailRuleFormPatternRules(parser);
      skipWsAndComments(parser);
      const closeParens = parser.accept("}");
      return {
        openParens,
        closeParens,
        tailType,
        matchType,
        pattern,
      } as ast.TailRuleForm; // @FIXME: typing!
    case "match":
      return {
        tailType,
        matchType,
        pattern: acceptTailRuleMatchPatternRules(parser),
      } as ast.TailRuleMatch;
  }
}

function acceptTailRuleFormPatternRules(
  parser: RecursiveDescentParser,
): ast.TailRuleFormPatternRule[] {
  const rules: ast.TailRuleFormPatternRule[] = [];
  while (!parser.try("}")) {
    const key = choice<ast.Token>([acceptIdent, acceptStrLit])(
      parser,
    ) as ast.Key;
    skipWsAndComments(parser);
    const array = parser.accept("[]");
    skipWsAndComments(parser);
    const equal = parser.accept("=");
    if (equal) {
      const values: ast.TailRulePatternValue[] = [];
      while (!skipWsAndCommentUntilNewLine(parser)) {
        values.push(
          choice([acceptIdent, acceptStrLit, acceptRegex])(
            parser,
          ) as ast.TailRulePatternValue,
        );
        skipWsAndComments(parser);
        if (!parser.accept("|")) break;
        skipWsAndComments(parser);
      }
      rules.push({
        ...mergeSpans([key, ...values]),
        key,
        array,
        value: values,
      });
    } else {
      rules.push({
        ...mergeSpans([key]),
        key,
        array,
      });
    }
  }
  return rules;
}

function acceptTailRuleMatchPatternRules(
  parser: RecursiveDescentParser,
): ast.TailRuleMatchPatternRule[] {
  const rules: ast.TailRuleMatchPatternRule[] = [];
  parser.accept("|");
  do {
    skipWsAndComments(parser);
    rules.push(
      choice([acceptRegex, acceptIdent, acceptStrLit])(
        parser,
      ) as ast.TailRuleMatchPatternRule,
    );
    skipWsAndComments(parser);
  } while (parser.accept("|"));
  return rules;
}

function acceptIdent(parser: RecursiveDescentParser) {
  const ident = parser.accept(identPattern);
  if (!ident) return;
  return { ...ident, type: "id" };
}

function acceptStrLit(parser: RecursiveDescentParser) {
  const strLit = parser.accept(strLitPattern);
  if (!strLit) return;
  return { ...strLit, type: "string" };
}

function acceptRegex(parser: RecursiveDescentParser) {
  const regex = parser.accept(regexPattern);
  if (!regex) return;
  return { ...regex, type: "regex" };
}

function mergeSpans(spans: (undefined | Span | (undefined | Span)[])[]): Span {
  let start = Infinity;
  let end = -Infinity;
  for (let i = 0; i < spans.length; ++i) {
    if (spans[i] == null) continue;
    const span = Array.isArray(spans[i])
      ? mergeSpans(spans[i] as Span[])
      : spans[i] as Span;
    start = Math.min(start, span.start);
    end = Math.max(end, span.end);
  }
  return { start, end };
}

interface AcceptFn<T> {
  (parser: RecursiveDescentParser): T | undefined;
}

function acceptPatternAndThen<T>(
  pattern: Pattern,
  then: (token: Token) => T,
): AcceptFn<T> {
  return function accept(parser) {
    const token = parser.accept(pattern);
    if (!token) return;
    return then(token);
  };
}

function choice<T>(acceptFns: AcceptFn<T>[]): AcceptFn<T> {
  return function accept(parser) {
    for (const acceptFn of acceptFns) {
      const node = acceptFn(parser);
      if (node) return node;
    }
  };
}

function many<T>(parser: RecursiveDescentParser, acceptFn: AcceptFn<T>): T[] {
  const nodes: T[] = [];
  let node: ReturnType<typeof acceptFn>;
  while (node = acceptFn(parser)) nodes.push(node);
  return nodes;
}

const whitespacePattern = /^\s+/;
const whitespaceWithoutNewlinePattern =
  /^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
const newlinePattern = /^\r?\n/;
const identPattern = /^(?:[a-zA-Z0-9\-._~]|%[0-9a-fA-F]{2})+/;
const strLitPattern = /^'.*?'/;
const multilineCommentPattern = /^\/\*(?:.|\r?\n)*?\*\//;
const singlelineCommentPattern = /^\/\/.*(?:\r?\n|$)/;
const schemePattern = /^[a-z][a-z0-9\+-\.]*/i;
const regexPattern =
  /^\/(?:(?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/[a-z]*/;

function acceptSpecialToken<TType extends string>(
  parser: RecursiveDescentParser,
  type: TType,
  pattern: Pattern = identPattern,
): (Token & { type: TType }) | undefined {
  const token = parser.accept(pattern);
  if (!token) return;
  return { type, ...token };
}

function acceptCommentGroup(
  parser: RecursiveDescentParser,
): ast.CommentGroup | undefined {
  const loc = parser.loc;
  const comments: ast.Comment[] = [];
  while (true) {
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      comments.push(multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      comments.push(singlelineComment);
      continue;
    }
    break;
  }
  if (comments.length < 1) {
    parser.loc = loc;
    return;
  }
  return {
    ...mergeSpans(comments),
    type: "comment-group",
    comments,
  };
}

function acceptTrailingComments(
  parser: RecursiveDescentParser,
): ast.CommentGroup[] {
  const loc = parser.loc;
  const comments: ast.Comment[] = [];
  while (true) {
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const newline = parser.accept(newlinePattern);
    if (newline) break;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) {
      comments.push(multilineComment);
      continue;
    }
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      comments.push(singlelineComment);
      break;
    }
    break;
  }
  if (comments.length < 1) {
    parser.loc = loc;
    return [];
  }
  return [{
    ...mergeSpans(comments),
    type: "comment-group",
    comments,
  }];
}

interface SkipWsAndSweepCommentsResult {
  commentGroups: ast.CommentGroup[];
  trailingNewline: boolean;
}
function skipWsAndSweepComments(
  parser: RecursiveDescentParser,
): SkipWsAndSweepCommentsResult {
  const commentGroups: ast.CommentGroup[] = [];
  let trailingNewline = false;
  parser.accept(whitespacePattern);
  while (true) {
    const commentGroup = acceptCommentGroup(parser);
    if (commentGroup) {
      commentGroups.push(commentGroup);
      trailingNewline = false;
      continue;
    }
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const newline = parser.accept(newlinePattern);
    if (newline) {
      trailingNewline = true;
      continue;
    }
    break;
  }
  return {
    commentGroups,
    trailingNewline,
  };
}

function skipWsAndComments(parser: RecursiveDescentParser): undefined {
  while (true) {
    const whitespace = parser.accept(whitespacePattern);
    if (whitespace) continue;
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) continue;
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) continue;
    break;
  }
  return;
}

function skipWsAndCommentUntilNewLine(parser: RecursiveDescentParser): boolean {
  let hasNewline = false;
  while (true) {
    const whitespace = parser.accept(whitespaceWithoutNewlinePattern);
    if (whitespace) continue;
    const newline = parser.accept(newlinePattern);
    if (newline) {
      hasNewline = true;
      continue;
    }
    const multilineComment = acceptSpecialToken(
      parser,
      "multiline-comment",
      multilineCommentPattern,
    );
    if (multilineComment) continue;
    const singlelineComment = acceptSpecialToken(
      parser,
      "singleline-comment",
      singlelineCommentPattern,
    );
    if (singlelineComment) {
      hasNewline = true;
      continue;
    }
    break;
  }
  return hasNewline;
}
