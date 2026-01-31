"use client";

import * as React from "react";
import {
  FormProvider,
  useForm,
  type FieldValues,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { FormBuilderProps } from "./FormBuilder.types";
import { FormTabs } from "./FormTabs";
import { SectionCard } from "./SectionCard";
import { SideSectionCard } from "./SideSectionCard";

export function FormBuilder<TFormValues extends FieldValues>({
  config,
  globalOptions,
  onSubmit,
  onFieldChange,
  loadStatesByCountry,
  customSections,
  customSectionComponents,
}: FormBuilderProps<TFormValues>) {
  const [activeSection, setActiveSection] = React.useState<string>("general");
  const [hoveredSection, setHoveredSection] = React.useState<string | null>(null);
  const [flashSection, setFlashSection] = React.useState<string | null>(null);
  const [lockScroll, setLockScroll] = React.useState(false);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setFlashSection(sectionId);
    setLockScroll(true);
    setTimeout(() => {
      setFlashSection(null);
      setLockScroll(false);
    }, 1000);
  };

  const form = useForm<TFormValues>({
    resolver: zodResolver(config.schema) as any,
    defaultValues: config.defaultValues as any,
    mode: "onChange",
  });


  const handleSubmit: SubmitHandler<TFormValues> = async (data) => {
    await onSubmit(data);
  };

  const handleInvalid = (errors: any) => {
    const firstErrorField = Object.keys(errors)[0];
    if (!firstErrorField) return;

    const targetSection = config.sections.find((section) =>
      section.fields.some((f) => f.name === firstErrorField)
    );

    if (!targetSection) return;

    setActiveSection(targetSection.id);

    const el = document.getElementById(targetSection.id);
    if (el) {
      const rect = el.getBoundingClientRect();
      const offsetTop = window.scrollY;
      const top = rect.top + offsetTop - 140;

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }

    setFlashSection(targetSection.id);
    setTimeout(() => setFlashSection(null), 1500);
  };


  const handleFieldChange = (name: string, value: any) => {
    if (name === "country" && loadStatesByCountry) {
      loadStatesByCountry(value);
    }
  };

  const layout = config.layout || "two-column";
  const leftSections = config.sections.filter((s) => s.side !== "right" && s.fields.length > 0);
  const rightSections = config.sections.filter((s) => s.side === "right" && s.fields.length > 0);
  const allSectionsWithFields = config.sections.filter((s) => s.fields.length > 0);

  return (
    <FormProvider {...form}>
      
      <FormTabs sections={config.sections} activeSection={activeSection} setActiveSection={handleSectionClick} lockScroll={lockScroll} />          
       

      <form
        id="organization-form"
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
        className="pb-32 max-w-[1360px] mx-auto px-12"
      >
        {layout === "single-column" ? (
          <div className="space-y-10 pt-6 pb-12">
            {customSectionComponents ? (

              config.sections.map((section) => {
                const hasCustomComponent = customSectionComponents[section.id];
                if (hasCustomComponent) {
                  return <React.Fragment key={section.id}>{hasCustomComponent(flashSection)}</React.Fragment>;
                }
                if (section.fields.length > 0) {
                  return (
                    <SectionCard
                      key={section.id}
                      section={section}
                      globalOptions={globalOptions}
                      activeSection={activeSection}
                      setActiveSection={handleSectionClick}
                      hoveredSection={hoveredSection}
                      setHoveredSection={setHoveredSection}
                      flashSection={flashSection}
                      onFieldChange={handleFieldChange}
                    />
                  );
                }
                return null;
              })
            ) : (
  
              <>
                {allSectionsWithFields.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    globalOptions={globalOptions}
                    activeSection={activeSection}
                    setActiveSection={handleSectionClick}
                    hoveredSection={hoveredSection}
                    setHoveredSection={setHoveredSection}
                    flashSection={flashSection}
                    onFieldChange={handleFieldChange}
                  />
                ))}
                {customSections?.(flashSection)?.left}
                {customSections?.(flashSection)?.right}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-10 items-start pt-6 pb-12">

            <div className="space-y-10">
              {leftSections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  globalOptions={globalOptions}
                  activeSection={activeSection}
                  setActiveSection={handleSectionClick}
                  hoveredSection={hoveredSection}
                  setHoveredSection={setHoveredSection}
                  flashSection={flashSection}
                  onFieldChange={handleFieldChange}
                />
              ))}
              {customSections?.(flashSection)?.left}
            </div>

            <div className="space-y-10">
              {rightSections.map((section) => (
                <SideSectionCard
                  key={section.id}
                  section={section}
                  globalOptions={globalOptions}
                  activeSection={activeSection}
                  setActiveSection={handleSectionClick}
                  hoveredSection={hoveredSection}
                  setHoveredSection={setHoveredSection}
                  flashSection={flashSection}
                />
              ))}
              {customSections?.(flashSection)?.right}
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
