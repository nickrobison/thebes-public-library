import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../test/utils/render'
import { ProcessingPanel } from './ProcessingPanel'

describe('ProcessingPanel', () => {
  it('renders collapsed with the history heading', () => {
    render(<ProcessingPanel documentId="doc-1" />)

    expect(screen.getByTestId('processing-panel')).toBeInTheDocument()
    expect(screen.getByText('Processing History')).toBeInTheDocument()
    expect(screen.queryByText('No processing history available')).not.toBeInTheDocument()
  })

  it('expands and shows the empty history state', async () => {
    render(<ProcessingPanel documentId="doc-1" />)

    fireEvent.click(screen.getByText('Processing History'))

    await waitFor(() => expect(screen.getByText('No processing history available')).toBeInTheDocument())
  })
})
