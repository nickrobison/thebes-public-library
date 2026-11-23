import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  it('does not advance past the last page', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setNumPages(3))

    act(() => result.current.nextPage())
    expect(result.current.pageNumber).toBe(2)

    act(() => result.current.nextPage())
    expect(result.current.pageNumber).toBe(3)

    act(() => result.current.nextPage())
    expect(result.current.pageNumber).toBe(3)
  })

  it('clamps the page count to zero', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setNumPages(-5))
    expect(result.current.numPages).toBe(0)
  })

  it('fitWidth ignores invalid dimensions', () => {
    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))

    act(() => result.current.fitWidth(0, 100))
    expect(result.current.scale).toBe(1)

    act(() => result.current.fitWidth(100, 0))
    expect(result.current.scale).toBe(1)

    act(() => result.current.fitWidth(Number.NaN, 100))
    expect(result.current.scale).toBe(1)
  })

  it('hydrates from and persists to localStorage', () => {
    localStorage.setItem('tpl:reader:doc-1:art-1:v1', JSON.stringify({ pageNumber: 4, scale: 2 }))

    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    expect(result.current.pageNumber).toBe(4)
    expect(result.current.scale).toBe(2)

    act(() => result.current.setPageNumber(6))
    expect(localStorage.getItem('tpl:reader:doc-1:art-1:v1')).toContain('"pageNumber":6')
  })

  it('survives corrupt localStorage payloads', () => {
    localStorage.setItem('tpl:reader:doc-1:art-1:v1', 'not-json{')

    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    expect(result.current.pageNumber).toBe(1)
    expect(result.current.scale).toBe(1)
  })

  it('keeps working when persisting to localStorage throws', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    const { result } = renderHook(() => usePDFReader('doc-1', 'art-1'))
    act(() => result.current.setPageNumber(3))

    expect(result.current.pageNumber).toBe(3)
    setItemSpy.mockRestore()
  })
})
