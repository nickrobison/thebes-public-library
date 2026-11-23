import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { ReaderToolbar } from './ReaderToolbar'

function renderToolbar(overrides: Partial<Parameters<typeof ReaderToolbar>[0]> = {}) {
  const props: Parameters<typeof ReaderToolbar>[0] = {
    pageNumber: 1,
    numPages: 10,
    scale: 1,
    rotation: 0,
    viewMode: 'width',
    searchTerm: '',
    onPageChange: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onRotate: vi.fn(),
    onViewModeChange: vi.fn(),
    onSearchChange: vi.fn(),
    onFullscreen: vi.fn(),
    downloadUrl: '/api/v1/artifacts/art-1/content',
    downloadFilename: 'doc.pdf',
    ...overrides,
  }
  const utils = render(<ReaderToolbar {...props} />)
  return { ...utils, props }
}

describe('ReaderToolbar', () => {
  it('renders the toolbar with zoom level and page total', () => {
    renderToolbar({ pageNumber: 2, numPages: 10, scale: 1.5 })

    expect(screen.getByRole('toolbar', { name: 'PDF reader controls' })).toBeInTheDocument()
    expect(screen.getByTestId('reader-zoom-level')).toHaveTextContent('150%')
    expect(screen.getByTestId('reader-page-total')).toHaveTextContent('of 10')
    expect(screen.getByTestId('reader-page-input')).toHaveValue(2)
  })

  it('disables previous on the first page and next on the last page', () => {
    renderToolbar({ pageNumber: 1, numPages: 10 })

    expect(screen.getByTestId('reader-prev')).toBeDisabled()
    expect(screen.getByTestId('reader-next')).toBeEnabled()
  })

  it('disables next on the last page', () => {
    renderToolbar({ pageNumber: 10, numPages: 10 })

    expect(screen.getByTestId('reader-next')).toBeDisabled()
  })

  it('invokes page navigation callbacks from the page controls', () => {
    const onPageChange = vi.fn()
    const onNext = vi.fn()
    renderToolbar({ pageNumber: 1, numPages: 10, onPageChange, onNext })

    fireEvent.click(screen.getByTestId('reader-next'))
    expect(onNext).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByTestId('reader-page-input'), { target: { value: '5' } })
    expect(onPageChange).toHaveBeenCalledWith(5)

    fireEvent.keyDown(screen.getByTestId('reader-page-input'), { key: 'Enter' })
    expect(onPageChange).toHaveBeenCalledWith(5)
  })

  it('ignores invalid page input values', () => {
    const onPageChange = vi.fn()
    renderToolbar({ pageNumber: 1, numPages: 10, onPageChange })

    fireEvent.change(screen.getByTestId('reader-page-input'), { target: { value: '0' } })
    expect(onPageChange).not.toHaveBeenCalled()

    fireEvent.change(screen.getByTestId('reader-page-input'), { target: { value: '99' } })
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('invokes zoom, fit, search, rotate and fullscreen callbacks', () => {
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()
    const onViewModeChange = vi.fn()
    const onSearchChange = vi.fn()
    const onRotate = vi.fn()
    const onFullscreen = vi.fn()
    renderToolbar({
      pageNumber: 1,
      numPages: 10,
      onZoomIn,
      onZoomOut,
      onViewModeChange,
      onSearchChange,
      onRotate,
      onFullscreen,
    })

    fireEvent.click(screen.getByTestId('reader-zoom-in'))
    expect(onZoomIn).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('reader-zoom-out'))
    expect(onZoomOut).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('reader-fit-width'))
    expect(onViewModeChange).toHaveBeenCalledWith('width')

    fireEvent.click(screen.getByTestId('reader-fit-page'))
    expect(onViewModeChange).toHaveBeenCalledWith('page')

    fireEvent.change(screen.getByTestId('reader-search'), { target: { value: 'foo' } })
    expect(onSearchChange).toHaveBeenCalledWith('foo')

    fireEvent.click(screen.getByTestId('reader-rotate'))
    expect(onRotate).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('reader-fullscreen'))
    expect(onFullscreen).toHaveBeenCalledTimes(1)
  })

  it('exposes the download link with the artifact url and filename', () => {
    renderToolbar({ downloadUrl: '/api/v1/artifacts/art-9/content', downloadFilename: 'paper.pdf' })

    const download = screen.getByTestId('reader-download') as HTMLAnchorElement
    expect(download).toHaveAttribute('href', '/api/v1/artifacts/art-9/content')
    expect(download).toHaveAttribute('download', 'paper.pdf')
  })

  it('highlights only the active fit mode', () => {
    renderToolbar({ viewMode: 'page' })

    expect(screen.getByTestId('reader-fit-page')).toHaveClass('bg-blue-100')
    expect(screen.getByTestId('reader-fit-width')).not.toHaveClass('bg-blue-100')
  })

  it('highlights the width mode button in width view', () => {
    renderToolbar({ viewMode: 'width' })

    expect(screen.getByTestId('reader-fit-width')).toHaveClass('bg-blue-100')
    expect(screen.getByTestId('reader-fit-page')).not.toHaveClass('bg-blue-100')
  })

  it('ignores empty page input changes and empty enter presses', () => {
    const onPageChange = vi.fn()
    renderToolbar({ onPageChange })

    const input = screen.getByTestId('reader-page-input')

    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter', target: { value: '' } })

    expect(onPageChange).not.toHaveBeenCalled()
  })
})
