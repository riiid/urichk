import { build, emptyDir } from "https://deno.land/x/dnt@0.21.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: [
    "./index.ts",
    "./compile/js-url-checker.ts",
    "./compile/nextjs-navigation-hook.ts",
    "./compile/nextjs-search-params-hook.ts",
  ],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  package: {
    name: "urichk",
    version: Deno.args[0],
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
  declaration: false,
  typeCheck: false,
  test: false,
  packageManager: "yarn",
});

Deno.copyFileSync("LICENSE-MIT", "npm/LICENSE-MIT");
Deno.copyFileSync("LICENSE-APACHE", "npm/LICENSE-APACHE");
Deno.copyFileSync("README.md", "npm/README.md");
