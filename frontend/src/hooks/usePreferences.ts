"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tpl:library:prefs:v1";

export interface LibraryPreferences {
  viewMode: "table" | "card";
  sortField: string;
  sortDir: "asc" | "desc";
  splitPaneSizes: number[];
  panelCollapsedStates: Record<string, boolean>;
}

const defaultPreferences: LibraryPreferences = {
  viewMode: "table",
  sortField: "title",
  sortDir: "asc",
  splitPaneSizes: [33, 67],
  panelCollapsedStates: {},
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<LibraryPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LibraryPreferences>;
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load library preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error("Failed to save library preferences:", error);
      }
    }
  }, [preferences, isLoaded]);

  const updatePreferences = useCallback(
    (updates: Partial<LibraryPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  return {
    preferences,
    isLoaded,
    updatePreferences,
    resetPreferences,
  };
}