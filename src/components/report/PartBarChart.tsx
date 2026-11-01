import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BODY_PARTS, type BodyPart } from '../../domain/types'
import { BODY_PART_CATEGORY_COLORS, BODY_PART_LABELS } from '../../domain/constants'

export function PartBarChart({ partTotals }: { partTotals: Record<BodyPart, number> }) {
  const data = BODY_PARTS.map((part) => ({
    part,
    label: BODY_PART_LABELS[part],
    value: partTotals[part],
  }))

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={40} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value}回`, '回数']} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.part} fill={BODY_PART_CATEGORY_COLORS[entry.part]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
