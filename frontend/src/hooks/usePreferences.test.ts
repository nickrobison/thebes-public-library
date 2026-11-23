import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePreferences } from './usePreferences'

describe('usePreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default preferences when nothing is stored', async () => {
    const { result } = renderHook(() => usePreferences())

    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    expect(result.current.preferences).toEqual({
      viewMode: 'table',
      sortField: 'title',
      sortDir: 'asc',
      splitPaneSizes: [33, 67],
      panelCollapsedStates: {},
    })
  })

  it('loads stored preferences from localStorage', async () => {
    localStorage.setItem(
      'tpl:library:prefs:v1',
      JSON.stringify({ viewMode: 'card', sortField: 'author' }),
    )

    const { result } = renderHook(() => usePreferences())

    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    expect(result.current.preferences.viewMode).toBe('card')
    expect(result.current.preferences.sortField).toBe('author')
  })

  it('updates preferences', async () => {
    const { result } = renderHook(() => usePreferences())

    await waitFor(() => expect(result.current.isLoaded).toBe(true))

    act(() => {
      result.current.updatePreferences({ viewMode: 'card' })
    })

    expect(result.current.preferences.viewMode).toBe('card')
  })
})
