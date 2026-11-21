"use client";

import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

interface DocumentActionsProps {
  /** Invoked when "Edit Metadata" is chosen. */
  onEditMetadata?: () => void;
  /** Invoked when "View Processing History" is chosen. */
  onViewProcessingHistory?: () => void;
  /** Invoked when "Add Artifact" is chosen. */
  onAddArtifact?: () => void;
}

export function DocumentActions({ 
  onEditMetadata, 
  onViewProcessingHistory, 
  onAddArtifact 
}: DocumentActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (action: 'edit-metadata' | 'view-processing' | 'add-artifact') => {
    setIsOpen(false);
    switch (action) {
      case 'edit-metadata':
        onEditMetadata?.();
        break;
      case 'view-processing':
        onViewProcessingHistory?.();
        break;
      case 'add-artifact':
        onAddArtifact?.();
        break;
    }
  };
  
  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid="document-actions-trigger"
        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
        title="Document Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <div
          role="menu"
          data-testid="document-actions-menu"
          className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              data-testid="action-edit-metadata"
              onClick={() => handleAction('edit-metadata')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit Metadata
            </button>
            <button
              type="button"
              role="menuitem"
              data-testid="action-view-processing"
              onClick={() => handleAction('view-processing')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Processing History
            </button>
            <button
              type="button"
              role="menuitem"
              data-testid="action-add-artifact"
              onClick={() => handleAction('add-artifact')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Add Artifact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}