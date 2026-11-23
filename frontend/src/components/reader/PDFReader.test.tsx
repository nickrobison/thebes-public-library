import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/render'
import { PDFReader } from './PDFReader'

const mocks = vi.hoisted(() => ({ error: null as Error | null }))

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
  return {
    Document: MockDocument,
    Page: () => React.createElement('div', { 'data-testid': 'pdf-page' }),
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
  }
})

describe('PDFReader', () => {
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
})
