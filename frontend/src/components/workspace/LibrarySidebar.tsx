import { Link } from '@tanstack/react-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { LibraryItem } from '../../types/library'

export interface LibrarySidebarProps {
  items: LibraryItem[]
  activeDocumentId?: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  isLoading?: boolean
}

export function LibrarySidebar({
  items,
  activeDocumentId,
  collapsed,
  onCollapsedChange,
  isLoading = false,
}: LibrarySidebarProps) {
  if (collapsed) {
    return (
      <div className="flex h-full flex-col border-r border-slate-200 bg-white">
        <button
          type="button"
          aria-label="Expand library sidebar"
          data-testid="sidebar-expand"
          onClick={() => onCollapsedChange(false)}
          className="m-2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <nav
      aria-label="Library documents"
      data-testid="library-sidebar"
      className="flex h-full flex-col border-r border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-slate-700">Library</h2>
        <button
          type="button"
          aria-label="Collapse library sidebar"
          data-testid="sidebar-collapse"
          onClick={() => onCollapsedChange(true)}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <li className="px-2 py-4 text-sm text-slate-400">Loading…</li>
        ) : items.length === 0 ? (
          <li className="px-2 py-4 text-sm text-slate-400">No documents yet.</li>
        ) : (
          items.map((item) => {
            const isActive = item.id === activeDocumentId
            return (
              <li key={item.id}>
                <Link
                  to="/library/$documentId"
                  params={{ documentId: item.id }}
                  data-testid="sidebar-document-link"
                  aria-current={isActive ? 'page' : undefined}
                  className={`block rounded px-2 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-slate-900 font-medium text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block truncate font-medium">{item.title}</span>
                  <span
                    className={`block truncate text-xs ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.authors || 'Unknown author'}
                    {item.publicationYear ? ` · ${item.publicationYear}` : ''}
                  </span>
                </Link>
              </li>
            )
          })
        )}
      </ul>
    </nav>
  )
}
