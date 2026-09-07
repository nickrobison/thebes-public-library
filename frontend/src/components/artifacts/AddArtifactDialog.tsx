"use client";

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useImportPolling } from '../../hooks/useArtifacts';

interface AddArtifactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  documentId: string;
}

export function AddArtifactDialog({ isOpen, onClose, onUpload, documentId }: AddArtifactDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: importStatus } = useImportPolling(uploadId || '', (status) => {
    if (status.status === 'COMPLETED') {
      toast.success('Artifact uploaded successfully');
      onClose();
      // Refresh the artifacts list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (status.status === 'FAILED') {
      toast.error(`Upload failed: ${status.error || 'Unknown error'}`);
      setIsUploading(false);
    }
  });
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    setIsUploading(true);
    try {
      onUpload(selectedFile);
      // The upload mutation in useArtifacts hook will return an UploadResponse with an id
      // We need to capture that ID for polling
      // For now, we'll simulate it - in real implementation, we'd get the ID from the mutation response
      setUploadId('temp-upload-id');
    } catch (error) {
      toast.error('Failed to start upload');
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    if (!isUploading) {
      onClose();
      setSelectedFile(null);
      setUploadId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Upload Artifact</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
            {selectedFile && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          
          {importStatus && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Upload Status:</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${importStatus.processingProgress || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{importStatus.processingProgress || 0}%</span>
              </div>
              <div className="text-xs text-gray-600">
                Status: <span className={`font-medium ${importStatus.status === 'COMPLETED' ? 'text-green-600' : importStatus.status === 'FAILED' ? 'text-red-600' : 'text-blue-600'}`}>{importStatus.status}</span>
              </div>
              {importStatus.error && (
                <div className="text-xs text-red-600">
                  Error: {importStatus.error}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
