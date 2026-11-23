import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { LibrarySidebar } from './LibrarySidebar'
import type { LibraryItem } from '../../types/library'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  const React = await import('react')
  const Link = ({ children, ...props }: Record<string, unknown>) =>
    React.createElement('a', props, children)
  return { ...actual, Link }
})

const items: LibraryItem[] = [
  {
    id: 'doc-1',
    title: 'The Odyssey',
    authors: 'Homer',
    publicationYear: 800,
    processingStatus: 'COMPLETED',
  },
  {
    id: 'doc-2',
    title: 'Meditations',
    authors: null,
    publicationYear: null,
    processingStatus: 'PENDING',
  },
]

describe('LibrarySidebar', () => {
  it('renders the collapsed state with an expand button', () => {
    const onCollapsedChange = vi.fn()
    render(
      <LibrarySidebar items={items} collapsed onCollapsedChange={onCollapsedChange} />,
    )

    fireEvent.click(screen.getByTestId('sidebar-expand'))
    expect(onCollapsedChange).toHaveBeenCalledWith(false)
  })

  it('renders the expanded list when not collapsed', () => {
    render(
      <LibrarySidebar items={items} collapsed={false} onCollapsedChange={() => {}} activeDocumentId="doc-1" />,
    )

    expect(screen.getByTestId('library-sidebar')).toBeInTheDocument()
    expect(screen.getByText('The Odyssey')).toBeInTheDocument()
    expect(screen.getByText('Meditations')).toBeInTheDocument()
  })

  it('shows a loading state while items load', () => {
    render(
      <LibrarySidebar items={[]} collapsed={false} onCollapsedChange={() => {}} isLoading />,
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows an empty state when there are no documents', () => {
    render(
      <LibrarySidebar items={[]} collapsed={false} onCollapsedChange={() => {}} />,
    )
    expect(screen.getByText('No documents yet.')).toBeInTheDocument()
  })

  it('marks the active document', () => {
    render(
      <LibrarySidebar items={items} collapsed={false} onCollapsedChange={() => {}} activeDocumentId="doc-1" />,
    )

    const links = screen.getAllByTestId('sidebar-document-link')
    const active = links.find((link) => link.getAttribute('aria-current') === 'page')
    expect(active).toBeDefined()
    expect(active).toHaveTextContent('The Odyssey')
  })
})
