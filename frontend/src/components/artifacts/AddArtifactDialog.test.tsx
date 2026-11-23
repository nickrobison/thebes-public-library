import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../../test/utils/render'
import userEvent from '@testing-library/user-event'
import { AddArtifactDialog } from './AddArtifactDialog'

const onUpload = vi.fn()

function renderDialog(open = true) {
  return render(
    <AddArtifactDialog isOpen={open} onClose={vi.fn()} onUpload={onUpload} documentId="doc-1" />,
  )
}

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
})
