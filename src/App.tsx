import { lazy, Suspense, useState } from 'react'
import { AppDataProvider } from './hooks/AppDataContext'
import { AppShell } from './components/layout/AppShell'
import type { Tab } from './components/layout/BottomNav'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

const ReportPage = lazy(() => import('./pages/ReportPage').then((m) => ({ default: m.ReportPage })))

function App() {
  const [tab, setTab] = useState<Tab>('home')

  return (
    <AppDataProvider>
      <AppShell activeTab={tab} onChangeTab={setTab}>
        {tab === 'home' && <HomePage onNavigate={setTab} />}
        {tab === 'report' && (
          <Suspense fallback={<p className="pt-4 text-center text-sm text-slate-400">読み込み中…</p>}>
            <ReportPage />
          </Suspense>
        )}
        {tab === 'settings' && <SettingsPage />}
      </AppShell>
    </AppDataProvider>
  )
}

export default App
