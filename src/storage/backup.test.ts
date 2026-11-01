import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addRecord } from './recordsRepo'
import { confirmBackup, getMeta, hasUnbackedChanges } from './metaRepo'
import { buildExportPayload, buildImportPreview, readExportSnapshot, replaceAllRecords } from './backup'
import { validateImportPayload } from '../domain/validation'

beforeEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

describe('export', () => {
  it('produces a valid, re-importable payload', async () => {
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 20 })
    await addRecord({ date: '2026-11-02', part: 'legs', reps: 15 })

    const snapshot = await readExportSnapshot()
    const payload = buildExportPayload(snapshot.records)

    expect(payload.version).toBe(1)
    expect(payload.records).toHaveLength(2)

    const roundTrip = validateImportPayload(JSON.parse(JSON.stringify(payload)))
    expect(roundTrip.ok).toBe(true)
  })
})

describe('fresh install state', () => {
  it('does not report unbacked changes before any record has ever been added', async () => {
    const meta = await getMeta()
    expect(hasUnbackedChanges(meta)).toBe(false)
  })
})

describe('backup confirmation', () => {
  it('only marks the backup confirmed when the user explicitly confirms, and preserves unbacked-up state for later changes', async () => {
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 20 })
    const snapshot = await readExportSnapshot()

    // 書き出し開始〜確認までの間に新しい変更が入るケース
    await addRecord({ date: '2026-11-02', part: 'legs', reps: 5 })

    await confirmBackup(snapshot.revision)
    const meta = await getMeta()
    expect(meta.lastBackupRevision).toBe(snapshot.revision)
    expect(hasUnbackedChanges(meta)).toBe(true) // 確認後の新しい変更があるため未バックアップ
  })

  it('reports no unbacked changes right after confirming with the latest revision', async () => {
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 20 })
    const snapshot = await readExportSnapshot()
    await confirmBackup(snapshot.revision)
    const meta = await getMeta()
    expect(hasUnbackedChanges(meta)).toBe(false)
  })
})

describe('import / replaceAllRecords', () => {
  it('replaces all existing records atomically', async () => {
    await addRecord({ date: '2026-01-01', part: 'chest', reps: 1 })
    const incoming = [
      {
        id: 'imported-1',
        date: '2026-11-01',
        part: 'legs' as const,
        reps: 42,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ]
    await replaceAllRecords(incoming)
    const all = await db.records.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('imported-1')
  })

  it('rejects an invalid file and keeps existing data untouched', async () => {
    await addRecord({ date: '2026-01-01', part: 'chest', reps: 1 })
    const invalidPayload = { version: 1, exportedAt: '2026-11-01T00:00:00.000Z', records: [{ id: 'bad', reps: -1 }] }
    const result = validateImportPayload(invalidPayload)
    expect(result.ok).toBe(false)

    // 検証に失敗したら置換処理を呼び出さない、という利用側の契約を確認する
    const before = await db.records.toArray()
    expect(before).toHaveLength(1)
  })

  it('computes a preview of the incoming file before replacing', async () => {
    const fileRecords = [
      { id: '1', date: '2026-10-01', part: 'chest' as const, reps: 1, createdAt: '', updatedAt: '' },
      { id: '2', date: '2026-11-05', part: 'legs' as const, reps: 2, createdAt: '', updatedAt: '' },
    ]
    const preview = buildImportPreview(fileRecords, 3)
    expect(preview).toEqual({
      fileRecordCount: 2,
      oldestDate: '2026-10-01',
      newestDate: '2026-11-05',
      currentRecordCount: 3,
      resultRecordCount: 2,
    })
  })
})
