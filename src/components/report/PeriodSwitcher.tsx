import type { ReportPeriodKey } from '../../domain/types'
import { REPORT_PERIOD_LABELS } from '../../domain/constants'
import type { PeriodRange } from '../../domain/aggregation'

const PERIODS: ReportPeriodKey[] = ['week', 'month', 'year', 'all']

export function PeriodSwitcher({
  selected,
  onChange,
  range,
}: {
  selected: ReportPeriodKey
  onChange: (period: ReportPeriodKey) => void
  range: PeriodRange
}) {
  return (
    <div>
      <div role="tablist" aria-label="集計期間切替" className="flex gap-1 rounded-full bg-slate-100 p-1">
        {PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            role="tab"
            aria-selected={selected === period}
            onClick={() => onChange(period)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              selected === period ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            {REPORT_PERIOD_LABELS[period]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {range ? `対象期間: ${range.start} 〜 ${range.end}` : '対象期間なし（記録がありません）'}
      </p>
    </div>
  )
}
