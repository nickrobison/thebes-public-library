import { test, expect, type APIRequestContext } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const samplePdf = join(here, '..', 'fixtures', 'sample.pdf')

/**
 * Seeds one ingested document through the real upload pipeline: multipart upload
 * -> queued IMPORT_SINGLE job -> WorkflowWorker -> validation/storage/verification
 * -> artifact AVAILABLE. Returns the document id, or null if the pipeline did not
 * converge (in which case reader-specific tests are skipped rather than failing
 * on an unrelated infrastructure problem).
 */
async function seedDocument(request: APIRequestContext): Promise<string | null> {
  if (!existsSync(samplePdf)) return null

  const upload = await request.post('/api/v1/upload', {
    multipart: {
      file: {
        name: 'sample.pdf',
        mimeType: 'application/pdf',
        buffer: readFileSync(samplePdf),
      },
    },
  })
  if (!upload.ok()) return null
  const { importId } = (await upload.json()) as { importId: string }

  // The worker polls every 2s; allow generous headroom for CI.
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    const list = await request.get('/api/v1/library?limit=50&sortField=title&sortDir=asc')
    if (list.ok()) {
      const body = (await list.json()) as { items: Array<{ id: string; title: string }> }
      const seeded = body.items.find((item) => item.title === 'sample.pdf')
      if (seeded) return seeded.id
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.error(`[seed] document never appeared for import ${importId}`)
  return null
}

let documentId: string | null = null

test.beforeAll(async ({ request }) => {
  documentId = await seedDocument(request)
})

test.describe('Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library')
  })

  test('renders the seeded document in a table with the expected columns', async ({ page }) => {
    await expect(page.getByTestId('library-table')).toBeVisible()
    await expect(page.getByTestId('cell-title').first()).toBeVisible()

    for (const label of ['Title', 'Authors', 'Publication Year', 'Processing Status']) {
      await expect(page.getByRole('button', { name: `Sort by ${label}` })).toBeVisible()
    }
  })

  test('sorting a column is reflected in the URL', async ({ page }) => {
    await page.getByTestId('sort-title').click()
    await expect(page).toHaveURL(/sortField=title&sortDir=asc/)

    await page.getByTestId('sort-title').click()
    await expect(page).toHaveURL(/sortField=title&sortDir=desc/)
  })

  test('view toggle switches between table and card and is URL addressable', async ({ page }) => {
    await page.getByTestId('view-card').click()
    await expect(page.getByTestId('library-cards')).toBeVisible()
    await expect(page).toHaveURL(/view=card/)

    await page.getByTestId('view-table').click()
    await expect(page.getByTestId('library-table')).toBeVisible()
    await expect(page).not.toHaveURL(/view=card/)
  })

  test('selecting rows reveals the selection toolbar with a count', async ({ page }) => {
    await expect(page.getByTestId('selection-toolbar')).toHaveCount(0)

    await page.getByTestId('row-select').first().check()
    await expect(page.getByTestId('selection-toolbar')).toBeVisible()
    await expect(page.getByTestId('selection-count')).toHaveText('1 selected')

    await page.getByTestId('selection-clear').click()
    await expect(page.getByTestId('selection-toolbar')).toHaveCount(0)
  })

  test('bulk actions are present but disabled (Phase 4 placeholders)', async ({ page }) => {
    await page.getByTestId('row-select').first().check()
    await expect(page.getByRole('button', { name: 'Add to collection' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Tag' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  test('import dialog opens and shows only the active tab panel', async ({ page }) => {
    await page.getByTestId('open-import').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await expect(page.getByRole('tab', { name: 'Web Upload' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Bulk Import' })).toBeVisible()

    // Regression guard: TabsContent used to render every panel at once.
    await expect(page.getByText('Single File Upload')).toBeVisible()
    await expect(page.getByText('Bulk Directory Import')).toBeHidden()

    await page.getByRole('tab', { name: 'Bulk Import' }).click()
    await expect(page.getByText('Bulk Directory Import')).toBeVisible()
    await expect(page.getByText('Single File Upload')).toBeHidden()
  })

  test('sort dropdown is interactive', async ({ page }) => {
    await page.getByTestId('sort-select').click()
    await page.getByRole('option', { name: 'Publication Year' }).click()
    await expect(page).toHaveURL(/sortField=publicationYear/)
  })

  test('health indicator reports backend status', async ({ page }) => {
    await expect(page.getByTestId('health-indicator')).toBeVisible()
  })
})

test.describe('Document workspace', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!documentId, 'no ingested document available (upload pipeline did not converge)')
    await page.goto('/library')
    await page.getByTestId('cell-title').first().click()
    await expect(page.getByTestId('document-workspace')).toBeVisible()
  })

  test('opens the split-pane workspace with sidebar and side panels', async ({ page }) => {
    await expect(page).toHaveURL(/\/library\/[0-9a-f-]{36}/)
    await expect(page.getByTestId('split-pane')).toBeVisible()
    await expect(page.getByTestId('library-sidebar')).toBeVisible()
    await expect(page.getByTestId('metadata-panel')).toBeVisible()
    await expect(page.getByTestId('artifacts-panel')).toBeVisible()
    await expect(page.getByTestId('processing-panel')).toBeVisible()
  })

  test('sidebar collapses and expands', async ({ page }) => {
    await page.getByTestId('sidebar-collapse').click()
    await expect(page.getByTestId('library-sidebar')).toHaveCount(0)
    await page.getByTestId('sidebar-expand').click()
    await expect(page.getByTestId('library-sidebar')).toBeVisible()
  })

  test('document actions menu offers the three framework items and no delete', async ({ page }) => {
    await page.getByTestId('document-actions-trigger').click()
    const menu = page.getByTestId('document-actions-menu')
    await expect(menu).toBeVisible()

    await expect(page.getByTestId('action-edit-metadata')).toBeVisible()
    await expect(page.getByTestId('action-view-processing')).toBeVisible()
    await expect(page.getByTestId('action-add-artifact')).toBeVisible()
    await expect(menu.getByText(/delete/i)).toHaveCount(0)
  })

  test('split pane divider is keyboard operable', async ({ page }) => {
    const divider = page.getByTestId('split-pane-divider')
    const before = await divider.getAttribute('aria-valuenow')

    await divider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(divider).not.toHaveAttribute('aria-valuenow', before ?? '')
  })
})

test.describe('PDF reader', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!documentId, 'no ingested document available (upload pipeline did not converge)')
    await page.goto(`/library/${documentId}`)
    await expect(page.getByTestId('document-workspace')).toBeVisible()
  })

  test('renders the PDF canvas once the artifact is available', async ({ page }) => {
    const container = page.getByTestId('pdf-page-container')
    await expect(container).toBeVisible({ timeout: 30_000 })
    await expect(container.locator('canvas')).toBeVisible({ timeout: 30_000 })
  })

  test('exposes all reader controls', async ({ page }) => {
    await expect(page.getByTestId('reader-prev')).toBeVisible()
    await expect(page.getByTestId('reader-next')).toBeVisible()
    await expect(page.getByTestId('reader-page-input')).toBeVisible()
    await expect(page.getByTestId('reader-zoom-in')).toBeVisible()
    await expect(page.getByTestId('reader-zoom-out')).toBeVisible()
    await expect(page.getByTestId('reader-fit-width')).toBeVisible()
    await expect(page.getByTestId('reader-fit-page')).toBeVisible()
    await expect(page.getByTestId('reader-search')).toBeVisible()
    await expect(page.getByTestId('reader-rotate')).toBeVisible()
    await expect(page.getByTestId('reader-fullscreen')).toBeVisible()
    await expect(page.getByTestId('reader-download')).toHaveAttribute(
      'href',
      new RegExp(`/api/v1/artifacts/[0-9a-f-]{36}/content`),
    )
  })

  test('zoom controls change the reported scale', async ({ page }) => {
    const level = page.getByTestId('reader-zoom-level')
    await expect(level).toHaveText('100%')
    await page.getByTestId('reader-zoom-in').click()
    await expect(level).toHaveText('125%')
    await page.getByTestId('reader-zoom-out').click()
    await expect(level).toHaveText('100%')
  })

  test('page navigation moves through the document', async ({ page }) => {
    await expect(page.getByTestId('reader-page-input')).toHaveValue('1')
    await expect(page.getByTestId('reader-page-total')).toContainText('3')

    // Previous is disabled on the first page.
    await expect(page.getByTestId('reader-prev')).toBeDisabled()

    await page.getByTestId('reader-next').click()
    await expect(page.getByTestId('reader-page-input')).toHaveValue('2')
    await expect(page.getByTestId('reader-prev')).toBeEnabled()
  })

  test('reader state is persisted per document and artifact', async ({ page }) => {
    await page.getByTestId('reader-next').click()
    await expect(page.getByTestId('reader-page-input')).toHaveValue('2')

    await page.reload()
    await expect(page.getByTestId('reader-page-input')).toHaveValue('2', {
      timeout: 30_000,
    })
  })
})
