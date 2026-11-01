const NEUTRAL_HEATMAP_COLOR = '#E2E8F0'

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** intensity(0..1)に応じて、中立色から部位の基準色まで線形補間する。0回は中立色。 */
export function heatmapColor(baseHex: string, intensity: number): string {
  const t = Math.min(1, Math.max(0, intensity))
  const [nr, ng, nb] = hexToRgb(NEUTRAL_HEATMAP_COLOR)
  const [br, bg, bb] = hexToRgb(baseHex)
  return rgbToHex(nr + (br - nr) * t, ng + (bg - ng) * t, nb + (bb - nb) * t)
}

export { NEUTRAL_HEATMAP_COLOR }
