import type { LibraryResponse, SortDir, SortField } from '../types/library'

export interface LibraryQuery {
  limit?: number
  cursor?: string
  sortField?: SortField
  sortDir?: SortDir
}

export async function getLibrary({
  limit = 10,
  cursor,
  sortField = 'createdAt',
  sortDir = 'asc',
}: LibraryQuery = {}): Promise<LibraryResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    sortField,
    sortDir,
  })
  if (cursor) {
    params.set('cursor', cursor)
  }

  const response = await fetch(`/api/v1/library?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch library data: ${response.status}`)
  }
  return response.json() as Promise<LibraryResponse>
}
