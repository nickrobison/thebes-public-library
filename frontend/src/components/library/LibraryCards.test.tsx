import { describe, it, expect } from 'vitest'
import { renderWithRouter, screen } from '../../../test/utils/render'
import { LibraryCards } from './LibraryCards'
import type { LibraryItem } from '../../types/library'

const items: LibraryItem[] = [
  {
    id: 'doc-1',
    title: 'The Odyssey',
    authors: 'Homer',
    publicationYear: 800,
    processingStatus: 'COMPLETED',
  },
]

describe('LibraryCards', () => {
  it('renders loading state', () => {
    renderWithRouter(
      <LibraryCards items={[]} selectedIds={new Set()} onToggleSelect={() => {}} isLoading />,
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders the empty state', () => {
    renderWithRouter(<LibraryCards items={[]} selectedIds={new Set()} onToggleSelect={() => {}} />)
    expect(screen.getByText(/No documents yet/)).toBeInTheDocument()
  })

  it('renders items with title, authors and status', () => {
    renderWithRouter(
      <LibraryCards items={items} selectedIds={new Set()} onToggleSelect={() => {}} />,
    )
    expect(screen.getByTestId('library-cards')).toBeInTheDocument()
    expect(screen.getByText('The Odyssey')).toBeInTheDocument()
    expect(screen.getByText('Homer')).toBeInTheDocument()
    expect(screen.getByText('800')).toBeInTheDocument()
  })

  it('marks selected cards', () => {
    renderWithRouter(
      <LibraryCards items={items} selectedIds={new Set(['doc-1'])} onToggleSelect={() => {}} />,
    )
    expect(screen.getByTestId('card-select')).toBeChecked()
  })
})
