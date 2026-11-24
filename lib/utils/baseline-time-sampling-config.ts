/**
 * Configuración propia de un día de baseline Time-sampling (intervalo, unidad, cantidad de registros).
 *
 * Contrato backend: un día con resultado no puede cambiar su configuración sin reiniciarlo en
 * `/baseline/values`. Por eso el front solo envía la configuración de una fila guardada si cambió.
 */

export interface TimeSamplingBaselineRow {
  recordId?: string
  /** Conteo tal como está en pantalla; "" = sin conteo */
  value: string
  intervalLength?: string
  unitOfTime?: string
  suggestedNumberOfRecordings?: string
  loadedIntervalLength?: string
  loadedUnitOfTime?: string
  loadedSuggestedNumberOfRecordings?: string
  loadedDailyAveragePercent?: string
}

const same = (a?: string, b?: string) => (a ?? "").trim() === (b ?? "").trim()

/** Fila nueva, o fila guardada cuya configuración cambió */
export function isTimeSamplingConfigPending(row: TimeSamplingBaselineRow): boolean {
  if (!row.recordId) return true
  return (
    !same(row.intervalLength, row.loadedIntervalLength) ||
    !same(row.unitOfTime, row.loadedUnitOfTime) ||
    !same(row.suggestedNumberOfRecordings, row.loadedSuggestedNumberOfRecordings)
  )
}

/** Día con resultado: conteo registrado o porcentaje manual guardado */
export function hasRecordedTimeSamplingResult(row: TimeSamplingBaselineRow): boolean {
  return (row.value ?? "").trim() !== "" || (row.loadedDailyAveragePercent ?? "").trim() !== ""
}
