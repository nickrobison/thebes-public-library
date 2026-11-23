import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { BulkActionButton } from './BulkActionButton'

const items = [
  { id: 'art-1', filename: 'a.pdf', originalFilename: 'a.pdf' },
  { id: 'art-2', filename: 'b.pdf', originalFilename: 'b.pdf' },
]

describe('BulkActionButton', () => {
  it('opens the action menu on click and calls the action', () => {
    const onAction = vi.fn()
    render(<BulkActionButton items={items} onAction={onAction} />)

    fireEvent.click(screen.getByRole('button', { name: /Bulk Actions/ }))

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Metadata' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processing History' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Download' }))

    expect(onAction).toHaveBeenCalledWith('download', ['art-1', 'art-2'])
  })
})
