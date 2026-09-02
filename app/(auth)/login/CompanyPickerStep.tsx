"use client"

import { ArrowLeft, Building2, ChevronRight, Loader2 } from "lucide-react"

import type { MatchedCompany } from "@/lib/models/login/login"

interface CompanyPickerStepProps {
  companies: MatchedCompany[]
  error: string | null
  isSubmitting: boolean
  onSelect: (slug: string) => void
  onBack: () => void
}

export function CompanyPickerStep({
  companies,
  error,
  isSubmitting,
  onSelect,
  onBack,
}: CompanyPickerStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="mb-8">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
          <Building2 className="h-6 w-6" />
        </div>

        <h3 className="mb-2 text-[26px] 2xl:text-[28px] font-semibold text-[var(--color-login-text-primary)]">
          Choose your organization
        </h3>
        <p className="text-[14px] 2xl:text-[15px] leading-relaxed text-[var(--color-login-text-secondary)]">
          Your account belongs to more than one organization. Pick the one you want to sign in to.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[13px] font-medium text-red-500">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {companies.map((company) => (
          <button
            key={company.slug}
            type="button"
            onClick={() => onSelect(company.slug)}
            disabled={isSubmitting}
            className="
              group flex w-full items-center gap-4
              rounded-[16px] border border-gray-200 bg-white px-5 py-4
              text-left transition-all duration-200
              hover:border-[#2563EB]/40 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)]
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--color-login-text-primary)]">
                {company.companyName}
              </p>
              <p className="truncate text-[13px] text-[var(--color-login-text-muted)]">
                {company.slug}
              </p>
            </div>

            {isSubmitting ? (
              <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-[var(--color-login-text-muted)]" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--color-login-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#2563EB]" />
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex items-center gap-1.5 text-[13px] text-black transition-colors duration-200 hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Use another account
      </button>
    </div>
  )
}
