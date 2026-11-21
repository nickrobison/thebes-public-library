"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface BibliographicFields {
  title: string;
  authors: string;
  pubYear: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  version: number;
}

/** Shape returned by GET /api/v1/documents/{id}. */
interface DocumentMetadataResponse {
  id: string;
  title?: string | null;
  authors?: string | null;
  publicationYear?: number | null;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  doi?: string | null;
  version?: number;
}

const toFields = (doc: DocumentMetadataResponse): BibliographicFields => ({
  title: doc.title ?? '',
  authors: doc.authors ?? '',
  pubYear: doc.publicationYear != null ? String(doc.publicationYear) : '',
  journal: doc.journal ?? '',
  volume: doc.volume ?? '',
  issue: doc.issue ?? '',
  pages: doc.pages ?? '',
  doi: doc.doi ?? '',
  version: doc.version ?? 0,
});

const fetchDocumentMetadata = async (documentId: string): Promise<DocumentMetadataResponse> => {
  const response = await fetch(`/api/v1/documents/${documentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch document metadata');
  }
  return response.json();
};

const updateDocumentMetadata = async (
  documentId: string,
  data: Partial<BibliographicFields>,
  currentVersion: number
): Promise<DocumentMetadataResponse> => {
  // Backend uses `publicationYear`; the UI models it as `pubYear`.
  const { pubYear, ...rest } = data;
  const payload = {
    ...rest,
    ...(pubYear !== undefined ? { publicationYear: pubYear === '' ? null : Number(pubYear) } : {}),
  };

  const response = await fetch(`/api/v1/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': String(currentVersion)
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 409) {
    throw new Error('Stale version - document was updated by another user');
  }

  if (!response.ok) {
    throw new Error('Failed to update document metadata');
  }

  return response.json();
};

export function useDocumentMetadata(documentId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['documentMetadata', documentId],
    queryFn: () => fetchDocumentMetadata(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: ({ data, currentVersion }: { data: Partial<BibliographicFields>; currentVersion: number }) =>
      updateDocumentMetadata(documentId, data, currentVersion),
    onSuccess: () => {
      // PUT returns only {id, version, status}; refetch the full document.
      void queryClient.invalidateQueries({ queryKey: ['documentMetadata', documentId] });
      toast.success('Metadata updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update metadata');
    }
  });

  return {
    data: query.data ? toFields(query.data) : undefined,
    document: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: (data: Partial<BibliographicFields>) => {
      if (!query.data) return;
      mutation.mutate({
        data,
        currentVersion: query.data.version ?? 0
      });
    },
    isMutating: mutation.isPending
  };
}
