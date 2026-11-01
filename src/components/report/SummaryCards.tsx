import { Card } from '../layout/AppShell'
import { formatCount } from '../../domain/format'

export function SummaryCards({
  total,
  workoutDays,
  totalDays,
  averagePerDayRounded,
}: {
  total: number
  workoutDays: number
  totalDays: number
  averagePerDayRounded: number
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="text-center">
        <p className="text-xs text-slate-500">合計回数</p>
        <p className="mt-1 text-xl font-bold text-slate-900">{formatCount(total)}</p>
        <p className="text-xs text-slate-400">回</p>
      </Card>
      <Card className="text-center">
        <p className="text-xs text-slate-500">運動した日数</p>
        <p className="mt-1 text-xl font-bold text-slate-900">
          {workoutDays} / {totalDays}
        </p>
        <p className="text-xs text-slate-400">日</p>
      </Card>
      <Card className="text-center">
        <p className="text-xs text-slate-500">1日あたり平均</p>
        <p className="mt-1 text-xl font-bold text-slate-900">約{formatCount(averagePerDayRounded)}</p>
        <p className="text-xs text-slate-400">回/日</p>
      </Card>
    </div>
  )
}
