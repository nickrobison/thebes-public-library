"use client";

export async function fetchProcessingHistory(documentId: string) {
  const response = await fetch(`/api/v1/documents/${documentId}/processing-history`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch processing history');
  }
  
  return response.json();
}