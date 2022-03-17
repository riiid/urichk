import {
  Span,
  Token,
} from "https://deno.land/x/pbkit@v0.0.39/core/parser/recursive-descent-parser.ts";

export type Node =
  | CommentGroup
  | SinglelineComment
  | MultilineComment
  | DocumentComment;

export interface CommentGroup extends Span {
  type: "comment-group";
  comments: Comment[];
}

export type Comment = SinglelineComment | MultilineComment | DocumentComment;

export interface SinglelineComment extends Token {
  type: "singleline-comment";
}

export interface MultilineComment extends Token {
  type: "multiline-comment";
}

export interface DocumentComment extends Token {
  type: "document-comment";
}
