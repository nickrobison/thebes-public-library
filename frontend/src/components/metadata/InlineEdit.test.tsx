import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { InlineEdit } from './InlineEdit'

describe('InlineEdit', () => {
  it('renders the current value', () => {
    render(<InlineEdit field="title" value="The Odyssey" onSave={() => {}} />)
    expect(screen.getByText('The Odyssey')).toBeInTheDocument()
  })

  it('renders the placeholder when empty', () => {
    render(<InlineEdit field="title" value="" onSave={() => {}} placeholder="Enter title" />)
    expect(screen.getByText('Enter title')).toBeInTheDocument()
  })

  it('renders the default hint when no placeholder is given', () => {
    render(<InlineEdit field="title" value="" onSave={() => {}} />)
    expect(screen.getByText('Click to edit')).toBeInTheDocument()
  })

  it('enters edit mode on double click and saves on blur when changed', () => {
    const onSave = vi.fn()
    render(<InlineEdit field="title" value="Old" onSave={onSave} />)

    fireEvent.doubleClick(screen.getByText('Old'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Old')

    fireEvent.change(input, { target: { value: 'New' } })
    fireEvent.blur(input)

    expect(onSave).toHaveBeenCalledWith('title', 'New')
  })

  it('does not save when the value did not change', () => {
    const onSave = vi.fn()
    render(<InlineEdit field="title" value="Same" onSave={onSave} />)

    fireEvent.doubleClick(screen.getByText('Same'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Same' } })
    fireEvent.blur(input)

    expect(onSave).not.toHaveBeenCalled()
  })

  it('cancels on Escape without saving', () => {
    const onSave = vi.fn()
    render(<InlineEdit field="title" value="Old" onSave={onSave} />)

    fireEvent.doubleClick(screen.getByText('Old'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves on Enter', () => {
    const onSave = vi.fn()
    render(<InlineEdit field="title" value="Old" onSave={onSave} />)

    fireEvent.doubleClick(screen.getByText('Old'))
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'New' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSave).toHaveBeenCalledWith('title', 'New')
  })
})
