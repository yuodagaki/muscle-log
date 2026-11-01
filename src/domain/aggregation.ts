import { BODY_PARTS, type BodyPart, type ChartGranularity, type ReportPeriodKey, type WorkoutRecord } from './types'
import {
  addDays,
  compareDateStrings,
  daysBetweenInclusive,
  enumerateDates,
  isAfter,
  isBefore,
  monthKey,
  startOfMonth,
  startOfWeekMonday,
  startOfYear,
} from './dateUtils'

export class AggregationOverflowError extends Error {
  constructor() {
    super('累計値が安全な整数の範囲を超えました')
    this.name = 'AggregationOverflowError'
  }
}

/** オーバーフローを検出しながら安全に合計する。 */
export function safeSum(values: number[]): number {
  let total = 0
  for (const value of values) {
    total += value
    if (!Number.isSafeInteger(total)) {
      throw new AggregationOverflowError()
    }
  }
  return total
}

export type PeriodRange = { start: string; end: string } | null

/**
 * 集計期間の[開始日, 終了日]（両端含む）を求める。
 * 進行中の期間は開始日〜今日まで。全期間は最古の記録日〜今日まで。
 * 記録が0件の「全期間」はnull（対象期間なし）。
 */
export function resolvePeriodRange(period: ReportPeriodKey, records: WorkoutRecord[], today: string): PeriodRange {
  switch (period) {
    case 'week':
      return { start: startOfWeekMonday(today), end: today }
    case 'month':
      return { start: startOfMonth(today), end: today }
    case 'year':
      return { start: startOfYear(today), end: today }
    case 'all': {
      if (records.length === 0) return null
      let oldest = records[0].date
      for (const r of records) {
        if (isBefore(r.date, oldest)) oldest = r.date
      }
      return { start: oldest, end: today }
    }
  }
}

export function filterRecordsInRange(records: WorkoutRecord[], range: PeriodRange): WorkoutRecord[] {
  if (range === null) return []
  return records.filter((r) => !isBefore(r.date, range.start) && !isAfter(r.date, range.end))
}

export function totalReps(records: WorkoutRecord[]): number {
  return safeSum(records.map((r) => r.reps))
}

export function repsByPart(records: WorkoutRecord[]): Record<BodyPart, number> {
  const result: Record<BodyPart, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, abs: 0, legs: 0 }
  for (const part of BODY_PARTS) {
    result[part] = safeSum(records.filter((r) => r.part === part).map((r) => r.reps))
  }
  return result
}

export function distinctWorkoutDates(records: WorkoutRecord[]): Set<string> {
  return new Set(records.map((r) => r.date))
}

export function workoutDayCount(records: WorkoutRecord[]): number {
  return distinctWorkoutDates(records).size
}

export function totalCalendarDays(range: PeriodRange): number {
  if (range === null) return 0
  return daysBetweenInclusive(range.start, range.end)
}

/** 1日あたり平均（休息日を含む全暦日数で割る）。四捨五入前の値を返す。表示側で丸める。 */
export function averagePerDay(total: number, totalDays: number): number {
  if (totalDays <= 0) return 0
  return total / totalDays
}

/** 運動実施率（%）。四捨五入前の値を返す。表示側で丸める。 */
export function exerciseRate(workoutDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0
  return (workoutDays / totalDays) * 100
}

/** 部位別比率（%）。全体0の場合は全部位0を返す。 */
export function partRatio(partTotal: number, grandTotal: number): number {
  if (grandTotal <= 0) return 0
  return (partTotal / grandTotal) * 100
}

export type SeriesPoint = { key: string; label: string; total: number }

/** 日別推移: 範囲内の各暦日を0埋めで列挙する。 */
export function dailySeries(records: WorkoutRecord[], range: PeriodRange): SeriesPoint[] {
  if (range === null) return []
  const totalsByDate = new Map<string, number>()
  for (const r of records) {
    totalsByDate.set(r.date, (totalsByDate.get(r.date) ?? 0) + r.reps)
  }
  return enumerateDates(range.start, range.end).map((date) => ({
    key: date,
    label: date,
    total: totalsByDate.get(date) ?? 0,
  }))
}

/** 週別推移: 月曜始まりの週ごとに合計。期間の先頭・末尾の週は期間内部分だけを集計する。 */
export function weeklySeries(records: WorkoutRecord[], range: PeriodRange): SeriesPoint[] {
  if (range === null) return []
  const inRange = filterRecordsInRange(records, range)
  const totalsByWeekStart = new Map<string, number>()
  for (const r of inRange) {
    const weekStart = startOfWeekMonday(r.date)
    totalsByWeekStart.set(weekStart, (totalsByWeekStart.get(weekStart) ?? 0) + r.reps)
  }

  const points: SeriesPoint[] = []
  let cursor = startOfWeekMonday(range.start)
  const lastWeekStart = startOfWeekMonday(range.end)
  while (!isAfter(cursor, lastWeekStart)) {
    points.push({ key: cursor, label: cursor, total: totalsByWeekStart.get(cursor) ?? 0 })
    cursor = addDays(cursor, 7)
  }
  return points
}

/** 月別推移: 暦月ごとに合計。期間の先頭・末尾の月は期間内部分だけを集計する。 */
export function monthlySeries(records: WorkoutRecord[], range: PeriodRange): SeriesPoint[] {
  if (range === null) return []
  const inRange = filterRecordsInRange(records, range)
  const totalsByMonth = new Map<string, number>()
  for (const r of inRange) {
    const key = monthKey(r.date)
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + r.reps)
  }

  const points: SeriesPoint[] = []
  let cursor = startOfMonth(range.start)
  const lastMonthStart = startOfMonth(range.end)
  while (compareDateStrings(cursor, lastMonthStart) <= 0) {
    const key = monthKey(cursor)
    points.push({ key, label: key, total: totalsByMonth.get(key) ?? 0 })
    const [y, m] = key.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
    cursor = `${nextMonth}-01`
  }
  return points
}

export function seriesForGranularity(
  records: WorkoutRecord[],
  range: PeriodRange,
  granularity: ChartGranularity,
): SeriesPoint[] {
  switch (granularity) {
    case 'day':
      return dailySeries(records, range)
    case 'week':
      return weeklySeries(records, range)
    case 'month':
      return monthlySeries(records, range)
  }
}

/** ヒートマップの強度(0..1)。全体0なら全部位0。 */
export function heatmapIntensities(partTotals: Record<BodyPart, number>): Record<BodyPart, number> {
  const max = Math.max(...BODY_PARTS.map((p) => partTotals[p]))
  const result: Record<BodyPart, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, abs: 0, legs: 0 }
  if (max <= 0) return result
  for (const part of BODY_PARTS) {
    result[part] = partTotals[part] / max
  }
  return result
}
