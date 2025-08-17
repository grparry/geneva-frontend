/**
 * Simplified Governance React Hooks
 * 
 * Basic REST API integration for governance state.
 * WebSocket functionality removed - governance is now request-scoped.
 */

import { useState, useEffect, useCallback } from 'react';
import { governanceService } from '../services/governanceService';
import {
  RoomGovernanceState,
  UseGovernanceStateReturn
} from '../types/governance';

/**
 * Hook for managing room governance state with real-time updates
 */
export const useGovernanceState = (roomId: string | null): UseGovernanceStateReturn => {
  const [governance, setGovernance] = useState<RoomGovernanceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGovernance = useCallback(async () => {
    if (!roomId) {
      setGovernance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const governanceState = await governanceService.getRoomGovernanceState(roomId);
      console.log('🏛️ Governance data received:', governanceState);
      setGovernance(governanceState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch governance state';
      setError(errorMessage);
      console.error('Failed to fetch governance state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Initial fetch
  useEffect(() => {
    fetchGovernance();
  }, [fetchGovernance]);

  return {
    governance,
    isLoading,
    error,
    refreshGovernance: fetchGovernance
  };
};




/**
 * Simplified hook for basic governance state
 */
export const useRoomGovernance = (roomId: string | null) => {
  return useGovernanceState(roomId);
};

