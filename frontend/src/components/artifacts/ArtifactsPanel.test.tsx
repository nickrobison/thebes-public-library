import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '../../../test/utils/render'
import { ArtifactsPanel } from './ArtifactsPanel'

describe('ArtifactsPanel', () => {
  it('renders the panel container', async () => {
    render(<ArtifactsPanel documentId="doc-1" />)
    await waitFor(() => expect(screen.getByTestId('artifacts-panel')).toBeInTheDocument())
  })

  it('renders the empty state when no artifacts exist', async () => {
    render(<ArtifactsPanel documentId="doc-1" />)

    await waitFor(() => expect(screen.getByText('No artifacts found')).toBeInTheDocument())
  })
})
