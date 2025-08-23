import { useState, useEffect, useCallback } from 'react';
import { governanceService } from '../services/governanceService';
import { RoomGovernanceState } from '../types/governance';
import { ChatRoom } from '../api/chatApi';

export interface RoomWithState extends ChatRoom {
  governanceState?: RoomGovernanceState;
  governanceLoading?: boolean;
  governanceError?: string;
}

export interface UseRoomStatesReturn {
  roomsWithStates: RoomWithState[];
  isLoading: boolean;
  error: string | null;
  refreshStates: () => Promise<void>;
  getStateForRoom: (roomId: string) => RoomGovernanceState | undefined;
}

/**
 * Hook for fetching and managing governance states for multiple rooms
 * Efficiently batches requests and provides room state data for UI display
 */
export const useRoomStates = (rooms: ChatRoom[]): UseRoomStatesReturn => {
  const [roomStates, setRoomStates] = useState<Map<string, RoomGovernanceState>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set());
  const [errorStates, setErrorStates] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch governance state for a single room
  const fetchRoomState = useCallback(async (roomId: string): Promise<void> => {
    setLoadingStates(prev => new Set(prev).add(roomId));
    setErrorStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(roomId);
      return newMap;
    });

    try {
      console.log(`🏛️ Fetching governance state for room: ${roomId}`);
      const governanceState = await governanceService.getRoomGovernanceState(roomId);
      
      setRoomStates(prev => new Map(prev).set(roomId, governanceState));
      console.log(`✅ Got governance state for ${roomId}:`, governanceState.current_state);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch governance state';
      console.error(`❌ Failed to fetch governance state for room ${roomId}:`, err);
      
      setErrorStates(prev => new Map(prev).set(roomId, errorMessage));
    } finally {
      setLoadingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(roomId);
        return newSet;
      });
    }
  }, []);

  // Fetch governance states for all rooms
  const fetchAllRoomStates = useCallback(async (): Promise<void> => {
    if (rooms.length === 0) {
      setRoomStates(new Map());
      setLoadingStates(new Set());
      setErrorStates(new Map());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🏛️ Fetching governance states for ${rooms.length} rooms`);
      
      // Fetch all room states in parallel with a reasonable concurrency limit
      const batchSize = 5; // Limit concurrent requests
      const roomIds = rooms.map(room => room.room_id);
      
      for (let i = 0; i < roomIds.length; i += batchSize) {
        const batch = roomIds.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(roomId => fetchRoomState(roomId)));
      }
      
      console.log(`✅ Completed fetching governance states for all rooms`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch room governance states';
      setError(errorMessage);
      console.error('❌ Failed to fetch room governance states:', err);
    } finally {
      setIsLoading(false);
    }
  }, [rooms, fetchRoomState]);

  // Fetch states when rooms change
  useEffect(() => {
    fetchAllRoomStates();
  }, [fetchAllRoomStates]);

  // Clean up states for rooms that no longer exist
  useEffect(() => {
    const currentRoomIds = new Set(rooms.map(room => room.room_id));
    
    setRoomStates(prev => {
      const newMap = new Map();
      prev.forEach((state, roomId) => {
        if (currentRoomIds.has(roomId)) {
          newMap.set(roomId, state);
        }
      });
      return newMap;
    });
    
    setLoadingStates(prev => {
      const newSet = new Set<string>();
      prev.forEach(roomId => {
        if (currentRoomIds.has(roomId)) {
          newSet.add(roomId);
        }
      });
      return newSet;
    });
    
    setErrorStates(prev => {
      const newMap = new Map();
      prev.forEach((error, roomId) => {
        if (currentRoomIds.has(roomId)) {
          newMap.set(roomId, error);
        }
      });
      return newMap;
    });
  }, [rooms]);

  // Combine rooms with their governance states
  const roomsWithStates: RoomWithState[] = rooms.map(room => ({
    ...room,
    governanceState: roomStates.get(room.room_id),
    governanceLoading: loadingStates.has(room.room_id),
    governanceError: errorStates.get(room.room_id)
  }));

  // Helper function to get state for a specific room
  const getStateForRoom = useCallback((roomId: string): RoomGovernanceState | undefined => {
    return roomStates.get(roomId);
  }, [roomStates]);

  return {
    roomsWithStates,
    isLoading,
    error,
    refreshStates: fetchAllRoomStates,
    getStateForRoom
  };
};