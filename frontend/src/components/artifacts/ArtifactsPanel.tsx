"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useArtifacts } from '../../hooks/useArtifacts';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import { AddArtifactDialog } from './AddArtifactDialog';
import { SelectionToolbar } from '../library/SelectionToolbar';
import { BulkActionButton } from '../library/BulkActionButton';

interface ArtifactsPanelProps {
  documentId: string;
}

export function ArtifactsPanel({ documentId }: ArtifactsPanelProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { artifacts, isLoading, error, uploadArtifact, isUploading, refetch } = useArtifacts(documentId);
  
  const { 
    selected, 
    selectAll, 
    deselectAll, 
    toggleSelect, 
    selectItem, 
    deselectItem, 
    clearSelection, 
    isSelected, 
    selectedItems, 
    isAllSelected, 
    isIndeterminate 
  } = useMultiSelect({
    items: artifacts,
    getItemId: (artifact) => artifact.id,
    onSelectionChange: (selected) => {
      console.log('Selected artifacts:', selected);
    }
  });
  
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
    toast.error('Failed to load artifacts');
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-red-600">Error loading artifacts</div>
      </div>
    );
  }
  
  const preferredArtifacts = artifacts.filter(a => a.isPreferred);
  const additionalArtifacts = artifacts.filter(a => !a.isPreferred);
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'PROCESSING': return 'text-blue-600';
      case 'FAILED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div data-testid="artifacts-panel" className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Artifacts</h2>
        <div className="flex items-center space-x-3">
          {selected.size > 0 && (
            <SelectionToolbar
              selectedCount={selected.size}
              onClear={clearSelection}
            />
          )}
          <button
            onClick={() => setIsUploadDialogOpen(true)}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Add Artifact'}
          </button>
        </div>
      </div>
      
      {selected.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selected.size} item{selected.size !== 1 ? 's' : ''} selected
            </span>
            <BulkActionButton
              items={selectedItems()}
              onAction={(action) => {
                console.log('Bulk action from toolbar:', action);
                toast.info(`${action} action on ${selected.size} items`);
              }}
            />
          </div>
        </div>
      )}
      
      {preferredArtifacts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Preferred Artifacts</h3>
          <div className="space-y-2">
            {preferredArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${isSelected(artifact.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => toggleSelect(artifact.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected(artifact.id)}
                    onChange={() => toggleSelect(artifact.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{artifact.originalFilename}</span>
                      <span className="text-sm text-gray-500">({artifact.filename})</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Preferred</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatFileSize(artifact.fileSize)} • {artifact.mimeType} • {new Date(artifact.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${getStatusColor(artifact.status)}`}>{artifact.status}</span>
                  {artifact.processingProgress !== undefined && (
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${artifact.processingProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{artifact.processingProgress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {additionalArtifacts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Artifacts</h3>
          <div className="space-y-2">
            {additionalArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${isSelected(artifact.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => toggleSelect(artifact.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected(artifact.id)}
                    onChange={() => toggleSelect(artifact.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{artifact.originalFilename}</span>
                      <span className="text-sm text-gray-500">({artifact.filename})</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatFileSize(artifact.fileSize)} • {artifact.mimeType} • {new Date(artifact.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${getStatusColor(artifact.status)}`}>{artifact.status}</span>
                  {artifact.processingProgress !== undefined && (
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${artifact.processingProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{artifact.processingProgress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {artifacts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No artifacts found</div>
          <button
            onClick={() => setIsUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Artifact
          </button>
        </div>
      )}
      
      <AddArtifactDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={uploadArtifact}
        documentId={documentId}
      />
    </div>
  );
}
