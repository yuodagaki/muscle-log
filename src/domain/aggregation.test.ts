import { describe, expect, it } from 'vitest'
import {
  AggregationOverflowError,
  averagePerDay,
  dailySeries,
  exerciseRate,
  heatmapIntensities,
  monthlySeries,
  partRatio,
  repsByPart,
  resolvePeriodRange,
  safeSum,
  totalCalendarDays,
  totalReps,
  weeklySeries,
  workoutDayCount,
} from './aggregation'
import type { WorkoutRecord } from './types'

function rec(partial: Partial<WorkoutRecord> & { date: string; part: WorkoutRecord['part']; reps: number }): WorkoutRecord {
  return {
    id: partial.id ?? crypto.randomUUID(),
    date: partial.date,
    part: partial.part,
    reps: partial.reps,
    createdAt: partial.createdAt ?? `${partial.date}T00:00:00.000Z`,
    updatedAt: partial.updatedAt ?? `${partial.date}T00:00:00.000Z`,
  }
}

describe('totalReps / repsByPart', () => {
  it('sums reps across repeated entries for the same part', () => {
    const records = [
      rec({ date: '2026-11-01', part: 'chest', reps: 20 }),
      rec({ date: '2026-11-01', part: 'chest', reps: 30 }),
    ]
    expect(totalReps(records)).toBe(50)
    expect(repsByPart(records).chest).toBe(50)
  })
})

describe('safeSum', () => {
  it('throws when the running total exceeds Number.MAX_SAFE_INTEGER', () => {
    expect(() => safeSum([Number.MAX_SAFE_INTEGER, 1])).toThrow(AggregationOverflowError)
  })
})

describe('averagePerDay (休息日を含む平均)', () => {
  it('matches the spec example: 7 days, 500 reps total, 2 workout days -> ~71.4/day', () => {
    const result = averagePerDay(500, 7)
    expect(Math.round(result * 10) / 10).toBeCloseTo(71.4, 1)
  })

  it('returns 0 when there are no days in the period', () => {
    expect(averagePerDay(0, 0)).toBe(0)
  })
})

describe('exerciseRate', () => {
  it('computes workout days over total calendar days', () => {
    expect(Math.round(exerciseRate(5, 7) * 10) / 10).toBeCloseTo(71.4, 1)
  })

  it('does not divide by zero', () => {
    expect(exerciseRate(0, 0)).toBe(0)
  })
})

describe('partRatio', () => {
  it('returns 0 without NaN/Infinity when grand total is 0', () => {
    expect(partRatio(0, 0)).toBe(0)
    expect(Number.isFinite(partRatio(0, 0))).toBe(true)
  })
})

describe('resolvePeriodRange', () => {
  const records = [
    rec({ date: '2026-10-15', part: 'chest', reps: 10 }),
    rec({ date: '2026-11-01', part: 'legs', reps: 20 }),
  ]

  it('week starts on Monday and ends today', () => {
    const range = resolvePeriodRange('week', records, '2026-11-01')
    expect(range).toEqual({ start: '2026-10-26', end: '2026-11-01' })
  })

  it('month starts on the 1st and ends today', () => {
    const range = resolvePeriodRange('month', records, '2026-11-15')
    expect(range).toEqual({ start: '2026-11-01', end: '2026-11-15' })
  })

  it('year starts on Jan 1 and ends today', () => {
    const range = resolvePeriodRange('year', records, '2026-11-15')
    expect(range).toEqual({ start: '2026-01-01', end: '2026-11-15' })
  })

  it('all spans from the oldest record to today', () => {
    const range = resolvePeriodRange('all', records, '2026-11-15')
    expect(range).toEqual({ start: '2026-10-15', end: '2026-11-15' })
  })

  it('all is null when there are no records', () => {
    expect(resolvePeriodRange('all', [], '2026-11-15')).toBeNull()
  })
})

describe('workoutDayCount / totalCalendarDays', () => {
  it('counts distinct dates regardless of record count per day', () => {
    const records = [
      rec({ date: '2026-11-01', part: 'chest', reps: 10 }),
      rec({ date: '2026-11-01', part: 'legs', reps: 10 }),
      rec({ date: '2026-11-02', part: 'chest', reps: 10 }),
    ]
    expect(workoutDayCount(records)).toBe(2)
  })

  it('counts calendar days inclusive of both ends', () => {
    expect(totalCalendarDays({ start: '2026-11-01', end: '2026-11-07' })).toBe(7)
    expect(totalCalendarDays(null)).toBe(0)
  })
})

describe('dailySeries', () => {
  it('zero-fills days without records', () => {
    const records = [rec({ date: '2026-11-01', part: 'chest', reps: 10 })]
    const series = dailySeries(records, { start: '2026-11-01', end: '2026-11-03' })
    expect(series).toEqual([
      { key: '2026-11-01', label: '2026-11-01', total: 10 },
      { key: '2026-11-02', label: '2026-11-02', total: 0 },
      { key: '2026-11-03', label: '2026-11-03', total: 0 },
    ])
  })
})

describe('weeklySeries', () => {
  it('clips the first and last week to the period boundaries', () => {
    const records = [
      rec({ date: '2026-10-25', part: 'chest', reps: 100 }), // 期間外（前の週・日）
      rec({ date: '2026-10-26', part: 'chest', reps: 5 }), // 期間開始日
      rec({ date: '2026-11-01', part: 'chest', reps: 7 }),
    ]
    const series = weeklySeries(records, { start: '2026-10-26', end: '2026-11-01' })
    expect(series).toEqual([{ key: '2026-10-26', label: '2026-10-26', total: 12 }])
  })
})

describe('monthlySeries', () => {
  it('splits across a month boundary and excludes out-of-range records', () => {
    const records = [
      rec({ date: '2026-10-31', part: 'chest', reps: 3 }),
      rec({ date: '2026-11-01', part: 'chest', reps: 4 }),
      rec({ date: '2026-12-01', part: 'chest', reps: 999 }), // 期間外
    ]
    const series = monthlySeries(records, { start: '2026-10-31', end: '2026-11-01' })
    expect(series).toEqual([
      { key: '2026-10', label: '2026-10', total: 3 },
      { key: '2026-11', label: '2026-11', total: 4 },
    ])
  })
})

describe('heatmapIntensities', () => {
  it('returns all zero when total is zero', () => {
    const intensities = heatmapIntensities({ chest: 0, back: 0, shoulders: 0, arms: 0, abs: 0, legs: 0 })
    expect(Object.values(intensities).every((v) => v === 0)).toBe(true)
  })

  it('scales relative to the max part', () => {
    const intensities = heatmapIntensities({ chest: 10, back: 20, shoulders: 0, arms: 0, abs: 0, legs: 0 })
    expect(intensities.back).toBe(1)
    expect(intensities.chest).toBe(0.5)
  })
})
