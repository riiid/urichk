import { build, emptyDir } from "https://deno.land/x/dnt@0.21.0/mod.ts";
import packageJson from "../package.json" assert { type: "json" };

await emptyDir("./tmp/npm");

await build({
  entryPoints: [
    "./index.ts",
    { name: "./compile/get-path", path: "./compile/get-path.ts" },
    { name: "./compile/js-url-checker", path: "./compile/js-url-checker.ts" },
    {
      name: "./compile/nextjs-navigation-hook",
      path: "./compile/nextjs-navigation-hook.ts",
    },
    {
      name: "./compile/nextjs-search-params-hook",
      path: "./compile/nextjs-search-params-hook.ts",
    },
    {
      name: "./core/stringifier/formatter",
      path: "./core/stringifier/formatter.ts",
    },
    { name: "./core/parser/urichk", path: "./core/parser/urichk.ts" },
  ],
  outDir: "./tmp/npm",
  shims: {
    deno: true,
  },
  package: {
    name: "urichk",
    version: Deno.args[0] || packageJson.version,
    description: "Schema for checking uri",
    license: "(MIT OR Apache-2.0)",
    repository: {
      type: "git",
      url: "git+https://github.com/riiid/urichk.git",
    },
    bugs: {
      url: "https://github.com/riiid/urichk/issues",
    },
  },
  declaration: true,
  typeCheck: false,
  test: false,
  packageManager: "yarn",
});

Deno.copyFileSync("LICENSE-MIT", "tmp/npm/LICENSE-MIT");
Deno.copyFileSync("LICENSE-APACHE", "tmp/npm/LICENSE-APACHE");
Deno.copyFileSync("README.md", "tmp/npm/README.md");
