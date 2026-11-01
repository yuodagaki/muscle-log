/**
 * 日付はすべて `YYYY-MM-DD` の暦日文字列として扱う。
 * 「今日」の判定には端末のローカル日付（Y/M/D）を使うが、
 * 日数計算そのものはUTC基準の日番号（calendar day number）で行うことで
 * ローカルのDST・タイムゾーンによるミリ秒差分の誤差を避ける。
 * （SPEC.md 7章・REPORT_UI.md 3章の要件に対応）
 */

const DATE_STRING_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export type DateParts = { year: number; month: number; day: number }

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_STRING_RE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return isRealCalendarDate(year, month, day)
}

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false
  if (day < 1) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= daysInMonth
}

export function parseDateString(value: string): DateParts {
  const match = DATE_STRING_RE.exec(value)
  if (!match) throw new Error(`不正な日付文字列です: ${value}`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

export function formatDateParts({ year, month, day }: DateParts): string {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 暦日を一意の整数（UTC基準の日番号）に変換する。DSTの影響を受けない。 */
export function toDayNumber(dateStr: string): number {
  const { year, month, day } = parseDateString(dateStr)
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000)
}

export function fromDayNumber(dayNumber: number): string {
  const ms = dayNumber * 86_400_000
  const d = new Date(ms)
  return formatDateParts({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() })
}

export function addDays(dateStr: string, amount: number): string {
  return fromDayNumber(toDayNumber(dateStr) + amount)
}

/** 2つの暦日の間の日数（終了 - 開始）。両端を含む日数が欲しい場合は+1する。 */
export function dayDiff(startStr: string, endStr: string): number {
  return toDayNumber(endStr) - toDayNumber(startStr)
}

export function daysBetweenInclusive(startStr: string, endStr: string): number {
  return dayDiff(startStr, endStr) + 1
}

export function compareDateStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function isBefore(a: string, b: string): boolean {
  return compareDateStrings(a, b) < 0
}

export function isAfter(a: string, b: string): boolean {
  return compareDateStrings(a, b) > 0
}

export function clampDateRange(start: string, end: string): [string, string] {
  return isAfter(start, end) ? [end, start] : [start, end]
}

/** 端末のローカル暦日（今日）を YYYY-MM-DD で返す。 */
export function todayLocalDateString(now: Date = new Date()): string {
  return formatDateParts({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
}

/** 月曜始まりの週の開始日。 */
export function startOfWeekMonday(dateStr: string): string {
  const { year, month, day } = parseDateString(dateStr)
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay() // 0=Sun..6=Sat
  const offsetFromMonday = (dow + 6) % 7
  return addDays(dateStr, -offsetFromMonday)
}

export function startOfMonth(dateStr: string): string {
  const { year, month } = parseDateString(dateStr)
  return formatDateParts({ year, month, day: 1 })
}

export function startOfYear(dateStr: string): string {
  const { year } = parseDateString(dateStr)
  return formatDateParts({ year, month: 1, day: 1 })
}

export function endOfMonth(dateStr: string): string {
  const { year, month } = parseDateString(dateStr)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return formatDateParts({ year, month, day: lastDay })
}

export function addMonths(dateStr: string, amount: number): string {
  const { year, month, day } = parseDateString(dateStr)
  const totalMonthIndex = (month - 1) + amount
  const newYear = year + Math.floor(totalMonthIndex / 12)
  const newMonth = ((totalMonthIndex % 12) + 12) % 12
  const daysInNewMonth = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate()
  return formatDateParts({ year: newYear, month: newMonth + 1, day: Math.min(day, daysInNewMonth) })
}

export function monthKey(dateStr: string): string {
  const { year, month } = parseDateString(dateStr)
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
}

/** 指定範囲[start, end]（両端含む）内の暦日文字列を昇順で列挙する。 */
export function enumerateDates(start: string, end: string): string[] {
  const [s, e] = clampDateRange(start, end)
  const count = daysBetweenInclusive(s, e)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(addDays(s, i))
  }
  return result
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}
