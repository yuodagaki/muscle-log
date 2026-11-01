import { db } from './db'
import { EMPTY_META, type ExportPayload, type WorkoutRecord } from '../domain/types'
import { EXPORT_SCHEMA_VERSION } from '../domain/constants'
import { validateWorkoutRecordShape } from '../domain/validation'

export type ExportSnapshot = {
  records: WorkoutRecord[]
  revision: number
}

/** 書き出し用に、記録とリビジョンを一貫したスナップショットとして読み出す。 */
export async function readExportSnapshot(): Promise<ExportSnapshot> {
  return db.transaction('r', db.records, db.meta, async () => {
    const records = await db.records.toArray()
    const meta = (await db.meta.get(1)) ?? EMPTY_META
    return { records, revision: meta.revision }
  })
}

export class SnapshotValidationError extends Error {
  constructor() {
    super('書き出し対象データの検証に失敗しました')
    this.name = 'SnapshotValidationError'
  }
}

export function buildExportPayload(records: WorkoutRecord[]): ExportPayload {
  for (const record of records) {
    const errors = validateWorkoutRecordShape(record)
    if (errors.length > 0) {
      throw new SnapshotValidationError()
    }
  }
  return {
    version: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    records,
  }
}

export function exportFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = pad(now.getMonth() + 1)
  const d = pad(now.getDate())
  const hh = pad(now.getHours())
  const mm = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  return `muscle-log-${y}-${m}-${d}-${hh}${mm}${ss}.json`
}

/**
 * 検証済みレコードで全件置換する。単一トランザクションで実行し、
 * 途中失敗時は旧データを保持する（Dexieのトランザクションは失敗時に自動ロールバックする）。
 */
export async function replaceAllRecords(records: WorkoutRecord[]): Promise<void> {
  await db.transaction('rw', db.records, db.meta, async () => {
    await db.records.clear()
    if (records.length > 0) {
      await db.records.bulkAdd(records)
    }
    const current = (await db.meta.get(1)) ?? EMPTY_META
    await db.meta.put({ ...current, revision: current.revision + 1 })
  })
}

export type ImportPreview = {
  fileRecordCount: number
  oldestDate: string | null
  newestDate: string | null
  currentRecordCount: number
  resultRecordCount: number
}

export function buildImportPreview(fileRecords: WorkoutRecord[], currentRecordCount: number): ImportPreview {
  if (fileRecords.length === 0) {
    return {
      fileRecordCount: 0,
      oldestDate: null,
      newestDate: null,
      currentRecordCount,
      resultRecordCount: 0,
    }
  }
  let oldest = fileRecords[0].date
  let newest = fileRecords[0].date
  for (const r of fileRecords) {
    if (r.date < oldest) oldest = r.date
    if (r.date > newest) newest = r.date
  }
  return {
    fileRecordCount: fileRecords.length,
    oldestDate: oldest,
    newestDate: newest,
    currentRecordCount,
    resultRecordCount: fileRecords.length,
  }
}
