import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { LibraryTable } from './LibraryTable'
import type { LibraryItem } from '../../types/library'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const items: LibraryItem[] = [
  {
    id: 'doc-1',
    title: 'The Odyssey',
    authors: 'Homer',
    publicationYear: 800,
    processingStatus: 'COMPLETED',
  },
]

describe('LibraryTable', () => {
  it('renders headers and rows', () => {
    render(
      <LibraryTable
        items={items}
        sortField="title"
        sortDir="asc"
        onSortChange={() => {}}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
      />,
    )

    expect(screen.getByTestId('library-table')).toBeInTheDocument()
    expect(screen.getByTestId('cell-title').textContent).toBe('The Odyssey')
    expect(screen.getByText('Homer')).toBeInTheDocument()
    expect(screen.getByText('800')).toBeInTheDocument()
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })

  it('renders a loading row when loading', () => {
    render(
      <LibraryTable
        items={[]}
        sortField="title"
        sortDir="asc"
        onSortChange={() => {}}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        isLoading
      />,
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders the empty state when there are no items', () => {
    render(
      <LibraryTable
        items={[]}
        sortField="title"
        sortDir="asc"
        onSortChange={() => {}}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
        emptyMessage="No documents yet."
      />,
    )
    expect(screen.getByText('No documents yet.')).toBeInTheDocument()
  })

  it('sort buttons call onSortChange with the field', () => {
    const onSortChange = vi.fn()
    render(
      <LibraryTable
        items={items}
        sortField="title"
        sortDir="asc"
        onSortChange={onSortChange}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Title' }))
    expect(onSortChange).toHaveBeenCalledWith('title', 'desc')

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Authors' }))
    expect(onSortChange).toHaveBeenCalledWith('authors', 'asc')
  })
})
