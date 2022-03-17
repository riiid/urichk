import { parse } from "../parser/urichk.ts";
import format from "./formatter.ts";
import { test } from "https://deno.land/x/snap@0.0.3/mod.ts";

test("#1", ({ assertSnapshot }) => {
  const fixture = `
scheme:example1.com/foo/bar/baz {
  ? match
    /web-path=(?<path>.*)/
  # match id-1
    | id-2
    | /id-3/
}

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

scheme:username@example3.com:4321 {
  ? form {'a' = /.*/
    'b' = /.*/
    'c-d' = /.*/
    '/' = /.*/
    '?' = /.*/
    'f/' = /.*/
    'g' = /.*/
    'h' = /.*/
  }
}`;

  const parseResult = parse(fixture);
  if (!parseResult) throw new Error("No schema");
  const formatted = format(parseResult.ast);
  assertSnapshot(formatted);
});

test("#2", ({ assertSnapshot }) => {
  const fixture = `
  /**
   * Webview for resetting password of a user.
   */
  /webview/reset-password {
      ? form {
          /**
           * Code sent via email.
           */
          token = /^.+$/
      }
  }
  
  /**
   * Webview for a learning cell.
   */
  /webview/learning-cell {
      ? form {
          /**
           * Learning cell id.
           */
          cellId = /^\d+$/
      }
  }
  
  /**
   * Webview for the coupon box
   */
  /webview/coupon/box {}  
  /*
   * Webview of Virtual Exam Report Page
   */
  /webview/virtual-exam/report {
      ? form {
          /**
           * Session ID (Learning Self Card)
           */
          sessionId = /^\d+$/
          /**
           * It should be 'virtual_exam' if this page loaded after the virtual exam'
           * It should be 'self' if this page loaded by clicking a self card with the ended virtual exam
           */
          referrer = virtual_exam | self
      }
  }
`;

  const parseResult = parse(fixture);
  if (!parseResult) throw new Error("No schema");
  const formatted = format(parseResult.ast);
  assertSnapshot(formatted);
});
