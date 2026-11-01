import { addDays, isAfter } from '../../domain/dateUtils'

export function DateSelector({
  selectedDate,
  todayLocalDate,
  onChange,
}: {
  selectedDate: string
  todayLocalDate: string
  onChange: (date: string) => void
}) {
  const nextDate = addDays(selectedDate, 1)
  const isNextDisabled = isAfter(nextDate, todayLocalDate)
  const isToday = selectedDate === todayLocalDate

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="前の日"
        onClick={() => onChange(addDays(selectedDate, -1))}
        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 text-slate-600"
      >
        ‹
      </button>
      <div className="relative flex-1">
        <input
          type="date"
          value={selectedDate}
          max={todayLocalDate}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value)
          }}
          aria-label="記録する日付"
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-center text-sm font-medium text-slate-800"
        />
      </div>
      <button
        type="button"
        aria-label="次の日"
        disabled={isNextDisabled}
        onClick={() => onChange(nextDate)}
        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30"
      >
        ›
      </button>
      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(todayLocalDate)}
          className="shrink-0 rounded-xl border border-slate-200 px-2 text-xs text-slate-500"
        >
          今日
        </button>
      )}
    </div>
  )
}
