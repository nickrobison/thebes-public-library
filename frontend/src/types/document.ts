export interface DocumentDetail {
  id: string;
  title: string;
  authors: string | null;
  publicationYear: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  preferredArtifactId: string | null;
  artifacts: Artifact[];
}

export interface Artifact {
  id: string;
  documentId: string;
  originalFilename: string;
  status: 'PENDING' | 'AVAILABLE' | 'FAILED';
  isPreferred: boolean;
  createdAt: string;
}

export interface ProcessingHistoryItem {
  id: string;
  type: string;
  status: string;
  currentStage: string | null;
  retryCount: number;
  submittedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  payload: string;
  stages: unknown[];
}