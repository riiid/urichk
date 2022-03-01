import * as ast from "../ast.ts";
import { kebabToPascal } from "../case.ts";
import {
  getSearchParamsTypeCode,
  getTailRuleForm,
  urichkPathToString,
} from "./nextjs-navigation-hook.ts";

export interface CompileConfig {
  name: string; // kebab-case
}

export function compile(
  schema: ast.Urichk,
  config?: Partial<CompileConfig>,
): string {
  const { name = "" } = config ?? {};
  const defaultFunctionName = `get${kebabToPascal(name)}Path`;
  return `
import {encode} from 'querystring';

export interface PathOptionTable {${
    schema.map((rule) => {
      const path = JSON.stringify(urichkPathToString(rule.head.path || []));
      const tailRuleForm = getTailRuleForm(rule.tail);
      const searchParamsType = getSearchParamsTypeCode(tailRuleForm);
      return `
        ${rule.comment ?? ""}
        [${path}]: ${searchParamsType};
      `;
    }).join("\n")
  }
}

export default function ${defaultFunctionName}<Path extends keyof PathOptionTable>(path: Path, searchParams?: PathOptionTable[Path]): string {
  const query = (
      searchParams ?
      '?' + encode(searchParams) :
      ''
    );
  return path + query;
}
  `;
}
