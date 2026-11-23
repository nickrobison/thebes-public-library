import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUnsavedChanges } from './useUnsavedChanges'

describe('useUnsavedChanges', () => {
  it('exposes showWarning and confirmDiscard', () => {
    const { result } = renderHook(() => useUnsavedChanges(true, {}))

    expect(result.current.showWarning).toBe(false)

    act(() => {
      result.current.setShowWarning(true)
    })

    expect(result.current.showWarning).toBe(true)

    act(() => {
      result.current.confirmDiscard()
    })

    expect(result.current.showWarning).toBe(false)
  })

  it('prevents the default browser unload when there are unsaved changes', () => {
    renderHook(() => useUnsavedChanges(true, {}))

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('does not prevent the default browser unload without unsaved changes', () => {
    renderHook(() => useUnsavedChanges(false, {}))

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('shows the warning when a route change is declined', () => {
    const onRouteChange = () => false
    const { result } = renderHook(() => useUnsavedChanges(true, { onRouteChange }))

    act(() => {
      window.history.pushState({}, '', '/somewhere-else')
    })

    expect(result.current.showWarning).toBe(true)
  })

  it('stays quiet when a route change is accepted', () => {
    const onRouteChange = () => true
    const { result } = renderHook(() => useUnsavedChanges(true, { onRouteChange }))

    act(() => {
      window.history.pushState({}, '', '/somewhere-else-2')
    })

    expect(result.current.showWarning).toBe(false)
  })

  it('handles replaceState as a route change', () => {
    const onRouteChange = () => false
    const { result } = renderHook(() => useUnsavedChanges(true, { onRouteChange }))

    act(() => {
      window.history.replaceState({}, '', '/replaced-path')
    })

    expect(result.current.showWarning).toBe(true)
  })
})
