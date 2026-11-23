import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePDFReader } from './usePDFReader'

describe('usePDFReader', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts at default state', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    expect(result.current.pageNumber).toBe(1)
    expect(result.current.scale).toBe(1)
    expect(result.current.numPages).toBe(0)
    expect(result.current.searchTerm).toBe('')
  })

  it('moves to next and previous pages', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))

    act(() => result.current.nextPage())
    expect(result.current.pageNumber).toBe(2)

    act(() => result.current.previousPage())
    expect(result.current.pageNumber).toBe(1)
  })

  it('clamps previous to page 1', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setPageNumber(5))
    expect(result.current.pageNumber).toBe(5)
    act(() => result.current.previousPage())
    expect(result.current.pageNumber).toBe(4)
  })

  it('clamps scale into [0.25, 4]', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setScale(10))
    expect(result.current.scale).toBe(4)
    act(() => result.current.setScale(0))
    expect(result.current.scale).toBe(0.25)
  })

  it('zooms in and out', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.zoomIn())
    expect(result.current.scale).toBe(1.25)
    act(() => result.current.zoomOut())
    expect(result.current.scale).toBe(1)
  })

  it('rotates clockwise through 90/180/270/360', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.rotateClockwise())
    expect(result.current.rotation).toBe(90)
    act(() => result.current.rotateClockwise())
    expect(result.current.rotation).toBe(180)
    act(() => result.current.rotateClockwise())
    expect(result.current.rotation).toBe(270)
    act(() => result.current.rotateClockwise())
    expect(result.current.rotation).toBe(0)
  })

  it('sets view mode and search term', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setViewMode('page'))
    expect(result.current.viewMode).toBe('page')
    act(() => result.current.setSearchTerm('foo'))
    expect(result.current.searchTerm).toBe('foo')
  })

  it('resets to defaults', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setPageNumber(3))
    act(() => result.current.reset())
    expect(result.current.pageNumber).toBe(1)
  })
})
