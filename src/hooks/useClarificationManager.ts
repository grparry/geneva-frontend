import { useState, useEffect, useCallback, useRef } from 'react';
import { ClarificationRequest, ClarificationResponse, ClarificationState } from '../types/clarification';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';

interface UseClarificationManagerOptions {
  taskId?: string;
  pollingInterval?: number; // milliseconds
  enabled?: boolean;
  onNewClarification?: (request: ClarificationRequest) => void;
  onClarificationExpired?: (requestId: string) => void;
}

export const useClarificationManager = ({
  taskId,
  pollingInterval = 2000, // Poll every 2 seconds
  enabled = true,
  onNewClarification,
  onClarificationExpired
}: UseClarificationManagerOptions) => {
  const [state, setState] = useState<ClarificationState>({
    pending: [],
    answered: new Map(),
    expired: []
  });
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const knownRequestsRef = useRef<Set<string>>(new Set());

  // Fetch pending clarifications
  const fetchPendingClarifications = useCallback(async () => {
    if (!enabled) return;

    try {
      const url = taskId 
        ? `${API_BASE}/api/clarifications/pending?task_id=${taskId}`
        : `${API_BASE}/api/clarifications/pending`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch clarifications: ${response.status}`);
      }

      const data: ClarificationRequest[] = await response.json();
      
      // Check for new clarifications
      data.forEach(request => {
        if (!knownRequestsRef.current.has(request.id)) {
          knownRequestsRef.current.add(request.id);
          onNewClarification?.(request);
        }
      });

      // Check for expired clarifications
      const now = new Date().getTime();
      const expired = data.filter(request => 
        new Date(request.expires_at).getTime() <= now
      );

      expired.forEach(request => {
        if (!state.expired.includes(request.id)) {
          onClarificationExpired?.(request.id);
        }
      });

      setState(prev => ({
        ...prev,
        pending: data.filter(request => 
          new Date(request.expires_at).getTime() > now
        ),
        expired: [...prev.expired, ...expired.map(r => r.id)]
      }));

      setError(null);
    } catch (err) {
      console.error('Error fetching clarifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [enabled, taskId, onNewClarification, onClarificationExpired, state.expired]);

  // Submit clarification response
  const respondToClarification = useCallback(async (
    requestId: string,
    selectedOptionId: string,
    reasoning?: string,
    additionalContext?: Record<string, any>
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/clarifications/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_option_id: selectedOptionId,
          reasoning,
          additional_context: additionalContext,
          responded_by: 'user' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to respond to clarification: ${response.status}`);
      }

      const clarificationResponse: ClarificationResponse = await response.json();

      // Update state
      setState(prev => ({
        ...prev,
        pending: prev.pending.filter(req => req.id !== requestId),
        answered: new Map(prev.answered).set(requestId, clarificationResponse)
      }));

      return clarificationResponse;
    } catch (err) {
      console.error('Error responding to clarification:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  // Skip clarification (use default)
  const skipClarification = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/clarifications/${requestId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to skip clarification: ${response.status}`);
      }

      // Remove from pending
      setState(prev => ({
        ...prev,
        pending: prev.pending.filter(req => req.id !== requestId)
      }));
    } catch (err) {
      console.error('Error skipping clarification:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Start/stop polling
  useEffect(() => {
    if (enabled && !isPolling) {
      setIsPolling(true);
      
      const poll = async () => {
        await fetchPendingClarifications();
        
        if (enabled) {
          pollTimeoutRef.current = setTimeout(poll, pollingInterval);
        }
      };

      poll();
    } else if (!enabled && isPolling) {
      setIsPolling(false);
      
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [enabled, isPolling, pollingInterval, fetchPendingClarifications]);

  // Mock clarification for testing
  const createMockClarification = useCallback((): ClarificationRequest => {
    const id = `mock-${Date.now()}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    return {
      id,
      task_id: taskId || 'mock-task',
      agent_id: 'claude_code',
      question: 'I found multiple authentication approaches. Which would you prefer?',
      options: [
        {
          id: 'jwt',
          description: 'JWT-based authentication',
          pros: ['Stateless', 'Scalable', 'Industry standard'],
          cons: ['Token management complexity', 'Refresh token handling'],
          recommended: true
        },
        {
          id: 'session',
          description: 'Session-based authentication',
          pros: ['Simple implementation', 'Easy revocation', 'Server control'],
          cons: ['Requires server state', 'Less scalable', 'Cookie management']
        },
        {
          id: 'oauth',
          description: 'OAuth 2.0 with external providers',
          pros: ['No password management', 'Social login', 'Trusted providers'],
          cons: ['Complex setup', 'External dependencies', 'Privacy concerns']
        }
      ],
      context: {
        current_implementation: 'Basic authentication with hardcoded credentials',
        performance_requirements: { concurrent_users: 1000, response_time_ms: 100 },
        constraints: { compliance: 'SOC2', existing_infrastructure: 'Redis available' },
        related_files: ['src/auth/auth.py', 'src/auth/middleware.py', 'tests/test_auth.py']
      },
      urgency: 'HIGH' as any,
      timeout_seconds: 300,
      created_at: now.toISOString(),
      expires_at: expires.toISOString()
    };
  }, [taskId]);

  // Add mock clarification for testing
  const addMockClarification = useCallback(() => {
    const mockRequest = createMockClarification();
    setState(prev => ({
      ...prev,
      pending: [...prev.pending, mockRequest]
    }));
    knownRequestsRef.current.add(mockRequest.id);
    onNewClarification?.(mockRequest);
  }, [createMockClarification, onNewClarification]);

  return {
    // State
    pending: state.pending,
    answered: state.answered,
    expired: state.expired,
    error,
    isPolling,
    
    // Actions
    respondToClarification,
    skipClarification,
    refresh: fetchPendingClarifications,
    
    // Testing
    addMockClarification
  };
};