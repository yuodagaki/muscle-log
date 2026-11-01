import { useState } from 'react'
import { buildExportPayload, exportFileName, readExportSnapshot } from '../../storage/backup'
import { confirmBackup } from '../../storage/metaRepo'
import { ConfirmDialog } from '../common/ConfirmDialog'

function triggerDownload(payload: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Safariの共有/保存シートが開く時間を確保してから解放する。
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function ExportSection() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingSnapshotRevision, setPendingSnapshotRevision] = useState<number | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    try {
      const snapshot = await readExportSnapshot()
      const payload = buildExportPayload(snapshot.records)
      triggerDownload(payload, exportFileName())
      setPendingSnapshotRevision(snapshot.revision)
    } catch {
      setError('書き出しに失敗しました。もう一度お試しください。')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="min-h-11 w-full rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {isExporting ? '書き出し中…' : 'JSONを書き出す'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ConfirmDialog
        open={pendingSnapshotRevision !== null}
        title="ファイルを保存できましたか？"
        description="ダウンロードまたは共有シートでファイルの保存を終えた場合は「保存した」を選んでください。保存前に閉じた場合は「まだ・キャンセル」を選んでください。"
        confirmLabel="保存した"
        cancelLabel="まだ・キャンセル"
        onCancel={() => setPendingSnapshotRevision(null)}
        onConfirm={async () => {
          if (pendingSnapshotRevision !== null) {
            await confirmBackup(pendingSnapshotRevision)
          }
          setPendingSnapshotRevision(null)
        }}
      />
    </div>
  )
}
