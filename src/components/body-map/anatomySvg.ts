import frontUrl from '../../assets/body/anatomy-front.svg?url'
import backUrl from '../../assets/body/anatomy-back.svg?url'

const URLS: Record<'front' | 'back', string> = { front: frontUrl, back: backUrl }

const cache = new Map<string, Promise<string>>()

/** 人体図SVGを取得してテキストとして返す。一度取得した内容はビュー単位でキャッシュする。 */
export function loadAnatomySvg(view: 'front' | 'back'): Promise<string> {
  const url = URLS[view]
  const cached = cache.get(url)
  if (cached) return cached

  const promise = fetch(url).then((res) => {
    if (!res.ok) throw new Error('人体図の読み込みに失敗しました')
    return res.text()
  })
  cache.set(url, promise)
  return promise
}
