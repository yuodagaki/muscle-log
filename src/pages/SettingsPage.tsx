import { useAppData } from '../hooks/AppDataContext'
import { hasUnbackedChanges } from '../storage/metaRepo'
import { formatDateTimeLocal } from '../domain/format'
import { Card, SectionTitle } from '../components/layout/AppShell'
import { ExportSection } from '../components/settings/ExportSection'
import { ImportSection } from '../components/settings/ImportSection'
import { PwaInstallGuide } from '../components/settings/PwaInstallGuide'

const APP_VERSION = '0.1.0'

export function SettingsPage() {
  const { records, meta, loading, error } = useAppData()
  const unbacked = hasUnbackedChanges(meta)

  return (
    <div className="space-y-4 pt-2">
      <header>
        <h1 className="text-lg font-bold text-slate-900">Muscle Log</h1>
        <p className="text-sm text-slate-500">設定</p>
      </header>

      <Card>
        <SectionTitle>データの状態</SectionTitle>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">端末内保存</dt>
            <dd className="font-medium text-slate-800">
              {loading ? '読み込み中' : error ? '保存できませんでした' : '正常'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">記録件数</dt>
            <dd className="font-medium text-slate-800">{records.length}件</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">最終バックアップ確認</dt>
            <dd className="font-medium text-slate-800">
              {meta.lastBackupConfirmedAt ? formatDateTimeLocal(meta.lastBackupConfirmedAt) : '未作成'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">未バックアップ変更</dt>
            <dd className={`font-medium ${unbacked ? 'text-amber-600' : 'text-slate-800'}`}>
              {unbacked ? 'あり' : 'なし'}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <SectionTitle>データ管理</SectionTitle>
        <div className="space-y-2">
          <ExportSection />
          <ImportSection />
        </div>
      </Card>

      <Card>
        <SectionTitle>バックアップの案内</SectionTitle>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            「JSONを書き出す」を押すと記録ファイルがダウンロードされます。保存先（本体・iCloud
            Driveなど）は利用者が選択してください。
          </p>
          <p>
            「JSONから復元する」は選択したファイルの内容で<strong>既存の記録をすべて置き換えます</strong>
            。復元前に現在のデータをバックアップすることをおすすめします。
          </p>
          <p className="text-xs text-slate-400">
            ブラウザ側ではファイルが実際に保存されたことを確認できないため、書き出し後に「保存できましたか？」と確認します。
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle>アプリについて</SectionTitle>
        <div className="space-y-1 text-sm text-slate-600">
          <p>記録はこの端末のブラウザ内（IndexedDB）にのみ保存され、外部サーバーへは送信されません。</p>
          <p>
            端末のストレージ消去やアプリ削除などでデータが失われる可能性があるため、JSONバックアップを定期的に行ってください。
          </p>
          <p className="text-xs text-slate-400">バージョン: {APP_VERSION}</p>
        </div>
      </Card>

      <Card>
        <SectionTitle>PWAの利用案内</SectionTitle>
        <PwaInstallGuide />
      </Card>
    </div>
  )
}
