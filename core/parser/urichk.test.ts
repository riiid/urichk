import { parse } from "./urichk.ts";
import { test } from "https://deno.land/x/snap@0.0.3/mod.ts";

test("#1", async ({ assertSnapshot }) => {
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
  assertSnapshot(ast);
});

test("#2", async ({ assertSnapshot }) => {
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
  assertSnapshot(ast);
});

test("#3", ({ assertSnapshot }) => {
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
  // console.log(JSON.stringify(ast, (k, v) => (v == null ? undefined : v), 2));
  assertSnapshot(ast);
});

test("#4", ({ assertSnapshot }) => {
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
  assertSnapshot(ast);
});

test("#5", ({ assertSnapshot }) => {
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
  assertSnapshot(ast);
});

test("#6", ({ assertSnapshot }) => {
  const { ast } = parse(`
/**
 * Webview for resetting password of a user.
 */
/webview/reset-password {
    ? form {
        /**
         * Code sent via email.
         */
        token = /^.+$/
        /**
         * Code sent via email.
         */
        token = 
          | /^.+$/ 
        // asdfsdafdsa
          | /.$/
    }
}
`);
  assertSnapshot(ast);
});
