import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import Root from './__root'
import LibraryRoute, { validateLibrarySearch } from './library'
import LibraryDocumentRoute from './library.$documentId'

const rootRoute = createRootRoute({
  component: Root,
  errorComponent: ({ error }) => (
    <div className="p-6 text-red-700">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <pre className="mt-2 whitespace-pre-wrap text-sm">{String(error)}</pre>
    </div>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({
      to: '/library',
      search: { view: 'table', sortField: 'title', sortDir: 'asc' },
    })
  },
})

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  validateSearch: validateLibrarySearch,
  component: LibraryRoute,
})

const libraryDocumentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/$documentId',
  component: LibraryDocumentRoute,
})

const routeTree = rootRoute.addChildren([indexRoute, libraryRoute, libraryDocumentRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
