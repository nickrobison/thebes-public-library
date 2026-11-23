import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../test/utils/render'
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
  PDFReader: () => React.createElement('div', { 'data-testid': 'pdf-reader-stub' }),
}))
vi.mock('../components/metadata/MetadataPanel', () => ({
  MetadataPanel: () => React.createElement('div', { 'data-testid': 'metadata-panel-stub' }),
}))
vi.mock('../components/artifacts/ArtifactsPanel', () => ({
  ArtifactsPanel: () => React.createElement('div', { 'data-testid': 'artifacts-panel-stub' }),
}))
vi.mock('../components/processing/ProcessingPanel', () => ({
  ProcessingPanel: () => React.createElement('div', { 'data-testid': 'processing-panel-stub' }),
}))
vi.mock('../components/workspace/LibrarySidebar', () => ({
  LibrarySidebar: () => React.createElement('div', { 'data-testid': 'library-sidebar-stub' }),
}))
vi.mock('../components/workspace/SplitPane', () => ({
  SplitPane: ({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, left, right),
}))
vi.mock('../components/workspace/DocumentActions', () => ({
  DocumentActions: () => React.createElement('div', { 'data-testid': 'document-actions-stub' }),
}))

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
    expect(screen.getByTestId('pdf-reader-stub')).toBeInTheDocument()
    expect(screen.getByTestId('library-sidebar-stub')).toBeInTheDocument()
    expect(screen.getByTestId('metadata-panel-stub')).toBeInTheDocument()
    expect(screen.getByTestId('artifacts-panel-stub')).toBeInTheDocument()
    expect(screen.getByTestId('processing-panel-stub')).toBeInTheDocument()
    expect(screen.getByTestId('document-actions-stub')).toBeInTheDocument()
  })
})
