import { useEffect, useRef, useState } from 'react'
import type { BodyPart } from '../../domain/types'
import { loadAnatomySvg } from './anatomySvg'

/**
 * 背景イラストは各部位が元々カテゴリカラーで塗られているため、
 * ヒートマップは「中立グレーのヴェールをどれだけ薄くするか」で回数を表す。
 * 0回は厚いヴェールでほぼ中立色、最大回数はヴェールがほぼ消えて元の色が鮮やかに見える。
 */
const HEATMAP_NEUTRAL_VEIL = '#CBD5E1'
const HEATMAP_MAX_VEIL_OPACITY = 0.85

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

/**
 * muscle-log-handoff/muscle-log-body-ui/anatomy-front.svg / anatomy-back.svg を
 * 取得してインライン表示する。各SVGは背景の人体イラスト(PNG埋め込み)の上に、
 * 部位ごとの透明な当たり判定パス(class="muscle-region", data-muscle="<part>")が
 * 重なった構造になっている。ここではそのパスへイベント・スタイルを後付けする。
 */
export function BodyFigure(props: BodyFigureProps) {
  const { view, className, title, mode } = props
  const onSelectPart = mode === 'select' ? props.onSelectPart : undefined
  const selectedPart = mode === 'select' ? props.selectedPart : undefined
  const intensities = mode === 'heatmap' ? props.intensities : undefined

  const containerRef = useRef<HTMLDivElement>(null)
  const [markup, setMarkup] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMarkup(null)
    setLoadError(false)
    loadAnatomySvg(view)
      .then((svg) => {
        if (!cancelled) setMarkup(svg)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [view])

  // マークアップ注入直後の後処理: 重複IDの除去、ルートsvgのrole調整。
  useEffect(() => {
    if (!markup) return
    const root = containerRef.current
    if (!root) return
    const svgEl = root.querySelector('svg')
    if (!svgEl) return

    // 同じページ内で正面・背面を同時に表示する場合にid重複を避ける。
    // data-muscle属性とclassだけで部位を識別するため、idは不要。
    svgEl.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))

    if (mode === 'select') {
      // 内部のボタン群を読み上げ・フォーカス対象にするため、ルート側のrole="img"を外す。
      svgEl.removeAttribute('role')
      svgEl.removeAttribute('aria-label')
    } else {
      svgEl.setAttribute('role', 'img')
      svgEl.setAttribute('aria-label', title)
      svgEl.querySelectorAll<SVGElement>('.muscle-region').forEach((el) => {
        el.removeAttribute('tabindex')
        el.removeAttribute('role')
        el.removeAttribute('aria-label')
      })
    }
  }, [markup, mode, title])

  // クリック/キーボードのイベント接続(selectモードのみ)。
  useEffect(() => {
    if (!markup || mode !== 'select' || !onSelectPart) return
    const root = containerRef.current
    if (!root) return

    const cleanups: Array<() => void> = []
    root.querySelectorAll<SVGElement>('.muscle-region').forEach((el) => {
      const part = el.dataset.muscle as BodyPart
      const activate = () => onSelectPart(part)
      const onClick = () => activate()
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate()
        }
      }
      el.addEventListener('click', onClick)
      el.addEventListener('keydown', onKeyDown)
      cleanups.push(() => {
        el.removeEventListener('click', onClick)
        el.removeEventListener('keydown', onKeyDown)
      })
    })
    return () => cleanups.forEach((fn) => fn())
  }, [markup, mode, onSelectPart])

  // 選択状態・ヒートマップ配色の反映。
  useEffect(() => {
    if (!markup) return
    const root = containerRef.current
    if (!root) return

    root.querySelectorAll<SVGElement>('.muscle-region').forEach((el) => {
      const part = el.dataset.muscle as BodyPart
      if (mode === 'select') {
        const isSelected = part === selectedPart
        el.classList.toggle('is-selected', isSelected)
        el.setAttribute('aria-pressed', String(isSelected))
        el.style.fill = ''
        el.style.fillOpacity = ''
        el.style.stroke = ''
        el.style.strokeOpacity = ''
      } else if (intensities) {
        const intensity = Math.min(1, Math.max(0, intensities[part] ?? 0))
        el.classList.remove('is-selected')
        el.style.fill = HEATMAP_NEUTRAL_VEIL
        el.style.fillOpacity = String((1 - intensity) * HEATMAP_MAX_VEIL_OPACITY)
        el.style.stroke = 'none'
      }
    })
  }, [markup, mode, selectedPart, intensities])

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        人体図を読み込めませんでした。
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`anatomy-figure${className ? ` ${className}` : ''}`}
      {...(mode === 'select' ? { role: 'group', 'aria-label': title } : {})}
      aria-busy={!markup}
      dangerouslySetInnerHTML={{ __html: markup ?? '' }}
    />
  )
}
