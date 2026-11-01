import { createContext, useContext, type ReactNode } from 'react'
import { useLiveQuery } from './useLiveQuery'
import { db } from '../storage/db'
import { EMPTY_META, type BackupMetaRow, type WorkoutRecord } from '../domain/types'

type AppDataContextValue = {
  records: WorkoutRecord[]
  meta: BackupMetaRow
  loading: boolean
  error: Error | null
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const recordsState = useLiveQuery(() => db.records.toArray(), [], [] as WorkoutRecord[])
  const metaState = useLiveQuery(async () => (await db.meta.get(1)) ?? EMPTY_META, [], EMPTY_META)

  const value: AppDataContextValue = {
    records: recordsState.value,
    meta: metaState.value,
    loading: recordsState.loading || metaState.loading,
    error: recordsState.error ?? metaState.error,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppDataはAppDataProviderの内側で使用してください')
  return ctx
}
