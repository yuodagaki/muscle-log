import type { BodyPart } from '../../domain/types'
import { BodyFigure } from './BodyFigure'

export function BodyMapSelector({
  view,
  onToggleView,
  selectedPart,
  onSelectPart,
}: {
  view: 'front' | 'back'
  onToggleView: (view: 'front' | 'back') => void
  selectedPart: BodyPart
  onSelectPart: (part: BodyPart) => void
}) {
  return (
    <div>
      <div role="tablist" aria-label="正面・背面切替" className="mb-2 flex gap-1 rounded-full bg-slate-100 p-1">
        {(['front', 'back'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => onToggleView(v)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            {v === 'front' ? '正面' : '背面'}
          </button>
        ))}
      </div>
      <BodyFigure
        view={view}
        mode="select"
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        title={`人体図（${view === 'front' ? '正面' : '背面'}）部位選択`}
        className="mx-auto h-auto w-full max-w-[220px]"
      />
    </div>
  )
}
