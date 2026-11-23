import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { LibraryTable } from './LibraryTable'
import type { LibraryItem } from '../../types/library'

const routerMocks = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate,
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

  it('navigates to the document when a row is clicked', () => {
    routerMocks.navigate.mockClear()
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

    fireEvent.click(screen.getByTestId('cell-title'))

    expect(routerMocks.navigate).toHaveBeenCalledWith({
      to: '/library/$documentId',
      params: { documentId: 'doc-1' },
    })
  })

  it('toggles the sort direction when the active column is clicked again', () => {
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
    expect(screen.getByRole('button', { name: 'Sort by Title' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  })

  it('shows the descending indicator when sorted descending', () => {
    render(
      <LibraryTable
        items={items}
        sortField="title"
        sortDir="desc"
        onSortChange={() => {}}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Sort by Title' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('flips back to ascending when the active column is already descending', () => {
    const onSortChange = vi.fn()
    render(
      <LibraryTable
        items={items}
        sortField="title"
        sortDir="desc"
        onSortChange={onSortChange}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Title' }))

    expect(onSortChange).toHaveBeenCalledWith('title', 'asc')
  })

  it('renders em dashes for missing authors and publication year', () => {
    render(
      <LibraryTable
        items={[{ ...items[0], authors: '', publicationYear: null }]}
        sortField="title"
        sortDir="asc"
        onSortChange={() => {}}
        selectedIds={new Set()}
        onToggleSelect={() => {}}
        onToggleSelectAll={() => {}}
      />,
    )

    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
