import { cn } from "@/lib/utils"
import type { FieldValues } from "react-hook-form"
import type {SectionConfig, FormBuilderProps, FieldConfig} from "./FormBuilder.types"
import { FormField } from "./FormField"

interface Props<TFormValues extends FieldValues> {
  section: SectionConfig<TFormValues>
  globalOptions?: FormBuilderProps<TFormValues>["globalOptions"]
  activeSection?: string
  setActiveSection?: (section: string) => void
  hoveredSection?: string | null
  setHoveredSection?: (section: string | null) => void
  flashSection?: string | null
  onFieldChange?: (name: string, value: any) => void
}

export function SectionCard<TFormValues extends FieldValues>({
  section,
  globalOptions,
  setActiveSection,
  flashSection,
  onFieldChange,
}: Props<TFormValues>) {
  const columns = section.columns ?? 2
  const isFlashing = flashSection === section.id

    const fields:FieldConfig<TFormValues>[] = section.fields.map(
        (field: FieldConfig<TFormValues>) => ({...field, visible: field.visible ?? true}))

  return (
    <section
      id={section.id}
      className="scroll-mt-[100px]"
      onClick={() => setActiveSection?.(section.id)}
    >
      <div
        className={cn(
          `
          rounded-3xl p-10 transition-all duration-500
          backdrop-blur-[4px]
          
          bg-white/90
          shadow-[0_8px_24px_rgba(15,23,42,0.08)] 
          ring-1 ring-slate-200/60

          hover:-translate-y-[2px]
          hover:shadow-[0_12px_28px_rgba(0,0,0,0.15)]
          `,
          isFlashing &&
            `
            ring-2 ring-blue-500/60
            shadow-[0_0_25px_rgba(37,99,235,0.35)]
            `
        )}
      >

        <h2 className="
          text-xl font-semibold tracking-tight 
          text-[#037ECC]
        ">
          {section.title}
        </h2>

        {section.description && (
          <p className="
            text-sm mt-1 leading-relaxed
            text-slate-500
          ">
            {section.description}
          </p>
        )}

        <div
          className="
            h-px mt-6 
            bg-gradient-to-r 
            from-transparent via-slate-300 to-transparent
          "
        />

        <div
          className={cn(
            "mt-8 gap-8 grid grid-cols-1",
            columns === 2 && "md:grid-cols-2",
            columns === 3 && "md:grid-cols-2 xl:grid-cols-3"
          )}
        >
          {fields.map((field) => (
             field.visible && (
               <div 
                 key={String(field.name)}
                 className={cn(
                   field.colSpan === 2 && "md:col-span-2",
                   field.colSpan === 3 && "md:col-span-2 xl:col-span-3"
                 )}
               >
                 <FormField
                   field={field}
                   globalOptions={globalOptions}
                   onFieldChange={onFieldChange}
                 />
               </div>
             )
          ))}
        </div>
      </div>
    </section>
  )
}
