import type {
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
  const defaultFunctionName = `useNavigate${kebabToPascal(name)}`;
  return `
    import {useCallback} from 'react';
    import {useRouter} from 'next/router';
    import {encode} from 'querystring';
    export interface NavigateConfig {
      replace: boolean; // true: replace, false: push
      shallow: boolean;
    }
    export interface NavigateFn {${
    schema.map((rule) => {
      const path = JSON.stringify(urichkPathToString(rule.head.path || []));
      const tailRuleForm = getTailRuleForm(rule.tail);
      const searchParamsType = getSearchParamsTypeCode(tailRuleForm);
      return `
        ${rule.comment ?? ""}
        (path: ${path}, searchParams?: ${searchParamsType}, config?: Partial<NavigateConfig>): void;
      `;
    }).join("\n")
  }}
    export default function ${defaultFunctionName}(): NavigateFn {
      const router = useRouter();
      return useCallback(function navigate(path: string, searchParams: any, config?: Partial<NavigateConfig>) {
        const replace = !!config?.replace;
        const shallow = !!config?.shallow;
        const navigateFn = replace ? router.replace : router.push;
        const query = (
          searchParams ?
          '?' + encode(searchParams) :
          ''
        );
        navigateFn(path + query, undefined, { shallow });
      }, [router]);
    }
  `;
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
        ${key}?: ${type};
      `;
    }).join("\n") +
    "[key: string]: undefined | null | string | string[],\n" +
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
