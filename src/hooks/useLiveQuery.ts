import { useEffect, useRef, useState } from 'react'
import { liveQuery } from 'dexie'

export type LiveQueryState<T> = {
  value: T
  loading: boolean
  error: Error | null
}

/** DexieのliveQueryをReactの状態に橋渡しする薄いフック。追加の依存ライブラリを増やさない。 */
export function useLiveQuery<T>(querier: () => Promise<T> | T, deps: unknown[], initial: T): LiveQueryState<T> {
  const [state, setState] = useState<LiveQueryState<T>>({ value: initial, loading: true, error: null })
  const querierRef = useRef(querier)
  querierRef.current = querier

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }))
    const subscription = liveQuery(() => querierRef.current()).subscribe({
      next: (value) => setState({ value, loading: false, error: null }),
      error: (error: Error) => setState((s) => ({ ...s, loading: false, error })),
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
