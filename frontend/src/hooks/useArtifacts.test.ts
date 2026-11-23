import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '../../test/utils/render'
import { useArtifacts, useImportPolling } from './useArtifacts'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'

const testDocId = 'test-doc-id'
const testFile = new File(['pdf-bytes'], 'test.pdf', { type: 'application/pdf' })

describe('useArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads artifacts for a document', async () => {
    server.use(
      http.get(`/api/v1/documents/${testDocId}/artifacts`, () =>
        HttpResponse.json([
          {
            id: 'art-1',
            documentId: testDocId,
            originalFilename: 'paper.pdf',
            status: 'AVAILABLE',
            isPreferred: true,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      ),
    )

    const { result } = renderHook(() => useArtifacts(testDocId))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.artifacts).toHaveLength(1)
    expect(result.current.artifacts[0].originalFilename).toBe('paper.pdf')
  })

  it('uploads a file and resolves with the job id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jobId: 'job-42', status: 'PENDING', documentId: testDocId }),
    }) as unknown as typeof fetch

    const { result } = renderHook(() => useArtifacts(testDocId))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const uploadResult = await result.current.uploadArtifact(testFile)

    expect(uploadResult.jobId).toBe('job-42')
    expect(global.fetch).toHaveBeenCalled()
  })
})

describe('useImportPolling', () => {
  it('polls until the import completes and calls onComplete', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'job-42',
        status: 'COMPLETED',
        currentStage: 'DONE',
        retryCount: 0,
        submittedAt: '2026-01-01T00:00:00Z',
        completedAt: '2026-01-01T00:00:05Z',
        error: null,
      }),
    }) as unknown as typeof fetch

    const onComplete = vi.fn()
    const { result } = renderHook(() => useImportPolling('job-42', onComplete))

    await waitFor(
      () => expect(result.current.data?.status).toBe('COMPLETED'),
      { timeout: 5000 },
    )
    await waitFor(() => expect(onComplete).toHaveBeenCalled())

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'COMPLETED' }),
    )
  })
})
