import type { ReportPeriodKey, WorkoutRecord } from '../../domain/types'
import type { PeriodRange } from '../../domain/aggregation'
import { distinctWorkoutDates } from '../../domain/aggregation'
import {
  addDays,
  daysBetweenInclusive,
  enumerateDates,
  endOfMonth,
  isAfter,
  parseDateString,
  startOfWeekMonday,
} from '../../domain/dateUtils'

type DayStatus = 'workout' | 'rest' | 'future' | 'outside'

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

function DayChip({ date, status }: { date: string; status: DayStatus }) {
  const day = Number(date.split('-')[2])
  const style: Record<DayStatus, string> = {
    workout: 'bg-accent text-white',
    rest: 'bg-slate-100 text-slate-500',
    future: 'border border-dashed border-slate-200 text-slate-300',
    outside: 'text-transparent',
  }
  const label: Record<DayStatus, string> = {
    workout: `${date}は運動日`,
    rest: `${date}は休息日`,
    future: `${date}は未来日`,
    outside: '',
  }
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium ${style[status]}`}
      style={status === 'workout' ? { backgroundColor: 'var(--color-accent)' } : undefined}
      aria-label={label[status]}
      title={label[status]}
    >
      {status === 'outside' ? '' : day}
    </div>
  )
}

export function ContinuityCalendar({
  selectedPeriod,
  range,
  recordsInRange,
  todayLocalDate,
}: {
  selectedPeriod: ReportPeriodKey
  range: PeriodRange
  recordsInRange: WorkoutRecord[]
  todayLocalDate: string
}) {
  if (range === null) {
    return <p className="text-sm text-slate-400">対象期間のデータがありません。</p>
  }

  const workoutDates = distinctWorkoutDates(recordsInRange)

  if (selectedPeriod === 'week') {
    const days = enumerateDates(range.start, addDays(range.start, 6))
    return (
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((date) => (
            <DayChip
              key={date}
              date={date}
              status={isAfter(date, todayLocalDate) ? 'future' : workoutDates.has(date) ? 'workout' : 'rest'}
            />
          ))}
        </div>
      </div>
    )
  }

  if (selectedPeriod === 'month') {
    const monthStart = range.start
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeekMonday(monthStart)
    const calendarEnd = addDays(startOfWeekMonday(monthEnd), 6)
    const days = enumerateDates(calendarStart, calendarEnd)
    return (
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((date) => {
            let status: DayStatus
            if (date < monthStart || date > monthEnd) status = 'outside'
            else if (isAfter(date, todayLocalDate)) status = 'future'
            else status = workoutDates.has(date) ? 'workout' : 'rest'
            return <DayChip key={date} date={date} status={status} />
          })}
        </div>
      </div>
    )
  }

  if (selectedPeriod === 'year') {
    const { month: currentMonth, year } = parseDateString(todayLocalDate)
    const rows = Array.from({ length: currentMonth }, (_, i) => i + 1).map((month) => {
      const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`
      const monthEndFull = endOfMonth(monthStartStr)
      const clippedEnd = month === currentMonth ? todayLocalDate : monthEndFull
      const totalDays = daysBetweenInclusive(monthStartStr, clippedEnd)
      const workoutDayCount = enumerateDates(monthStartStr, clippedEnd).filter((d) => workoutDates.has(d)).length
      return { month, totalDays, workoutDayCount }
    })
    return (
      <ul className="space-y-1 text-sm">
        {rows.map((row) => (
          <li key={row.month} className="flex justify-between text-slate-700">
            <span>{row.month}月</span>
            <span className="text-slate-500">
              {row.workoutDayCount} / {row.totalDays} 日
            </span>
          </li>
        ))}
      </ul>
    )
  }

  // all
  const startYear = parseDateString(range.start).year
  const endYear = parseDateString(range.end).year
  const rows = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map((year) => {
    const yearStart = `${year}-01-01`
    const yearEndFull = `${year}-12-31`
    const start = year === startYear ? range.start : yearStart
    const end = year === endYear ? range.end : yearEndFull
    const totalDays = daysBetweenInclusive(start, end)
    const workoutDayCount = enumerateDates(start, end).filter((d) => workoutDates.has(d)).length
    return { year, totalDays, workoutDayCount }
  })
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((row) => (
        <li key={row.year} className="flex justify-between text-slate-700">
          <span>{row.year}年</span>
          <span className="text-slate-500">
            {row.workoutDayCount} / {row.totalDays} 日
          </span>
        </li>
      ))}
    </ul>
  )
}
