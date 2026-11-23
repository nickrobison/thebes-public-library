import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '../../test/utils/render'
import { act } from '@testing-library/react'
import { useDocumentMetadata } from './useDocumentMetadata'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

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

  it('does not mutate when there is no document data', async () => {
    server.use(http.get('/api/v1/documents/:id', () => new HttpResponse('boom', { status: 500 })))

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.error).toBeDefined())

    act(() => {
      result.current.mutate({ title: 'New Title' })
    })

    expect(result.current.isMutating).toBe(false)
  })

  it('reports a mutation error via toast', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3 }),
      ),
      http.put('/api/v1/documents/:id', () => new HttpResponse('conflict', { status: 409 })),
    )

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.document).toBeDefined())

    act(() => {
      result.current.mutate({ title: 'New Title' })
    })

    await waitFor(() => expect(result.current.isMutating).toBe(false))
  })

  it('reports a generic failure for non-conflict update errors', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3 }),
      ),
      http.put('/api/v1/documents/:id', () => new HttpResponse('boom', { status: 500 })),
    )

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.document).toBeDefined())

    act(() => {
      result.current.mutate({ title: 'New Title' })
    })

    await waitFor(() => expect(result.current.isMutating).toBe(false))
  })

  it('defaults missing document fields and version to empty values', async () => {
    let seenIfMatch: string | null = null
    server.use(
      http.get('/api/v1/documents/:id', () => HttpResponse.json({ id: 'doc-1' })),
      http.put('/api/v1/documents/:id', ({ request }) => {
        seenIfMatch = request.headers.get('if-match')
        return HttpResponse.json({ id: 'doc-1', version: 1, status: 'updated' })
      }),
    )

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.document).toBeDefined())

    expect(result.current.data).toEqual({
      title: '',
      authors: '',
      pubYear: '',
      journal: '',
      volume: '',
      issue: '',
      pages: '',
      doi: '',
      version: 0,
    })

    act(() => {
      result.current.mutate({ title: 'New Title' })
    })
    await waitFor(() => expect(result.current.isMutating).toBe(false))

    expect(seenIfMatch).toBe('0')
  })

  it('maps pubYear to a nullable publicationYear in the update payload', async () => {
    const seenBodies: Array<Record<string, unknown>> = []
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3 }),
      ),
      http.put('/api/v1/documents/:id', async ({ request }) => {
        seenBodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({ id: 'doc-1', version: 4, status: 'updated' })
      }),
    )

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.document).toBeDefined())

    act(() => {
      result.current.mutate({ pubYear: '' })
    })
    await waitFor(() => expect(result.current.isMutating).toBe(false))

    act(() => {
      result.current.mutate({ pubYear: '850' })
    })
    await waitFor(() => expect(result.current.isMutating).toBe(false))

    expect(seenBodies[0]).toEqual({ publicationYear: null })
    expect(seenBodies[1]).toEqual({ publicationYear: 850 })
  })

  it('mutates using the current document version', async () => {
    let seenIfMatch: string | null = null
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3 }),
      ),
      http.put('/api/v1/documents/:id', async ({ request }) => {
        seenIfMatch = request.headers.get('if-match')
        return HttpResponse.json({ id: 'doc-1', version: 4, status: 'updated' })
      }),
    )

    const { result } = renderHook(() => useDocumentMetadata('doc-1'))
    await waitFor(() => expect(result.current.document).toBeDefined())

    act(() => {
      result.current.mutate({ title: 'New Title' })
    })

    await waitFor(() => expect(result.current.isMutating).toBe(false))
    expect(seenIfMatch).toBe('3')
  })
})
