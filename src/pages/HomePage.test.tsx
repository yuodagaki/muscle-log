import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppDataProvider } from '../hooks/AppDataContext'
import { HomePage } from './HomePage'
import { db } from '../storage/db'

beforeEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

afterEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

function renderHome() {
  return render(
    <AppDataProvider>
      <HomePage onNavigate={() => {}} />
    </AppDataProvider>,
  )
}

describe('HomePage', () => {
  it('manual add creates one history entry with the default 20 reps for the selected (default) part', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(await screen.findByRole('button', { name: '記録を追加' }))

    const list = await screen.findByRole('list')
    const item = within(list).getAllByRole('listitem')[0]
    expect(within(item).getByText('胸')).toBeInTheDocument()
    expect(within(item).getByText('20回')).toBeInTheDocument()
  })

  it('quick add creates an independent history entry without touching the manual draft value, and totals accumulate for the same part/day', async () => {
    const user = userEvent.setup()
    renderHome()

    // 手入力で20回記録
    await user.click(await screen.findByRole('button', { name: '記録を追加' }))
    await screen.findByRole('list')

    // ワンタップモードへ切替して+10
    await user.click(screen.getByRole('tab', { name: 'ワンタップ' }))
    await user.click(await screen.findByRole('button', { name: '+10' }))

    // 履歴が2件になる
    await screen.findByText('今日の履歴')
    const list = screen.getByRole('list')
    await within(list).findAllByRole('listitem')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)

    // 合計は20+10=30回
    const summaryCard = screen.getByText('今日の合計').closest('div') as HTMLElement
    expect(within(summaryCard).getByText('30回')).toBeInTheDocument()
  })

  it('shows a save failure message instead of a success state when the write fails', async () => {
    const user = userEvent.setup()
    const originalAdd = db.records.add.bind(db.records)
    db.records.add = (() =>
      Promise.reject(new Error('書き込みに失敗しました'))) as unknown as typeof db.records.add

    renderHome()
    await user.click(await screen.findByRole('button', { name: '記録を追加' }))

    expect(await screen.findByText('書き込みに失敗しました')).toBeInTheDocument()
    expect(screen.queryByText('保存しました')).not.toBeInTheDocument()

    db.records.add = originalAdd
  })
})
