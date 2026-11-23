import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.clearAllMocks()
})

export const server = setupServer(
  http.get('/api/v1/library', () => {
    return HttpResponse.json({ items: [], nextCursor: null })
  }),
  http.get('/api/v1/library/:id', () => {
    return HttpResponse.json({
      id: 'test-doc-id',
      title: 'Test Doc',
      authors: ['Author'],
      publicationYear: 2024,
      processingStatus: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
  http.get('/api/v1/documents/:id/artifacts', () => {
    return HttpResponse.json([])
  }),
  http.post('/api/v1/documents/:id/artifacts', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    return HttpResponse.json({
      jobId: 'test-job-id',
      status: 'PENDING',
      documentId: 'test-doc-id',
    })
  }),
  http.get('/api/v1/imports/:id', () => {
    return HttpResponse.json({
      id: 'test-job-id',
      status: 'COMPLETED',
      currentStage: 'DONE',
      retryCount: 0,
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: null,
    })
  }),
  http.post('/api/v1/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    return HttpResponse.json({
      importId: 'test-import-id',
      status: 'PENDING',
      originalFilename: file?.name || 'test.pdf',
    })
  }),
  http.get('/api/v1/documents/:id/processing-history', () => {
    return HttpResponse.json([])
  }),
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok', postgresql: 'up', elasticsearch: 'up', storage: 'up' })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// jsdom may not expose a functional localStorage in all environments; provide an
// in-memory implementation so preference/reader tests can persist state.
const memoryStorage = new Map<string, string>()
const storageObj = {
  get length() {
    return memoryStorage.size
  },
  clear: () => memoryStorage.clear(),
  getItem: (key: string) => (memoryStorage.has(key) ? memoryStorage.get(key)! : null),
  key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
  removeItem: (key: string) => void memoryStorage.delete(key),
  setItem: (key: string, value: string) => void memoryStorage.set(key, String(value)),
}
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: storageObj,
})
Object.defineProperty(window, 'sessionStorage', {
  configurable: true,
  writable: true,
  value: storageObj,
})

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver
