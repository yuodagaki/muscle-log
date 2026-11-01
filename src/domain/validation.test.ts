import { describe, expect, it } from 'vitest'
import { isPositiveSafeInteger, isValidBodyPart, validateImportPayload, validateWorkoutRecordShape } from './validation'

function validRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    date: '2026-11-01',
    part: 'chest',
    reps: 20,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('isPositiveSafeInteger', () => {
  it('rejects zero, negative, decimal and unsafe values', () => {
    expect(isPositiveSafeInteger(0)).toBe(false)
    expect(isPositiveSafeInteger(-1)).toBe(false)
    expect(isPositiveSafeInteger(1.5)).toBe(false)
    expect(isPositiveSafeInteger(Number.MAX_SAFE_INTEGER + 10)).toBe(false)
  })

  it('accepts positive integers', () => {
    expect(isPositiveSafeInteger(1)).toBe(true)
    expect(isPositiveSafeInteger(20)).toBe(true)
  })
})

describe('isValidBodyPart', () => {
  it('accepts only the 6 known codes', () => {
    expect(isValidBodyPart('chest')).toBe(true)
    expect(isValidBodyPart('biceps')).toBe(false)
  })
})

describe('validateWorkoutRecordShape', () => {
  it('passes a well-formed record', () => {
    expect(validateWorkoutRecordShape(validRecord())).toEqual([])
  })

  it('flags invalid date, part, reps, and timestamps', () => {
    const errors = validateWorkoutRecordShape(
      validRecord({ date: '2026-02-30', part: 'biceps', reps: 0, createdAt: 'not-a-date' }),
    )
    const paths = errors.map((e) => e.path)
    expect(paths).toContain('record.date')
    expect(paths).toContain('record.part')
    expect(paths).toContain('record.reps')
    expect(paths).toContain('record.createdAt')
  })
})

describe('validateImportPayload', () => {
  it('accepts a valid export payload', () => {
    const result = validateImportPayload({
      version: 1,
      exportedAt: '2026-11-01T00:00:00.000Z',
      records: [validRecord({ id: 'a1' }), validRecord({ id: 'a2' })],
    })
    expect(result.ok).toBe(true)
  })

  it('rejects unsupported versions', () => {
    const result = validateImportPayload({ version: 2, exportedAt: '2026-11-01T00:00:00.000Z', records: [] })
    expect(result.ok).toBe(false)
  })

  it('rejects duplicate record IDs', () => {
    const result = validateImportPayload({
      version: 1,
      exportedAt: '2026-11-01T00:00:00.000Z',
      records: [validRecord({ id: 'dup' }), validRecord({ id: 'dup' })],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes('重複'))).toBe(true)
    }
  })

  it('rejects malformed JSON shapes entirely rather than partially importing', () => {
    const result = validateImportPayload({
      version: 1,
      exportedAt: '2026-11-01T00:00:00.000Z',
      records: [validRecord({ id: 'ok' }), validRecord({ id: 'bad', reps: -5 })],
    })
    expect(result.ok).toBe(false)
  })

  it('rejects a non-object root', () => {
    expect(validateImportPayload(null).ok).toBe(false)
    expect(validateImportPayload('oops').ok).toBe(false)
  })
})
