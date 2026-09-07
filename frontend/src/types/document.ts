export interface Document {
  id: string;
  bibliographicFields: {
    title: string;
    authors: string;
    pubYear: string;
    journal: string;
    volume: string;
    issue: string;
    pages: string;
    doi: string;
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Artifact {
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

export interface BibliographicFields {
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