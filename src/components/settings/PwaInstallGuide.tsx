function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia?.('(display-mode: standalone)').matches === true || navStandalone === true
}

export function PwaInstallGuide() {
  if (isStandalone()) return null

  return (
    <div className="space-y-2 text-sm text-slate-600">
      <p>iPhoneのSafariで開いている場合、ホーム画面に追加するとアプリのように起動できます。</p>
      <ol className="list-inside list-decimal space-y-1">
        <li>画面下部の共有ボタンをタップする。</li>
        <li>「ホーム画面に追加」を選ぶ。</li>
        <li>「追加」をタップして完了。</li>
      </ol>
      <p className="text-xs text-slate-400">
        通常のSafariタブとホーム画面版では、記録データの保存領域が別になる場合があります。両方から同じ記録が見える保証はありません。
      </p>
    </div>
  )
}
