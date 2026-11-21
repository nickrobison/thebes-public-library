import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { getDocument } from '../api/documents'
import { useLibrary } from '../hooks/useLibrary'
import { usePreferences } from '../hooks/usePreferences'
import { SplitPane } from '../components/workspace/SplitPane'
import { LibrarySidebar } from '../components/workspace/LibrarySidebar'
import { PDFReader } from '../components/reader/PDFReader'
import { MetadataPanel } from '../components/metadata/MetadataPanel'
import { ProcessingPanel } from '../components/processing/ProcessingPanel'
import { ArtifactsPanel } from '../components/artifacts/ArtifactsPanel'
import { DocumentActions } from '../components/workspace/DocumentActions'

const DEFAULT_LEFT_PERCENT = 28

/** Scrolls a side panel into view; used by the document actions menu. */
function revealPanel(testId: string) {
  document.querySelector(`[data-testid="${testId}"]`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export default function LibraryDocumentRoute() {
  const { documentId } = useParams({ from: '/library/$documentId' })
  const { preferences, updatePreferences } = usePreferences()
  const library = useLibrary({ limit: 100 })

  const document = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
  })

  const leftPercent = preferences.splitPaneSizes[0] ?? DEFAULT_LEFT_PERCENT
  const sidebarCollapsed = preferences.panelCollapsedStates.sidebar ?? false

  const preferredArtifact = useMemo(() => {
    const doc = document.data
    if (!doc) return null
    return doc.artifacts.find((artifact) => artifact.isPreferred) ?? doc.artifacts[0] ?? null
  }, [document.data])

  const sidebar = (
    <LibrarySidebar
      items={library.data?.items ?? []}
      activeDocumentId={documentId}
      collapsed={sidebarCollapsed}
      onCollapsedChange={(collapsed) =>
        updatePreferences({ panelCollapsedStates: { ...preferences.panelCollapsedStates, sidebar: collapsed } })
      }
      isLoading={library.isLoading}
    />
  )

  if (document.isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading document…</div>
  }

  if (document.isError) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Failed to load document: {document.error.message}</p>
      </div>
    )
  }

  const doc = document.data
  if (!doc) {
    return <div className="p-6 text-sm text-slate-500">Document not found.</div>
  }

  const reader = preferredArtifact ? (
    <PDFReader
      documentId={documentId}
      artifactId={preferredArtifact.id}
      downloadFilename={preferredArtifact.originalFilename ?? 'document.pdf'}
    />
  ) : (
    <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
      This document has no artifacts yet.
    </div>
  )

  return (
    <div className="h-[calc(100vh-57px)]" data-testid="document-workspace">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="truncate text-base font-semibold" data-testid="document-title">
          {doc.title}
        </h1>
        <DocumentActions
          onEditMetadata={() => revealPanel('metadata-panel')}
          onViewProcessingHistory={() => revealPanel('processing-panel')}
          onAddArtifact={() => revealPanel('artifacts-panel')}
        />
      </div>

      <div className="h-[calc(100%-45px)]">
        <SplitPane
          leftPercent={leftPercent}
          onLeftPercentChange={(percent) =>
            updatePreferences({ splitPaneSizes: [percent, 100 - percent] })
          }
          left={sidebar}
          right={
            <div className="flex h-full min-w-0">
              <section className="min-w-0 flex-1 border-r border-slate-200 bg-slate-100">
                {reader}
              </section>
              <aside
                data-testid="document-sidepanels"
                className="w-[380px] shrink-0 space-y-4 overflow-y-auto bg-slate-50 p-4"
              >
                <MetadataPanel documentId={documentId} />
                <ArtifactsPanel documentId={documentId} />
                <ProcessingPanel documentId={documentId} />
              </aside>
            </div>
          }
        />
      </div>
    </div>
  )
}
