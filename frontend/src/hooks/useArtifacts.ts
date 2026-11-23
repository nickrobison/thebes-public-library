"use client";

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Artifact {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  isPreferred: boolean;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingProgress?: number;
  createdAt: string;
  updatedAt: string;
}

interface UploadResponse {
  jobId: string;
  status: string;
  documentId: string;
}

interface ImportStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingProgress?: number;
  error?: string;
}

const fetchArtifacts = async (documentId: string): Promise<Artifact[]> => {
  const response = await fetch(`/api/v1/documents/${documentId}/artifacts`);
  if (!response.ok) {
    throw new Error('Failed to fetch artifacts');
  }
  return response.json();
};

const uploadArtifact = async (documentId: string, file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/api/v1/documents/${documentId}/artifacts`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload artifact');
  }
  
  return response.json();
};

const fetchImportStatus = async (importId: string): Promise<ImportStatus> => {
  const response = await fetch(`/api/v1/imports/${importId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch import status');
  }
  return response.json();
};

export function useArtifacts(documentId: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['artifacts', documentId],
    queryFn: () => fetchArtifacts(documentId),
    enabled: !!documentId,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  const mutation = useMutation({
    mutationFn: ({ file }: { file: File }) => uploadArtifact(documentId, file),
    onSuccess: (data) => {
      toast.success('Artifact upload started');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload artifact');
    }
  });
  
  return {
    artifacts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    uploadArtifact: (file: File) => mutation.mutateAsync({ file }),
    isUploading: mutation.isPending,
    refetch: query.refetch,
  };
}

export function useImportPolling(importId: string, onComplete?: (status: ImportStatus) => void) {
  const completedRef = useRef<string | null>(null);
  const query = useQuery({
    queryKey: ['importStatus', importId],
    queryFn: () => fetchImportStatus(importId),
    enabled: !!importId,
    staleTime: 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        return false;
      }
      return 2000;
    },
  });

  useEffect(() => {
    const data = query.data;
    if (!data || !onComplete) return;
    if ((data.status === 'COMPLETED' || data.status === 'FAILED') && completedRef.current !== importId) {
      completedRef.current = importId;
      onComplete(data);
    }
  }, [importId, onComplete, query.data]);

  return query;
}
