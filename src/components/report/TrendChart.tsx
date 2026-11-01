import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ChartGranularity } from '../../domain/types'
import type { SeriesPoint } from '../../domain/aggregation'

const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  day: '日別',
  week: '週別',
  month: '月別',
}

function formatPointLabel(point: SeriesPoint, granularity: ChartGranularity): string {
  if (granularity === 'month') {
    const [y, m] = point.key.split('-')
    return `${y}/${m}`
  }
  const [, m, d] = point.key.split('-')
  return `${m}/${d}`
}

export function TrendChart({
  granularity,
  onChangeGranularity,
  series,
}: {
  granularity: ChartGranularity
  onChangeGranularity: (g: ChartGranularity) => void
  series: SeriesPoint[]
}) {
  const data = series.map((point) => ({ label: formatPointLabel(point, granularity), total: point.total }))
  const isScrollable = data.length > 14

  return (
    <div>
      <div role="tablist" aria-label="推移の単位切替" className="mb-3 flex gap-1 rounded-full bg-slate-100 p-1">
        {(['day', 'week', 'month'] as const).map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={granularity === g}
            onClick={() => onChangeGranularity(g)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              granularity === g ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            {GRANULARITY_LABELS[g]}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-400">対象期間のデータがありません。</p>
      ) : (
        <div style={{ width: isScrollable ? Math.max(data.length * 36, 320) : '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={isScrollable ? Math.floor(data.length / 8) : 0} />
              <YAxis hide />
              <Tooltip formatter={(value) => [`${value}回`, '合計']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#2563eb" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {isScrollable && <p className="mt-1 text-xs text-slate-400">横にスクロールできます。</p>}
    </div>
  )
}
