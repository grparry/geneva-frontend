/**
 * Cognitive Memory Redux Slice
 * State management for Geneva's Cognitive Memory system
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  CognitiveState,
  CognitiveMemory,
  CognitiveSearchParams,
  CognitiveTier,
  SecurityRiskLevel,
  ConceptUsage,
  TierStatsResponse,
} from '../../types/cognitive';

const initialState: CognitiveState = {
  memories: {
    items: [],
    loading: false,
    error: null,
    total: 0,
    hasMore: false,
  },
  tiers: {
    stats: null,
    loading: false,
    error: null,
  },
  concepts: {
    items: [],
    loading: false,
    error: null,
  },
  search: {
    results: [],
    loading: false,
    error: null,
    params: {
      query: '',
      filters: {},
      limit: 50,
      offset: 0,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
  },
  security: {
    memories: {
      low: [],
      medium: [],
      high: [],
      critical: [],
    },
    loading: false,
    error: null,
  },
  ui: {
    selectedMemory: null,
    selectedTier: null,
    selectedConcept: null,
    showAdvancedFilters: false,
    viewMode: 'browser',
  },
};

export const cognitiveSlice = createSlice({
  name: 'cognitive',
  initialState,
  reducers: {
    // UI state management
    setSelectedMemory: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedMemory = action.payload;
    },

    setSelectedTier: (state, action: PayloadAction<CognitiveTier | null>) => {
      state.ui.selectedTier = action.payload;
    },

    setSelectedConcept: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedConcept = action.payload;
    },

    setViewMode: (state, action: PayloadAction<'browser' | 'search' | 'security' | 'concepts'>) => {
      state.ui.viewMode = action.payload;
    },

    toggleAdvancedFilters: (state) => {
      state.ui.showAdvancedFilters = !state.ui.showAdvancedFilters;
    },

    setShowAdvancedFilters: (state, action: PayloadAction<boolean>) => {
      state.ui.showAdvancedFilters = action.payload;
    },

    // Search state management
    setSearchParams: (state, action: PayloadAction<Partial<CognitiveSearchParams>>) => {
      state.search.params = {
        ...state.search.params,
        ...action.payload,
      };
    },

    clearSearch: (state) => {
      state.search.results = [];
      state.search.params = {
        query: '',
        filters: {},
        limit: 50,
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'desc',
      };
      state.search.error = null;
    },

    // Memory state management
    setMemories: (state, action: PayloadAction<{
      memories: CognitiveMemory[];
      total: number;
      hasMore: boolean;
    }>) => {
      state.memories.items = action.payload.memories;
      state.memories.total = action.payload.total;
      state.memories.hasMore = action.payload.hasMore;
    },

    appendMemories: (state, action: PayloadAction<{
      memories: CognitiveMemory[];
      total: number;
      hasMore: boolean;
    }>) => {
      state.memories.items.push(...action.payload.memories);
      state.memories.total = action.payload.total;
      state.memories.hasMore = action.payload.hasMore;
    },

    updateMemory: (state, action: PayloadAction<CognitiveMemory>) => {
      const index = state.memories.items.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.memories.items[index] = action.payload;
      }
      
      // Update in search results if present
      const searchIndex = state.search.results.findIndex(m => m.id === action.payload.id);
      if (searchIndex !== -1) {
        state.search.results[searchIndex] = action.payload;
      }

      // Update in security memories if present
      Object.keys(state.security.memories).forEach(riskLevel => {
        const securityIndex = state.security.memories[riskLevel as SecurityRiskLevel]
          .findIndex(m => m.id === action.payload.id);
        if (securityIndex !== -1) {
          state.security.memories[riskLevel as SecurityRiskLevel][securityIndex] = action.payload;
        }
      });
    },

    removeMemory: (state, action: PayloadAction<string>) => {
      const memoryId = action.payload;
      
      // Remove from main memories
      state.memories.items = state.memories.items.filter(m => m.id !== memoryId);
      state.memories.total = Math.max(0, state.memories.total - 1);
      
      // Remove from search results
      state.search.results = state.search.results.filter(m => m.id !== memoryId);
      
      // Remove from security memories
      Object.keys(state.security.memories).forEach(riskLevel => {
        state.security.memories[riskLevel as SecurityRiskLevel] = 
          state.security.memories[riskLevel as SecurityRiskLevel].filter(m => m.id !== memoryId);
      });

      // Clear selection if it was the removed memory
      if (state.ui.selectedMemory === memoryId) {
        state.ui.selectedMemory = null;
      }
    },

    // Tier stats management
    setTierStats: (state, action: PayloadAction<TierStatsResponse>) => {
      state.tiers.stats = action.payload;
    },

    // Concepts management
    setConcepts: (state, action: PayloadAction<ConceptUsage[]>) => {
      state.concepts.items = action.payload;
    },

    updateConceptUsage: (state, action: PayloadAction<{
      concept: string;
      count: number;
      percentage: number;
    }>) => {
      const index = state.concepts.items.findIndex(c => c.concept === action.payload.concept);
      if (index !== -1) {
        state.concepts.items[index] = action.payload;
      } else {
        state.concepts.items.push(action.payload);
      }
    },

    // Security memories management
    setSecurityMemories: (state, action: PayloadAction<{
      level: SecurityRiskLevel;
      memories: CognitiveMemory[];
    }>) => {
      state.security.memories[action.payload.level] = action.payload.memories;
    },

    // Bulk operations
    bulkUpdateMemories: (state, action: PayloadAction<{
      memory_ids: string[];
      updates: Partial<CognitiveMemory>;
    }>) => {
      const { memory_ids, updates } = action.payload;
      
      // Update main memories
      state.memories.items = state.memories.items.map(memory => 
        memory_ids.includes(memory.id) 
          ? { ...memory, ...updates }
          : memory
      );
      
      // Update search results
      state.search.results = state.search.results.map(memory => 
        memory_ids.includes(memory.id) 
          ? { ...memory, ...updates }
          : memory
      );
      
      // Update security memories
      Object.keys(state.security.memories).forEach(riskLevel => {
        state.security.memories[riskLevel as SecurityRiskLevel] = 
          state.security.memories[riskLevel as SecurityRiskLevel].map(memory => 
            memory_ids.includes(memory.id) 
              ? { ...memory, ...updates }
              : memory
          );
      });
    },

    // Loading states
    setMemoriesLoading: (state, action: PayloadAction<boolean>) => {
      state.memories.loading = action.payload;
    },

    setTierStatsLoading: (state, action: PayloadAction<boolean>) => {
      state.tiers.loading = action.payload;
    },

    setConceptsLoading: (state, action: PayloadAction<boolean>) => {
      state.concepts.loading = action.payload;
    },

    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.search.loading = action.payload;
    },

    setSecurityLoading: (state, action: PayloadAction<boolean>) => {
      state.security.loading = action.payload;
    },

    // Error states
    setMemoriesError: (state, action: PayloadAction<string | null>) => {
      state.memories.error = action.payload;
    },

    setTierStatsError: (state, action: PayloadAction<string | null>) => {
      state.tiers.error = action.payload;
    },

    setConceptsError: (state, action: PayloadAction<string | null>) => {
      state.concepts.error = action.payload;
    },

    setSearchError: (state, action: PayloadAction<string | null>) => {
      state.search.error = action.payload;
    },

    setSecurityError: (state, action: PayloadAction<string | null>) => {
      state.security.error = action.payload;
    },

    // Clear all errors
    clearErrors: (state) => {
      state.memories.error = null;
      state.tiers.error = null;
      state.concepts.error = null;
      state.search.error = null;
      state.security.error = null;
    },

    // Reset state
    resetCognitiveState: () => initialState,
  },
});

// Export actions
export const {
  setSelectedMemory,
  setSelectedTier,
  setSelectedConcept,
  setViewMode,
  toggleAdvancedFilters,
  setShowAdvancedFilters,
  setSearchParams,
  clearSearch,
  setMemories,
  appendMemories,
  updateMemory,
  removeMemory,
  setTierStats,
  setConcepts,
  updateConceptUsage,
  setSecurityMemories,
  bulkUpdateMemories,
  setMemoriesLoading,
  setTierStatsLoading,
  setConceptsLoading,
  setSearchLoading,
  setSecurityLoading,
  setMemoriesError,
  setTierStatsError,
  setConceptsError,
  setSearchError,
  setSecurityError,
  clearErrors,
  resetCognitiveState,
} = cognitiveSlice.actions;

// Export selectors
export const selectCognitiveMemories = (state: { cognitive: CognitiveState }) => state.cognitive.memories;
export const selectCognitiveTiers = (state: { cognitive: CognitiveState }) => state.cognitive.tiers;
export const selectCognitiveConcepts = (state: { cognitive: CognitiveState }) => state.cognitive.concepts;
export const selectCognitiveSearch = (state: { cognitive: CognitiveState }) => state.cognitive.search;
export const selectCognitiveSecurity = (state: { cognitive: CognitiveState }) => state.cognitive.security;
export const selectCognitiveUI = (state: { cognitive: CognitiveState }) => state.cognitive.ui;

// Complex selectors
export const selectSelectedMemory = (state: { cognitive: CognitiveState }) => {
  const selectedId = state.cognitive.ui.selectedMemory;
  if (!selectedId) return null;
  
  // Look in main memories first
  const mainMemory = state.cognitive.memories.items.find(m => m.id === selectedId);
  if (mainMemory) return mainMemory;
  
  // Look in search results
  const searchMemory = state.cognitive.search.results.find(m => m.id === selectedId);
  if (searchMemory) return searchMemory;
  
  // Look in security memories
  for (const riskLevel of Object.keys(state.cognitive.security.memories)) {
    const securityMemory = state.cognitive.security.memories[riskLevel as SecurityRiskLevel]
      .find(m => m.id === selectedId);
    if (securityMemory) return securityMemory;
  }
  
  return null;
};

export const selectMemoriesByTier = (state: { cognitive: CognitiveState }, tier: CognitiveTier) => {
  return state.cognitive.memories.items.filter(m => m.tier === tier);
};

export const selectMemoriesByConcept = (state: { cognitive: CognitiveState }, concept: string) => {
  return state.cognitive.memories.items.filter(m => m.concepts.includes(concept));
};

export const selectTierCounts = (state: { cognitive: CognitiveState }) => {
  const stats = state.cognitive.tiers.stats;
  if (!stats) return {};
  
  return Object.fromEntries(
    Object.entries(stats.tier_distribution).map(([tier, data]) => [
      tier,
      { count: data.count, percentage: data.percentage }
    ])
  );
};

export const selectTopConcepts = (state: { cognitive: CognitiveState }, limit: number = 10) => {
  return state.cognitive.concepts.items
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const selectHighRiskMemories = (state: { cognitive: CognitiveState }) => {
  return [
    ...state.cognitive.security.memories.high,
    ...state.cognitive.security.memories.critical,
  ].sort((a, b) => b.risk_score - a.risk_score);
};

export const selectCognitiveIsLoading = (state: { cognitive: CognitiveState }) => {
  return state.cognitive.memories.loading ||
         state.cognitive.tiers.loading ||
         state.cognitive.concepts.loading ||
         state.cognitive.search.loading ||
         state.cognitive.security.loading;
};

export const selectCognitiveErrors = (state: { cognitive: CognitiveState }) => {
  return [
    state.cognitive.memories.error,
    state.cognitive.tiers.error,
    state.cognitive.concepts.error,
    state.cognitive.search.error,
    state.cognitive.security.error,
  ].filter(Boolean);
};

export default cognitiveSlice.reducer;