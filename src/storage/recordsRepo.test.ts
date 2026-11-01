import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addRecord, deleteRecord, InvalidRecordInputError, listRecordsByDate, updateRecord } from './recordsRepo'
import { getMeta } from './metaRepo'

beforeEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

describe('addRecord', () => {
  it('creates an independent history entry per call and accumulates per part/day', async () => {
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 20 })
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 30 })

    const records = await listRecordsByDate('2026-11-01')
    expect(records).toHaveLength(2)
    expect(records.reduce((sum, r) => sum + r.reps, 0)).toBe(50)
    expect(new Set(records.map((r) => r.id)).size).toBe(2) // ID重複なし
  })

  it('bumps the revision on every successful write', async () => {
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 20 })
    const metaAfterFirst = await getMeta()
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 10 })
    const metaAfterSecond = await getMeta()
    expect(metaAfterSecond.revision).toBe(metaAfterFirst.revision + 1)
  })

  it('rejects invalid reps and dates without writing anything', async () => {
    await expect(addRecord({ date: '2026-11-01', part: 'chest', reps: 0 })).rejects.toThrow(InvalidRecordInputError)
    await expect(addRecord({ date: '2026-02-30', part: 'chest', reps: 10 })).rejects.toThrow(InvalidRecordInputError)
    expect(await listRecordsByDate('2026-11-01')).toHaveLength(0)
  })
})

describe('updateRecord', () => {
  it('allows editing past-dated records and updates updatedAt while keeping createdAt', async () => {
    const created = await addRecord({ date: '2026-10-01', part: 'chest', reps: 10 })
    const updated = await updateRecord(created.id, { date: '2026-10-02', part: 'legs', reps: 15 })

    expect(updated.date).toBe('2026-10-02')
    expect(updated.part).toBe('legs')
    expect(updated.reps).toBe(15)
    expect(updated.createdAt).toBe(created.createdAt)
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.updatedAt).getTime())
  })
})

describe('deleteRecord', () => {
  it('removes the record and bumps revision', async () => {
    const created = await addRecord({ date: '2026-11-01', part: 'chest', reps: 10 })
    await deleteRecord(created.id)
    expect(await listRecordsByDate('2026-11-01')).toHaveLength(0)
  })
})
