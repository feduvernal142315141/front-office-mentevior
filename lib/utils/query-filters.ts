export type GenericFilterValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type FilterRule = {
  field: string;          
  value: GenericFilterValue;
  operator?: string;  
  logic?: "AND" | "OR";  
  type?: "string" | "number" | "boolean";
};

export type SearchRule = {
  fields: string[];      
  search: string;         
};

export function buildFilters(
  rules: FilterRule[],
  searchRule?: SearchRule
): string[] {
  const output: string[] = [];

  if (searchRule && searchRule.search.trim() !== "") {
    const term = searchRule.search.trim();

    searchRule.fields.forEach((field, index) => {
      output.push(`${field}__CONTAINS_IGNORE_CASE__${term}__${searchRule.fields.length - 1 > index ? "OR" : "AND"}`);
    });
  }


  for (const rule of rules) {
    if (
      rule.value === undefined ||
      rule.value === null ||
      rule.value === "" ||
      rule.value === "all"
    )
      continue;

    const field = rule.field;
    const logic = rule.logic ?? "AND";     
    const operator = rule.operator ?? "CONTAINS";

    let formattedValue = "";

    if (rule.type === "boolean") {

      formattedValue = `Boolean_${String(rule.value)}`;
      output.push(`${field}__${operator}__${formattedValue}__${logic}`);
      continue;
    }

    if (rule.type === "number") {
      formattedValue = `Integer_${rule.value}`;
      output.push(`${field}__${operator}__${formattedValue}__${logic}`);
      continue;
    }

    formattedValue = String(rule.value);
    output.push(`${field}__${operator}__${formattedValue}__${logic}`);
  }

  return output;
}
