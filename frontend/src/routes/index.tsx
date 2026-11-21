import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import Root from './__root'
import LibraryRoute, { validateLibrarySearch } from './library'
import LibraryDocumentRoute from './library.$documentId'

const rootRoute = createRootRoute({
  component: Root,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw { redirect: { to: '/library' } }
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
