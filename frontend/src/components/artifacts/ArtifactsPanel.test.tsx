import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../../test/utils/render'
import userEvent from '@testing-library/user-event'
import { server } from '../../../test/setup'
import { http, HttpResponse } from 'msw'
import { delay } from 'msw'
import { toast } from 'sonner'
import { ArtifactsPanel } from './ArtifactsPanel'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}))

function makeArtifact(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'art-1',
    documentId: 'doc-1',
    originalFilename: 'preferred.pdf',
    filename: 'preferred.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    isPreferred: true,
    status: 'COMPLETED',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ArtifactsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the panel container', async () => {
    render(<ArtifactsPanel documentId="doc-1" />)
    await waitFor(() => expect(screen.getByTestId('artifacts-panel')).toBeInTheDocument())
  })

  it('renders a loading state while artifacts are fetched', async () => {
    server.use(
      http.get('/api/v1/documents/:id/artifacts', async () => {
        await delay(50)
        return HttpResponse.json([])
      }),
    )

    render(<ArtifactsPanel documentId="doc-1" />)

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders the empty state when no artifacts exist', async () => {
    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('No artifacts found')).toBeInTheDocument())
  })

  it('renders an error state when loading artifacts fails', async () => {
    server.use(http.get('/api/v1/documents/:id/artifacts', () => new HttpResponse('boom', { status: 500 })))

    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('Error loading artifacts')).toBeInTheDocument())
  })

  it('renders preferred and additional artifacts with metadata', async () => {
    server.use(
      http.get('/api/v1/documents/:id/artifacts', () =>
        HttpResponse.json([
          {
            id: 'art-1',
            documentId: 'doc-1',
            originalFilename: 'preferred.pdf',
            filename: 'preferred.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            isPreferred: true,
            status: 'COMPLETED',
            processingProgress: 100,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          {
            id: 'art-2',
            documentId: 'doc-1',
            originalFilename: 'extra.pdf',
            filename: 'extra.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            isPreferred: false,
            status: 'PROCESSING',
            processingProgress: 42,
            createdAt: '2026-01-02T00:00:00Z',
            updatedAt: '2026-01-02T00:00:00Z',
          },
        ]),
      ),
    )

    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('Preferred Artifacts')).toBeInTheDocument())
    expect(screen.getByText('Additional Artifacts')).toBeInTheDocument()
    expect(screen.getByText('preferred.pdf')).toBeInTheDocument()
    expect(screen.getByText('extra.pdf')).toBeInTheDocument()
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('PROCESSING')).toBeInTheDocument()
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('shows the selection toolbar and bulk actions when an artifact is selected', async () => {
    server.use(
      http.get('/api/v1/documents/:id/artifacts', () =>
        HttpResponse.json([
          {
            id: 'art-1',
            documentId: 'doc-1',
            originalFilename: 'preferred.pdf',
            filename: 'preferred.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            isPreferred: true,
            status: 'COMPLETED',
            processingProgress: 100,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      ),
    )

    const user = userEvent.setup()
    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('preferred.pdf')).toBeInTheDocument())
    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument())
    expect(screen.getByText('1 item selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to collection' })).toBeDisabled()
  })

  it('opens the add artifact dialog from the empty state and closes it', async () => {
    const user = userEvent.setup()
    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('No artifacts found')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Add First Artifact' }))

    expect(screen.getByText('Upload Artifact')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Upload Artifact')).not.toBeInTheDocument()
  })

  it('formats file sizes in bytes, kilobytes and megabytes', async () => {
    server.use(
      http.get('/api/v1/documents/:id/artifacts', () =>
        HttpResponse.json([
          makeArtifact({ id: 'art-bytes', fileSize: 500, isPreferred: true }),
          makeArtifact({ id: 'art-kb', fileSize: 2048, isPreferred: true }),
          makeArtifact({ id: 'art-mb', fileSize: 3 * 1024 * 1024, isPreferred: true }),
        ]),
      ),
    )

    render(<ArtifactsPanel documentId="doc-1" />)

    const findSize = (prefix: string) =>
      screen.getByText((_, element) =>
        element?.classList.contains('mt-1') === true &&
        (element?.textContent ?? '').startsWith(`${prefix} •`),
      )

    await waitFor(() => expect(findSize('500 B')).toBeInTheDocument())
    expect(findSize('2.0 KB')).toBeInTheDocument()
    expect(findSize('3.0 MB')).toBeInTheDocument()
  })

  it('colors FAILED and unknown statuses distinctly', async () => {
    server.use(
      http.get('/api/v1/documents/:id/artifacts', () =>
        HttpResponse.json([
          makeArtifact({ id: 'art-failed', status: 'FAILED', isPreferred: true }),
          makeArtifact({ id: 'art-weird', status: 'ARCHIVED', isPreferred: true }),
        ]),
      ),
    )

    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('FAILED')).toBeInTheDocument())
    expect(screen.getByText('FAILED')).toHaveClass('text-red-600')
    expect(screen.getByText('ARCHIVED')).toHaveClass('text-gray-600')
  })

  it('runs a bulk action over multiple selected artifacts', async () => {
    server.use(
      http.get('/api/v1/documents/:id/artifacts', () =>
        HttpResponse.json([
          makeArtifact({ id: 'art-1', isPreferred: true }),
          makeArtifact({ id: 'art-2', isPreferred: false }),
        ]),
      ),
    )

    const user = userEvent.setup()
    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getAllByText('preferred.pdf').length).toBeGreaterThan(0))
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[1])

    expect(screen.getByText('2 items selected')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /bulk actions/i }))
    await user.click(screen.getByRole('button', { name: 'View' }))

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('view action on 2 items'))
  })
})
