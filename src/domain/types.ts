export const BODY_PARTS = ['chest', 'back', 'shoulders', 'arms', 'abs', 'legs'] as const

export type BodyPart = (typeof BODY_PARTS)[number]

export type WorkoutRecord = {
  id: string
  /** YYYY-MM-DD。運動した暦日（端末のローカル日付）。 */
  date: string
  part: BodyPart
  /** 1以上の安全な整数。 */
  reps: number
  /** ISO 8601タイムスタンプ（UTC）。 */
  createdAt: string
  /** ISO 8601タイムスタンプ（UTC）。 */
  updatedAt: string
}

export type NewRecordInput = {
  date: string
  part: BodyPart
  reps: number
}

export type RecordEditInput = {
  date: string
  part: BodyPart
  reps: number
}

export type BackupMetaRow = {
  id: 1
  /** 記録の変更ごとに単調増加する管理用リビジョン。 */
  revision: number
  /** 利用者が「保存した」と確認した時点のISO 8601タイムスタンプ。未確認ならnull。 */
  lastBackupConfirmedAt: string | null
  /** 利用者が確認した書き出しスナップショットのリビジョン。未確認ならnull。 */
  lastBackupRevision: number | null
}

export const EMPTY_META: BackupMetaRow = {
  id: 1,
  revision: 0,
  lastBackupConfirmedAt: null,
  lastBackupRevision: null,
}

export type ExportPayload = {
  version: 1
  exportedAt: string
  records: WorkoutRecord[]
}

export type ReportPeriodKey = 'week' | 'month' | 'year' | 'all'

export type ChartGranularity = 'day' | 'week' | 'month'
