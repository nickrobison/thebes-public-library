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
})
