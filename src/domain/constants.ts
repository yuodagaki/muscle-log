import type { BodyPart, ReportPeriodKey } from './types'

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: '胸',
  back: '背中',
  shoulders: '肩',
  arms: '腕',
  abs: '腹',
  legs: '脚',
}

/** 選択UI用のカテゴリカラー（BODY_UI.md準拠）。ヒートマップとは別モード。 */
export const BODY_PART_CATEGORY_COLORS: Record<BodyPart, string> = {
  chest: '#F38A85',
  back: '#709BE9',
  shoulders: '#FFC17D',
  arms: '#76B9ED',
  abs: '#89C98A',
  legs: '#B49CE9',
}

/** ワンタップ記録の基本プリセット（SPEC.md 2.2 確定値）。 */
export const QUICK_ADD_PRESETS = [5, 10, 20] as const

/** 手入力モードの入力補助ステップ（SPEC.md 2.2 確定値）。 */
export const MANUAL_ADJUST_STEPS = [1, 5, 10, 20] as const

/** 手入力欄の初期値（暫定、HOME_UI.md）。 */
export const DEFAULT_DRAFT_REPS = 20

export const MIN_REPS = 1

export const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const EXPORT_SCHEMA_VERSION = 1 as const

export const REPORT_PERIOD_LABELS: Record<ReportPeriodKey, string> = {
  week: '今週',
  month: '今月',
  year: '今年',
  all: '全期間',
}
