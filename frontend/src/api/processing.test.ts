import { describe, it, expect, beforeEach, vi } from 'vitest'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'
import { fetchProcessingHistory } from './processing'

describe('api/processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the processing history for a document', async () => {
    const items = [
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

    server.use(
      http.get('/api/v1/documents/:id/processing-history', () => HttpResponse.json(items)),
    )

    const result = await fetchProcessingHistory('doc-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('job-1')
  })

  it('throws when the response is not ok', async () => {
    server.use(
      http.get('/api/v1/documents/:id/processing-history', () =>
        new HttpResponse('nope', { status: 404 }),
      ),
    )
    await expect(fetchProcessingHistory('doc-1')).rejects.toThrow('Failed to fetch processing history')
  })
})
