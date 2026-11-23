import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/render'
import { PDFReader } from './PDFReader'

const mocks = vi.hoisted(() => ({
  error: null as Error | null,
  reportRender: true,
}))

vi.mock('react-pdf', async () => {
  const React = await import('react')
  const { useEffect } = React as typeof React
  const MockDocument = ({ loading, onLoadError, children }: any) => {
    useEffect(() => {
      if (mocks.error) {
        onLoadError?.(mocks.error)
      }
    }, [])
    if (mocks.error) {
      return React.createElement('div', null, 'Failed to load PDF document')
    }
    return React.createElement('div', null, loading, children)
  }
  const MockPage = ({ onRenderSuccess, customTextRenderer, width, height }: any) => {
    useEffect(() => {
      if (mocks.reportRender) {
        onRenderSuccess?.({ width: 612, height: 792 })
      }
    }, [])
    const text =
      typeof customTextRenderer === 'function'
        ? customTextRenderer({ pageIndex: 0, pageNumber: 1, itemIndex: 0, str: 'The quick brown fox' })
        : null
    return React.createElement(
      'div',
      { 'data-testid': 'pdf-page', 'data-width': width, 'data-height': height },
      text,
    )
  }
  return {
    Document: MockDocument,
    Page: MockPage,
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
  }
})

describe('PDFReader', () => {
  beforeEach(() => {
    mocks.error = null
    mocks.reportRender = true
    vi.stubGlobal(
      'requestFullscreen',
      vi.fn().mockResolvedValue(undefined),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the loading state while the document loads', () => {
    mocks.error = null
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    expect(screen.getByText('Loading PDF...')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-page')).toBeInTheDocument()
  })

  it('renders the reader toolbar with the download url and filename', () => {
    mocks.error = null
    render(<PDFReader documentId="doc-1" artifactId="art-1" downloadFilename="paper.pdf" />)

    expect(screen.getByTestId('reader-download')).toHaveAttribute('href', '/api/v1/artifacts/art-1/content')
    expect(screen.getByTestId('reader-download')).toHaveAttribute('download', 'paper.pdf')
    expect(screen.getByTestId('reader-zoom-level')).toBeInTheDocument()
  })

  it('shows an error state and a retry action when loading fails', async () => {
    mocks.error = new Error('boom')
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load PDF: boom')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  })

  it('shows the not-available message for 404 load errors', async () => {
    mocks.error = new Error('404 Not Found')
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    await waitFor(() => {
      expect(screen.getByText('Document not available yet. Please try again later.')).toBeInTheDocument()
    })
  })

  it('returns to the loading state after a successful retry', async () => {
    mocks.error = new Error('boom')
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load PDF: boom')).toBeInTheDocument()
    })

    mocks.error = null
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(screen.getByText('Loading PDF...')).toBeInTheDocument()
    })
  })

  it('toggles fullscreen on the rendered container', async () => {
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const exitFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      writable: true,
      value: requestFullscreen,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      writable: true,
      value: exitFullscreen,
    })

    fireEvent.click(screen.getByTestId('reader-fullscreen'))

    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByTestId('reader-fullscreen'))

    await waitFor(() => expect(exitFullscreen).toHaveBeenCalledTimes(1))
  })

  it('highlights search matches through the custom text renderer', async () => {
    mocks.error = null
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    fireEvent.change(screen.getByTestId('reader-search'), { target: { value: 'quick' } })

    await waitFor(() => {
      expect(screen.getByTestId('pdf-page')).toHaveTextContent('quick')
    })
    expect(document.querySelector('mark')).not.toBeNull()
  })

  it('omits explicit page dimensions when the page has not rendered', () => {
    mocks.reportRender = false
    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    expect(screen.getByTestId('pdf-page')).not.toHaveAttribute('data-width')
  })

  it('fits the page to the container width', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 800,
    })

    try {
      render(<PDFReader documentId="doc-1" artifactId="art-1" />)

      const page = await waitFor(() => {
        const el = screen.getByTestId('pdf-page')
        expect(el.getAttribute('data-width')).not.toBe('undefined')
        return el
      })

      // 800 / 612 zoom, clamped under 4x.
      expect(screen.getByTestId('reader-zoom-level')).toHaveTextContent('131%')
      expect(Number(page.getAttribute('data-width'))).toBeCloseTo(800, 0)
      expect(Number(page.getAttribute('data-height'))).toBeCloseTo(1035.3, 0)
    } finally {
      delete (HTMLElement.prototype as any).clientWidth
    }
  })

  it('scales the page to fit the viewport in page mode', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 800,
    })

    try {
      render(<PDFReader documentId="doc-1" artifactId="art-1" />)

      await waitFor(() => {
        expect(screen.getByTestId('reader-zoom-level')).toHaveTextContent('131%')
      })

      fireEvent.click(screen.getByTestId('reader-fit-page'))

      await waitFor(() => {
        const width = Number(screen.getByTestId('pdf-page').getAttribute('data-width'))
        const height = Number(screen.getByTestId('pdf-page').getAttribute('data-height'))
        expect(height).toBeGreaterThan(0)
        expect(height).toBeLessThanOrEqual(window.innerHeight * 0.85 + 1)
        expect(width).toBeGreaterThan(0)
        expect(width).toBeLessThan(800)
      })
    } finally {
      delete (HTMLElement.prototype as any).clientWidth
    }
  })

  it('ignores fullscreen request failures', async () => {
    Object.defineProperty(window.HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      writable: true,
      value: vi.fn().mockRejectedValue(new Error('denied')),
    })

    render(<PDFReader documentId="doc-1" artifactId="art-1" />)

    fireEvent.click(screen.getByTestId('reader-fullscreen'))

    await waitFor(() => {
      expect(screen.getByTestId('reader-fullscreen')).toBeInTheDocument()
    })
    expect(screen.queryByText(/Failed to load PDF/)).not.toBeInTheDocument()
  })
})
