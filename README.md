# urichk
schema for checking uri

[syntax specification](./urichk.ne)

## example

```urichk
// this is
/* urichk example */
https://example.com/foo/[bar]/baz {
    ? match /^param1=.+?&param2=.+$/
    ? form {
        param1 = /^.+$/
        param2 [] = /^.+$/
    }
    # match
        | id1
        | id2
}
```
