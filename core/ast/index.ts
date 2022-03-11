import {
  Span,
  Token as ParserToken,
} from "https://deno.land/x/pbkit@v0.0.39/core/parser/recursive-descent-parser.ts";
import { CommentGroup } from "./comments.ts";
import * as comments from "./comments.ts";

export * from "./comments.ts";

export type Node =
  | Rule
  | comments.Node;

export interface StatementBase extends Span {
  leadingComments: CommentGroup[];
  trailingComments: CommentGroup[];
  leadingDetachedComments: CommentGroup[];
}

export type Urichk = Rule[];
export interface Token<TText extends string = string> extends ParserToken {
  text: TText;
}
export interface Rule extends StatementBase {
  head: Head;
  tail: Tail;
}
export interface Head extends Span {
  scheme?: Scheme;
  authority?: Authority;
  path?: Path;
}
export interface Scheme extends Token {}
export interface Authority extends Span {
  userinfo?: Userinfo;
  host: Host;
  port?: Port;
}
export interface Userinfo extends Token {}
export interface Host extends Token {}
export interface Port extends Token {}
export interface Path extends Span {
  fragments: PathFragment[];
}
export type PathFragment = StaticPathFragment | ParamPathFragment;
export interface StaticPathFragment extends Token {
  type: "static";
}
export interface ParamPathFragment extends Token {
  type: "param";
}

export interface Tail extends Span {
  rules: TailRule[];
  openParens: Token;
  closeParens: Token;
}
export type TailRule = TailRuleMatch | TailRuleForm;
export interface TailRuleBase<TMatch extends Token> extends Span {
  tailType: Token<"?" | "#">;
  matchType: TMatch;
}
export interface TailRuleMatch extends TailRuleBase<Token<"match">> {
  pattern: TailRuleMatchPatternRule[];
}
export interface TailRuleForm extends TailRuleBase<Token<"form">> {
  openParens: Token;
  closeParens: Token;
  pattern: TailRuleFormPatternRule[];
}
export type TailRuleMatchPatternRule = TailRulePatternValue;
export interface TailRuleFormPatternRule extends Span {
  key: Key;
  value?: TailRulePatternValue[];
  array?: Token;
}
export interface Key extends Token {
  type: "id" | "string";
}
export interface TailRulePatternValue extends Token {
  type: "id" | "string" | "regex";
}
