import type { Artifact, DocumentDetail, ProcessingHistoryItem } from '../types/document'

export interface DocumentUpdate {
  title?: string
  authors?: string
  publicationYear?: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
}

export interface UpdateDocumentResult {
  id: string
  version: number
  status: string
}

async function parseError(response: Response): Promise<Error> {
  const body = await response.text()
  return new Error(`Request failed (${response.status}): ${body}`)
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await fetch(`/api/v1/documents/${documentId}`)
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<DocumentDetail>
}

export async function getDocumentArtifacts(documentId: string): Promise<Artifact[]> {
  const response = await fetch(`/api/v1/documents/${documentId}/artifacts`)
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<Artifact[]>
}

export async function getProcessingHistory(
  documentId: string,
): Promise<ProcessingHistoryItem[]> {
  const response = await fetch(`/api/v1/documents/${documentId}/processing-history`)
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<ProcessingHistoryItem[]>
}

/** Saves metadata using optimistic concurrency; a 409 means another editor won. */
export async function updateDocument(
  documentId: string,
  update: DocumentUpdate,
  version: number,
): Promise<UpdateDocumentResult> {
  const response = await fetch(`/api/v1/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': String(version),
    },
    body: JSON.stringify(update),
  })
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<UpdateDocumentResult>
}

export interface AddArtifactResult {
  jobId: string
  status: string
  documentId: string
}

export async function addArtifact(
  documentId: string,
  originalFilename: string,
): Promise<AddArtifactResult> {
  const response = await fetch(`/api/v1/documents/${documentId}/artifacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalFilename }),
  })
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.json() as Promise<AddArtifactResult>
}
