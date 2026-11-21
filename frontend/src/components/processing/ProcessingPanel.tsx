"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { ProcessingHistoryItem } from '../../types/document';

type WorkflowStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface ProcessingStage {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime?: string;
  endTime?: string;
  output?: unknown;
  error?: string;
}

type ProcessingHistory = Omit<ProcessingHistoryItem, 'stages'> & {
  stages: ProcessingStage[];
};

interface ProcessingPanelProps {
  documentId: string;
}

export function ProcessingPanel({ documentId }: ProcessingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProcessingHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/documents/${documentId}/processing-history`);
      if (response.ok) {
        const data = (await response.json()) as ProcessingHistory[];
        // Guard against unexpected stage shapes so one bad row cannot blank the panel.
        setProcessingHistory(
          data.map((run) => ({ ...run, stages: Array.isArray(run.stages) ? run.stages : [] }))
        );
      } else {
        toast.error('Failed to load processing history');
      }
    } catch (error) {
      toast.error('Failed to load processing history');
    } finally {
      setIsLoading(false);
    }
  };

  const STATUS_BADGES: Record<WorkflowStatus, { className: string; label: string }> = {
    PENDING: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    RUNNING: { className: 'bg-blue-100 text-blue-800', label: 'Running' },
    COMPLETED: { className: 'bg-green-100 text-green-800', label: 'Completed' },
    FAILED: { className: 'bg-red-100 text-red-800', label: 'Failed' },
  };

  const getStatusBadge = (status: string) => {
    // Fall back to a neutral badge for unexpected values rather than throwing.
    const config = STATUS_BADGES[status as WorkflowStatus] ?? {
      className: 'bg-gray-100 text-gray-800',
      label: status,
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div
      data-testid="processing-panel"
      data-expanded={isExpanded}
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    >
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => {
          if (!isExpanded) fetchProcessingHistory();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">📊</span>
            <h3 className="text-lg font-medium text-gray-900">Processing History</h3>
            {processingHistory.length > 0 && (
              <span className="text-sm text-gray-500">({processingHistory.length} runs)</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExpanded) fetchProcessingHistory();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {processingHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No processing history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processingHistory.map((run) => (
                <div key={run.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{run.type}</span>
                      {getStatusBadge(run.status)}
                      <span className="text-sm text-gray-500">Retry: {run.retryCount}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Submitted: {formatDate(run.submittedAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Current Stage:</span>
                      <p className="text-sm text-gray-600">{run.currentStage}</p>
                    </div>
                    {run.completedAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Completed:</span>
                        <p className="text-sm text-gray-600">{formatDate(run.completedAt)}</p>
                      </div>
                    )}
                    {run.failureReason && (
                      <div className="md:col-span-2">
                        <span className="text-sm font-medium text-red-700">Failure Reason:</span>
                        <p className="text-sm text-red-600">{run.failureReason}</p>
                      </div>
                    )}
                  </div>

                  {run.stages && run.stages.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Stages:</span>
                      <div className="mt-2 space-y-2">
                        {run.stages.map((stage, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium w-24">{stage.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                                ${stage.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  stage.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                                  stage.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}
                              }`}
                              >
                                {stage.status}
                              </span>
                              {stage.startTime && (
                                <span className="text-xs text-gray-500">
                                  Started: {formatDate(stage.startTime)}
                                </span>
                              )}
                              {stage.endTime && (
                                <span className="text-xs text-gray-500">
                                  Ended: {formatDate(stage.endTime)}
                                </span>
                              )}
                            </div>
                            {stage.error && (
                              <div className="ml-auto">
                                <span className="text-xs text-red-600">Error: {stage.error}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}