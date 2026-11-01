import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/AppDataContext'
import { todayLocalDateString } from '../domain/dateUtils'
import {
  exerciseRate,
  filterRecordsInRange,
  heatmapIntensities,
  repsByPart,
  resolvePeriodRange,
  seriesForGranularity,
  totalCalendarDays,
  totalReps,
  workoutDayCount,
  averagePerDay,
} from '../domain/aggregation'
import { roundToInt, roundToOneDecimal } from '../domain/format'
import type { ChartGranularity, ReportPeriodKey } from '../domain/types'
import { Card, SectionTitle } from '../components/layout/AppShell'
import { PeriodSwitcher } from '../components/report/PeriodSwitcher'
import { SummaryCards } from '../components/report/SummaryCards'
import { BodyHeatmapSection } from '../components/report/BodyHeatmapSection'
import { TrendChart } from '../components/report/TrendChart'
import { PartBarChart } from '../components/report/PartBarChart'
import { ContinuityCalendar } from '../components/report/ContinuityCalendar'

export function ReportPage() {
  const { records, loading, error } = useAppData()
  const todayLocalDate = useMemo(() => todayLocalDateString(), [])

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriodKey>('week')
  const [granularity, setGranularity] = useState<ChartGranularity>('day')

  const range = useMemo(() => resolvePeriodRange(selectedPeriod, records, todayLocalDate), [records, selectedPeriod, todayLocalDate])
  const recordsInRange = useMemo(() => filterRecordsInRange(records, range), [records, range])

  const total = totalReps(recordsInRange)
  const totalDays = totalCalendarDays(range)
  const workoutDays = workoutDayCount(recordsInRange)
  const average = averagePerDay(total, totalDays)
  const rate = exerciseRate(workoutDays, totalDays)
  const partTotals = useMemo(() => repsByPart(recordsInRange), [recordsInRange])
  const intensities = useMemo(() => heatmapIntensities(partTotals), [partTotals])
  const series = useMemo(() => seriesForGranularity(records, range, granularity), [records, range, granularity])

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-lg font-bold text-slate-900">Muscle Log</h1>
        <p className="text-sm text-slate-500">レポート</p>
      </header>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">データの読み込みに失敗しました。再読み込みしてください。</p>
        </Card>
      )}

      <Card>
        <PeriodSwitcher selected={selectedPeriod} onChange={setSelectedPeriod} range={range} />
      </Card>

      {loading ? (
        <Card>
          <p className="text-sm text-slate-400">読み込み中…</p>
        </Card>
      ) : (
        <>
          <SummaryCards
            total={total}
            workoutDays={workoutDays}
            totalDays={totalDays}
            averagePerDayRounded={roundToInt(average)}
          />

          <Card>
            <p className="text-sm text-slate-600">
              運動実施率: <span className="font-semibold text-slate-900">{roundToOneDecimal(rate)}%</span>
            </p>
          </Card>

          <Card>
            <SectionTitle>部位のバランス</SectionTitle>
            <BodyHeatmapSection partTotals={partTotals} intensities={intensities} grandTotal={total} />
          </Card>

          <Card>
            <SectionTitle>推移</SectionTitle>
            <TrendChart granularity={granularity} onChangeGranularity={setGranularity} series={series} />
          </Card>

          <Card>
            <SectionTitle>部位別累計</SectionTitle>
            <PartBarChart partTotals={partTotals} />
          </Card>

          <Card>
            <SectionTitle>継続状況</SectionTitle>
            <ContinuityCalendar
              selectedPeriod={selectedPeriod}
              range={range}
              recordsInRange={recordsInRange}
              todayLocalDate={todayLocalDate}
            />
          </Card>
        </>
      )}
    </div>
  )
}
