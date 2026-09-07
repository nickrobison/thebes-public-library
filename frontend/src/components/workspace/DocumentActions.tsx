"use client";

import React, { useState } from 'react';

interface DocumentActionsProps {
  documentId: string;
  onEditMetadata?: () => void;
  onViewProcessingHistory?: () => void;
  onAddArtifact?: () => void;
}

export function DocumentActions({ 
  documentId, 
  onEditMetadata, 
  onViewProcessingHistory, 
  onAddArtifact 
}: DocumentActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleAction = (action: string) => {
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
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Document Actions"
      >
        ⋮
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => handleAction('edit-metadata')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit Metadata
            </button>
            <button
              onClick={() => handleAction('view-processing')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Processing History
            </button>
            <button
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