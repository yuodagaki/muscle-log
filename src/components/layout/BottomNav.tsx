export type Tab = 'home' | 'report' | 'settings'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: 'ホーム', icon: '🏠' },
  { key: 'report', label: 'レポート', icon: '📊' },
  { key: 'settings', label: '設定', icon: '⚙️' },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
      aria-label="画面切り替え"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          return (
            <li key={tab.key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-slate-400'
                }`}
                style={isActive ? { color: 'var(--color-accent)' } : undefined}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
