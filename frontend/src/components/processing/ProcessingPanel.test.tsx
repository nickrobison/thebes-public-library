import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/render'
import { toast } from 'sonner'
import { server } from '../../../test/setup'
import { http, HttpResponse } from 'msw'
import { ProcessingPanel } from './ProcessingPanel'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}))

describe('ProcessingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders collapsed with the history heading', () => {
    render(<ProcessingPanel documentId="doc-1" />)

    expect(screen.getByTestId('processing-panel')).toBeInTheDocument()
    expect(screen.getByText('Processing History')).toBeInTheDocument()
    expect(screen.queryByText('No processing history available')).not.toBeInTheDocument()
  })

  it('expands and shows the empty history state', async () => {
    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    await waitFor(() => expect(screen.getByText('No processing history available')).toBeInTheDocument())
  })

  it('shows an error toast when loading the processing history fails', async () => {
    server.use(http.get('/api/v1/documents/:id/processing-history', () => new HttpResponse('boom', { status: 500 })))

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load processing history'))
  })

  it('shows an error toast when loading the processing history throws', async () => {
    server.use(http.get('/api/v1/documents/:id/processing-history', () => {
      throw new Error('network down')
    }))

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load processing history'))
  })

  it('shows an error toast when the history request rejects', async () => {
    server.use(http.get('/api/v1/documents/:id/processing-history', () => HttpResponse.error()))

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load processing history'))
  })

  it('expands via the chevron button', async () => {
    render(<ProcessingPanel documentId="doc-1" />)

    const chevron = screen.getByTestId('processing-panel').querySelector('button')
    expect(chevron).not.toBeNull()
    fireEvent.click(chevron!)

    expect(screen.getByTestId('processing-panel')).toHaveAttribute('data-expanded', 'true')
  })

  it('renders processing runs returned by the history endpoint', async () => {
    server.use(
      http.get('/api/v1/documents/:id/processing-history', () =>
        HttpResponse.json([
          {
            id: 'job-1',
            type: 'IMPORT_SINGLE',
            status: 'COMPLETED',
            currentStage: 'DONE',
            retryCount: 1,
            submittedAt: '2026-01-01T10:00:00Z',
            completedAt: '2026-01-01T10:00:05Z',
            failureReason: null,
            payload: '{}',
            stages: [
              {
                name: 'VALIDATE',
                status: 'COMPLETED',
                startTime: '2026-01-01T10:00:00Z',
                endTime: '2026-01-01T10:00:01Z',
              },
            ],
          },
          {
            id: 'job-2',
            type: 'IMPORT_BATCH',
            status: 'FAILED',
            currentStage: 'EXTRACT',
            retryCount: 0,
            submittedAt: '2026-01-02T10:00:00Z',
            completedAt: null,
            failureReason: 'corrupt pdf',
            payload: '{}',
            stages: [],
          },
        ]),
      ),
    )

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    await waitFor(() => expect(screen.getByText('IMPORT_SINGLE')).toBeInTheDocument())
    expect(screen.getByText('IMPORT_BATCH')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Retry: 1')).toBeInTheDocument()
    expect(screen.getByText('corrupt pdf')).toBeInTheDocument()
    expect(screen.getByText('Stages:')).toBeInTheDocument()
    expect(screen.getByText('VALIDATE')).toBeInTheDocument()
  })

  it('falls back to a neutral badge for unknown run statuses', async () => {
    server.use(
      http.get('/api/v1/documents/:id/processing-history', () =>
        HttpResponse.json([
          {
            id: 'job-3',
            type: 'IMPORT_SINGLE',
            status: 'WEIRD',
            currentStage: '???',
            retryCount: 0,
            submittedAt: '2026-01-03T10:00:00Z',
            completedAt: null,
            failureReason: null,
            payload: '{}',
            stages: [],
          },
        ]),
      ),
    )

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    expect(await screen.findByText('WEIRD')).toBeInTheDocument()
  })

  it('renders running and failed stages with timestamps and errors', async () => {
    server.use(
      http.get('/api/v1/documents/:id/processing-history', () =>
        HttpResponse.json([
          {
            id: 'job-4',
            type: 'IMPORT_SINGLE',
            status: 'RUNNING',
            currentStage: 'OCR',
            retryCount: 0,
            submittedAt: '2026-01-04T10:00:00Z',
            completedAt: null,
            failureReason: null,
            payload: '{}',
            stages: [
              {
                name: 'PARSE',
                status: 'RUNNING',
                startTime: '2026-01-04T10:00:01Z',
              },
              {
                name: 'ENCODE',
                status: 'FAILED',
                endTime: '2026-01-04T10:00:02Z',
                error: 'tesseract exploded',
              },
            ],
          },
        ]),
      ),
    )

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    expect(await screen.findByText('PARSE')).toBeInTheDocument()
    expect(screen.getByText('ENCODE')).toBeInTheDocument()
    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(screen.getByText('FAILED')).toBeInTheDocument()
    expect(screen.getByText(/Started:/)).toBeInTheDocument()
    expect(screen.getByText(/Ended:/)).toBeInTheDocument()
    expect(screen.getByText('Error: tesseract exploded')).toBeInTheDocument()
    expect(screen.getByText('FAILED')).toHaveClass('bg-red-100')
  })

  it('guards against malformed stage lists in the history payload', async () => {
    server.use(
      http.get('/api/v1/documents/:id/processing-history', () =>
        HttpResponse.json([
          {
            id: 'job-5',
            type: 'IMPORT_SINGLE',
            status: 'COMPLETED',
            currentStage: 'DONE',
            retryCount: 0,
            submittedAt: '2026-01-05T10:00:00Z',
            completedAt: null,
            failureReason: null,
            payload: '{}',
            stages: 'not-an-array',
          },
        ]),
      ),
    )

    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    expect(await screen.findByText('IMPORT_SINGLE')).toBeInTheDocument()
    expect(screen.queryByText('Stages:')).not.toBeInTheDocument()
  })
})
