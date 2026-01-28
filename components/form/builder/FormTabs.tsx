"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

type FormSection = {
  id: string;
  tabLabel?: string;
  title?: string;
};

interface FormTabsProps {
  sections: FormSection[];
  offsetTop?: number;
  activeSection?: string;
  setActiveSection?: (section: string) => void;
  lockScroll?: boolean;
}

export function FormTabs({
  sections,
  offsetTop = 0,
  activeSection: externalActiveSection,
  setActiveSection: externalSetActiveSection,
}: FormTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(
    externalActiveSection || sections[0]?.id || null
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const lock = useRef(false);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    if (externalActiveSection) setActiveId(externalActiveSection);
  }, [externalActiveSection]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        lock.current = false;
      }, 180);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabClick = (id: string) => {
    const el = document.getElementById(id);
    
    if (!el) {
      console.error(`[FormTabs] Element with id "${id}" not found in DOM`);
      return;
    }

    lock.current = true;
    setActiveId(id);
    externalSetActiveSection?.(id);

    el.scrollIntoView({ 
      behavior: "smooth",
      block: "start"
    });
  };

  if (!sections.length) return null;

  return (
    <div
      className="sticky z-40 w-full"
      style={{ top: offsetTop }}
    >
      <div
        className={cn(
          `
          border-b backdrop-blur-xl transition-all duration-300
          bg-white/95
          border-slate-200
          `,
          isScrolled &&
            `
            shadow-[0_4px_14px_rgba(0,0,0,0.08)]
            `
        )}
      >
        <div className="max-w-[1360px] mx-auto px-10">
          <div className="flex items-center justify-center h-16 gap-4 select-none flex-wrap">
            {sections.map((section) => {
              const label = section.tabLabel ?? section.title ?? section.id;
              const active = activeId === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleTabClick(section.id)}
                  className={cn(
                    `
                    relative h-full px-3 text-[15px] font-semibold tracking-wide
                    transition-all duration-300
                    cursor-pointer
                    `,
                    active
                      ? "text-[#037ECC]"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {label}

                  {active && (
                    <span
                      className="
                      absolute inset-x-0 -bottom-[1px] h-[4px]
                      rounded-full
                      bg-gradient-to-r from-[#037ECC] to-[#079CFB]
                      shadow-[0_4px_12px_rgba(3,126,204,0.5)]
                      animate-in slide-in-from-bottom-1 duration-300
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
