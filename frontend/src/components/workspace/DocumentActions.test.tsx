import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils/render'
import { DocumentActions } from './DocumentActions'

describe('DocumentActions', () => {
  it('renders the trigger button', () => {
    render(<DocumentActions />)
    expect(screen.getByTestId('document-actions-trigger')).toBeInTheDocument()
  })

  it('does not render the menu when closed', () => {
    render(<DocumentActions />)
    expect(screen.queryByTestId('document-actions-menu')).not.toBeInTheDocument()
  })

  it('opens the menu and runs the chosen action', () => {
    const onEditMetadata = vi.fn()
    const onViewProcessingHistory = vi.fn()
    const onAddArtifact = vi.fn()
    render(
      <DocumentActions
        onEditMetadata={onEditMetadata}
        onViewProcessingHistory={onViewProcessingHistory}
        onAddArtifact={onAddArtifact}
      />,
    )

    fireEvent.click(screen.getByTestId('document-actions-trigger'))
    expect(screen.getByTestId('document-actions-menu')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('action-add-artifact'))
    expect(onAddArtifact).toHaveBeenCalledTimes(1)
    expect(onEditMetadata).not.toHaveBeenCalled()
    expect(onViewProcessingHistory).not.toHaveBeenCalled()
    expect(screen.queryByTestId('document-actions-menu')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onEditMetadata = vi.fn()
    render(<DocumentActions onEditMetadata={onEditMetadata} />)

    fireEvent.click(screen.getByTestId('document-actions-trigger'))
    expect(screen.getByTestId('document-actions-menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('document-actions-menu')).not.toBeInTheDocument()
  })

  it('closes on outside mousedown', () => {
    const onEditMetadata = vi.fn()
    render(<DocumentActions onEditMetadata={onEditMetadata} />)

    fireEvent.click(screen.getByTestId('document-actions-trigger'))
    expect(screen.getByTestId('document-actions-menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('document-actions-menu')).not.toBeInTheDocument()
  })
})
