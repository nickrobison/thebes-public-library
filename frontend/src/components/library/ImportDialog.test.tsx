import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils/render'
import userEvent from '@testing-library/user-event'
import { ImportDialog } from './ImportDialog'

describe('ImportDialog', () => {
  it('renders the web upload tab by default with the file picker', () => {
    render(<ImportDialog onClose={vi.fn()} />)

    expect(screen.getByText('Single File Upload')).toBeInTheDocument()
    expect(screen.queryByText('Bulk Directory Import')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Select PDF file')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload and Process' })).toBeDisabled()
  })

  it('enables upload only after a file is selected', async () => {
    const user = userEvent.setup()
    render(<ImportDialog onClose={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Upload and Process' })
    expect(button).toBeDisabled()

    const input = screen.getByLabelText('Select PDF file') as HTMLInputElement
    const file = new File(['pdf-bytes'], 'sample.pdf', { type: 'application/pdf' })
    await user.upload(input, file)

    expect(input.files?.[0]?.name).toBe('sample.pdf')
    expect(screen.getByText(/Selected:/)).toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('submits a multipart upload through the API and shows the queued import', async () => {
    const user = userEvent.setup()
    render(<ImportDialog onClose={vi.fn()} />)

    const input = screen.getByLabelText('Select PDF file') as HTMLInputElement
    await user.upload(input, new File(['pdf-bytes'], 'sample.pdf', { type: 'application/pdf' }))

    const uploadResponse = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ importId: 'import-1', status: 'PENDING', originalFilename: 'sample.pdf' }),
    })
    global.fetch = uploadResponse as unknown as typeof fetch

    await user.click(screen.getByRole('button', { name: 'Upload and Process' }))

    await vi.waitFor(() => {
      expect(uploadResponse).toHaveBeenCalledWith('/api/v1/upload', expect.objectContaining({ method: 'POST' }))
    })

    expect(uploadResponse.mock.calls[0][1]?.body).toBeInstanceOf(FormData)

    await vi.waitFor(() => {
      expect(screen.getByText('Upload Successful')).toBeInTheDocument()
    })
    expect(screen.getByText(/Import job: import-1/)).toBeInTheDocument()
  })

  it('shows an error toast when the upload fails', async () => {
    const user = userEvent.setup()
    render(<ImportDialog onClose={vi.fn()} />)

    const input = screen.getByLabelText('Select PDF file') as HTMLInputElement
    await user.upload(input, new File(['pdf-bytes'], 'sample.pdf', { type: 'application/pdf' }))

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch

    await user.click(screen.getByRole('button', { name: 'Upload and Process' }))

    await vi.waitFor(() => {
      expect(screen.getAllByText('Upload failed. Please try again.').length).toBeGreaterThan(0)
    })
  })

  it('switches to the bulk import tab', async () => {
    const user = userEvent.setup()
    render(<ImportDialog onClose={vi.fn()} />)

    await user.click(screen.getByRole('tab', { name: 'Bulk Import' }))

    expect(screen.getByText('Bulk Directory Import')).toBeInTheDocument()
    expect(screen.queryByText('Single File Upload')).not.toBeInTheDocument()
  })
})
