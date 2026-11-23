import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils/render'
import LibraryRoute, { validateLibrarySearch } from './library'
import type { LibraryItem } from '../types/library'

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  search: { view: 'table', sortField: 'title', sortDir: 'asc' as 'asc' | 'desc' },
}))

const libraryMocks = vi.hoisted(() => ({
  data: {
    items: [
      {
        id: 'doc-1',
        title: 'The Odyssey',
        authors: 'Homer',
        publicationYear: 800,
        processingStatus: 'COMPLETED',
      },
    ] as LibraryItem[],
  },
  isLoading: false,
  isError: false,
  error: null as Error | null,
}))

vi.mock('../hooks/useLibrary', () => ({
  useLibrary: () => libraryMocks,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate,
    useSearch: () => routerMocks.search,
  }
})

describe('library route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMocks.navigate.mockClear()
    routerMocks.search = { view: 'table', sortField: 'title', sortDir: 'asc' }
    libraryMocks.data = {
      items: [
        {
          id: 'doc-1',
          title: 'The Odyssey',
          authors: 'Homer',
          publicationYear: 800,
          processingStatus: 'COMPLETED',
        },
      ],
    }
    libraryMocks.isLoading = false
    libraryMocks.isError = false
    libraryMocks.error = null
  })

  it('validates the search params with defaults for unknown values', () => {
    expect(validateLibrarySearch({})).toEqual({ view: 'table', sortField: 'title', sortDir: 'asc' })
    expect(validateLibrarySearch({ view: 'card', sortField: 'bogus', sortDir: 'sideways' })).toEqual({
      view: 'card',
      sortField: 'title',
      sortDir: 'asc',
    })
    expect(
      validateLibrarySearch({ view: 'card', sortField: 'authors', sortDir: 'desc' }),
    ).toEqual({ view: 'card', sortField: 'authors', sortDir: 'desc' })
  })

  it('renders the table view by default', () => {
    render(<LibraryRoute />)

    expect(screen.getByTestId('library-table')).toBeInTheDocument()
  })

  it('renders the card view when the search requests it', () => {
    routerMocks.search = { view: 'card', sortField: 'title', sortDir: 'asc' }
    render(<LibraryRoute />)

    expect(screen.getByTestId('library-cards')).toBeInTheDocument()
  })

  it('renders an error state when the library query fails', () => {
    libraryMocks.isError = true
    libraryMocks.error = new Error('database down')

    render(<LibraryRoute />)

    expect(screen.getByText('Failed to load the library: database down')).toBeInTheDocument()
  })

  it('sorts via the navigate callback and tracks the first sort direction', () => {
    render(<LibraryRoute />)

    fireEvent.click(screen.getByRole('button', { name: /sort by title/i }))

    expect(routerMocks.navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/library',
        search: expect.any(Function),
      }),
    )
  })

  it('shows the selection toolbar after selecting all and clears it', () => {
    render(<LibraryRoute />)

    fireEvent.click(screen.getByTestId('select-all'))

    expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('selection-count')).toHaveTextContent('1 selected')

    fireEvent.click(screen.getByTestId('selection-clear'))

    expect(screen.queryByTestId('selection-toolbar')).not.toBeInTheDocument()
  })

  it('shows an error state when the library fails to load', () => {
    libraryMocks.isError = true
    libraryMocks.error = new Error('database down')

    render(<LibraryRoute />)

    expect(screen.getByText('Failed to load the library: database down')).toBeInTheDocument()
  })

  it('toggles a single row selection', () => {
    render(<LibraryRoute />)

    fireEvent.click(screen.getByTestId('row-select'))

    expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('selection-count')).toHaveTextContent('1 selected')
  })

  it('deselects a selected row on a second toggle', () => {
    render(<LibraryRoute />)

    fireEvent.click(screen.getByTestId('row-select'))
    expect(screen.getByTestId('selection-count')).toHaveTextContent('1 selected')

    fireEvent.click(screen.getByTestId('row-select'))

    expect(screen.queryByTestId('selection-toolbar')).not.toBeInTheDocument()
  })

  it('clears the selection when every row is already selected', () => {
    render(<LibraryRoute />)

    fireEvent.click(screen.getByTestId('select-all'))
    expect(screen.getByTestId('selection-count')).toHaveTextContent('1 selected')

    fireEvent.click(screen.getByTestId('select-all'))

    expect(screen.queryByTestId('selection-toolbar')).not.toBeInTheDocument()
  })

  it('respects the chosen direction once the user has sorted', () => {
    const { rerender } = render(<LibraryRoute />)

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Authors' }))

    const firstCall = routerMocks.navigate.mock.calls[0][0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
    }
    routerMocks.search = firstCall.search(routerMocks.search) as typeof routerMocks.search
    rerender(<LibraryRoute />)

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Authors' }))

    expect(routerMocks.navigate).toHaveBeenCalledTimes(2)
    const secondCall = routerMocks.navigate.mock.calls[1][0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
    }
    expect(secondCall.search(routerMocks.search)).toEqual({
      view: 'table',
      sortField: 'authors',
      sortDir: 'desc',
    })
  })
})
