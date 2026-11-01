import { BODY_PARTS, type BodyPart } from '../../domain/types'
import { BODY_PART_CATEGORY_COLORS, BODY_PART_LABELS } from '../../domain/constants'

export function PartSelector({
  selectedPart,
  onSelectPart,
  countsByPart,
}: {
  selectedPart: BodyPart
  onSelectPart: (part: BodyPart) => void
  /** 選択日などの部位別合計（ボタン内の「○回」表示用）。省略時は非表示。 */
  countsByPart?: Record<BodyPart, number>
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="部位を選択">
      {BODY_PARTS.map((part) => {
        const isSelected = part === selectedPart
        const color = BODY_PART_CATEGORY_COLORS[part]
        return (
          <button
            key={part}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectPart(part)}
            className={`flex min-h-11 items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
              isSelected ? 'border-accent bg-blue-50' : 'border-slate-200 bg-white'
            }`}
            style={isSelected ? { borderColor: 'var(--color-accent)' } : undefined}
          >
            <span className="flex items-center gap-2 font-medium text-slate-800">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
              {BODY_PART_LABELS[part]}
            </span>
            {countsByPart !== undefined && (
              <span className="text-sm text-slate-500">{countsByPart[part]}回</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
