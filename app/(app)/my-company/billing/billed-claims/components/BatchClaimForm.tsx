"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarRange, ClipboardList } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { MonthRangePicker } from "@/components/custom/MonthRangePicker"
import { useBatchClaimForm } from "../hooks/useBatchClaimForm"
import { EligibleServiceLogsPicker } from "./EligibleServiceLogsPicker"

interface BatchClaimFormProps {
  form: ReturnType<typeof useBatchClaimForm>
  onSaved: (batchClaimId: string) => void
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>
}

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">{icon}</div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export function BatchClaimForm({ form, onSaved }: BatchClaimFormProps) {
  const router = useRouter()
  const {
    isEdit,
    payerId,
    payerPlanId,
    reference,
    comments,
    setReference,
    setComments,
    handlePayerChange,
    handlePlanChange,
    payerOptions,
    planOptions,
    isLoadingPayers,
    isLoadingPlans,
    startMonth,
    endMonth,
    handleRangeChange,
    serviceLogs,
    isLoadingEligible,
    hasSearched,
    canSearch,
    selectedIds,
    toggleServiceLog,
    setServiceLogsSelected,
    orphanSelections,
    billingCodeLabels,
    handleSubmit,
    isSaving,
    errors,
  } = form

  const submit = async () => {
    const id = await handleSubmit()
    if (id) onSaved(id)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      noValidate
    >
      <div className="space-y-5 pb-32">
        {/* ─── Batch Details ─── */}
        <Section icon={<ClipboardList className="h-4 w-4" />} title="Batch Details">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div data-form-field="payerId">
              <FloatingSelect
                label="Payer"
                value={payerId}
                onChange={handlePayerChange}
                options={payerOptions}
                searchable
                disabled={isLoadingPayers}
                required
              />
            </div>
            <div data-form-field="payerPlanId">
              <FloatingSelect
                label="Payer Plan"
                value={payerPlanId}
                onChange={handlePlanChange}
                options={planOptions}
                searchable
                disabled={!payerId || isLoadingPlans}
                hasError={!!errors.payerPlanId}
                required
              />
              <FieldError message={errors.payerPlanId} />
              {payerId && !isLoadingPlans && planOptions.length === 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    This payer has no insurance plans configured.{" "}
                    <Link
                      href={`/my-company/billing/payers/${payerId}/edit`}
                      className="font-semibold underline hover:text-amber-900"
                    >
                      Add a plan in the payer configuration
                    </Link>{" "}
                    to be able to build a batch claim.
                  </p>
                </div>
              )}
            </div>
            <div data-form-field="reference">
              <FloatingInput
                label="Reference"
                value={reference}
                onChange={setReference}
                onBlur={() => {}}
                hasError={!!errors.reference}
                required
              />
              <FieldError message={errors.reference} />
            </div>
            <div data-form-field="comments">
              <FloatingTextarea
                label="Comments"
                value={comments}
                onChange={setComments}
                onBlur={() => {}}
                rows={2}
              />
            </div>
          </div>
        </Section>

        {/* ─── Appointment selection ─── */}
        <Section
          icon={<CalendarRange className="h-4 w-4" />}
          title="Select Service Logs"
          subtitle="Service logs whose appointments have a locked and signed session note"
        >
          <div className="space-y-4">
            <div className="max-w-md" data-form-field="dateRange">
              <MonthRangePicker
                label="Service Period"
                startValue={startMonth}
                endValue={endMonth}
                onChange={handleRangeChange}
                hasError={!!errors.dateRange}
                required
              />
              <FieldError message={errors.dateRange} />
            </div>

            <div data-form-field="serviceLogs">
              <EligibleServiceLogsPicker
                serviceLogs={serviceLogs}
                isLoading={isLoadingEligible}
                hasSearched={hasSearched}
                canSearch={canSearch}
                selectedIds={selectedIds}
                onToggle={toggleServiceLog}
                onSetGroupSelected={setServiceLogsSelected}
                orphanSelections={orphanSelections}
                billingCodeLabels={billingCodeLabels}
              />
              <FieldError message={errors.serviceLogs} />
            </div>
          </div>
        </Section>

        <FormBottomBar
          isSubmitting={isSaving}
          onCancel={() => router.push("/my-company/billing/billed-claims")}
          submitText={isEdit ? "Save Changes" : "Create Batch Claim"}
        />
      </div>
    </form>
  )
}
