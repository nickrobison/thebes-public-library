import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '../../test/utils/render'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './index'
import { server } from '../../test/setup'
import { http, HttpResponse } from 'msw'

describe('root layout health indicator', () => {
  it('shows a healthy backend when the health check succeeds', async () => {
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('health-indicator')).toHaveTextContent('Backend OK'))
    expect(screen.getByText('Thebes Public Library')).toBeInTheDocument()
  })

  it('shows an unreachable backend when the health check fails', async () => {
    server.use(http.get('/health', () => new HttpResponse('down', { status: 500 })))

    render(<RouterProvider router={router} />)

    await waitFor(() =>
      expect(screen.getByTestId('health-indicator')).toHaveTextContent('Backend unreachable'),
    )
  })

  it('shows an unknown backend label when health omits the status field', async () => {
    server.use(http.get('/health', () => HttpResponse.json({ postgresql: 'up' })))

    render(<RouterProvider router={router} />)

    await waitFor(() =>
      expect(screen.getByTestId('health-indicator')).toHaveTextContent('Backend unknown'),
    )
  })
})
