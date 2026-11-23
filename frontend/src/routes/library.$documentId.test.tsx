import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../../test/utils/render'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  const React = await import('react')
  const Link = ({ children, ...props }: Record<string, unknown>) =>
    React.createElement('a', props, children)
  return {
    ...actual,
    Link,
    useParams: () => ({ documentId: 'doc-1' }),
    useNavigate: () => vi.fn(),
    useSearch: () => ({ view: 'table', sortField: 'title', sortDir: 'asc' }),
  }
})

vi.mock('../components/reader/PDFReader', () => ({
  PDFReader: () => React.createElement('div', { 'data-testid': 'pdf-page-container' }),
}))
vi.mock('../components/metadata/MetadataPanel', () => ({
  MetadataPanel: () => React.createElement('div', { 'data-testid': 'metadata-panel' }),
}))
vi.mock('../components/artifacts/ArtifactsPanel', () => ({
  ArtifactsPanel: () => React.createElement('div', { 'data-testid': 'artifacts-panel' }),
}))
vi.mock('../components/processing/ProcessingPanel', () => ({
  ProcessingPanel: () => React.createElement('div', { 'data-testid': 'processing-panel' }),
}))
vi.mock('../components/workspace/LibrarySidebar', () => ({
  LibrarySidebar: ({ collapsed, onCollapsedChange }: any) =>
    React.createElement('div', {
      'data-testid': 'library-sidebar-stub',
      'data-collapsed': String(collapsed),
      onClick: () => onCollapsedChange?.(true),
    }),
}))
vi.mock('../components/workspace/SplitPane', () => ({
  SplitPane: ({ left, right, leftPercent, onLeftPercentChange }: any) =>
    React.createElement('div', {
      'data-testid': 'split-pane-stub',
      'data-left-percent': String(leftPercent),
      onClick: () => onLeftPercentChange?.(50),
    }, left, right),
}))
import { DocumentActions } from '../components/workspace/DocumentActions'

// @ts-expect-error - React is a type-only import inside vi.mock factory scope
import React from 'react'

import LibraryDocumentRoute from './library.$documentId'

describe('library.$documentId route', () => {
  it('shows a loading state while the document loads', () => {
    server.use(http.get('/api/v1/documents/:id', () => new Promise(() => {})))

    render(<LibraryDocumentRoute />)

    expect(screen.getByText('Loading document…')).toBeInTheDocument()
  })

  it('shows an error state when loading fails', async () => {
    server.use(http.get('/api/v1/documents/:id', () => new HttpResponse('boom', { status: 500 })))

    render(<LibraryDocumentRoute />)

    await waitFor(() => expect(screen.getByText(/Failed to load document/)).toBeInTheDocument())
  })

  it('shows a not-found state when the document does not exist', async () => {
    server.use(http.get('/api/v1/documents/:id', () => HttpResponse.json(null)))

    render(<LibraryDocumentRoute />)

    await waitFor(() => expect(screen.getByText('Document not found.')).toBeInTheDocument())
  })

  it('renders the workspace with the pdf reader when a preferred artifact exists', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          preferredArtifactId: 'art-1',
          artifacts: [
            {
              id: 'art-1',
              documentId: 'doc-1',
              originalFilename: 'odyssey.pdf',
              status: 'AVAILABLE',
              isPreferred: true,
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      ),
    )

    render(<LibraryDocumentRoute />)

    await waitFor(() => expect(screen.getByTestId('document-workspace')).toBeInTheDocument())

    expect(screen.getByTestId('document-title')).toHaveTextContent('The Odyssey')
    expect(screen.getByTestId('pdf-page-container')).toBeInTheDocument()
    expect(screen.getByTestId('library-sidebar-stub')).toBeInTheDocument()
    expect(screen.getByTestId('metadata-panel')).toBeInTheDocument()
    expect(screen.getByTestId('artifacts-panel')).toBeInTheDocument()
    expect(screen.getByTestId('processing-panel')).toBeInTheDocument()
    expect(screen.getByTestId('document-actions-trigger')).toBeInTheDocument()
  })

  it('shows a fallback when the document has no artifacts', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () => HttpResponse.json({ id: 'doc-1', title: 'The Odyssey', version: 3, artifacts: [] })),
    )

    render(<LibraryDocumentRoute />)

    await waitFor(() => {
      expect(screen.getByText('This document has no artifacts yet.')).toBeInTheDocument()
    })
  })

  it('falls back to the default split percent when no size is stored', async () => {
    localStorage.setItem(
      'tpl:library:prefs:v1',
      JSON.stringify({ viewMode: 'table', splitPaneSizes: [] }),
    )
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          version: 3,
          artifacts: [],
        }),
      ),
    )

    render(<LibraryDocumentRoute />)

    const splitPane = await screen.findByTestId('split-pane-stub')
    expect(splitPane).toHaveAttribute('data-left-percent', '28')
    localStorage.removeItem('tpl:library:prefs:v1')
  })

  it('updates the split pane size through preferences', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          preferredArtifactId: 'art-1',
          artifacts: [
            {
              id: 'art-1',
              documentId: 'doc-1',
              originalFilename: 'odyssey.pdf',
              status: 'AVAILABLE',
              isPreferred: true,
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      ),
    )

    render(<LibraryDocumentRoute />)

    const splitPane = await screen.findByTestId('split-pane-stub')
    expect(splitPane).toHaveAttribute('data-left-percent', '33')

    fireEvent.click(splitPane)

    await waitFor(() => expect(screen.getByTestId('split-pane-stub')).toHaveAttribute('data-left-percent', '50'))
  })

  it('collapses the sidebar through preferences', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          preferredArtifactId: 'art-1',
          artifacts: [
            {
              id: 'art-1',
              documentId: 'doc-1',
              originalFilename: 'odyssey.pdf',
              status: 'AVAILABLE',
              isPreferred: true,
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      ),
    )

    render(<LibraryDocumentRoute />)

    const sidebar = await screen.findByTestId('library-sidebar-stub')
    expect(sidebar).toHaveAttribute('data-collapsed', 'false')

    fireEvent.click(sidebar)

    await waitFor(() => expect(screen.getByTestId('library-sidebar-stub')).toHaveAttribute('data-collapsed', 'true'))
  })

  it('reveals a side panel through the document actions menu', async () => {
    server.use(
      http.get('/api/v1/documents/:id', () =>
        HttpResponse.json({
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          version: 3,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          preferredArtifactId: 'art-1',
          artifacts: [
            {
              id: 'art-1',
              documentId: 'doc-1',
              originalFilename: 'odyssey.pdf',
              status: 'AVAILABLE',
              isPreferred: true,
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      ),
    )

    const scrollSpy = vi.fn()
    Element.prototype.scrollIntoView = scrollSpy

    render(<LibraryDocumentRoute />)

    await screen.findByTestId('document-workspace')

    fireEvent.click(screen.getByTestId('document-actions-trigger'))
    fireEvent.click(screen.getByTestId('action-view-processing'))

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })
})
