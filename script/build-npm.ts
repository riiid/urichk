import { build, emptyDir } from "https://deno.land/x/dnt@0.21.0/mod.ts";
import packageJson from "../package.json" assert { type: "json" };

await emptyDir("./tmp/npm");

await build({
  entryPoints: [
    "./index.ts",
    "./compile/get-path.ts",
    "./compile/js-url-checker.ts",
    "./compile/nextjs-navigation-hook.ts",
    "./compile/nextjs-search-params-hook.ts",
    "./core/stringifier/formatter.ts",
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
