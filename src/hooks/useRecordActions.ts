import { useCallback, useRef, useState } from 'react'
import { addRecord, deleteRecord, updateRecord } from '../storage/recordsRepo'
import type { NewRecordInput, RecordEditInput } from '../domain/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type RecordActionsState = {
  status: SaveStatus
  errorMessage: string | null
}

/**
 * 記録の追加・編集・削除を単一の保存ロックで保護する。
 * 二重タップや非同期競合による重複保存を防ぎ、
 * IndexedDBのコミット確認後にのみ「保存成功」を示す。
 */
export function useRecordActions() {
  const [state, setState] = useState<RecordActionsState>({ status: 'idle', errorMessage: null })
  const lockedRef = useRef(false)

  const run = useCallback(async (operation: () => Promise<void>): Promise<boolean> => {
    if (lockedRef.current) return false
    lockedRef.current = true
    setState({ status: 'saving', errorMessage: null })
    try {
      await operation()
      setState({ status: 'saved', errorMessage: null })
      return true
    } catch (error) {
      setState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '保存に失敗しました',
      })
      return false
    } finally {
      lockedRef.current = false
    }
  }, [])

  const add = useCallback((input: NewRecordInput) => run(async () => { await addRecord(input) }), [run])
  const edit = useCallback(
    (id: string, patch: RecordEditInput) => run(async () => { await updateRecord(id, patch) }),
    [run],
  )
  const remove = useCallback((id: string) => run(async () => { await deleteRecord(id) }), [run])

  const isSubmitting = state.status === 'saving'

  return { status: state.status, errorMessage: state.errorMessage, isSubmitting, add, edit, remove }
}
