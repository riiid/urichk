import { parse } from "./urichk.ts";
import { assertEquals } from "https://deno.land/std@0.129.0/testing/asserts.ts";

Deno.test("#1", () => {
  const { ast } = parse(`
// Where is mine
scheme:example1.com/foo/bar/baz {
  ? match /web-path=(?<path>.*)/
  # match
    | id-1
    | id-2
    | id-3
}
  `);
  assertEquals(ast, [
    {
      start: 1,
      end: 129,
      head: {
        start: 18,
        end: 49,
        scheme: {
          start: 18,
          end: 24,
          text: "scheme",
        },
        authority: {
          start: 25,
          end: 37,
          host: {
            start: 25,
            end: 37,
            text: "example1.com",
          },
          port: undefined,
          userinfo: undefined,
        },
        path: {
          start: 38,
          end: 49,
          fragments: [
            {
              type: "static",
              start: 38,
              end: 41,
              text: "foo",
            },
            {
              type: "static",
              start: 42,
              end: 45,
              text: "bar",
            },
            {
              type: "static",
              start: 46,
              end: 49,
              text: "baz",
            },
          ],
        },
      },
      tail: {
        start: 50,
        end: 129,
        openParens: {
          start: 50,
          end: 51,
          text: "{",
        },
        rules: [
          {
            tailType: {
              start: 54,
              end: 55,
              text: "?",
            },
            matchType: {
              start: 56,
              end: 61,
              text: "match",
            },
            pattern: [
              {
                start: 62,
                end: 84,
                text: "/web-path=(?<path>.*)/",
                type: "regex",
              },
            ],
          },
          {
            tailType: {
              start: 87,
              end: 88,
              text: "#",
            },
            matchType: {
              start: 89,
              end: 94,
              text: "match",
            },
            pattern: [
              {
                start: 101,
                end: 105,
                text: "id-1",
                type: "id",
              },
              {
                start: 112,
                end: 116,
                text: "id-2",
                type: "id",
              },
              {
                start: 123,
                end: 127,
                text: "id-3",
                type: "id",
              },
            ],
          },
        ],
        closeParens: {
          start: 128,
          end: 129,
          text: "}",
        },
      },
      leadingComments: [
        {
          start: 1,
          end: 18,
          type: "comment-group",
          comments: [
            {
              type: "singleline-comment",
              start: 1,
              end: 18,
              text: "// Where is mine\n",
            },
          ],
        },
      ],
      leadingDetachedComments: [],
      trailingComments: [],
    },
  ]);
});

Deno.test("#2", () => {
  const { ast } = parse(`
/**
 * foo
 */
scheme:example2.com/path/[param1]/[param2] {
  /**
   * bar
   */
  ? form {
    /**
     * baz
     */
    '' = ''
    a
    b
    param1 = exact | match | value
    param2 = /^[0-9]+$/
    param3 [] = /^[a-z]+$/i
  }
  # match /id/
}
 `);
  assertEquals(ast, [
    {
      start: 1,
      end: 251,
      head: {
        start: 16,
        end: 57,
        scheme: {
          start: 16,
          end: 22,
          text: "scheme",
        },
        authority: {
          start: 23,
          end: 35,
          userinfo: undefined,
          host: {
            start: 23,
            end: 35,
            text: "example2.com",
          },
          port: undefined,
        },
        path: {
          start: 36,
          end: 57,
          fragments: [
            {
              type: "static",
              start: 36,
              end: 40,
              text: "path",
            },
            {
              type: "param",
              start: 42,
              end: 48,
              text: "param1",
            },
            {
              type: "param",
              start: 51,
              end: 57,
              text: "param2",
            },
          ],
        },
      },
      tail: {
        start: 59,
        end: 251,
        openParens: {
          start: 59,
          end: 60,
          text: "{",
        },
        rules: [
          {
            openParens: {
              start: 91,
              end: 92,
              text: "{",
            },
            closeParens: {
              start: 233,
              end: 234,
              text: "}",
            },
            tailType: {
              start: 84,
              end: 85,
              text: "?",
            },
            matchType: {
              start: 86,
              end: 90,
              text: "form",
            },
            pattern: [
              {
                start: 124,
                end: 131,
                key: {
                  start: 124,
                  end: 126,
                  text: "''",
                  type: "string",
                },
                value: [
                  {
                    start: 129,
                    end: 131,
                    text: "''",
                    type: "string",
                  },
                ],
                array: undefined,
              },
              {
                start: 136,
                end: 137,
                key: {
                  start: 136,
                  end: 137,
                  text: "a",
                  type: "id",
                },
                array: undefined,
              },
              {
                start: 142,
                end: 143,
                key: {
                  end: 143,
                  start: 142,
                  text: "b",
                  type: "id",
                },
                array: undefined,
              },
              {
                start: 148,
                end: 178,
                key: {
                  start: 148,
                  end: 154,
                  text: "param1",
                  type: "id",
                },
                value: [
                  {
                    start: 157,
                    end: 162,
                    text: "exact",
                    type: "id",
                  },
                  {
                    start: 165,
                    end: 170,
                    text: "match",
                    type: "id",
                  },
                  {
                    start: 173,
                    end: 178,
                    text: "value",
                    type: "id",
                  },
                ],
                array: undefined,
              },
              {
                start: 183,
                end: 202,
                key: {
                  end: 189,
                  start: 183,
                  text: "param2",
                  type: "id",
                },
                value: [
                  {
                    start: 192,
                    end: 202,
                    text: "/^[0-9]+$/",
                    type: "regex",
                  },
                ],
                array: undefined,
              },
              {
                start: 207,
                end: 230,
                key: {
                  start: 207,
                  end: 213,
                  text: "param3",
                  type: "id",
                },
                array: {
                  start: 214,
                  end: 216,
                  text: "[]",
                },
                value: [
                  {
                    start: 219,
                    end: 230,
                    text: "/^[a-z]+$/i",
                    type: "regex",
                  },
                ],
              },
            ],
          },
          {
            tailType: {
              start: 237,
              end: 238,
              text: "#",
            },
            matchType: {
              start: 239,
              end: 244,
              text: "match",
            },
            pattern: [
              {
                start: 245,
                end: 249,
                text: "/id/",
                type: "regex",
              },
            ],
          },
        ],
        closeParens: {
          start: 250,
          end: 251,
          text: "}",
        },
      },
      leadingComments: [],
      leadingDetachedComments: [
        {
          start: 1,
          end: 15,
          type: "comment-group",
          comments: [
            {
              type: "multiline-comment",
              start: 1,
              end: 15,
              text: "/**\n * foo\n */",
            },
          ],
        },
      ],
      trailingComments: [],
    },
  ]);
});

Deno.test("#3", () => {
  const { ast } = parse(`
    /**
     * Comment here
     */ 
    example3.com {
      // hello
      # match /id/
    }
    /**
     * Comment end
     */ 
  `);
  assertEquals(ast, [
    {
      start: 5,
      end: 96,
      head: {
        start: 42,
        end: 54,
        authority: {
          start: 42,
          end: 54,
          host: {
            end: 54,
            start: 42,
            text: "example3.com",
          },
          port: undefined,
          userinfo: undefined,
        },
        path: undefined,
        scheme: undefined,
      },
      tail: {
        start: 55,
        end: 96,
        openParens: {
          start: 55,
          end: 56,
          text: "{",
        },
        rules: [
          {
            tailType: {
              start: 78,
              end: 79,
              text: "#",
            },
            matchType: {
              start: 80,
              end: 85,
              text: "match",
            },
            pattern: [
              {
                start: 86,
                end: 90,
                text: "/id/",
                type: "regex",
              },
            ],
          },
        ],
        closeParens: {
          start: 95,
          end: 96,
          text: "}",
        },
      },
      leadingComments: [],
      leadingDetachedComments: [
        {
          start: 5,
          end: 36,
          type: "comment-group",
          comments: [
            {
              type: "multiline-comment",
              start: 5,
              end: 36,
              text: "/**\n     * Comment here\n     */",
            },
          ],
        },
      ],
      trailingComments: [],
    },
  ]);
});

Deno.test("#4", () => {
  const { ast } = parse(`
scheme:username@example3.com:4321 {
  ? form {
    'a' = /.*/
    'b' = /.*/
    'c-d' = /.*/
    '/' = /.*/
    '?' = /.*/
    'f/' = /.*/
    'g' = /.*/
    'h' = /.*/
  }
}  
  `);
  assertEquals(ast, [
    {
      start: 1,
      end: 176,
      head: {
        start: 1,
        end: 34,
        path: undefined,
        scheme: {
          start: 1,
          end: 7,
          text: "scheme",
        },
        authority: {
          start: 8,
          end: 34,
          userinfo: {
            start: 8,
            end: 16,
            text: "username",
          },
          host: {
            start: 17,
            end: 29,
            text: "example3.com",
          },
          port: {
            start: 30,
            end: 34,
            text: "4321",
          },
        },
      },
      tail: {
        start: 35,
        end: 176,
        openParens: {
          start: 35,
          end: 36,
          text: "{",
        },
        rules: [
          {
            openParens: {
              start: 46,
              end: 47,
              text: "{",
            },
            closeParens: {
              start: 173,
              end: 174,
              text: "}",
            },
            tailType: {
              start: 39,
              end: 40,
              text: "?",
            },
            matchType: {
              start: 41,
              end: 45,
              text: "form",
            },
            pattern: [
              {
                start: 52,
                end: 70,
                array: undefined,
                key: {
                  start: 52,
                  end: 55,
                  text: "'a'",
                  type: "string",
                },
                value: [
                  {
                    start: 67,
                    end: 70,
                    text: "'b'",
                    type: "string",
                  },
                ],
              },
              {
                start: 82,
                end: 102,
                array: undefined,
                key: {
                  start: 82,
                  end: 87,
                  text: "'c-d'",
                  type: "string",
                },
                value: [
                  {
                    start: 99,
                    end: 102,
                    text: "'/'",
                    type: "string",
                  },
                ],
              },
              {
                start: 114,
                end: 133,
                array: undefined,
                key: {
                  start: 114,
                  end: 117,
                  text: "'?'",
                  type: "string",
                },
                value: [
                  {
                    start: 129,
                    end: 133,
                    text: "'f/'",
                    type: "string",
                  },
                ],
              },
              {
                start: 145,
                end: 163,
                array: undefined,
                key: {
                  start: 145,
                  end: 148,
                  text: "'g'",
                  type: "string",
                },
                value: [
                  {
                    start: 160,
                    end: 163,
                    text: "'h'",
                    type: "string",
                  },
                ],
              },
              {
                start: 166,
                end: 170,
                array: undefined,
                key: undefined,
                value: [
                  {
                    start: 166,
                    end: 170,
                    text: "/.*/",
                    type: "regex",
                  },
                ],
              },
            ],
          },
        ],
        closeParens: {
          start: 175,
          end: 176,
          text: "}",
        },
      },
      leadingComments: [],
      leadingDetachedComments: [],
      trailingComments: [],
    },
  ]);
});

Deno.test("#5", () => {
  const { ast } = parse(`
example3.com {
  // hello
  # match /id/
}

// bye
example2.com:123 {
  # match /id/
}
  `);
  assertEquals(ast, [
    {
      "start": 1,
      "end": 43,
      "head": {
        "start": 1,
        "end": 13,
        "scheme": undefined,
        "authority": {
          "start": 1,
          "end": 13,
          "userinfo": undefined,
          "host": {
            "start": 1,
            "end": 13,
            "text": "example3.com",
          },
          "port": undefined,
        },
        "path": undefined,
      },
      "tail": {
        "start": 14,
        "end": 43,
        "openParens": {
          "start": 14,
          "end": 15,
          "text": "{",
        },
        "rules": [
          {
            "tailType": {
              "start": 29,
              "end": 30,
              "text": "#",
            },
            "matchType": {
              "start": 31,
              "end": 36,
              "text": "match",
            },
            "pattern": [
              {
                "start": 37,
                "end": 41,
                "text": "/id/",
                "type": "regex",
              },
            ],
          },
        ],
        "closeParens": {
          "start": 42,
          "end": 43,
          "text": "}",
        },
      },
      "leadingComments": [],
      "leadingDetachedComments": [],
      "trailingComments": [],
    },
    {
      "start": 45,
      "end": 87,
      "head": {
        "start": 52,
        "end": 68,
        "scheme": {
          "start": 52,
          "end": 64,
          "text": "example2.com",
        },
        "authority": {
          "start": 65,
          "end": 68,
          "userinfo": undefined,
          "host": {
            "start": 65,
            "end": 68,
            "text": "123",
          },
          "port": undefined,
        },
        "path": undefined,
      },
      "tail": {
        "start": 69,
        "end": 87,
        "openParens": {
          "start": 69,
          "end": 70,
          "text": "{",
        },
        "rules": [
          {
            "tailType": {
              "start": 73,
              "end": 74,
              "text": "#",
            },
            "matchType": {
              "start": 75,
              "end": 80,
              "text": "match",
            },
            "pattern": [
              {
                "start": 81,
                "end": 85,
                "text": "/id/",
                "type": "regex",
              },
            ],
          },
        ],
        "closeParens": {
          "start": 86,
          "end": 87,
          "text": "}",
        },
      },
      "leadingComments": [
        {
          "start": 45,
          "end": 52,
          "type": "comment-group",
          "comments": [
            {
              "type": "singleline-comment",
              "start": 45,
              "end": 52,
              "text": "// bye\n",
            },
          ],
        },
      ],
      "leadingDetachedComments": [],
      "trailingComments": [],
    },
  ]);
});
