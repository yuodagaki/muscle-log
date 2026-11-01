import { useState } from 'react'
import type { BodyPart } from '../../domain/types'
import { BODY_PART_LABELS, MANUAL_ADJUST_STEPS, MIN_REPS, QUICK_ADD_PRESETS } from '../../domain/constants'
import { SaveStatusInline } from '../common/SaveStatusInline'
import type { SaveStatus } from '../../hooks/useRecordActions'

export type InputMode = 'manual' | 'quick'

export function RecordEntryCard({
  selectedPart,
  dateLabel,
  inputMode,
  onChangeMode,
  draftReps,
  onChangeDraftReps,
  onManualSubmit,
  onQuickAdd,
  isSubmitting,
  status,
  errorMessage,
}: {
  selectedPart: BodyPart
  dateLabel: string
  inputMode: InputMode
  onChangeMode: (mode: InputMode) => void
  draftReps: number
  onChangeDraftReps: (reps: number) => void
  onManualSubmit: () => void
  onQuickAdd: (reps: number) => void
  isSubmitting: boolean
  status: SaveStatus
  errorMessage: string | null
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm text-slate-500">
          {dateLabel} ・ <span className="font-semibold text-slate-800">{BODY_PART_LABELS[selectedPart]}</span>
        </p>
      </div>

      <div role="tablist" aria-label="記録モード切替" className="mb-3 flex gap-1 rounded-full bg-slate-100 p-1">
        {(['manual', 'quick'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={inputMode === m}
            onClick={() => onChangeMode(m)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              inputMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            {m === 'manual' ? '入力して記録' : 'ワンタップ'}
          </button>
        ))}
      </div>

      {inputMode === 'manual' ? (
        <ManualEntryForm
          draftReps={draftReps}
          onChangeDraftReps={onChangeDraftReps}
          onSubmit={onManualSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <QuickAddButtons onQuickAdd={onQuickAdd} isSubmitting={isSubmitting} />
      )}

      <SaveStatusInline status={status} errorMessage={errorMessage} />
    </div>
  )
}

function ManualEntryForm({
  draftReps,
  onChangeDraftReps,
  onSubmit,
  isSubmitting,
}: {
  draftReps: number
  onChangeDraftReps: (reps: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const [rawText, setRawText] = useState(String(draftReps))

  const commitText = (text: string) => {
    const parsed = Number(text)
    if (Number.isInteger(parsed) && parsed >= MIN_REPS) {
      onChangeDraftReps(parsed)
    }
  }

  const adjust = (delta: number) => {
    const next = Math.max(MIN_REPS, draftReps + delta)
    onChangeDraftReps(next)
    setRawText(String(next))
  }

  const isValid = Number.isInteger(draftReps) && draftReps >= MIN_REPS

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="回数を1減らす"
          onClick={() => adjust(-1)}
          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-lg font-semibold text-slate-600"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={MIN_REPS}
          step={1}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value)
            commitText(e.target.value)
          }}
          aria-label="回数"
          className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-center text-lg font-semibold text-slate-900"
        />
        <button
          type="button"
          aria-label="回数を1増やす"
          onClick={() => adjust(1)}
          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-lg font-semibold text-slate-600"
        >
          ＋
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {MANUAL_ADJUST_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => adjust(step)}
            className="min-h-9 rounded-full border border-slate-200 px-3 text-sm text-slate-600"
          >
            +{step}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className="mt-3 min-h-11 w-full rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        記録を追加
      </button>
    </div>
  )
}

function QuickAddButtons({
  onQuickAdd,
  isSubmitting,
}: {
  onQuickAdd: (reps: number) => void
  isSubmitting: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {QUICK_ADD_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          disabled={isSubmitting}
          onClick={() => onQuickAdd(preset)}
          className="min-h-14 rounded-xl border border-slate-200 text-lg font-semibold text-slate-800 disabled:opacity-50"
        >
          +{preset}
        </button>
      ))}
    </div>
  )
}
