import { describe, it, expect, beforeEach, vi } from 'vitest'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'
import { getLibrary } from './library'
import type { LibraryResponse } from '../types/library'

const API = '/api/v1/library'

describe('api/library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the library with default pagination and sorting', async () => {
    let seenUrl = ''
    server.use(
      http.get(API, ({ request }) => {
        seenUrl = request.url.toString()
        const body: LibraryResponse = { items: [], nextCursor: null }
        return HttpResponse.json(body)
      }),
    )

    const result = await getLibrary({})

    expect(result).toEqual({ items: [], nextCursor: null })
    expect(seenUrl).toContain('limit=10')
    expect(seenUrl).toContain('sortField=createdAt')
    expect(seenUrl).toContain('sortDir=asc')
    expect(seenUrl).not.toContain('cursor=')
  })

  it('passes limit, cursor and sort fields through', async () => {
    let seenUrl = ''
    server.use(
      http.get(API, ({ request }) => {
        seenUrl = request.url.toString()
        const body: LibraryResponse = { items: [], nextCursor: null }
        return HttpResponse.json(body)
      }),
    )

    await getLibrary({ limit: 50, cursor: 'abc', sortField: 'title', sortDir: 'desc' })

    expect(seenUrl).toContain('limit=50')
    expect(seenUrl).toContain('cursor=abc')
    expect(seenUrl).toContain('sortField=title')
    expect(seenUrl).toContain('sortDir=desc')
  })

  it('throws with the status when the response is not ok', async () => {
    server.use(http.get(API, () => new HttpResponse('boom', { status: 500 })))

    await expect(getLibrary({})).rejects.toThrow('Failed to fetch library data: 500')
  })
})
