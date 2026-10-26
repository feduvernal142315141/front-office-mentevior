"use client"

import { useMemo, useState } from "react"
import { PencilLine, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { SectionCard } from "@/components/custom/SectionCard"
import {
  getManualEntryDuration,
  type ManualEntryFormValue,
} from "@/lib/modules/case-supervision-log/utils/manual-entries"
import type { CaseSupervisionManualEntry } from "@/lib/types/case-supervision-log.types"
import { useManualEntryOptions } from "../hooks/useManualEntryOptions"
import { ManualLogEntriesTable } from "./ManualLogEntriesTable"
import { ManualLogEntryModal } from "./ManualLogEntryModal"

interface ManualLogEntrySectionProps {
  entries: ManualEntryFormValue[]
  clientId: string
  /** `yyyyMM` */
  reportMonth: string
  supervisorName?: string
  /** Entradas ya guardadas: aportan los textos de lo que ya no está en los catálogos */
  savedEntries?: CaseSupervisionManualEntry[]
  /** Alta o edición confirmada en el modal. Si rechaza, el modal queda abierto */
  onSaveEntry: (entry: ManualEntryFormValue) => void | Promise<void>
  /** Sin esto no hay botón de agregar: el `PUT` no crea entradas nuevas */
  canAdd?: boolean
  canEdit?: boolean
  /** Sin esto no hay botón de quitar: el `PUT` no borra entradas */
  onRemoveEntry?: (key: string) => void
  isSaving?: boolean
  disabled?: boolean
}

/**
 * Manual Log Entry: actividades sin appointment detrás, para cuando el provider
 * no llega al 10% de supervisión. Tabla de las entradas y modal para agregar o
 * editar.
 */
export function ManualLogEntrySection({
  entries,
  clientId,
  reportMonth,
  supervisorName,
  savedEntries,
  onSaveEntry,
  canAdd = false,
  canEdit = true,
  onRemoveEntry,
  isSaving,
  disabled,
}: ManualLogEntrySectionProps) {
  const options = useManualEntryOptions(clientId, savedEntries)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const rows = useMemo(() => entries.map(options.toRow), [entries, options.toRow])
  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + getManualEntryDuration(e.timeStart, e.timeEnd), 0),
    [entries],
  )
  const editingEntry = editingKey ? entries.find((e) => e.key === editingKey) ?? null : null

  const openAdd = () => {
    setEditingKey(null)
    setModalOpen(true)
  }

  const openEdit = (key: string) => {
    setEditingKey(key)
    setModalOpen(true)
  }

  const handleSave = async (entry: ManualEntryFormValue) => {
    try {
      await onSaveEntry(entry)
      setModalOpen(false)
    } catch {
      // El llamador ya avisó del error; el modal queda abierto con lo escrito
    }
  }

  return (
    <SectionCard
      icon={<PencilLine className="h-4 w-4" />}
      title="Manual Log Entry"
      subtitle={
        entries.length > 0
          ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"} · ${totalHours.toFixed(2)} h`
          : "Optional"
      }
      action={
        canAdd ? (
          <Button
            type="button"
            variant="secondary"
            onClick={openAdd}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        ) : undefined
      }
    >
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Add activities that have no appointment behind them, for example when supervision is below
          the 10% requirement.
        </p>
      ) : (
        <ManualLogEntriesTable
          rows={rows}
          supervisorName={supervisorName}
          onEdit={canEdit ? openEdit : undefined}
          onDelete={onRemoveEntry}
          disabled={disabled}
        />
      )}

      <ManualLogEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entry={editingEntry}
        reportMonth={reportMonth}
        options={options}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </SectionCard>
  )
}
