import {
  render as rtlRender,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
  type RenderOptions,
} from '@testing-library/react'
import { renderHook as rtlRenderHook, type RenderHookOptions as RTLRenderHookOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { type ReactElement, type ReactNode } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/routes'

function Providers({ children }: { children?: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {children}
    </QueryClientProvider>
  )
}

function AllTheProviders({ children }: { children?: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      {children}
    </QueryClientProvider>
  )
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: Providers, ...options })
}

export function renderWithRouter(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options })
}

const QueryWrapper = ({ children }: { children?: ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
      })
    }
  >
    {children}
  </QueryClientProvider>
)

export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  options?: RTLRenderHookOptions<Props>,
) {
  const { wrapper, ...rest } = options ?? {}
  return rtlRenderHook<Result, Props>(callback, { wrapper: QueryWrapper, ...rest })
}

export { screen, fireEvent, cleanup, waitFor, within }
