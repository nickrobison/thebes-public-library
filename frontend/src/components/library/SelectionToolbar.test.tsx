import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils/render'
import { SelectionToolbar } from './SelectionToolbar'

describe('SelectionToolbar', () => {
  it('renders nothing when nothing is selected', () => {
    render(<SelectionToolbar selectedCount={0} onClear={() => {}} />)
    expect(screen.queryByTestId('selection-toolbar')).not.toBeInTheDocument()
  })

  it('renders the selection count and disabled bulk actions', () => {
    render(<SelectionToolbar selectedCount={2} onClear={() => {}} />)

    expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('selection-count')).toHaveTextContent('2 selected')
    expect(screen.getByRole('button', { name: 'Add to collection' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tag' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  it('clears the selection when the clear button is clicked', () => {
    const onClear = vi.fn()
    render(<SelectionToolbar selectedCount={1} onClear={onClear} />)

    screen.getByTestId('selection-clear').click()
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
