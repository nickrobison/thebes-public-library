export interface LibraryItem {
  id: string;
  title: string;
  authors: string | null;
  publicationYear: number | null;
  processingStatus: string;
}

export interface LibraryResponse {
  items: LibraryItem[];
  nextCursor: string | null;
}

export type SortField =
  | 'title'
  | 'authors'
  | 'publicationYear'
  | 'processingStatus'
  | 'createdAt';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  dir: SortDir;
}