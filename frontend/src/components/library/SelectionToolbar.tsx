"use client";

import { X } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  onClear: () => void;
}

/**
 * Bulk action bar. The actions are framework placeholders for Phase 4
 * (collections, tags, export), so they render disabled rather than pretending
 * to work. Only clearing the selection is functional today.
 */
export function SelectionToolbar({ selectedCount, onClear }: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      data-testid="selection-toolbar"
      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
    >
      <span
        data-testid="selection-count"
        className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white"
      >
        {selectedCount} selected
      </span>

      <span className="text-xs text-slate-400">Bulk actions arrive in Phase 4:</span>

      <button
        type="button"
        disabled
        title="Available in Phase 4"
        className="cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-400"
      >
        Add to collection
      </button>
      <button
        type="button"
        disabled
        title="Available in Phase 4"
        className="cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-400"
      >
        Tag
      </button>
      <button
        type="button"
        disabled
        title="Available in Phase 4"
        className="cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-400"
      >
        Export
      </button>

      <button
        type="button"
        aria-label="Clear selection"
        data-testid="selection-clear"
        onClick={onClear}
        className="ml-auto rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
