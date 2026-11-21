import { useCallback, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { FileUp, LayoutGrid, Rows } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LibraryTable } from '../components/library/LibraryTable'
import { LibraryCards } from '../components/library/LibraryCards'
import { SelectionToolbar } from '../components/library/SelectionToolbar'
import { ImportDialog } from '../components/library/ImportDialog'
import { useLibrary } from '../hooks/useLibrary'
import type { SortField } from '../types/library'

export const SORT_FIELDS: Array<{ value: SortField; label: string }> = [
  { value: 'title', label: 'Title' },
  { value: 'authors', label: 'Authors' },
  { value: 'publicationYear', label: 'Publication Year' },
  { value: 'processingStatus', label: 'Processing Status' },
  { value: 'createdAt', label: 'Date Added' },
]

export const SORT_FIELD_VALUES: SortField[] = [
  'title',
  'authors',
  'publicationYear',
  'processingStatus',
  'createdAt',
]

export interface LibrarySearch {
  view: 'table' | 'card'
  sortField: SortField
  sortDir: 'asc' | 'desc'
}

export function validateLibrarySearch(search: Record<string, unknown>): LibrarySearch {
  const view = search.view === 'card' ? 'card' : 'table'
  const requested = search.sortField as SortField
  const sortField = SORT_FIELD_VALUES.includes(requested) ? requested : 'title'
  const sortDir = search.sortDir === 'desc' ? 'desc' : 'asc'
  return { view, sortField, sortDir }
}

export default function LibraryRoute() {
  const { view, sortField, sortDir } = useSearch({ from: '/library' })
  const navigate = useNavigate({ from: '/library' })
  const [importOpen, setImportOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // URL carries default sort params on mount, so track whether the user has
  // actually chosen a sort yet: the first header click applies ascending.
  const hasUserSorted = useRef(false)

  const { data, isLoading, isError, error } = useLibrary({ sortField, sortDir, limit: 50 })
  const items = data?.items ?? []

  const setSearch = useCallback(
    (next: Partial<{ view: 'table' | 'card'; sortField: SortField; sortDir: 'asc' | 'desc' }>) => {
      void navigate({
        to: '/library',
        search: (prev) => ({ ...prev, ...next }),
        replace: true,
      })
    },
    [navigate],
  )

  const handleSortChange = useCallback(
    (field: SortField, dir: 'asc' | 'desc') => {
      const nextDir = hasUserSorted.current ? dir : 'asc'
      hasUserSorted.current = true
      setSearch({ sortField: field, sortDir: nextDir })
    },
    [setSearch],
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (items.length > 0 && items.every((item) => prev.has(item.id))) {
        return new Set()
      }
      return new Set(items.map((item) => item.id))
    })
  }, [items])

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={(value) => handleSortChange(value as SortField, 'asc')}>
            <SelectTrigger className="w-48" aria-label="Sort by" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              aria-label="Table view"
              data-testid="view-table"
              onClick={() => setSearch({ view: 'table' })}
            >
              <Rows className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={view === 'card' ? 'default' : 'ghost'}
              size="sm"
              aria-label="Card view"
              data-testid="view-card"
              onClick={() => setSearch({ view: 'card' })}
            >
              <LayoutGrid className="h-4 w-4" />
              Card
            </Button>
          </div>

          <Button data-testid="open-import" onClick={() => setImportOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3">
          <SelectionToolbar
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
          />
        </div>
      )}

      {isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load the library: {error.message}
        </p>
      ) : view === 'table' ? (
        <LibraryTable
          items={items}
          sortField={sortField}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          isLoading={isLoading}
        />
      ) : (
        <LibraryCards
          items={items}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          isLoading={isLoading}
        />
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import documents</DialogTitle>
            <DialogDescription>
              Upload a single PDF, or import a directory of PDFs in bulk.
            </DialogDescription>
          </DialogHeader>
          <ImportDialog onClose={() => setImportOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
