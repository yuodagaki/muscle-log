import { useState } from 'react'
import { BODY_PARTS, type BodyPart, type WorkoutRecord } from '../../domain/types'
import { BODY_PART_LABELS, MIN_REPS } from '../../domain/constants'
import { formatTimeLocal } from '../../domain/format'
import { ConfirmDialog } from '../common/ConfirmDialog'

export function HistoryList({
  records,
  onEdit,
  onDelete,
  isSubmitting,
  todayLocalDate,
}: {
  records: WorkoutRecord[]
  onEdit: (id: string, patch: { date: string; part: BodyPart; reps: number }) => void
  onDelete: (id: string) => void
  isSubmitting: boolean
  todayLocalDate: string
}) {
  const sorted = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (sorted.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">この日の記録はまだありません。</p>
  }

  return (
    <ul className="space-y-2">
      {sorted.map((record) => (
        <HistoryItem
          key={record.id}
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
          isSubmitting={isSubmitting}
          todayLocalDate={todayLocalDate}
        />
      ))}
    </ul>
  )
}

function HistoryItem({
  record,
  onEdit,
  onDelete,
  isSubmitting,
  todayLocalDate,
}: {
  record: WorkoutRecord
  onEdit: (id: string, patch: { date: string; part: BodyPart; reps: number }) => void
  onDelete: (id: string) => void
  isSubmitting: boolean
  todayLocalDate: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [draftDate, setDraftDate] = useState(record.date)
  const [draftPart, setDraftPart] = useState<BodyPart>(record.part)
  const [draftReps, setDraftReps] = useState(String(record.reps))
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const openEdit = () => {
    setDraftDate(record.date)
    setDraftPart(record.part)
    setDraftReps(String(record.reps))
    setExpanded(true)
  }

  const repsNumber = Number(draftReps)
  const isValid = Number.isInteger(repsNumber) && repsNumber >= MIN_REPS && draftDate.length > 0 && draftDate <= todayLocalDate

  const handleSave = () => {
    if (!isValid) return
    onEdit(record.id, { date: draftDate, part: draftPart, reps: repsNumber })
    setExpanded(false)
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => (expanded ? setExpanded(false) : openEdit())}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span>
          <span className="font-semibold text-slate-800">{BODY_PART_LABELS[record.part]}</span>
          <span className="ml-2 text-slate-600">{record.reps}回</span>
        </span>
        <span className="text-xs text-slate-400">{formatTimeLocal(record.createdAt)} 記録</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-3">
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-slate-500">
              日付
              <input
                type="date"
                value={draftDate}
                max={todayLocalDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
              />
            </label>
            <label className="flex-1 text-xs text-slate-500">
              部位
              <select
                value={draftPart}
                onChange={(e) => setDraftPart(e.target.value as BodyPart)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
              >
                {BODY_PARTS.map((part) => (
                  <option key={part} value={part}>
                    {BODY_PART_LABELS[part]}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-20 text-xs text-slate-500">
              回数
              <input
                type="number"
                inputMode="numeric"
                min={MIN_REPS}
                value={draftReps}
                onChange={(e) => setDraftReps(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={isSubmitting}
              className="min-h-10 flex-1 rounded-lg border border-red-200 text-sm font-medium text-red-600 disabled:opacity-50"
            >
              削除
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isSubmitting}
              className="min-h-10 flex-1 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              保存
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="この記録を削除しますか？"
        description={
          <>
            {record.date} ・ {BODY_PART_LABELS[record.part]} ・ {record.reps}回
            <br />
            削除すると元に戻せません。
          </>
        }
        confirmLabel="削除する"
        destructive
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false)
          setExpanded(false)
          onDelete(record.id)
        }}
      />
    </li>
  )
}
