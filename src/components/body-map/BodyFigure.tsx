import type { BodyPart } from '../../domain/types'
import { BODY_PART_CATEGORY_COLORS } from '../../domain/constants'
import { BACK_REGIONS, BODY_SILHOUETTE_PATH, BODY_VIEW_BOX, FRONT_REGIONS } from './bodyPaths'
import { heatmapColor } from './bodyColors'

type SelectModeProps = {
  mode: 'select'
  selectedPart: BodyPart
  onSelectPart: (part: BodyPart) => void
  intensities?: undefined
}

type HeatmapModeProps = {
  mode: 'heatmap'
  intensities: Record<BodyPart, number>
  selectedPart?: undefined
  onSelectPart?: undefined
}

export type BodyFigureProps = (SelectModeProps | HeatmapModeProps) & {
  view: 'front' | 'back'
  className?: string
  title: string
}

export function BodyFigure(props: BodyFigureProps) {
  const { view, className, title } = props
  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS

  return (
    <svg
      viewBox={BODY_VIEW_BOX}
      role="img"
      aria-label={title}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <path d={BODY_SILHOUETTE_PATH} fill="#F3F5F7" stroke="#35414C" strokeWidth={2.8} strokeLinejoin="round" />
      {regions.map((region) => {
        const baseColor = BODY_PART_CATEGORY_COLORS[region.part]
        const isSelect = props.mode === 'select'
        const isSelected = isSelect && props.selectedPart === region.part
        const fill = isSelect ? baseColor : heatmapColor(baseColor, props.intensities[region.part])
        const opacity = isSelect && !isSelected ? 0.55 : 1

        const handleActivate = () => {
          if (isSelect) props.onSelectPart(region.part)
        }

        return (
          <g
            key={region.part}
            role={isSelect ? 'button' : undefined}
            tabIndex={isSelect ? 0 : undefined}
            aria-label={region.label}
            aria-pressed={isSelect ? isSelected : undefined}
            onClick={isSelect ? handleActivate : undefined}
            onKeyDown={
              isSelect
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleActivate()
                    }
                  }
                : undefined
            }
            style={{ cursor: isSelect ? 'pointer' : 'default', outline: 'none' }}
          >
            {region.paths.map((d, index) => (
              <path
                key={index}
                d={d}
                fill={fill}
                opacity={opacity}
                stroke={isSelected ? '#17212b' : '#ffffff'}
                strokeWidth={isSelected ? 3.5 : 2.3}
                strokeLinejoin="round"
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
