import { parse } from "../index.ts";
import { assertEquals } from "https://deno.land/std@0.127.0/testing/asserts.ts";
import format from "./formatter.ts";

Deno.test("formatter", () => {
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

  const schema = parse(fixture);
  if (!schema) throw new Error("No schema");
  const formatted = format(schema);
  console.log(formatted);
  assertEquals(
    formatted,
    `scheme:example1.com/foo/bar/baz {
    ? match /web-path=(?<path>.*)/

    # match 
        | id-1
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

`,
  );
});
