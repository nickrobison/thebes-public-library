import { useQuery } from '@tanstack/react-query'
import { getLibrary } from '../api/library'
import type { LibraryItem, SortDir, SortField } from '../types/library'

export interface UseLibraryOptions {
  limit?: number
  cursor?: string
  sortField?: SortField
  sortDir?: SortDir
  enabled?: boolean
}

export function useLibrary({
  limit = 20,
  cursor,
  sortField = 'title',
  sortDir = 'asc',
  enabled = true,
}: UseLibraryOptions = {}) {
  return useQuery({
    queryKey: ['library', { limit, cursor, sortField, sortDir }],
    queryFn: () => getLibrary({ limit, cursor, sortField, sortDir }),
    enabled,
    select: (data) => ({
      items: data.items as LibraryItem[],
      nextCursor: data.nextCursor,
    }),
  })
}
