"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useDocumentMetadata } from '../../hooks/useDocumentMetadata';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { InlineEdit } from './InlineEdit';
import { MetadataEditorModal } from './MetadataEditorModal';

interface MetadataPanelProps {
  documentId: string;
}

interface BibliographicFields {
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

export function MetadataPanel({ documentId }: MetadataPanelProps) {
  const { data: document, isLoading, error, mutate } = useDocumentMetadata(documentId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localFields, setLocalFields] = useState<BibliographicFields | null>(null);
  const { showWarning, setShowWarning, confirmDiscard } = useUnsavedChanges(
    !!localFields,
    {
      onRouteChange: (to) => {
        if (confirm('You have unsaved changes. Do you want to discard them?')) {
          return true;
        }
        return false;
      }
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load metadata');
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-red-600">Error loading metadata</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-600">No metadata available</div>
      </div>
    );
  }

  const fields = document as BibliographicFields;
  const displayFields = localFields || fields;

  const handleInlineSave = (field: string, value: string) => {
    if (!(field in displayFields)) return;
    const key = field as keyof BibliographicFields;
    const updatedFields = { ...displayFields, [key]: value };
    setLocalFields(updatedFields);
    
    if (updatedFields.version !== fields.version) {
      mutate({ ...updatedFields, version: fields.version + 1 });
    }
  };

  const handleModalSave = (updatedFields: BibliographicFields) => {
    const hasChanges = Object.keys(updatedFields).some(
      key => updatedFields[key as keyof BibliographicFields] !== fields[key as keyof BibliographicFields]
    );
    
    if (hasChanges) {
      mutate({ ...updatedFields, version: fields.version + 1 });
    }
    setIsModalOpen(false);
    setLocalFields(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bibliographic Metadata</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Edit All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <InlineEdit
              field="title"
              value={displayFields.title}
              onSave={handleInlineSave}
              placeholder="Enter title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
            <InlineEdit
              field="authors"
              value={displayFields.authors}
              onSave={handleInlineSave}
              placeholder="Enter authors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
            <InlineEdit
              field="pubYear"
              value={displayFields.pubYear}
              onSave={handleInlineSave}
              placeholder="e.g., 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
            <InlineEdit
              field="journal"
              value={displayFields.journal}
              onSave={handleInlineSave}
              placeholder="Enter journal"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
            <InlineEdit
              field="volume"
              value={displayFields.volume}
              onSave={handleInlineSave}
              placeholder="Enter volume"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
            <InlineEdit
              field="issue"
              value={displayFields.issue}
              onSave={handleInlineSave}
              placeholder="Enter issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
            <InlineEdit
              field="pages"
              value={displayFields.pages}
              onSave={handleInlineSave}
              placeholder="e.g., 123-145"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
            <InlineEdit
              field="doi"
              value={displayFields.doi}
              onSave={handleInlineSave}
              placeholder="Enter DOI"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Version: {displayFields.version}</span>
          {localFields && (
            <span className="text-orange-600">Unsaved changes</span>
          )}
        </div>
      </div>

      <MetadataEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={displayFields}
        onSave={handleModalSave}
      />

      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">You have unsaved changes. Do you want to discard them?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWarning(false);
                  setLocalFields(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
