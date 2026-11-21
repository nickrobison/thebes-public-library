"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { usePDFReader } from "@/hooks/usePDFReader";
import { ReaderToolbar } from "./ReaderToolbar";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFReaderProps {
  documentId: string;
  artifactId: string;
  downloadFilename?: string;
}

/**
 * react-pdf types `customTextRenderer` as returning `string`, but the runtime
 * renders whatever React node it returns. We derive the library's own prop type
 * from the public `Page` component (rather than reaching into
 * `node_modules/react-pdf/dist/...`, which breaks on upgrade) and assert to it
 * once, at the single call site that needs it.
 */
type PageCustomTextRenderer = NonNullable<
  Parameters<typeof Page>[0]["customTextRenderer"]
>;

type CustomTextRenderer = (props: {
  pageIndex: number;
  pageNumber: number;
  itemIndex: number;
} & TextItem) => React.ReactNode;

const asPageTextRenderer = (
  renderer: CustomTextRenderer,
): PageCustomTextRenderer => renderer as PageCustomTextRenderer;

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim()) {
    return text;
  }
  const escaped = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : part
      )}
    </>
  );
}

export function PDFReader({ documentId, artifactId, downloadFilename }: PDFReaderProps) {
  const pdfUrl = `/api/v1/artifacts/${artifactId}/content`;
  const filename = downloadFilename || `document-${artifactId}.pdf`;

  const {
    pageNumber,
    scale,
    rotation,
    viewMode,
    numPages,
    searchTerm,
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
  } = usePDFReader(documentId, artifactId);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Measure container width for fit-width mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = container.clientWidth;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Handle page size from onRenderSuccess
  const handleRenderSuccess = useCallback((page: { width: number; height: number }) => {
    if (page.width > 0 && page.height > 0) {
      setPageWidth(page.width);
      setPageHeight(page.height);
    }
  }, []);

  // Apply fit-width when container or page size changes
  useEffect(() => {
    if (viewMode === "width" && containerWidth > 0 && pageWidth > 0) {
      fitWidth(containerWidth, pageWidth);
    }
  }, [viewMode, containerWidth, pageWidth, fitWidth]);

  // Fullscreen toggle
  const handleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or denied - silently ignore
    }
  }, [isFullscreen]);

  // Handle document load success
  const handleLoadSuccess = useCallback(
    (pdf: { numPages: number }) => {
      setNumPages(pdf.numPages);
      setLoadError(null);
    },
    [setNumPages]
  );

  // Handle document load error
  const handleLoadError = useCallback((error: Error) => {
    if (error.message.includes("404") || error.message.includes("409")) {
      setLoadError("Document not available yet. Please try again later.");
    } else {
      setLoadError(`Failed to load PDF: ${error.message}`);
    }
  }, []);

  // Custom text renderer for search highlighting
  const customTextRenderer = useCallback<CustomTextRenderer>(
    (props) => {
      return <span>{highlightMatches(props.str, searchTerm)}</span>;
    },
    [searchTerm]
  );

  // Compute page dimensions for rendering
  const getPageDimensions = useCallback(() => {
    if (pageWidth <= 0 || pageHeight <= 0) {
      return { width: undefined, height: undefined };
    }

    if (viewMode === "width" && containerWidth > 0) {
      const targetWidth = containerWidth;
      const targetHeight = (pageHeight / pageWidth) * targetWidth;
      return { width: targetWidth, height: targetHeight };
    }

    if (viewMode === "page" && containerWidth > 0) {
      const maxWidth = containerWidth;
      const maxHeight = window.innerHeight * 0.85;
      const scaleX = maxWidth / pageWidth;
      const scaleY = maxHeight / pageHeight;
      const fitScale = Math.min(scaleX, scaleY, 4);
      return {
        width: pageWidth * fitScale,
        height: pageHeight * fitScale,
      };
    }

    // Default: use scale
    return {
      width: pageWidth * scale,
      height: pageHeight * scale,
    };
  }, [pageWidth, pageHeight, viewMode, containerWidth, scale]);

  const dimensions = getPageDimensions();

  if (loadError) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800 min-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700"
        data-testid="pdf-page-container"
      >
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-400">{loadError}</p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-white dark:bg-gray-900"
      data-testid="pdf-page-container"
    >
      <ReaderToolbar
        pageNumber={pageNumber}
        numPages={numPages}
        scale={scale}
        rotation={rotation}
        viewMode={viewMode}
        searchTerm={searchTerm}
        onPageChange={setPageNumber}
        onNext={nextPage}
        onPrevious={previousPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onRotate={rotateClockwise}
        onViewModeChange={setViewMode}
        onSearchChange={setSearchTerm}
        onFullscreen={handleFullscreen}
        downloadUrl={pdfUrl}
        downloadFilename={filename}
      />

      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
        <Document
          file={pdfUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-3">Loading PDF...</span>
            </div>
          }
          error={
            <div className="flex items-center justify-center p-8 text-center text-red-600 dark:text-red-400">
              <p>Failed to load PDF document</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            rotate={rotation}
            width={dimensions.width}
            height={dimensions.height}
            onRenderSuccess={handleRenderSuccess}
            customTextRenderer={asPageTextRenderer(customTextRenderer)}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
}