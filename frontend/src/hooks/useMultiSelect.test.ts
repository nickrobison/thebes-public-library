import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMultiSelect } from './useMultiSelect'

describe('useMultiSelect', () => {
  it('tracks selection', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const getItemId = (i: { id: string }) => i.id
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ items, getItemId, onSelectionChange }),
    )

    expect(result.current.selected.size).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.isIndeterminate).toBe(false)

    act(() => {
      result.current.selectAll()
    })
    expect(result.current.isAllSelected).toBe(true)
    expect(result.current.isIndeterminate).toBe(false)

    act(() => {
      result.current.deselectAll()
    })
    expect(result.current.selected.size).toBe(0)
  })

  it('toggles individual items', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const getItemId = (i: { id: string }) => i.id

    const { result } = renderHook(() => useMultiSelect({ items, getItemId }))

    act(() => {
      result.current.toggleSelect('a')
    })
    expect(result.current.isSelected('a')).toBe(true)
    expect(result.current.isIndeterminate).toBe(true)
    expect(result.current.selectedItems()).toHaveLength(1)

    act(() => {
      result.current.toggleSelect('a')
    })
    expect(result.current.isSelected('a')).toBe(false)
  })
})
