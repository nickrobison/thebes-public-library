import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils/render'
import { ImportButton } from './ImportButton'

describe('ImportButton', () => {
  it('opens the import dialog from the trigger', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    render(<ImportButton />)

    await user.click(screen.getByRole('button', { name: 'Import' }))

    expect(screen.getByText('Import Documents')).toBeInTheDocument()
    expect(screen.getByText('Single File Upload')).toBeInTheDocument()
  })
})
