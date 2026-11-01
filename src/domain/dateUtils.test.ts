import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetweenInclusive,
  enumerateDates,
  isValidDateString,
  startOfMonth,
  startOfWeekMonday,
  startOfYear,
  todayLocalDateString,
} from './dateUtils'

describe('isValidDateString', () => {
  it('accepts real calendar dates', () => {
    expect(isValidDateString('2026-11-01')).toBe(true)
    expect(isValidDateString('2024-02-29')).toBe(true) // うるう年
  })

  it('rejects malformed or non-existent dates', () => {
    expect(isValidDateString('2026-13-01')).toBe(false)
    expect(isValidDateString('2026-02-30')).toBe(false)
    expect(isValidDateString('2023-02-29')).toBe(false) // 非うるう年
    expect(isValidDateString('2026/11/01')).toBe(false)
    expect(isValidDateString('')).toBe(false)
    expect(isValidDateString(123)).toBe(false)
  })
})

describe('startOfWeekMonday', () => {
  it('finds Monday for a mid-week date', () => {
    // 2026-11-01は日曜日
    expect(startOfWeekMonday('2026-11-01')).toBe('2026-10-26')
  })

  it('returns same date when already Monday', () => {
    expect(startOfWeekMonday('2026-11-02')).toBe('2026-11-02')
  })

  it('handles month/year boundary', () => {
    // 2026-01-01は木曜日
    expect(startOfWeekMonday('2026-01-01')).toBe('2025-12-29')
  })
})

describe('startOfMonth / startOfYear', () => {
  it('returns first day of month and year', () => {
    expect(startOfMonth('2026-11-15')).toBe('2026-11-01')
    expect(startOfYear('2026-11-15')).toBe('2026-01-01')
  })
})

describe('addDays / daysBetweenInclusive', () => {
  it('crosses month and year boundaries correctly', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('handles leap year boundary', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01')
  })

  it('counts inclusive days', () => {
    expect(daysBetweenInclusive('2026-11-01', '2026-11-07')).toBe(7)
    expect(daysBetweenInclusive('2026-11-01', '2026-11-01')).toBe(1)
  })
})

describe('enumerateDates', () => {
  it('lists every calendar day in range', () => {
    expect(enumerateDates('2026-02-27', '2026-03-01')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ])
  })
})

describe('todayLocalDateString', () => {
  it('formats using local Y/M/D components, not UTC', () => {
    const localDate = new Date(2026, 10, 1, 23, 30) // 2026-11-01 23:30 ローカル時刻
    expect(todayLocalDateString(localDate)).toBe('2026-11-01')
  })
})
