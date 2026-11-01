import type { SaveStatus } from '../../hooks/useRecordActions'

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: '',
  saving: '保存中…',
  saved: '保存しました',
  error: '保存できませんでした',
}

export function SaveStatusInline({ status, errorMessage }: { status: SaveStatus; errorMessage: string | null }) {
  if (status === 'idle') return null

  const color = status === 'error' ? 'text-red-600' : status === 'saved' ? 'text-emerald-600' : 'text-slate-500'
  const icon = status === 'error' ? '⚠️' : status === 'saved' ? '✅' : '⏳'

  return (
    <p role="status" aria-live="polite" className={`mt-2 flex items-center gap-1 text-sm font-medium ${color}`}>
      <span aria-hidden="true">{icon}</span>
      {status === 'error' && errorMessage ? errorMessage : STATUS_TEXT[status]}
    </p>
  )
}
