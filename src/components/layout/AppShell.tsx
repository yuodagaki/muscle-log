import type { ReactNode } from 'react'
import { BottomNav, type Tab } from './BottomNav'

export function AppShell({
  activeTab,
  onChangeTab,
  children,
}: {
  activeTab: Tab
  onChangeTab: (tab: Tab) => void
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg" style={{ backgroundColor: 'var(--color-app-bg)' }}>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
        {children}
      </main>
      <BottomNav active={activeTab} onChange={onChangeTab} />
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-sm font-semibold text-slate-600">{children}</h2>
}
