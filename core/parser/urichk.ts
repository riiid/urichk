import {
  createRecursiveDescentParser,
  Pattern,
  RecursiveDescentParser,
  Span,
  Token,
} from "https://deno.land/x/pbkit@v0.0.39/core/parser/recursive-descent-parser.ts";
import * as ast from "../ast/index.ts";

export interface ParseResult<T = ast.Urichk> {
  ast: T;
  parser: RecursiveDescentParser;
}

export function parse(text: string): ParseResult {
  const parser = createRecursiveDescentParser(text);
  const rules = acceptStatements(parser, [acceptRule]);
  return { ast: rules, parser };
}

interface AcceptStatementFn<T extends ast.StatementBase> {
  (
    parser: RecursiveDescentParser,
    leadingComments: ast.CommentGroup[],
  ): T | undefined;
}
function acceptStatement<T extends ast.StatementBase>(
  parser: RecursiveDescentParser,
  acceptStatementFn: AcceptStatementFn<T>,
) {
  const { commentGroups: leadingComments } = skipWsAndSweepComments(parser);
  const statement = acceptStatementFn(
    parser,
    leadingComments,
  );
  return statement;
}

function acceptStatements<T extends ast.StatementBase>(
  parser: RecursiveDescentParser,
  acceptStatementFns: AcceptStatementFn<T>[],
) {
  const statements: T[] = [];
  statements:
  while (true) {
    const { commentGroups: leadingComments } = skipWsAndSweepComments(parser);
    for (const acceptStatementFn of acceptStatementFns) {
      const statement = acceptStatementFn(
        parser,
        leadingComments,
      );
      if (statement) {
        statements.push(statement);
        continue statements;
      }
    }
    break;
  }
  return statements;
}

function acceptRule(
  parser: RecursiveDescentParser,
  leadingComments: ast.CommentGroup[],
): ast.Rule | undefined {
  const head = acceptStatement(parser, acceptHead);
  if (!head) return;
  skipWsAndComments(parser);
  const tail = acceptStatement(parser, acceptTail);
  if (!tail) return;
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      head,
      tail,
      leadingComments,

      trailingComments,
    ]),
    head,
    tail,
    leadingComments,

    trailingComments,
  };
}

// @TODO: https://datatracker.ietf.org/doc/html/rfc3986#section-3
function acceptHead(
  parser: RecursiveDescentParser,
  leadingComments: ast.CommentGroup[],
): ast.Head | undefined {
  const schemeOrAuthority = acceptSchemeOrAuthority(parser);
  if (schemeOrAuthority) {
    const { scheme, authority } = schemeOrAuthority;
    const path = acceptPath(parser);
    const trailingComments = acceptTrailingComments(parser);
    return {
      ...mergeSpans([
        scheme,
        authority,
        path,
        leadingComments,
      ]),
      scheme,
      authority,
      path,
      leadingComments,
      trailingComments,
    };
  } else {
    const path = acceptPath(parser);
    const trailingComments = acceptTrailingComments(parser);
    if (!path) return;
    return {
      ...mergeSpans([
        path,
        leadingComments,
      ]),
      path,
      leadingComments,
      trailingComments,
    };
  }
  function acceptSchemeOrAuthority(parser: RecursiveDescentParser) {
    const loc = parser.loc;
    return acceptPatternAndThen(schemePattern, (token) => {
      if (!token) return;
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
      if (!token) return;
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

function acceptTail(
  parser: RecursiveDescentParser,
  leadingComments: ast.CommentGroup[],
): ast.Tail | undefined {
  const openParens = parser.expect("{");
  const rules = acceptTailRules(parser);
  const closeParens = parser.expect("}");
  const trailingComments = acceptTrailingComments(parser);
  return {
    ...mergeSpans([
      openParens,
      closeParens,
      leadingComments,
      trailingComments,
    ]),
    openParens,
    rules,
    closeParens,
    leadingComments,
    trailingComments,
  };
}

function acceptTailRules(parser: RecursiveDescentParser): ast.TailRule[] {
  const tailRules: ast.TailRule[] = [];
  while (true) {
    const tailRule = acceptStatement(parser, acceptTailRule);
    if (!tailRule) break;
    tailRules.push(tailRule);
    skipWsAndComments(parser);
  }
  return tailRules;
}

function acceptTailRule(
  parser: RecursiveDescentParser,
  leadingComments: ast.CommentGroup[],
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
    case "form": {
      const openParens = parser.accept("{");
      // skipWsAndComments(parser);
      const pattern = acceptTailRuleFormPatternRules(parser);
      skipWsAndComments(parser);
      const closeParens = parser.accept("}");
      return {
        openParens,
        closeParens,
        tailType,
        matchType,
        pattern,
        leadingComments,
        trailingComments: acceptTrailingComments(parser),
      } as ast.TailRuleForm; // @FIXME: typing!
    }
    case "match": {
      return {
        tailType,
        matchType,
        pattern: acceptTailRuleMatchPatternRules(parser),
        leadingComments,
        trailingComments: acceptTrailingComments(parser),
      } as ast.TailRuleMatch;
    }
  }
}

function acceptTailRuleFormPatternRules(
  parser: RecursiveDescentParser,
): ast.TailRuleFormPatternRule[] {
  const rules: ast.TailRuleFormPatternRule[] = [];
  while (!parser.try(/^\s*}/)) {
    const { commentGroups: leadingComments } = skipWsAndSweepComments(parser);
    const key = choice<ast.Token>([acceptIdent, acceptStrLit])(
      parser,
    ) as ast.Key | undefined;
    if (!key) break;
    skipWsAndComments(parser);
    const array = parser.accept("[]");
    skipWsAndComments(parser);
    const equal = parser.accept("=");
    if (equal) {
      const values: ast.TailRulePatternValue[] =
        acceptTailRuleMatchPatternRules(parser);
      const trailingComments = acceptTrailingComments(parser);
      rules.push({
        ...mergeSpans([
          key,
          ...values,
          leadingComments,

          trailingComments,
        ]),
        key,
        array,
        value: values,
        leadingComments,

        trailingComments,
      });
    } else {
      const trailingComments = acceptTrailingComments(parser);
      rules.push({
        ...mergeSpans([
          key,
          leadingComments,

          trailingComments,
        ]),
        key,
        array,
        leadingComments,

        trailingComments,
      });
    }
  }
  return rules;
}

function acceptTailRuleMatchPatternRules(
  parser: RecursiveDescentParser,
): ast.TailRuleMatchPatternRule[] {
  let loc = parser.loc;
  const rules: ast.TailRuleMatchPatternRule[] = [];
  parser.accept("|");
  do {
    const { commentGroups: leadingComments } = skipWsAndSweepComments(parser);
    const rule = choice([acceptRegex, acceptIdent, acceptStrLit])(
      parser,
    ) as ast.TailRuleMatchPatternRule;
    rules.push({
      ...rule,
      leadingComments,
      trailingComments: acceptTrailingComments(parser),
    });
    loc = parser.loc;
    skipWsAndComments(parser);
  } while (parser.accept("|"));
  parser.loc = loc;
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
  then: (token: Token | undefined) => T,
): AcceptFn<T> {
  return function accept(parser) {
    const token = parser.accept(pattern);
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
const documentCommentPattern = /^\/\*\*(?:.|\r?\n\s*\*)*(\r?\n\s*)\*\//;
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
    const documentComment = acceptSpecialToken(
      parser,
      "document-comment",
      documentCommentPattern,
    );
    if (documentComment) {
      comments.push(documentComment);
      continue;
    }
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
    const documentComment = acceptSpecialToken(
      parser,
      "document-comment",
      documentCommentPattern,
    );
    if (documentComment) {
      comments.push(documentComment);
      continue;
    }
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
