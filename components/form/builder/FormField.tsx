"use client"

import { useFormContext, type FieldValues } from "react-hook-form"
import type { FieldConfig, GlobalOptionsMap } from "./FormBuilder.types"

import { TextAreaField } from "./fields/TextAreaField"
import { FloatingSelect } from "./fields/FloatingSelect"
import { SwitchField } from "./fields/SwitchField"
import { FileUploadField } from "./fields/FileUploadField"
import { LogoField } from "./fields/LogoField"
import { DocumentField } from "./fields/DocumentField"
import { FloatingInputField } from "./fields/FloatingInputField"

interface FormFieldProps<TFormValues extends FieldValues = FieldValues> {
  field: FieldConfig<TFormValues>
  globalOptions?: GlobalOptionsMap
  onFieldChange?: (name: string, value: any) => void
}

export function FormField<TFormValues extends FieldValues = FieldValues>({
  field,
  globalOptions,
  onFieldChange, 
}: FormFieldProps<TFormValues>) {
  const { formState } = useFormContext<TFormValues>();

  function getNestedError(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => {
    if (acc && acc[key] !== undefined) return acc[key];
    return undefined;
  }, obj);
}

  const fieldError = getNestedError(formState.errors, field.name);
  const error = fieldError?.message;

  const optionsFromGlobal =
    field.optionsKey && globalOptions?.[field.optionsKey]
      ? globalOptions[field.optionsKey]
      : undefined;

  const options = optionsFromGlobal ?? field.options ?? [];

  const commonProps = {
    field,
    options,
    error,
    onFieldChange,
  };

  const components: Record<string, React.ComponentType<any>> = {
    text: FloatingInputField,
    email: FloatingInputField,
    number: FloatingInputField,
    textarea: TextAreaField,
    select: FloatingSelect,
    switch: SwitchField,
    file: FileUploadField,
    logo: LogoField,
    document: DocumentField,
  };

  const Component =
    components[field.type as keyof typeof components] ?? FloatingInputField;

  return <Component {...commonProps} />;
}
