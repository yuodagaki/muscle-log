import { db } from './db'
import { EMPTY_META } from '../domain/types'
import type { NewRecordInput, RecordEditInput, WorkoutRecord } from '../domain/types'
import { isValidBodyPart, isPositiveSafeInteger } from '../domain/validation'
import { isValidDateString } from '../domain/dateUtils'

export class InvalidRecordInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRecordInputError'
  }
}

function assertValidInput(input: NewRecordInput | RecordEditInput): void {
  if (!isValidDateString(input.date)) {
    throw new InvalidRecordInputError('日付が不正です')
  }
  if (!isValidBodyPart(input.part)) {
    throw new InvalidRecordInputError('部位が不正です')
  }
  if (!isPositiveSafeInteger(input.reps)) {
    throw new InvalidRecordInputError('回数は1以上の整数で入力してください')
  }
}

async function bumpRevision(): Promise<void> {
  const current = (await db.meta.get(1)) ?? EMPTY_META
  await db.meta.put({ ...current, revision: current.revision + 1 })
}

export async function addRecord(input: NewRecordInput): Promise<WorkoutRecord> {
  assertValidInput(input)
  const now = new Date().toISOString()
  const record: WorkoutRecord = {
    id: crypto.randomUUID(),
    date: input.date,
    part: input.part,
    reps: input.reps,
    createdAt: now,
    updatedAt: now,
  }
  await db.transaction('rw', db.records, db.meta, async () => {
    await db.records.add(record)
    await bumpRevision()
  })
  return record
}

export async function updateRecord(id: string, patch: RecordEditInput): Promise<WorkoutRecord> {
  assertValidInput(patch)
  return db.transaction('rw', db.records, db.meta, async () => {
    const existing = await db.records.get(id)
    if (!existing) {
      throw new InvalidRecordInputError('編集対象のレコードが見つかりません')
    }
    const updated: WorkoutRecord = {
      ...existing,
      date: patch.date,
      part: patch.part,
      reps: patch.reps,
      updatedAt: new Date().toISOString(),
    }
    await db.records.put(updated)
    await bumpRevision()
    return updated
  })
}

export async function deleteRecord(id: string): Promise<void> {
  await db.transaction('rw', db.records, db.meta, async () => {
    await db.records.delete(id)
    await bumpRevision()
  })
}

export async function listAllRecords(): Promise<WorkoutRecord[]> {
  return db.records.toArray()
}

export async function listRecordsByDate(date: string): Promise<WorkoutRecord[]> {
  return db.records.where('date').equals(date).toArray()
}
