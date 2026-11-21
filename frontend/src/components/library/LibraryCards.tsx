import { useNavigate } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import type { LibraryItem } from '../../types/library'

export interface LibraryCardsProps {
  items: LibraryItem[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  isLoading?: boolean
  emptyMessage?: string
}

export function LibraryCards({
  items,
  selectedIds,
  onToggleSelect,
  isLoading = false,
  emptyMessage = 'No documents yet. Import a PDF to get started.',
}: LibraryCardsProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">{emptyMessage}</p>
  }

  return (
    <div data-testid="library-cards" className="card-view grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          data-testid="library-card"
          onClick={() => navigate({ to: '/library/$documentId', params: { documentId: item.id } })}
          className={`cursor-pointer rounded-md border bg-white p-4 transition-shadow hover:shadow-md ${
            selectedIds.has(item.id) ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              aria-label={`Select ${item.title}`}
              data-testid="card-select"
              checked={selectedIds.has(item.id)}
              onClick={(event) => event.stopPropagation()}
              onChange={() => onToggleSelect(item.id)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 truncate text-sm text-slate-600">{item.authors || 'Unknown author'}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                {item.publicationYear ? <span>{item.publicationYear}</span> : null}
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {item.processingStatus}
                </span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
