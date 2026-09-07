import { useQuery } from '@tanstack/react-query'
import { LibraryItem } from '../types/library'

export function useLibrary() {
  return useQuery<LibraryItem[]>({
    queryKey: ['library'],
    queryFn: async () => {
      const response = await fetch('/api/library')
      if (!response.ok) {
        throw new Error('Failed to fetch library data')
      }
      return response.json()
    },
  })
}