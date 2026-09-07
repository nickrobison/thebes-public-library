"use client";

import { useState, useEffect, useRef } from 'react';

interface UnsavedChangesOptions {
  onBeforeUnload?: (event: BeforeUnloadEvent) => string | void;
  onRouteChange?: (to: string) => boolean;
}

export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  options: UnsavedChangesOptions = {}
) {
  const [showWarning, setShowWarning] = useState(false);
  const lastPathRef = useRef<string>(
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    const handleRouteChange = (to: string) => {
      if (hasUnsavedChanges && options.onRouteChange) {
        const shouldProceed = options.onRouteChange(to);
        if (!shouldProceed) {
          setShowWarning(true);
          return false;
        }
      }
      return true;
    };

    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Store original pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState and replaceState to detect route changes
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      if (args[2] !== lastPathRef.current) {
        lastPathRef.current = args[2] as string;
        handleRouteChange(args[2] as string);
      }
      return result;
    };

    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      if (args[2] !== lastPathRef.current) {
        lastPathRef.current = args[2] as string;
        handleRouteChange(args[2] as string);
      }
      return result;
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [hasUnsavedChanges, options.onRouteChange]);

  const confirmDiscard = () => {
    setShowWarning(false);
    return true;
  };

  return {
    showWarning,
    setShowWarning,
    confirmDiscard
  };
}