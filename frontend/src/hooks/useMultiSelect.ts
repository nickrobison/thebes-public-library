"use client";

import { useState, useCallback, useEffect } from 'react';

interface UseMultiSelectOptions<T> {
  items: T[];
  getItemId: (item: T) => string | number;
  initialSelected?: (string | number)[];
  onSelectionChange?: (selected: (string | number)[]) => void;
}

export function useMultiSelect<T>(options: UseMultiSelectOptions<T>) {
  const { items, getItemId, initialSelected = [], onSelectionChange } = options;
  
  const [selected, setSelected] = useState<Set<string | number>>(new Set(initialSelected));
  
  const isAllSelected = items.length > 0 && selected.size === items.length;
  const isIndeterminate = selected.size > 0 && selected.size < items.length;
  
  const selectAll = useCallback(() => {
    const allIds = items.map(getItemId);
    setSelected(new Set(allIds));
    onSelectionChange?.(allIds);
  }, [items, getItemId, onSelectionChange]);
  
  const deselectAll = useCallback(() => {
    setSelected(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);
  
  const toggleSelect = useCallback((id: string | number) => {
    setSelected(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      const arraySelected = Array.from(newSelected);
      onSelectionChange?.(arraySelected);
      return newSelected;
    });
  }, [onSelectionChange]);
  
  const selectItem = useCallback((id: string | number) => {
    setSelected(prev => {
      const newSelected = new Set(prev);
      newSelected.add(id);
      const arraySelected = Array.from(newSelected);
      onSelectionChange?.(arraySelected);
      return newSelected;
    });
  }, [onSelectionChange]);
  
  const deselectItem = useCallback((id: string | number) => {
    setSelected(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(id);
      const arraySelected = Array.from(newSelected);
      onSelectionChange?.(arraySelected);
      return newSelected;
    });
  }, [onSelectionChange]);
  
  const clearSelection = useCallback(() => {
    setSelected(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);
  
  const isSelected = useCallback((id: string | number) => {
    return selected.has(id);
  }, [selected]);
  
  const selectedItems = useCallback(() => {
    return items.filter(item => selected.has(getItemId(item)));
  }, [items, selected, getItemId]);
  
  return {
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
    isIndeterminate,
  };
}