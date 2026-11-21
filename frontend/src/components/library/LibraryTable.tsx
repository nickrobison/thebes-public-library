import { useNavigate } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { LibraryItem, SortField } from '../../types/library'

const COLUMNS: Array<{ field: SortField; label: string; className?: string }> = [
  { field: 'title', label: 'Title' },
  { field: 'authors', label: 'Authors' },
  { field: 'publicationYear', label: 'Publication Year' },
  { field: 'processingStatus', label: 'Processing Status' },
]

export interface LibraryTableProps {
  items: LibraryItem[]
  sortField: SortField
  sortDir: 'asc' | 'desc'
  onSortChange: (field: SortField, dir: 'asc' | 'desc') => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  isLoading?: boolean
  emptyMessage?: string
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return dir === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  )
}

export function LibraryTable({
  items,
  sortField,
  sortDir,
  onSortChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isLoading = false,
  emptyMessage = 'No documents yet. Import a PDF to get started.',
}: LibraryTableProps) {
  const navigate = useNavigate()
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      onSortChange(field, sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(field, 'asc')
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <Table data-testid="library-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Select all documents"
                data-testid="select-all"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-slate-300"
              />
            </TableHead>
            {COLUMNS.map((column) => {
              const isActive = column.field === sortField
              return (
                <TableHead key={column.field} className={column.className}>
                  <button
                    type="button"
                    data-testid={`sort-${column.field}`}
                    aria-label={`Sort by ${column.label}`}
                    aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort(column.field)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
                  >
                    {column.label}
                    <SortIndicator active={isActive} dir={sortDir} />
                  </button>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 1} className="h-24 text-center text-sm text-slate-400">
                Loading…
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length + 1} className="h-24 text-center text-sm text-slate-400">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                data-testid="library-row"
                data-state={selectedIds.has(item.id) ? 'selected' : undefined}
                onClick={() =>
                  navigate({ to: '/library/$documentId', params: { documentId: item.id } })
                }
                className="cursor-pointer hover:bg-slate-50"
              >
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.title}`}
                    data-testid="row-select"
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </TableCell>
                <TableCell data-testid="cell-title" className="font-medium text-slate-900">
                  {item.title}
                </TableCell>
                <TableCell className="text-slate-600">{item.authors || '—'}</TableCell>
                <TableCell className="text-slate-600">{item.publicationYear ?? '—'}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {item.processingStatus}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
