"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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
  const [visibleCount, setVisibleCount] = useState(sections.length);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const lock = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const calculateVisibleTabs = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const moreButtonWidth = 100;
    const gap = 16;
    let totalWidth = 0;
    let count = 0;

    const tempContainer = document.createElement("div");
    tempContainer.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;";
    document.body.appendChild(tempContainer);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const label = section.tabLabel ?? section.title ?? section.id;
      
      const tempButton = document.createElement("button");
      tempButton.className = "px-3 text-[15px] font-semibold tracking-wide";
      tempButton.textContent = label;
      tempContainer.appendChild(tempButton);
      
      const tabWidth = tempButton.offsetWidth;
      const widthNeeded = totalWidth + tabWidth + (count > 0 ? gap : 0);
      const hasMoreTabs = i < sections.length - 1;
      const reservedWidth = hasMoreTabs ? moreButtonWidth + gap : 0;

      if (widthNeeded + reservedWidth <= containerWidth) {
        totalWidth = widthNeeded;
        count++;
      } else {
        break;
      }
    }

    document.body.removeChild(tempContainer);

    if (count < sections.length && count === sections.length) {
      count = sections.length;
    }

    setVisibleCount(Math.max(1, count));
  }, [sections]);

  useEffect(() => {
    calculateVisibleTabs();

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleTabs();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", calculateVisibleTabs);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateVisibleTabs);
    };
  }, [calculateVisibleTabs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        moreButtonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleTabClick = (id: string) => {
    const el = document.getElementById(id);
    
    if (!el) {
      console.error(`[FormTabs] Element with id "${id}" not found in DOM`);
      return;
    }

    lock.current = true;
    setActiveId(id);
    externalSetActiveSection?.(id);
    setDropdownOpen(false);

    el.scrollIntoView({ 
      behavior: "smooth",
      block: "start"
    });
  };

  if (!sections.length) return null;

  const visibleSections = sections.slice(0, visibleCount);
  const overflowSections = sections.slice(visibleCount);
  const hasOverflow = overflowSections.length > 0;
  const isActiveInOverflow = overflowSections.some(s => s.id === activeId);

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
          <div 
            ref={containerRef}
            className="flex items-center justify-center h-16 gap-4 select-none"
          >
            {visibleSections.map((section) => {
              const label = section.tabLabel ?? section.title ?? section.id;
              const active = activeId === section.id;

              return (
                <button
                  key={section.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(section.id, el);
                  }}
                  type="button"
                  onClick={() => handleTabClick(section.id)}
                  className={cn(
                    `
                    relative h-full px-3 text-[15px] font-semibold tracking-wide
                    transition-all duration-300
                    cursor-pointer whitespace-nowrap
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

            {hasOverflow && (
              <div className="relative h-full flex items-center">
                <button
                  ref={moreButtonRef}
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    `
                    relative h-full px-3 text-[15px] font-semibold tracking-wide
                    transition-all duration-300
                    cursor-pointer whitespace-nowrap
                    flex items-center gap-1
                    `,
                    isActiveInOverflow
                      ? "text-[#037ECC]"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  More
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      dropdownOpen && "rotate-180"
                    )}
                  />

                  {isActiveInOverflow && (
                    <span
                      className="
                      absolute inset-x-0 -bottom-[1px] h-[4px]
                      rounded-full
                      bg-gradient-to-r from-[#037ECC] to-[#079CFB]
                      shadow-[0_4px_12px_rgba(3,126,204,0.5)]
                      "
                    />
                  )}
                </button>

                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="
                      absolute top-full right-0 mt-2
                      min-w-[180px]
                      bg-white rounded-xl
                      shadow-[0_10px_40px_rgba(0,0,0,0.12)]
                      border border-slate-200
                      py-2
                      z-50
                      animate-in fade-in-0 zoom-in-95 duration-200
                    "
                  >
                    {overflowSections.map((section) => {
                      const label = section.tabLabel ?? section.title ?? section.id;
                      const active = activeId === section.id;

                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => handleTabClick(section.id)}
                          className={cn(
                            `
                            w-full px-4 py-2.5 text-left text-[14px] font-medium
                            transition-all duration-200
                            cursor-pointer
                            `,
                            active
                              ? "text-[#037ECC] bg-[#037ECC]/5"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
