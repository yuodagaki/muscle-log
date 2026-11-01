import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MuscleLogDB } from './db'
import { db } from './db'
import { addRecord } from './recordsRepo'

beforeEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

afterEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

describe('persistence across reconnects (reload相当)', () => {
  it('keeps records visible to a newly opened connection to the same database', async () => {
    await addRecord({ date: '2026-11-01', part: 'chest', reps: 20 })

    // ページ再読み込みに相当: 同名のIndexedDBへ新しい接続を張る。
    const reopened = new MuscleLogDB()
    const records = await reopened.records.toArray()
    reopened.close()

    expect(records).toHaveLength(1)
    expect(records[0].part).toBe('chest')
    expect(records[0].reps).toBe(20)
  })
})
