import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/render'
import { act } from '@testing-library/react'
import { MetadataPanel } from './MetadataPanel'
import { server } from '../../../test/setup'
import { http, HttpResponse } from 'msw'

describe('MetadataPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a loading skeleton while the document loads', () => {
    server.use(http.get('/api/v1/documents/:id', () => new Promise(() => {})))

    render(<MetadataPanel documentId="doc-1" />)

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders an error state when loading fails', async () => {
    server.use(http.get('/api/v1/documents/:id', () => new HttpResponse('boom', { status: 500 })))

    render(<MetadataPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('Error loading metadata')).toBeInTheDocument())
  })

  it('renders the document fields via inline edits', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
        }),
      ),
    )

    render(<MetadataPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('Bibliographic Metadata')).toBeInTheDocument())
    expect(screen.getByText('The Odyssey')).toBeInTheDocument()
    expect(screen.getByText('Homer')).toBeInTheDocument()
    expect(screen.getByText('Version: 3')).toBeInTheDocument()
  })

  it('opens the metadata editor modal from the Edit All button', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
        }),
      ),
    )

    render(<MetadataPanel documentId="doc-1" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit All' }))

    expect(await screen.findByText('Edit Bibliographic Metadata')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Edit Bibliographic Metadata')).not.toBeInTheDocument())
  })

  it('marks unsaved changes after an inline edit and clears them', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
        }),
      ),
    )

    render(<MetadataPanel documentId="doc-1" />)

    await screen.findByText('The Odyssey')

    fireEvent.doubleClick(screen.getByText('The Odyssey'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'The Iliad' } })
    fireEvent.blur(input)

    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument()
  })

  it('saves edited metadata through the modal and closes it', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
        }),
      ),
      http.put('/api/v1/documents/:id', () => HttpResponse.json({ id: 'doc-1', version: 4, status: 'updated' })),
    )

    render(<MetadataPanel documentId="doc-1" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Edit All' }))
    await screen.findByText('Edit Bibliographic Metadata')
    const modalInput = screen
      .getAllByRole('textbox')
      .find((input) => (input as HTMLInputElement).value === 'The Odyssey')
    expect(modalInput).toBeDefined()
    fireEvent.change(modalInput!, { target: { value: 'The Iliad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(screen.queryByText('Edit Bibliographic Metadata')).not.toBeInTheDocument())
  })

  it('shows the discard confirmation when leaving with unsaved changes', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
        }),
      ),
    )

    render(<MetadataPanel documentId="doc-1" />)

    await screen.findByText('The Odyssey')

    fireEvent.doubleClick(screen.getByText('The Odyssey'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'The Iliad' } })
    fireEvent.blur(input)

    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument()

    act(() => {
      window.history.pushState({}, '', '/library/doc-2')
    })

    expect(await screen.findByText('Unsaved Changes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' }))

    await waitFor(() => expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument())
  })

  it('renders a placeholder state when the document has no metadata', async () => {
    server.use(http.get('/api/v1/documents/:id', () => HttpResponse.json(null)))

    render(<MetadataPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('No metadata available')).toBeInTheDocument())
  })

  it('proceeds past the route-change guard when the user confirms', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3 }),
      ),
    )

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<MetadataPanel documentId="doc-1" />)

    await screen.findByText('The Odyssey')

    fireEvent.doubleClick(screen.getByText('The Odyssey'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'The Iliad' } })
    fireEvent.blur(input)

    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument()

    act(() => {
      window.history.pushState({}, '', '/library/doc-9')
    })

    await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Do you want to discard them?'))
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument()

    confirmSpy.mockRestore()
  })
})
