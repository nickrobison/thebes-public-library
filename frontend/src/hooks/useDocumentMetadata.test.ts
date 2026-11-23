import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '../../test/utils/render'
import { useDocumentMetadata } from './useDocumentMetadata'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'

describe('useDocumentMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads metadata fields from the document response', async () => {
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

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.document).toBeDefined())

    expect(result.current.data).toEqual({
      title: 'The Odyssey',
      authors: 'Homer',
      pubYear: '800',
      journal: '',
      volume: '',
      issue: '',
      pages: '',
      doi: '',
      version: 3,
    })
  })

  it('exposes the mutate callback', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3 }),
      ),
    )

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.document).toBeDefined())
    expect(typeof result.current.mutate).toBe('function')
    expect(result.current.isMutating).toBe(false)
  })
})
