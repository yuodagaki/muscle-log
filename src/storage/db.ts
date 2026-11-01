import Dexie, { type EntityTable } from 'dexie'
import type { BackupMetaRow, WorkoutRecord } from '../domain/types'

export class MuscleLogDB extends Dexie {
  records!: EntityTable<WorkoutRecord, 'id'>
  meta!: EntityTable<BackupMetaRow, 'id'>

  constructor() {
    super('muscle-log')
    this.version(1).stores({
      records: 'id, date, part, [date+part]',
      meta: 'id',
    })
  }
}

export const db = new MuscleLogDB()
