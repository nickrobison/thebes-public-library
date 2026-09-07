"use client";

import React, { useState } from 'react';

interface BulkActionButtonProps {
  items: Array<{ id: string; filename: string; originalFilename: string }>;
  onAction: (action: string, itemIds: string[]) => void;
}

export function BulkActionButton({ items, onAction }: BulkActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleAction = (action: string) => {
    const itemIds = items.map(item => item.id);
    onAction(action, itemIds);
    setIsOpen(false);
  };
  
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        Bulk Actions ▾
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => handleAction('view')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View
            </button>
            <button
              onClick={() => handleAction('download')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Download
            </button>
            <button
              onClick={() => handleAction('metadata')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Metadata
            </button>
            <button
              onClick={() => handleAction('processing')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Processing History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}