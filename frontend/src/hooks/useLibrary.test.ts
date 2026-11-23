import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '../../test/utils/render'
import { useLibrary } from './useLibrary'

describe('useLibrary', () => {
  it('starts in a loading state', () => {
    const { result } = renderHook(() => useLibrary({}))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.fetchStatus).toBe('fetching')
  })

  it('returns the library items from the query', async () => {
    const { result } = renderHook(() => useLibrary({}))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      items: [],
      nextCursor: null,
    })
    expect(result.current.isError).toBe(false)
  })

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useLibrary({ enabled: false }))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })
})
