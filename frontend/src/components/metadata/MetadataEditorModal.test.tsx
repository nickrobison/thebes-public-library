import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/render'
import { MetadataEditorModal, type BibliographicFields } from './MetadataEditorModal'

const initialData: BibliographicFields = {
  title: 'Old Title',
  authors: 'Homer',
  pubYear: '800',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  version: 3,
}

describe('MetadataEditorModal', () => {
  it('does not render content when closed', () => {
    render(<MetadataEditorModal isOpen={false} onClose={vi.fn()} initialData={initialData} onSave={() => {}} />)
    expect(screen.queryByText('Edit Bibliographic Metadata')).not.toBeInTheDocument()
  })

  it('renders fields prefilled from initialData when open', () => {
    render(<MetadataEditorModal isOpen onClose={vi.fn()} initialData={initialData} onSave={() => {}} />)

    expect((screen.getByDisplayValue('Old Title') as HTMLInputElement).value).toBe('Old Title')
    expect((screen.getByDisplayValue('Homer') as HTMLInputElement).value).toBe('Homer')
    expect((screen.getByDisplayValue('800') as HTMLInputElement).value).toBe('800')
  })

  it('disables save until a change is made, then calls onSave', async () => {
    const onSave = vi.fn()
    render(<MetadataEditorModal isOpen onClose={vi.fn()} initialData={initialData} onSave={onSave} />)

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    expect(saveButton).toBeDisabled()

    const titleInput = screen.getByDisplayValue('Old Title') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    await waitFor(() => expect(saveButton).toBeEnabled())

    fireEvent.click(saveButton)

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Title', version: 3 }),
    )
  })

  it('closes via cancel without saving', async () => {
    const onClose = vi.fn()
    const onSave = vi.fn()
    render(<MetadataEditorModal isOpen onClose={onClose} initialData={initialData} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSave).not.toHaveBeenCalled()
  })
})
