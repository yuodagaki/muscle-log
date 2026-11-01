import { BODY_PARTS, type BodyPart, type WorkoutRecord } from './types'
import { isValidDateString } from './dateUtils'

export function isValidBodyPart(value: unknown): value is BodyPart {
  return typeof value === 'string' && (BODY_PARTS as readonly string[]).includes(value)
}

export function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && Number.isSafeInteger(value)
}

export function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false
  const parsed = Date.parse(value)
  return !Number.isNaN(parsed)
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export type FieldValidationError = { path: string; message: string }

export function validateWorkoutRecordShape(value: unknown, path = 'record'): FieldValidationError[] {
  const errors: FieldValidationError[] = []
  if (typeof value !== 'object' || value === null) {
    return [{ path, message: 'レコードがオブジェクトではありません' }]
  }
  const record = value as Record<string, unknown>

  if (!isNonEmptyString(record.id)) {
    errors.push({ path: `${path}.id`, message: 'idが不正です' })
  }
  if (!isValidDateString(record.date)) {
    errors.push({ path: `${path}.date`, message: 'dateが不正です（YYYY-MM-DDの実在する日付が必要）' })
  }
  if (!isValidBodyPart(record.part)) {
    errors.push({ path: `${path}.part`, message: 'partが不正です' })
  }
  if (!isPositiveSafeInteger(record.reps)) {
    errors.push({ path: `${path}.reps`, message: 'repsは1以上の安全な整数が必要です' })
  }
  if (!isValidIsoTimestamp(record.createdAt)) {
    errors.push({ path: `${path}.createdAt`, message: 'createdAtがISO 8601形式ではありません' })
  }
  if (!isValidIsoTimestamp(record.updatedAt)) {
    errors.push({ path: `${path}.updatedAt`, message: 'updatedAtがISO 8601形式ではありません' })
  }
  return errors
}

export type ImportValidationResult =
  | { ok: true; records: WorkoutRecord[]; exportedAt: string }
  | { ok: false; errors: FieldValidationError[] }

export function validateImportPayload(data: unknown): ImportValidationResult {
  const errors: FieldValidationError[] = []

  if (typeof data !== 'object' || data === null) {
    return { ok: false, errors: [{ path: 'root', message: 'JSONのルートがオブジェクトではありません' }] }
  }
  const payload = data as Record<string, unknown>

  if (payload.version !== 1) {
    errors.push({ path: 'version', message: '対応していないバージョンです（version: 1 のみ対応）' })
  }
  if (!isValidIsoTimestamp(payload.exportedAt)) {
    errors.push({ path: 'exportedAt', message: 'exportedAtがISO 8601形式ではありません' })
  }
  if (!Array.isArray(payload.records)) {
    errors.push({ path: 'records', message: 'recordsが配列ではありません' })
    return { ok: false, errors }
  }

  const seenIds = new Set<string>()
  payload.records.forEach((record, index) => {
    const recordErrors = validateWorkoutRecordShape(record, `records[${index}]`)
    errors.push(...recordErrors)
    if (recordErrors.length === 0) {
      const id = (record as Record<string, unknown>).id as string
      if (seenIds.has(id)) {
        errors.push({ path: `records[${index}].id`, message: `IDが重複しています: ${id}` })
      }
      seenIds.add(id)
    }
  })

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    records: payload.records as WorkoutRecord[],
    exportedAt: payload.exportedAt as string,
  }
}
