import { describe, it, expect, beforeEach, vi } from 'vitest'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'
import { getDocument, getDocumentArtifacts, updateDocument } from './documents'
import type { DocumentDetail, Artifact } from '../types/document'

describe('api/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches a document detail', async () => {
    const detail: DocumentDetail = {
      id: 'doc-1',
      title: 'T',
      authors: null,
      publicationYear: null,
      journal: null,
      volume: null,
      issue: null,
      pages: null,
      doi: null,
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      preferredArtifactId: null,
      artifacts: [],
    }

    server.use(http.get('/api/v1/documents/:id', () => HttpResponse.json(detail)))

    const result = await getDocument('doc-1')
    expect(result.id).toBe('doc-1')
    expect(result.title).toBe('T')
  })

  it('fetches artifacts for a document', async () => {
    const artifacts: Artifact[] = [
      {
        id: 'art-1',
        documentId: 'doc-1',
        originalFilename: 'paper.pdf',
        status: 'AVAILABLE',
        isPreferred: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]

    server.use(http.get('/api/v1/documents/:id/artifacts', () => HttpResponse.json(artifacts)))

    const result = await getDocumentArtifacts('doc-1')
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('AVAILABLE')
  })

  it('updates a document sending the If-Match version header', async () => {
    let seenBody: unknown = null
    let seenIfMatch: string | null = null
    server.use(
      http.put('/api/v1/documents/:id', async ({ request }) => {
        seenBody = await request.json()
        seenIfMatch = request.headers.get('if-match')
        return HttpResponse.json({ id: 'doc-1', version: 2, status: 'updated' })
      }),
    )

    const result = await updateDocument('doc-1', { title: 'New' }, 1)

    expect(seenBody).toEqual({ title: 'New' })
    expect(seenIfMatch).toBe('1')
    expect(result.version).toBe(2)
  })

  it('throws when the update fails', async () => {
    server.use(http.put('/api/v1/documents/:id', () => new HttpResponse('conflict', { status: 409 })))

    await expect(updateDocument('doc-1', { title: 'New' }, 1)).rejects.toThrow()
  })
})
