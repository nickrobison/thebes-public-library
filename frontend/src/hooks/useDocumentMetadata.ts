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

interface DocumentMetadata {
  id: string;
  fields: BibliographicFields;
}

const fetchDocumentMetadata = async (documentId: string): Promise<DocumentMetadata> => {
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
): Promise<DocumentMetadata> => {
  const response = await fetch(`/api/v1/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': String(currentVersion)
    },
    body: JSON.stringify(data)
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
    onSuccess: (data) => {
      queryClient.setQueryData(['documentMetadata', documentId], data);
      toast.success('Metadata updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update metadata');
    }
  });

  return {
    data: query.data?.fields,
    document: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: (data: Partial<BibliographicFields>) => {
      if (!query.data?.fields) return;
      mutation.mutate({ 
        data, 
        currentVersion: query.data.fields.version 
      });
    },
    isMutating: mutation.isPending
  };
}