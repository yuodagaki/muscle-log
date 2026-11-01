import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/AppDataContext'
import { useRecordActions } from '../hooks/useRecordActions'
import { todayLocalDateString, startOfMonth, isAfter, isBefore } from '../domain/dateUtils'
import { totalReps, repsByPart } from '../domain/aggregation'
import { formatCount, formatDateTimeLocal } from '../domain/format'
import { hasUnbackedChanges } from '../storage/metaRepo'
import { DEFAULT_DRAFT_REPS } from '../domain/constants'
import type { BodyPart } from '../domain/types'
import { Card, SectionTitle } from '../components/layout/AppShell'
import { DateSelector } from '../components/layout/DateSelector'
import { BodyMapSelector } from '../components/body-map/BodyMapSelector'
import { PartSelector } from '../components/body-map/PartSelector'
import { RecordEntryCard, type InputMode } from '../components/record-entry/RecordEntryCard'
import { HistoryList } from '../components/record-entry/HistoryList'
import type { Tab } from '../components/layout/BottomNav'

export function HomePage({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { records, meta, loading, error } = useAppData()
  const actions = useRecordActions()

  const todayLocalDate = useMemo(() => todayLocalDateString(), [])
  const [selectedDate, setSelectedDate] = useState(todayLocalDate)
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front')
  const [selectedPart, setSelectedPart] = useState<BodyPart>('chest')
  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [draftReps, setDraftReps] = useState(DEFAULT_DRAFT_REPS)

  const recordsForSelectedDate = useMemo(
    () => records.filter((r) => r.date === selectedDate),
    [records, selectedDate],
  )
  const selectedDateTotal = totalReps(recordsForSelectedDate)
  const countsByPart = useMemo(() => repsByPart(recordsForSelectedDate), [recordsForSelectedDate])

  const monthStart = startOfMonth(todayLocalDate)
  const monthTotal = useMemo(
    () =>
      totalReps(
        records.filter((r) => !isBefore(r.date, monthStart) && !isAfter(r.date, todayLocalDate)),
      ),
    [records, monthStart, todayLocalDate],
  )

  const isPastSelection = selectedDate !== todayLocalDate
  const dateLabel = isPastSelection ? `${selectedDate}（選択日）` : '今日'

  const handleManualSubmit = async () => {
    const ok = await actions.add({ date: selectedDate, part: selectedPart, reps: draftReps })
    if (ok) setDraftReps(DEFAULT_DRAFT_REPS)
  }

  const handleQuickAdd = (reps: number) => {
    void actions.add({ date: selectedDate, part: selectedPart, reps })
  }

  const unbacked = hasUnbackedChanges(meta)

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-lg font-bold text-slate-900">Muscle Log</h1>
        <div className="mt-2">
          <DateSelector selectedDate={selectedDate} todayLocalDate={todayLocalDate} onChange={setSelectedDate} />
        </div>
      </header>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">データの読み込みに失敗しました。再読み込みしてください。</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-slate-500">{dateLabel}の合計</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCount(selectedDateTotal)}回</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">今月の合計</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCount(monthTotal)}回</p>
        </Card>
      </div>

      <Card>
        <SectionTitle>部位を選ぶ</SectionTitle>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="sm:w-1/2">
            <BodyMapSelector
              view={bodyView}
              onToggleView={setBodyView}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
            />
          </div>
          <div className="sm:w-1/2">
            <PartSelector selectedPart={selectedPart} onSelectPart={setSelectedPart} countsByPart={countsByPart} />
          </div>
        </div>
      </Card>

      <RecordEntryCard
        selectedPart={selectedPart}
        dateLabel={dateLabel}
        inputMode={inputMode}
        onChangeMode={setInputMode}
        draftReps={draftReps}
        onChangeDraftReps={setDraftReps}
        onManualSubmit={handleManualSubmit}
        onQuickAdd={handleQuickAdd}
        isSubmitting={actions.isSubmitting}
        status={actions.status}
        errorMessage={actions.errorMessage}
      />

      <Card>
        <SectionTitle>{dateLabel}の履歴</SectionTitle>
        <HistoryList
          records={recordsForSelectedDate}
          onEdit={(id, patch) => actions.edit(id, patch)}
          onDelete={(id) => actions.remove(id)}
          isSubmitting={actions.isSubmitting}
          todayLocalDate={todayLocalDate}
        />
      </Card>

      <Card>
        <SectionTitle>保存・バックアップ状態</SectionTitle>
        <p className="text-sm text-slate-700">
          {loading ? '読み込み中…' : error ? '端末内データの読み込みに失敗しました' : '端末内に保存済み'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          最終バックアップ確認:{' '}
          {meta.lastBackupConfirmedAt ? formatDateTimeLocal(meta.lastBackupConfirmedAt) : '未作成'}
        </p>
        {unbacked && <p className="mt-1 text-sm text-amber-600">バックアップ後に記録が変更されています。</p>}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="mt-3 text-sm font-medium"
          style={{ color: 'var(--color-accent)' }}
        >
          設定でJSONバックアップを管理する →
        </button>
      </Card>
    </div>
  )
}
