import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportSection } from './ImportSection'
import { AppDataProvider } from '../../hooks/AppDataContext'
import { db } from '../../storage/db'
import { addRecord } from '../../storage/recordsRepo'

beforeEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

afterEach(async () => {
  await db.records.clear()
  await db.meta.clear()
})

function renderImport() {
  return render(
    <AppDataProvider>
      <ImportSection />
    </AppDataProvider>,
  )
}

function jsonFile(content: unknown, name = 'backup.json') {
  return new File([JSON.stringify(content)], name, { type: 'application/json' })
}

describe('ImportSection', () => {
  it('rejects malformed JSON and keeps existing data untouched', async () => {
    await addRecord({ date: '2026-01-01', part: 'chest', reps: 5 })
    const user = userEvent.setup()
    renderImport()

    const input = document.getElementById('import-file-input') as HTMLInputElement
    await user.upload(input, new File(['not json'], 'bad.json', { type: 'application/json' }))

    expect(await screen.findByText(/JSONの形式が不正です/)).toBeInTheDocument()
    expect(await db.records.toArray()).toHaveLength(1)
  })

  it('rejects a structurally invalid payload (negative reps) without replacing data', async () => {
    await addRecord({ date: '2026-01-01', part: 'chest', reps: 5 })
    const user = userEvent.setup()
    renderImport()

    const input = document.getElementById('import-file-input') as HTMLInputElement
    await user.upload(
      input,
      jsonFile({
        version: 1,
        exportedAt: '2026-11-01T00:00:00.000Z',
        records: [
          {
            id: 'bad',
            date: '2026-11-01',
            part: 'chest',
            reps: -5,
            createdAt: '2026-11-01T00:00:00.000Z',
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
      }),
    )

    expect(await screen.findByText(/仕様と一致しないため/)).toBeInTheDocument()
    expect(await db.records.toArray()).toHaveLength(1)
  })

  it('shows a preview and replaces all records only after explicit confirmation', async () => {
    await addRecord({ date: '2026-01-01', part: 'chest', reps: 5 })
    const user = userEvent.setup()
    renderImport()

    const input = document.getElementById('import-file-input') as HTMLInputElement
    await user.upload(
      input,
      jsonFile({
        version: 1,
        exportedAt: '2026-11-01T00:00:00.000Z',
        records: [
          {
            id: 'new-1',
            date: '2026-11-01',
            part: 'legs',
            reps: 12,
            createdAt: '2026-11-01T00:00:00.000Z',
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
      }),
    )

    expect(await screen.findByText('既存の記録をすべて置き換えます')).toBeInTheDocument()
    expect(screen.getByText(/ファイル内の記録件数: 1件/)).toBeInTheDocument()

    // キャンセルすると置換されない
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(await db.records.toArray()).toHaveLength(1)
    expect((await db.records.toArray())[0].part).toBe('chest')
  })
})
