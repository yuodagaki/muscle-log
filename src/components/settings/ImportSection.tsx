import { useRef, useState, type ChangeEvent } from 'react'
import { useAppData } from '../../hooks/AppDataContext'
import { MAX_IMPORT_FILE_SIZE_BYTES } from '../../domain/constants'
import { validateImportPayload } from '../../domain/validation'
import { buildImportPreview, replaceAllRecords, type ImportPreview } from '../../storage/backup'
import type { WorkoutRecord } from '../../domain/types'
import { ConfirmDialog } from '../common/ConfirmDialog'

type PendingImport = { records: WorkoutRecord[]; preview: ImportPreview }

export function ImportSection() {
  const { records } = useAppData()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [pending, setPending] = useState<PendingImport | null>(null)

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    resetInput()
    if (!file) return

    setError(null)
    setSuccessMessage(null)

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      setError('ファイルサイズが大きすぎます（上限10MB）。')
      return
    }

    let text: string
    try {
      text = await file.text()
    } catch {
      setError('ファイルを読み込めませんでした。')
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('JSONの形式が不正です。ファイルの内容を確認してください。')
      return
    }

    const result = validateImportPayload(parsed)
    if (!result.ok) {
      setError('ファイルの内容が仕様と一致しないため、復元を中止しました。既存の記録は変更されていません。')
      return
    }

    setPending({ records: result.records, preview: buildImportPreview(result.records, records.length) })
  }

  const handleConfirmRestore = async () => {
    if (!pending) return
    setIsImporting(true)
    try {
      await replaceAllRecords(pending.records)
      setSuccessMessage('復元しました。バックアップ状態は「未バックアップ変更あり」として表示されます。')
    } catch {
      setError('復元に失敗しました。既存の記録は保持されています。')
    } finally {
      setIsImporting(false)
      setPending(null)
    }
  }

  return (
    <div>
      <label className="block">
        <span className="sr-only">JSONファイルを選択</span>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          disabled={isImporting}
          className="hidden"
          id="import-file-input"
        />
        <span
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-red-200 text-sm font-semibold text-red-600"
        >
          JSONから復元する
        </span>
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="mt-2 text-sm text-emerald-600">{successMessage}</p>}

      <ConfirmDialog
        open={pending !== null}
        title="既存の記録をすべて置き換えます"
        description={
          pending && (
            <div className="space-y-1">
              <p>ファイル内の記録件数: {pending.preview.fileRecordCount}件</p>
              <p>
                対象期間: {pending.preview.oldestDate ?? '—'} 〜 {pending.preview.newestDate ?? '—'}
              </p>
              <p>現在の件数: {pending.preview.currentRecordCount}件 → 置換後: {pending.preview.resultRecordCount}件</p>
              <p className="font-semibold text-red-600">既存の記録は失われ、元に戻せません。</p>
            </div>
          )
        }
        confirmLabel={isImporting ? '復元中…' : '復元する'}
        destructive
        onCancel={() => setPending(null)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  )
}
