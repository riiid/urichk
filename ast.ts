export type Urichk = Rule[];
export interface Token<TText = string> {
  text: TText;
  offset: number;
  lineBreaks: number;
  line: number;
  col: number;
}
export interface Rule {
  comment?: Token;
  head: Head;
  tail: Tail;
}
export interface Head {
  scheme?: Scheme;
  authority?: Authority;
  path?: Path;
}
export interface Scheme extends Token {}
export interface Authority {
  userinfo?: Userinfo;
  host: Host;
  port?: Port;
}
export interface Userinfo extends Token {}
export interface Host extends Token {}
export interface Port extends Token {}
export type Path = PathFragment[];
export type PathFragment = StaticPathFragment | ParamPathFragment;
export interface StaticPathFragment {
  type: "static";
  name: Token;
}
export interface ParamPathFragment {
  type: "param";
  name: Token;
}
export type Tail = TailRule[];
export type TailRule = TailRuleMatch | TailRuleForm;
export interface TailRuleBase<TMatch extends Token> {
  comment?: Token;
  tailType: Token<"?" | "#">;
  matchType: TMatch;
}
export interface TailRuleMatch extends TailRuleBase<Token<"match">> {
  pattern: TailRulePatternValue[];
}
export interface TailRuleForm extends TailRuleBase<Token<"form">> {
  pattern: TailRuleFormPatternRule[];
}
export interface Key {
  type: "id" | "string";
  value: Token;
}
export interface TailRuleFormPatternRule {
  comment?: Token;
  key: Key;
  value: TailRulePatternValue[] | null;
  array: boolean;
}
export interface TailRulePatternValue {
  type: "id" | "string" | "regex";
  value: Token;
}
