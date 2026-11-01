import { BODY_PARTS, type BodyPart } from '../../domain/types'
import { BODY_PART_CATEGORY_COLORS, BODY_PART_LABELS } from '../../domain/constants'
import { formatCount } from '../../domain/format'
import { BodyFigure } from '../body-map/BodyFigure'

export function BodyHeatmapSection({
  partTotals,
  intensities,
  grandTotal,
}: {
  partTotals: Record<BodyPart, number>
  intensities: Record<BodyPart, number>
  grandTotal: number
}) {
  if (grandTotal <= 0) {
    return <p className="text-sm text-slate-400">記録がありません。</p>
  }

  return (
    <div>
      <div className="flex justify-center gap-4">
        <BodyFigure view="front" mode="heatmap" intensities={intensities} title="人体ヒートマップ（正面）" className="h-auto w-32" />
        <BodyFigure view="back" mode="heatmap" intensities={intensities} title="人体ヒートマップ（背面）" className="h-auto w-32" />
      </div>
      <ul className="mt-3 space-y-1.5">
        {BODY_PARTS.map((part) => {
          const value = partTotals[part]
          const ratio = grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0
          return (
            <li key={part} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: BODY_PART_CATEGORY_COLORS[part] }}
                  aria-hidden="true"
                />
                {BODY_PART_LABELS[part]}
              </span>
              <span className="text-slate-500">
                {formatCount(value)}回 ・ {ratio}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
