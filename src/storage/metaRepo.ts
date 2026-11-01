import { db } from './db'
import { EMPTY_META, type BackupMetaRow } from '../domain/types'

export async function getMeta(): Promise<BackupMetaRow> {
  const row = await db.meta.get(1)
  return row ?? EMPTY_META
}

/**
 * 利用者がファイル保存を確認した時点のスナップショットのリビジョンを記録する。
 * 確認待ち中に新しい変更（revisionの増加）があっても、ここに渡した
 * snapshotRevision だけを記録することで「未バックアップ変更あり」の判定
 * （現在revision > lastBackupRevision）が正しく維持される。
 */
export async function confirmBackup(snapshotRevision: number): Promise<void> {
  const current = await getMeta()
  const next: BackupMetaRow = {
    ...current,
    lastBackupConfirmedAt: new Date().toISOString(),
    lastBackupRevision: snapshotRevision,
  }
  await db.meta.put(next)
}

/**
 * revisionは0から始まり、記録の変更ごとに単調増加する。
 * 一度も変更がない（revision=0）新規状態を「未バックアップ変更あり」と
 * 誤表示しないよう、lastBackupRevisionが未確認(null)の場合の基準は0とする。
 */
export function hasUnbackedChanges(meta: BackupMetaRow): boolean {
  return meta.revision > (meta.lastBackupRevision ?? 0)
}
