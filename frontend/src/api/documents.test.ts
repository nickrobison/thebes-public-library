import { describe, it, expect, beforeEach, vi } from 'vitest'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'
import { getDocument, getDocumentArtifacts, getProcessingHistory, updateDocument, addArtifact } from './documents'
import type { DocumentDetail, Artifact, ProcessingHistoryItem } from '../types/document'

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

  it('throws with status detail when fetching artifacts fails', async () => {
    server.use(http.get('/api/v1/documents/:id/artifacts', () => new HttpResponse('nope', { status: 500 })))

    await expect(getDocumentArtifacts('doc-1')).rejects.toThrow('Request failed (500)')
  })

  it('fetches the processing history', async () => {
    const history: ProcessingHistoryItem[] = [
      {
        id: 'job-1',
        type: 'IMPORT_SINGLE',
        status: 'COMPLETED',
        currentStage: 'DONE',
        retryCount: 0,
        submittedAt: '2026-01-01T00:00:00Z',
        completedAt: '2026-01-01T00:00:05Z',
        failureReason: null,
        payload: '{}',
        stages: [],
      },
    ]

    server.use(http.get('/api/v1/documents/:id/processing-history', () => HttpResponse.json(history)))

    const result = await getProcessingHistory('doc-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('job-1')
  })

  it('throws when fetching the processing history fails', async () => {
    server.use(
      http.get('/api/v1/documents/:id/processing-history', () => new HttpResponse('nope', { status: 404 })),
    )

    await expect(getProcessingHistory('doc-1')).rejects.toThrow('Request failed (404)')
  })

  it('adds an artifact and returns the job id', async () => {
    let seenBody: unknown = null
    server.use(
      http.post('/api/v1/documents/:id/artifacts', async ({ request }) => {
        seenBody = await request.json()
        return HttpResponse.json({ jobId: 'job-42', status: 'PENDING', documentId: 'doc-1' })
      }),
    )

    const result = await addArtifact('doc-1', 'paper.pdf')

    expect(seenBody).toEqual({ originalFilename: 'paper.pdf' })
    expect(result.jobId).toBe('job-42')
  })

  it('throws when adding an artifact fails', async () => {
    server.use(http.post('/api/v1/documents/:id/artifacts', () => new HttpResponse('nope', { status: 500 })))

    await expect(addArtifact('doc-1', 'paper.pdf')).rejects.toThrow('Request failed (500)')
  })
})
