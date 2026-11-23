import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../../test/utils/render'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { server } from '../../../test/setup'
import { http, HttpResponse } from 'msw'
import { AddArtifactDialog } from './AddArtifactDialog'

const onUpload = vi.fn()

function renderDialog(open = true) {
  return render(
    <AddArtifactDialog isOpen={open} onClose={vi.fn()} onUpload={onUpload} documentId="doc-1" />,
  )
}

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}))

describe('AddArtifactDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onUpload.mockReset()
  })

  it('renders nothing when closed', () => {
    renderDialog(false)
    expect(screen.queryByText('Upload Artifact')).not.toBeInTheDocument()
  })

  it('prompts for a file when open', () => {
    renderDialog(true)
    expect(screen.getByText('Upload Artifact')).toBeInTheDocument()
    expect(screen.getByText('Select File')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })

  it('uploads the selected file and polls the returned job', async () => {
    const user = userEvent.setup()
    onUpload.mockResolvedValue({ jobId: 'job-42' })

    renderDialog(true)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    const file = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    expect(fileInput.files?.[0]?.name).toBe('paper.pdf')

    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file))

    // useImportPolling resolves via MSW handler for /api/v1/imports/job-42 (COMPLETED).
    await waitFor(
      () => {
        expect(screen.getByText(/Upload Status/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('does not call onUpload without a file', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows an error toast and resets the upload state when starting the upload fails', async () => {
    const user = userEvent.setup()
    onUpload.mockRejectedValueOnce(new Error('queue full'))

    renderDialog(true)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('queue full'))
    expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled()
  })

  it('shows the failure reason when the upload job fails', async () => {
    const user = userEvent.setup()
    onUpload.mockResolvedValue({ jobId: 'job-42' })
    server.use(http.get('/api/v1/imports/:id', () =>
      HttpResponse.json({
        id: 'job-42',
        status: 'FAILED',
        processingProgress: 0,
        error: 'boom',
      }),
    ))

    renderDialog(true)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(screen.getByText('Error: boom')).toBeInTheDocument())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Upload failed: boom'))
  })

  it('falls back to an unknown-error message when a failed job has no reason', async () => {
    const user = userEvent.setup()
    onUpload.mockResolvedValue({ jobId: 'job-42' })
    server.use(http.get('/api/v1/imports/:id', () =>
      HttpResponse.json({
        id: 'job-42',
        status: 'FAILED',
        processingProgress: 0,
        error: null,
      }),
    ))

    renderDialog(true)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Upload failed: Unknown error'))
  })

  it('colors pending jobs blue', async () => {
    const user = userEvent.setup()
    onUpload.mockResolvedValue({ jobId: 'job-42' })
    server.use(http.get('/api/v1/imports/:id', () =>
      HttpResponse.json({
        id: 'job-42',
        status: 'PENDING',
        processingProgress: 10,
        error: null,
      }),
    ))

    renderDialog(true)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(screen.getByText('PENDING')).toHaveClass('text-blue-600'))
  })

  it('confirms a completed upload and closes the dialog', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    onUpload.mockResolvedValue({ jobId: 'job-42' })

    render(
      <AddArtifactDialog isOpen onClose={onClose} onUpload={onUpload} documentId="doc-1" />,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Artifact uploaded successfully'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
