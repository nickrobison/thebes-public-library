"use client";

import type { ChangeEvent, KeyboardEvent } from "react";

interface ReaderToolbarProps {
  pageNumber: number;
  numPages: number;
  scale: number;
  rotation: number;
  viewMode: "width" | "page";
  searchTerm: string;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onViewModeChange: (mode: "width" | "page") => void;
  onSearchChange: (term: string) => void;
  onFullscreen: () => void;
  downloadUrl: string;
  downloadFilename: string;
}

function handlePageInputChange(
  e: ChangeEvent<HTMLInputElement>,
  numPages: number,
  onPageChange: (page: number) => void
) {
  const value = e.target.value;
  if (value === "") return;
  const page = parseInt(value, 10);
  if (!Number.isNaN(page) && page >= 1 && (numPages === 0 || page <= numPages)) {
    onPageChange(page);
  }
}

function handlePageInputKeyDown(
  e: KeyboardEvent<HTMLInputElement>,
  numPages: number,
  onPageChange: (page: number) => void
) {
  if (e.key === "Enter") {
    const value = e.currentTarget.value;
    if (value === "") return;
    const page = parseInt(value, 10);
    if (!Number.isNaN(page) && page >= 1 && (numPages === 0 || page <= numPages)) {
      onPageChange(page);
    }
    e.currentTarget.blur();
  }
}

export function ReaderToolbar({
  pageNumber,
  numPages,
  scale,
  rotation,
  viewMode,
  searchTerm,
  onPageChange,
  onNext,
  onPrevious,
  onZoomIn,
  onZoomOut,
  onRotate,
  onViewModeChange,
  onSearchChange,
  onFullscreen,
  downloadUrl,
  downloadFilename,
}: ReaderToolbarProps) {
  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      role="toolbar"
      aria-label="PDF reader controls"
    >
      {/* Navigation */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <button
          data-testid="reader-prev"
          aria-label="Previous page"
          onClick={onPrevious}
          disabled={pageNumber <= 1}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <input
            data-testid="reader-page-input"
            aria-label="Page number"
            type="number"
            min="1"
            max={numPages > 0 ? numPages : undefined}
            value={pageNumber}
            onChange={(e) => handlePageInputChange(e, numPages, onPageChange)}
            onKeyDown={(e) => handlePageInputKeyDown(e, numPages, onPageChange)}
            className="w-16 text-center border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <span
            data-testid="reader-page-total"
            aria-hidden="true"
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            of {numPages > 0 ? numPages : "?"}
          </span>
        </div>
        <button
          data-testid="reader-next"
          aria-label="Next page"
          onClick={onNext}
          disabled={numPages > 0 && pageNumber >= numPages}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <button
          data-testid="reader-zoom-out"
          aria-label="Zoom out"
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12H3" />
          </svg>
        </button>
        <span
          data-testid="reader-zoom-level"
          aria-label={`Current zoom: ${zoomPercent}%`}
          className="w-16 text-center text-sm font-mono text-gray-700 dark:text-gray-300"
        >
          {zoomPercent}%
        </span>
        <button
          data-testid="reader-zoom-in"
          aria-label="Zoom in"
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Fit modes */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <button
          data-testid="reader-fit-width"
          aria-label="Fit width"
          onClick={() => onViewModeChange("width")}
          className={`p-1.5 rounded transition-colors ${
            viewMode === "width"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          title="Fit width"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          data-testid="reader-fit-page"
          aria-label="Fit page"
          onClick={() => onViewModeChange("page")}
          className={`p-1.5 rounded transition-colors ${
            viewMode === "page"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          title="Fit page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <label htmlFor="reader-search" className="sr-only">
          Search in document
        </label>
        <input
          data-testid="reader-search"
          id="reader-search"
          aria-label="Search in document"
          type="search"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-48 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      {/* Rotation */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <button
          data-testid="reader-rotate"
          aria-label={`Rotate (currently ${rotation}°)`}
          onClick={onRotate}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={`Rotate (currently ${rotation}°)`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Fullscreen */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2">
        <button
          data-testid="reader-fullscreen"
          aria-label="Fullscreen"
          onClick={onFullscreen}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Download */}
      <div className="flex items-center gap-1">
        <a
          data-testid="reader-download"
          aria-label="Download"
          href={downloadUrl}
          download={downloadFilename}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Download"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>
    </div>
  );
}