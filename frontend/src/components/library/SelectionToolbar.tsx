"use client";

import React from 'react';

interface SelectionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: string) => void;
}

export function SelectionToolbar({ selectedCount, onClear, onAction }: SelectionToolbarProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
        {selectedCount} selected
      </div>
      <button
        onClick={() => onAction('view')}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        View
      </button>
      <button
        onClick={() => onAction('download')}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        Download
      </button>
      <button
        onClick={() => onAction('metadata')}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        Metadata
      </button>
      <button
        onClick={() => onAction('processing')}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        Processing History
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1 text-red-600 hover:text-red-700 transition-colors text-sm"
      >
        Clear Selection
      </button>
    </div>
  );
}