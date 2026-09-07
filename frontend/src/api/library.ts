export async function getLibrary() {
  const response = await fetch('/api/library')
  if (!response.ok) throw new Error('Failed to fetch library data')
  return response.json() as Promise<{
    items: Array<{ id: string; title: string; authors?: string; publicationYear?: number; processingStatus?: string }>,
    nextCursor?: string
  }>
}

