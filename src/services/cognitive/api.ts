/**
 * Cognitive Memory API Client
 * RTK Query API client for Geneva's Cognitive Memory system
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CognitiveMemory,
  CognitiveMemoriesResponse,
  TierStatsResponse,
  ConceptsResponse,
  CognitiveSearchRequest,
  CognitiveSearchParams,
  CognitiveTier,
  SecurityRiskLevel,
  ConceptUsage,
  CognitiveAnalytics,
} from '../../types/cognitive';

// Base query with project ID header
const cognitiveBaseQuery = fetchBaseQuery({
  baseUrl: '/api/cognitive',
  prepareHeaders: (headers, { getState }) => {
    // Get project ID from state or use system default
    const projectId = (getState() as any)?.auth?.currentProject?.id || '00000000-0000-0000-0000-000000000000';
    headers.set('X-Project-ID', projectId);
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const cognitiveApi = createApi({
  reducerPath: 'cognitiveApi',
  baseQuery: cognitiveBaseQuery,
  tagTypes: ['Memory', 'TierStats', 'Concepts', 'SearchResults', 'SecurityMemories', 'Analytics'],
  endpoints: (builder) => ({
    // Get memories by tier
    getMemoriesByTier: builder.query<CognitiveMemoriesResponse, {
      tier: CognitiveTier;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }>({
      query: ({ tier, page = 1, limit = 50, sort_by = 'created_at', sort_order = 'desc' }) => ({
        url: `/memories/tiers/${tier}`,
        params: { page, limit, sort_by, sort_order },
      }),
      providesTags: (result, error, { tier }) => [
        { type: 'Memory', id: `tier-${tier}` },
        { type: 'Memory', id: 'LIST' },
      ],
    }),

    // Get tier statistics
    getTierStats: builder.query<TierStatsResponse, void>({
      query: () => '/memories/tiers/stats',
      providesTags: [{ type: 'TierStats', id: 'LIST' }],
    }),

    // Get memories by security risk level
    getMemoriesByRisk: builder.query<CognitiveMemoriesResponse, {
      level: SecurityRiskLevel;
      time_range?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ level, time_range = '24h', page = 1, limit = 50 }) => ({
        url: `/security/memories/risk/${level}`,
        params: { time_range, page, limit },
      }),
      providesTags: (result, error, { level }) => [
        { type: 'SecurityMemories', id: level },
        { type: 'Memory', id: 'LIST' },
      ],
    }),

    // Get all concepts with usage stats
    getConcepts: builder.query<ConceptsResponse, {
      limit?: number;
      min_count?: number;
      sort_by?: 'count' | 'concept';
      sort_order?: 'asc' | 'desc';
    }>({
      query: ({ limit = 100, min_count = 1, sort_by = 'count', sort_order = 'desc' }) => ({
        url: '/concepts/',
        params: { limit, min_count, sort_by, sort_order },
      }),
      providesTags: [{ type: 'Concepts', id: 'LIST' }],
    }),

    // Get memories by concept
    getMemoriesByConcept: builder.query<CognitiveMemoriesResponse, {
      concept: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }>({
      query: ({ concept, page = 1, limit = 50, sort_by = 'importance', sort_order = 'desc' }) => ({
        url: `/concepts/${encodeURIComponent(concept)}/memories`,
        params: { page, limit, sort_by, sort_order },
      }),
      providesTags: (result, error, { concept }) => [
        { type: 'Memory', id: `concept-${concept}` },
        { type: 'Memory', id: 'LIST' },
      ],
    }),

    // Advanced search
    searchMemories: builder.mutation<CognitiveMemoriesResponse, CognitiveSearchRequest>({
      query: (searchRequest) => ({
        url: '/memories/search',
        method: 'POST',
        body: searchRequest,
      }),
      invalidatesTags: [{ type: 'SearchResults', id: 'LIST' }],
    }),

    // Get single memory by ID
    getMemoryById: builder.query<CognitiveMemory, string>({
      query: (id) => `/memories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Memory', id }],
    }),

    // Get related memories
    getRelatedMemories: builder.query<CognitiveMemoriesResponse, {
      memoryId: string;
      limit?: number;
      similarity_threshold?: number;
    }>({
      query: ({ memoryId, limit = 10, similarity_threshold = 0.7 }) => ({
        url: `/memories/${memoryId}/related`,
        params: { limit, similarity_threshold },
      }),
      providesTags: (result, error, { memoryId }) => [
        { type: 'Memory', id: `related-${memoryId}` },
      ],
    }),

    // Get memory analytics
    getAnalytics: builder.query<CognitiveAnalytics, {
      time_range?: string;
      include_trends?: boolean;
    }>({
      query: ({ time_range = '24h', include_trends = true }) => ({
        url: '/analytics',
        params: { time_range, include_trends },
      }),
      providesTags: [{ type: 'Analytics', id: 'LIST' }],
    }),

    // Bulk operations
    bulkUpdateMemories: builder.mutation<{ updated: number }, {
      memory_ids: string[];
      updates: Partial<Pick<CognitiveMemory, 'status' | 'importance' | 'concepts'>>;
    }>({
      query: ({ memory_ids, updates }) => ({
        url: '/memories/bulk',
        method: 'PATCH',
        body: { memory_ids, updates },
      }),
      invalidatesTags: [
        { type: 'Memory', id: 'LIST' },
        { type: 'TierStats', id: 'LIST' },
        { type: 'Concepts', id: 'LIST' },
      ],
    }),

    // Export memories
    exportMemories: builder.mutation<{ download_url: string }, {
      filters?: CognitiveSearchParams['filters'];
      format?: 'json' | 'csv' | 'xlsx';
      include_metadata?: boolean;
    }>({
      query: ({ filters, format = 'json', include_metadata = true }) => ({
        url: '/memories/export',
        method: 'POST',
        body: { filters, format, include_metadata },
      }),
    }),

    // Create new memory (for testing/manual creation)
    createMemory: builder.mutation<CognitiveMemory, {
      content: string;
      memory_type: 'llm' | 'observation' | 'decision';
      importance?: number;
      concepts?: string[];
      properties?: Record<string, any>;
    }>({
      query: (memoryData) => ({
        url: '/memories',
        method: 'POST',
        body: memoryData,
      }),
      invalidatesTags: [
        { type: 'Memory', id: 'LIST' },
        { type: 'TierStats', id: 'LIST' },
        { type: 'Concepts', id: 'LIST' },
      ],
    }),

    // Delete memory
    deleteMemory: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/memories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Memory', id },
        { type: 'Memory', id: 'LIST' },
        { type: 'TierStats', id: 'LIST' },
        { type: 'Concepts', id: 'LIST' },
      ],
    }),

    // Get memory processing status
    getProcessingStatus: builder.query<{
      total_pending: number;
      total_processing: number;
      total_completed: number;
      total_failed: number;
      avg_processing_time: number;
    }, void>({
      query: () => '/processing/status',
      providesTags: [{ type: 'Analytics', id: 'processing' }],
    }),

    // Trigger memory reprocessing
    reprocessMemory: builder.mutation<{ reprocessing: boolean }, {
      memory_id: string;
      agents?: ('bradley' | 'thedra' | 'greta')[];
    }>({
      query: ({ memory_id, agents = ['bradley', 'thedra', 'greta'] }) => ({
        url: `/memories/${memory_id}/reprocess`,
        method: 'POST',
        body: { agents },
      }),
      invalidatesTags: (result, error, { memory_id }) => [
        { type: 'Memory', id: memory_id },
        { type: 'Analytics', id: 'processing' },
      ],
    }),

    // Get concept relationships
    getConceptRelationships: builder.query<{
      concept: string;
      related_concepts: Array<{
        concept: string;
        relationship_strength: number;
        co_occurrence_count: number;
      }>;
    }, {
      concept: string;
      limit?: number;
      min_strength?: number;
    }>({
      query: ({ concept, limit = 20, min_strength = 0.1 }) => ({
        url: `/concepts/${encodeURIComponent(concept)}/relationships`,
        params: { limit, min_strength },
      }),
      providesTags: (result, error, { concept }) => [
        { type: 'Concepts', id: `relationships-${concept}` },
      ],
    }),

    // Health check
    getHealthStatus: builder.query<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      cognitive_agents: Record<string, boolean>;
      processing_queue_depth: number;
      last_processed_at: string;
    }, void>({
      query: () => '/health',
      providesTags: [{ type: 'Analytics', id: 'health' }],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetMemoriesByTierQuery,
  useGetTierStatsQuery,
  useGetMemoriesByRiskQuery,
  useGetConceptsQuery,
  useGetMemoriesByConceptQuery,
  useSearchMemoriesMutation,
  useGetMemoryByIdQuery,
  useGetRelatedMemoriesQuery,
  useGetAnalyticsQuery,
  useBulkUpdateMemoriesMutation,
  useExportMemoriesMutation,
  useCreateMemoryMutation,
  useDeleteMemoryMutation,
  useGetProcessingStatusQuery,
  useReprocessMemoryMutation,
  useGetConceptRelationshipsQuery,
  useGetHealthStatusQuery,
} = cognitiveApi;

// Export API for store configuration
export default cognitiveApi;