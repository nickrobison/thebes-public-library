"use client";

import { useState, useEffect, useCallback } from "react";

interface PDFReaderState {
  pageNumber: number;
  scale: number;
  rotation: 0 | 90 | 180 | 270;
  viewMode: "width" | "page";
  numPages: number;
  searchTerm: string;
}

const defaultState: PDFReaderState = {
  pageNumber: 1,
  scale: 1,
  rotation: 0,
  viewMode: "width",
  numPages: 0,
  searchTerm: "",
};

function getStorageKey(documentId: string, artifactId: string): string {
  return `tpl:reader:${documentId}:${artifactId}:v1`;
}

function loadStateFromStorage(key: string): Partial<PDFReaderState> | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as Partial<PDFReaderState>;
    }
  } catch {
    // Ignore localStorage errors (e.g., privacy mode)
  }
  return null;
}

function saveStateToStorage(key: string, state: PDFReaderState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors (e.g., privacy mode)
  }
}

export function usePDFReader(documentId: string, artifactId: string) {
  const storageKey = getStorageKey(documentId, artifactId);
  const [state, setState] = useState<PDFReaderState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadStateFromStorage(storageKey);
    if (stored) {
      setState((prev) => ({ ...prev, ...stored }));
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Persist to localStorage when state changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveStateToStorage(storageKey, state);
    }
  }, [state, isHydrated, storageKey]);

  const setPageNumber = useCallback((n: number) => {
    setState((prev) => ({ ...prev, pageNumber: Math.max(1, n) }));
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) => {
      if (prev.numPages > 0 && prev.pageNumber >= prev.numPages) {
        return prev;
      }
      return { ...prev, pageNumber: prev.pageNumber + 1 };
    });
  }, []);

  const previousPage = useCallback(() => {
    setState((prev) => ({ ...prev, pageNumber: Math.max(1, prev.pageNumber - 1) }));
  }, []);

  const setScale = useCallback((n: number) => {
    const clamped = Math.max(0.25, Math.min(4, n));
    setState((prev) => ({ ...prev, scale: clamped }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => {
      const next = Math.min(4, Math.round((prev.scale + 0.25) * 100) / 100);
      return { ...prev, scale: next };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => {
      const next = Math.max(0.25, Math.round((prev.scale - 0.25) * 100) / 100);
      return { ...prev, scale: next };
    });
  }, []);

  const rotateClockwise = useCallback(() => {
    setState((prev) => {
      const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
      const currentIndex = rotations.indexOf(prev.rotation);
      const nextIndex = (currentIndex + 1) % rotations.length;
      return { ...prev, rotation: rotations[nextIndex] };
    });
  }, []);

  const setViewMode = useCallback((mode: "width" | "page") => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const setNumPages = useCallback((n: number) => {
    setState((prev) => ({ ...prev, numPages: Math.max(0, n) }));
  }, []);

  const fitWidth = useCallback((containerWidth: number, pageWidth: number) => {
    if (containerWidth <= 0 || pageWidth <= 0 || !Number.isFinite(containerWidth) || !Number.isFinite(pageWidth)) {
      return;
    }
    const newScale = containerWidth / pageWidth;
    setState((prev) => ({ ...prev, scale: Math.max(0.25, Math.min(4, newScale)) }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  return {
    ...state,
    setPageNumber,
    nextPage,
    previousPage,
    setScale,
    zoomIn,
    zoomOut,
    rotateClockwise,
    setViewMode,
    setSearchTerm,
    setNumPages,
    fitWidth,
    reset,
  };
}