import {
  Path,
  Tail,
  TailRuleForm,
  TailRuleFormPatternRule,
  Urichk,
} from "../ast.ts";
import { kebabToPascal } from "../case.ts";

export interface CompileConfig {
  name: string; // kebab-case
}

export function compile(
  schema: Urichk,
  config?: Partial<CompileConfig>,
): string {
  const {
    name = "",
  } = config ?? {};
  const defaultFunctionName = `use${kebabToPascal(name)}SearchParams`;
  return `
    import {useRouter} from 'next/router';
    import {ParsedUrlQuery} from 'querystring';
    type Pathname = keyof ConvertTable;
    export default function ${defaultFunctionName}<TPath extends Pathname>(path: TPath) {
      const {query} = useRouter();
      if (!convertTable[path]) throw new Error(\`unknown path: \${path}\`);
      return convertTable[path](query) as ReturnType<ConvertTable[TPath]>;
    }
    type ConvertTable = typeof convertTable;
    const convertTable = ${getConvertTableCode(schema)};
  `;
}

function getConvertTableCode(schema: Urichk) {
  return (
    "{" +
    schema.map((rule) => {
      const key = JSON.stringify(urichkPathToString(rule.head.path || []));
      const tailRuleForm = getTailRuleForm(rule.tail);
      return `
        ${rule.comment ?? ""}
        ${key}: (query: ParsedUrlQuery) => {
          const result: any = {};
          ${getConvertCode(tailRuleForm)}
          return result as ${getSearchParamsTypeCode(tailRuleForm)};
        },
      `;
    }).join("\n") +
    "} as const"
  );
}

function getConvertCode(tailRuleForm?: TailRuleForm) {
  if (!tailRuleForm) return "/* noop */";
  return tailRuleForm.pattern.map((rule) => {
    const key = getTailRuleFormPatternRuleKeyCode(rule);
    return `{ // ${key}
      const value = query[${key}];
      ${
      rule.array
        ? `
        if (value == null) {
          result[${key}] = [];
        } else if (Array.isArray(value)) {
          result[${key}] = value;
        } else {
          result[${key}] = [value];
        }
      `
        : `
        if (value == null) {
          result[${key}] = null;
        } else if (Array.isArray(value)) {
          result[${key}] = value[0];
        } else {
          result[${key}] = value;
        }
      `
    }
    }`;
  }).join("\n");
}

function getSearchParamsTypeCode(tailRuleForm?: TailRuleForm) {
  if (!tailRuleForm) return "{}";
  return (
    "{\n" +
    tailRuleForm.pattern.map((rule) => {
      const key = getTailRuleFormPatternRuleKeyCode(rule);
      const type = rule.array ? "string[]" : "string | null";
      return `
        ${rule.comment ?? ""}
        readonly ${key}: ${type};
      `;
    }).join("\n") +
    "}\n"
  );
}

function getTailRuleFormPatternRuleKeyCode(
  tailRuleFormPatternRule: TailRuleFormPatternRule,
) {
  switch (tailRuleFormPatternRule.key.type) {
    case "id":
      return JSON.stringify(tailRuleFormPatternRule.key.value.text);
    case "string":
      return tailRuleFormPatternRule.key.value.text;
  }
}

function getTailRuleForm(tail: Tail) {
  return tail.find((tailRule) => {
    if (tailRule.tailType.text !== "?") return false;
    if (tailRule.matchType.text !== "form") return false;
    return true;
  }) as TailRuleForm | undefined;
}

function urichkPathToString(path: Path) {
  return "/" + path.map((fragment) => {
    switch (fragment.type) {
      case "static":
        return fragment.name.text;
      case "param":
        return "[" + fragment.name.text + "]";
    }
  }).join("/");
}
