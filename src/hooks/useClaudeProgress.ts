import { useEffect, useState, useCallback, useRef } from 'react';
import { ProgressStage } from '../components/claude/progress/ClaudeProgressBar';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

export interface ProgressEvent {
  stage: ProgressStage;
  progress: number; // 0-1
  message: string;
  timestamp: string;
}

export interface ProgressSummary {
  task_id: string;
  current_stage: ProgressStage;
  overall_progress: number; // 0-1
  current_operation: string;
  estimated_remaining: number; // seconds
  start_time: string;
  stages_completed: ProgressStage[];
}

export interface ProgressStreamData {
  event: ProgressEvent;
  summary: ProgressSummary;
  heartbeat?: boolean;
}

interface UseClaudeProgressOptions {
  taskId: string;
  enabled?: boolean;
  onProgress?: (data: ProgressStreamData) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const useClaudeProgress = ({
  taskId,
  enabled = true,
  onProgress,
  onComplete,
  onError
}: UseClaudeProgressOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ProgressStreamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !taskId || eventSourceRef.current) {
      return;
    }

    try {
      const url = `${API_BASE}/api/progress/${taskId}/stream`;
      console.log('Connecting to progress stream:', url);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('Progress stream connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: ProgressStreamData = JSON.parse(event.data);
          
          // Update current progress
          setCurrentProgress(data);
          
          // Call callback
          onProgress?.(data);
          
          // Check if complete
          if (data.summary.overall_progress >= 1.0) {
            onComplete?.();
            disconnect();
          }
        } catch (err) {
          console.error('Failed to parse progress event:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.error('Progress stream error:', event);
        setIsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            eventSource.close();
            eventSourceRef.current = null;
            connect();
          }, delay);
        } else {
          const errorMsg = 'Failed to connect to progress stream after 5 attempts';
          setError(errorMsg);
          onError?.(new Error(errorMsg));
          disconnect();
        }
      };

      // Handle specific event types
      eventSource.addEventListener('error', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setError(data.message);
        onError?.(new Error(data.message));
        disconnect();
      });

      eventSource.addEventListener('complete', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setCurrentProgress(data);
        onComplete?.();
        disconnect();
      });

    } catch (err) {
      console.error('Failed to create progress stream:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      onError?.(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [taskId, enabled, onProgress, onComplete, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Mock progress for testing (remove in production)
  const mockProgress = useCallback(() => {
    if (!enabled || !taskId) return;

    const stages = Object.values(ProgressStage);
    let currentStageIndex = 0;
    let stageProgress = 0;

    const interval = setInterval(() => {
      stageProgress += 0.1;
      
      if (stageProgress >= 1) {
        stageProgress = 0;
        currentStageIndex++;
        
        if (currentStageIndex >= stages.length) {
          clearInterval(interval);
          onComplete?.();
          return;
        }
      }

      const mockData: ProgressStreamData = {
        event: {
          stage: stages[currentStageIndex] as ProgressStage,
          progress: stageProgress,
          message: `Processing ${stages[currentStageIndex].toLowerCase().replace(/_/g, ' ')}...`,
          timestamp: new Date().toISOString()
        },
        summary: {
          task_id: taskId,
          current_stage: stages[currentStageIndex] as ProgressStage,
          overall_progress: (currentStageIndex + stageProgress) / stages.length,
          current_operation: `Step ${currentStageIndex + 1} of ${stages.length}`,
          estimated_remaining: Math.max(0, (stages.length - currentStageIndex) * 5),
          start_time: new Date(Date.now() - 30000).toISOString(),
          stages_completed: stages.slice(0, currentStageIndex) as ProgressStage[]
        }
      };

      setCurrentProgress(mockData);
      onProgress?.(mockData);
    }, 500);

    return () => clearInterval(interval);
  }, [taskId, enabled, onProgress, onComplete]);

  useEffect(() => {
    if (enabled && taskId) {
      // For now, use mock progress until backend is ready
      // TODO: Switch to real SSE connection when backend endpoints are available
      const cleanup = mockProgress();
      return cleanup;
      
      // Uncomment for real implementation:
      // connect();
    }

    return () => {
      disconnect();
    };
  }, [taskId, enabled, connect, disconnect, mockProgress]);

  return {
    isConnected,
    currentProgress,
    error,
    reconnect: connect,
    disconnect
  };
};