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

  it('starts with the provided initial selection', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const getItemId = (i: { id: string }) => i.id
    const { result } = renderHook(() =>
      useMultiSelect({ items, getItemId, initialSelected: ['a'] }),
    )

    expect(result.current.isSelected('a')).toBe(true)
    expect(result.current.isSelected('b')).toBe(false)
    expect(result.current.isIndeterminate).toBe(true)
  })

  it('selects an individual item and reports the change', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const getItemId = (i: { id: string }) => i.id
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useMultiSelect({ items, getItemId, onSelectionChange }),
    )

    act(() => {
      result.current.selectItem('b')
    })

    expect(result.current.isSelected('b')).toBe(true)
    expect(onSelectionChange).toHaveBeenCalledWith(['b'])
  })

  it('deselects an individual item and reports the change', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const getItemId = (i: { id: string }) => i.id
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useMultiSelect({ items, getItemId, initialSelected: ['a', 'b'], onSelectionChange }),
    )

    act(() => {
      result.current.deselectItem('a')
    })

    expect(result.current.selected.size).toBe(1)
    expect(onSelectionChange).toHaveBeenCalledWith(['b'])
  })

  it('clears the selection and reports the change', () => {
    const items = [{ id: 'a' }]
    const getItemId = (i: { id: string }) => i.id
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useMultiSelect({ items, getItemId, onSelectionChange }),
    )

    act(() => {
      result.current.selectAll()
    })
    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selected.size).toBe(0)
    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it('exposes the derived selected items list', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const getItemId = (i: { id: string }) => i.id
    const { result } = renderHook(() =>
      useMultiSelect({ items, getItemId, initialSelected: ['a', 'b'] }),
    )

    expect(result.current.selectedItems()).toHaveLength(2)

    act(() => {
      result.current.toggleSelect('a')
    })

    expect(result.current.selectedItems()).toHaveLength(1)
  })
})
