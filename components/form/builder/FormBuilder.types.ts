import type { ZodTypeAny } from "zod";

export interface FieldConfig<TFormValues> {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "textarea" | "select" | "switch" | "file" | "logo" | "document";
  required?: boolean;
  options?: { label: string; value: string }[];
  optionsKey?: string;
  visible?: boolean;
  disabled?: boolean;

  colSpan?: 1 | 2 | 3;
}

export interface SectionConfig<TFormValues> {
  id: string;
  title: string;
  tabLabel?: string;
  description?: string;
  columns?: 1 | 2 | 3; 
  side?: "left" | "right"; 
  fields: FieldConfig<TFormValues>[];
}

export interface FormConfig<TFormValues> {
  title: string;
  subtitle?: string;
  schema: ZodTypeAny;
  defaultValues: TFormValues;
  sections: SectionConfig<TFormValues>[];
  layout?: "two-column" | "single-column";
}

export interface GlobalOptionsMap {
  [key: string]: { label: string; value: string }[];
}

export interface FormBuilderProps<TFormValues> {
  config: FormConfig<TFormValues>;
  globalOptions?: GlobalOptionsMap;
  onFieldChange?: (name: string, value: any) => void;
  loadStatesByCountry?: (countryId: string) => void;
  onSubmit: (data: TFormValues) => void | Promise<void>;
  readonly?: boolean;
  customSections?: (flashSection: string | null) => {
    left?: React.ReactNode;
    right?: React.ReactNode;
  };

  customSectionComponents?: Record<string, (flashSection: string | null) => React.ReactNode>;
}
