/**
 * 5D Memory Management API Client
 * RTK Query API client for Geneva's 5D Memory Management System
 *
 * Connects to backend endpoints at /api/v1/memory/
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Memory5D,
  Memory5DFilters,
  Memory5DSearchRequest,
  Memory5DSearchResponse,
  DimensionalBrowseRequest,
  DimensionalStats,
  Memory5DHealthStatus,
  TrinityProcessingStatus,
  TrinityAgentAction,
  Memory5DContent,
  Memory5DEditRequest,
  validateMemory5D,
} from '../../types/memory5d';

// Enhanced base query with project ID header and security token
const memory5dBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1/memory',
  prepareHeaders: (headers, { getState }) => {
    // Get project ID from state or use system default
    const state = getState() as any;
    const projectId = state?.auth?.currentProject?.id || '00000000-0000-0000-0000-000000000000';
    const authToken = state?.auth?.token;

    headers.set('X-Project-ID', projectId);
    headers.set('Content-Type', 'application/json');

    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    return headers;
  },
});

// Enhanced base query with validation and error handling
const memory5dBaseQueryWithValidation = async (args: any, api: any, extraOptions: any) => {
  // Pre-flight validation for mutations
  if (args.method && ['POST', 'PUT', 'PATCH'].includes(args.method)) {
    const body = args.body;

    // Validate Memory5D objects before sending
    if (body && (body.cognitive_type || body.temporal_tier)) {
      const validation = validateMemory5D(body);
      if (!validation.valid) {
        return {
          error: {
            status: 'VALIDATION_ERROR',
            data: {
              message: 'Invalid memory data',
              errors: validation.errors
            }
          }
        };
      }
    }
  }

  // Execute the actual query
  const result = await memory5dBaseQuery(args, api, extraOptions);

  // Post-process errors for better user experience
  if (result.error) {
    console.error('5D Memory API Error:', result.error);
  }

  return result;
};

export const memory5dApi = createApi({
  reducerPath: 'memory5dApi',
  baseQuery: memory5dBaseQueryWithValidation,
  tagTypes: [
    'Memory5D',
    'DimensionalStats',
    'SearchResults',
    'TrinityStatus',
    'HealthStatus',
    'Content',
    'Browse'
  ],
  endpoints: (builder) => ({

    // ========================================================================
    // CONTENT ENDPOINTS
    // ========================================================================

    // Get memories with basic filtering
    getMemories: builder.query<Memory5DSearchResponse, {
      filters?: Memory5DFilters;
      limit?: number;
      offset?: number;
      sort_by?: keyof Memory5D;
      sort_order?: 'asc' | 'desc';
    }>({
      query: ({ filters, limit = 50, offset = 0, sort_by = 'created_at', sort_order = 'desc' }) => ({
        url: '/content/memories',
        params: {
          ...filters,
          limit,
          offset,
          sort_by,
          sort_order
        },
      }),
      providesTags: [
        { type: 'Memory5D', id: 'LIST' },
        { type: 'SearchResults', id: 'LIST' }
      ],
    }),

    // Advanced cross-dimensional search
    searchMemories5D: builder.mutation<Memory5DSearchResponse, Memory5DSearchRequest>({
      query: (searchRequest) => ({
        url: '/content/search',
        method: 'POST',
        body: searchRequest,
      }),
      invalidatesTags: [{ type: 'SearchResults', id: 'LIST' }],
    }),

    // Get single memory by ID
    getMemoryById: builder.query<Memory5D, string>({
      query: (id) => `/content/memories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Memory5D', id }],
    }),

    // Create new 5D memory
    createMemory5D: builder.mutation<Memory5D, {
      content: string;
      cognitive_type: Memory5D['cognitive_type'];
      temporal_tier: Memory5D['temporal_tier'];
      organizational_scope: Memory5D['organizational_scope'];
      security_classification: Memory5D['security_classification'];
      ontological_schema: Memory5D['ontological_schema'];
      metadata?: Record<string, any>;
    }>({
      query: (memoryData) => ({
        url: '/content/memories',
        method: 'POST',
        body: memoryData,
      }),
      invalidatesTags: [
        { type: 'Memory5D', id: 'LIST' },
        { type: 'DimensionalStats', id: 'LIST' },
      ],
    }),

    // Update existing memory
    updateMemory5D: builder.mutation<Memory5D, {
      id: string;
      updates: Partial<Memory5D>;
    }>({
      query: ({ id, updates }) => ({
        url: `/content/memories/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Memory5D', id },
        { type: 'Memory5D', id: 'LIST' },
        { type: 'DimensionalStats', id: 'LIST' },
      ],
    }),

    // Delete memory
    deleteMemory5D: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/content/memories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Memory5D', id },
        { type: 'Memory5D', id: 'LIST' },
        { type: 'DimensionalStats', id: 'LIST' },
      ],
    }),

    // Get related memories
    getRelatedMemories: builder.query<Memory5DSearchResponse, {
      memoryId: string;
      cross_dimensional?: boolean;
      limit?: number;
      similarity_threshold?: number;
    }>({
      query: ({ memoryId, cross_dimensional = true, limit = 10, similarity_threshold = 0.7 }) => ({
        url: `/content/memories/${memoryId}/related`,
        params: { cross_dimensional, limit, similarity_threshold },
      }),
      providesTags: (result, error, { memoryId }) => [
        { type: 'Memory5D', id: `related-${memoryId}` },
      ],
    }),

    // ========================================================================
    // BROWSING ENDPOINTS
    // ========================================================================

    // Browse by dimension
    browseByDimension: builder.query<Memory5DSearchResponse, DimensionalBrowseRequest>({
      query: ({ dimension, value, include_cross_dimensional = false, limit = 50, offset = 0 }) => ({
        url: `/browse/${dimension}/${encodeURIComponent(value)}`,
        params: { include_cross_dimensional, limit, offset },
      }),
      providesTags: (result, error, { dimension, value }) => [
        { type: 'Browse', id: `${dimension}-${value}` },
        { type: 'Memory5D', id: 'LIST' }
      ],
    }),

    // Get all available dimension values
    getDimensionValues: builder.query<{
      cognitive_type: string[];
      temporal_tier: string[];
      organizational_scope: string[];
      security_classification: string[];
      ontological_schema: string[];
    }, void>({
      query: () => '/browse/dimensions/values',
      providesTags: [{ type: 'Browse', id: 'dimensions' }],
    }),

    // Cross-dimensional analysis
    getCrossDimensionalInsights: builder.query<{
      correlations: Array<{
        dimension1: string;
        value1: string;
        dimension2: string;
        value2: string;
        correlation_strength: number;
        memory_count: number;
      }>;
      strongest_patterns: Array<{
        pattern: string;
        description: string;
        frequency: number;
      }>;
    }, {
      min_correlation?: number;
      limit?: number;
    }>({
      query: ({ min_correlation = 0.5, limit = 20 }) => ({
        url: '/browse/cross-dimensional-insights',
        params: { min_correlation, limit },
      }),
      providesTags: [{ type: 'Browse', id: 'insights' }],
    }),

    // ========================================================================
    // DIMENSIONS ENDPOINTS
    // ========================================================================

    // Get comprehensive dimensional statistics
    getDimensionalStats: builder.query<DimensionalStats, {
      time_range?: string;
      include_trends?: boolean;
    }>({
      query: ({ time_range = '30d', include_trends = true }) => ({
        url: '/dimensions/stats',
        params: { time_range, include_trends },
      }),
      providesTags: [{ type: 'DimensionalStats', id: 'LIST' }],
    }),

    // Validate dimensional consistency
    validateDimensionalConsistency: builder.mutation<{
      consistency_score: number;
      inconsistencies: Array<{
        memory_id: string;
        dimension: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        suggested_fix: string;
      }>;
    }, {
      memory_ids?: string[];
      fix_automatically?: boolean;
    }>({
      query: ({ memory_ids, fix_automatically = false }) => ({
        url: '/dimensions/validate-consistency',
        method: 'POST',
        body: { memory_ids, fix_automatically },
      }),
      invalidatesTags: [
        { type: 'Memory5D', id: 'LIST' },
        { type: 'DimensionalStats', id: 'LIST' }
      ],
    }),

    // Bulk update dimensions
    bulkUpdateDimensions: builder.mutation<{
      updated_count: number;
      failed_count: number;
      errors: string[];
    }, {
      memory_ids: string[];
      dimension_updates: Partial<{
        cognitive_type: Memory5D['cognitive_type'];
        temporal_tier: Memory5D['temporal_tier'];
        organizational_scope: Memory5D['organizational_scope'];
        security_classification: Memory5D['security_classification'];
        ontological_schema: Memory5D['ontological_schema'];
      }>;
    }>({
      query: ({ memory_ids, dimension_updates }) => ({
        url: '/dimensions/bulk-update',
        method: 'PATCH',
        body: { memory_ids, dimension_updates },
      }),
      invalidatesTags: [
        { type: 'Memory5D', id: 'LIST' },
        { type: 'DimensionalStats', id: 'LIST' },
      ],
    }),

    // ========================================================================
    // TRINITY AGENT ENDPOINTS
    // ========================================================================

    // Get Trinity processing status
    getTrinityStatus: builder.query<TrinityProcessingStatus, void>({
      query: () => '/trinity/status',
      providesTags: [{ type: 'TrinityStatus', id: 'LIST' }],
    }),

    // Trigger Trinity agent action
    triggerTrinityAction: builder.mutation<{
      action_id: string;
      status: 'queued' | 'processing' | 'completed' | 'failed';
      estimated_completion?: string;
    }, TrinityAgentAction>({
      query: (action) => ({
        url: '/trinity/actions',
        method: 'POST',
        body: action,
      }),
      invalidatesTags: [
        { type: 'TrinityStatus', id: 'LIST' },
        { type: 'Memory5D', id: 'LIST' },
      ],
    }),

    // Get Trinity processing history
    getTrinityProcessingHistory: builder.query<Array<{
      action_id: string;
      agent: string;
      action_type: string;
      memory_id: string;
      started_at: string;
      completed_at?: string;
      status: string;
      result_summary?: string;
      error_message?: string;
    }>, {
      agent?: 'bradley' | 'greta' | 'thedra';
      limit?: number;
      status_filter?: string;
    }>({
      query: ({ agent, limit = 50, status_filter }) => ({
        url: '/trinity/history',
        params: { agent, limit, status_filter },
      }),
      providesTags: [{ type: 'TrinityStatus', id: 'history' }],
    }),

    // Force Trinity reprocessing
    forceTrinityReprocessing: builder.mutation<{
      reprocessing_job_id: string;
      memories_queued: number;
    }, {
      memory_ids?: string[];
      agents?: ('bradley' | 'greta' | 'thedra')[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }>({
      query: ({ memory_ids, agents = ['bradley', 'greta', 'thedra'], priority = 'medium' }) => ({
        url: '/trinity/reprocess',
        method: 'POST',
        body: { memory_ids, agents, priority },
      }),
      invalidatesTags: [
        { type: 'TrinityStatus', id: 'LIST' },
        { type: 'Memory5D', id: 'LIST' },
      ],
    }),

    // ========================================================================
    // HEALTH AND ADMIN ENDPOINTS
    // ========================================================================

    // Get system health status
    getHealthStatus: builder.query<Memory5DHealthStatus, void>({
      query: () => '/health',
      providesTags: [{ type: 'HealthStatus', id: 'LIST' }],
    }),

    // Run system diagnostics
    runSystemDiagnostics: builder.mutation<{
      diagnostic_id: string;
      results: {
        dimensional_integrity: { score: number; issues: string[] };
        trinity_health: { score: number; issues: string[] };
        performance_metrics: { score: number; issues: string[] };
        storage_health: { score: number; issues: string[] };
      };
    }, {
      include_deep_scan?: boolean;
      fix_issues_automatically?: boolean;
    }>({
      query: ({ include_deep_scan = false, fix_issues_automatically = false }) => ({
        url: '/admin/diagnostics',
        method: 'POST',
        body: { include_deep_scan, fix_issues_automatically },
      }),
      invalidatesTags: [
        { type: 'HealthStatus', id: 'LIST' },
        { type: 'Memory5D', id: 'LIST' },
      ],
    }),

    // Bulk operations
    bulkDeleteMemories: builder.mutation<{
      deleted_count: number;
      failed_count: number;
      errors: string[];
    }, {
      memory_ids: string[];
      confirm_destructive_operation: boolean;
    }>({
      query: ({ memory_ids, confirm_destructive_operation }) => ({
        url: '/admin/bulk-delete',
        method: 'DELETE',
        body: { memory_ids, confirm_destructive_operation },
      }),
      invalidatesTags: [
        { type: 'Memory5D', id: 'LIST' },
        { type: 'DimensionalStats', id: 'LIST' },
        { type: 'HealthStatus', id: 'LIST' },
      ],
    }),

    // Export memories
    exportMemories5D: builder.mutation<{
      export_id: string;
      download_url: string;
      estimated_completion?: string;
    }, {
      filters?: Memory5DFilters;
      format?: 'json' | 'csv' | 'xlsx' | 'pdf';
      include_metadata?: boolean;
      include_relationships?: boolean;
    }>({
      query: ({ filters, format = 'json', include_metadata = true, include_relationships = false }) => ({
        url: '/admin/export',
        method: 'POST',
        body: { filters, format, include_metadata, include_relationships },
      }),
    }),

    // ========================================================================
    // CONTENT MANAGEMENT ENDPOINTS
    // ========================================================================

    // Get memory content with edit history
    getMemoryContent: builder.query<Memory5DContent, string>({
      query: (memoryId) => `/content/memories/${memoryId}/content`,
      providesTags: (result, error, memoryId) => [
        { type: 'Content', id: memoryId }
      ],
    }),

    // Edit memory content
    editMemoryContent: builder.mutation<Memory5DContent, Memory5DEditRequest>({
      query: ({ memory_id, ...editData }) => ({
        url: `/content/memories/${memory_id}/content`,
        method: 'PATCH',
        body: editData,
      }),
      invalidatesTags: (result, error, { memory_id }) => [
        { type: 'Content', id: memory_id },
        { type: 'Memory5D', id: memory_id },
        { type: 'Memory5D', id: 'LIST' },
      ],
    }),

    // Get memory edit history
    getMemoryEditHistory: builder.query<Memory5DContent['edit_history'], {
      memoryId: string;
      limit?: number;
    }>({
      query: ({ memoryId, limit = 20 }) => ({
        url: `/content/memories/${memoryId}/edit-history`,
        params: { limit },
      }),
      providesTags: (result, error, { memoryId }) => [
        { type: 'Content', id: `history-${memoryId}` }
      ],
    }),

    // Restore memory to previous version
    restoreMemoryVersion: builder.mutation<Memory5D, {
      memory_id: string;
      version: number;
      restore_reason: string;
    }>({
      query: ({ memory_id, version, restore_reason }) => ({
        url: `/content/memories/${memory_id}/restore`,
        method: 'POST',
        body: { version, restore_reason },
      }),
      invalidatesTags: (result, error, { memory_id }) => [
        { type: 'Content', id: memory_id },
        { type: 'Memory5D', id: memory_id },
        { type: 'Memory5D', id: 'LIST' },
      ],
    }),

    // ========================================================================
    // ANALYTICS ENDPOINTS
    // ========================================================================

    // Get memory analytics
    getMemoryAnalytics: builder.query<{
      processing_stats: {
        total_processed_today: number;
        avg_processing_time_seconds: number;
        success_rate: number;
        error_rate: number;
      };
      dimensional_trends: {
        dimension: string;
        trending_values: Array<{ value: string; growth_rate: number }>;
      }[];
      usage_patterns: {
        peak_hours: number[];
        most_active_users: string[];
        popular_search_terms: string[];
      };
    }, {
      time_range?: string;
      include_predictions?: boolean;
    }>({
      query: ({ time_range = '7d', include_predictions = false }) => ({
        url: '/admin/analytics',
        params: { time_range, include_predictions },
      }),
      providesTags: [{ type: 'HealthStatus', id: 'analytics' }],
    }),

  }),
});

// Export hooks for use in components
export const {
  // Content operations
  useGetMemoriesQuery,
  useSearchMemories5DMutation,
  useGetMemoryByIdQuery,
  useCreateMemory5DMutation,
  useUpdateMemory5DMutation,
  useDeleteMemory5DMutation,
  useGetRelatedMemoriesQuery,

  // Browsing operations
  useBrowseByDimensionQuery,
  useGetDimensionValuesQuery,
  useGetCrossDimensionalInsightsQuery,

  // Dimensional operations
  useGetDimensionalStatsQuery,
  useValidateDimensionalConsistencyMutation,
  useBulkUpdateDimensionsMutation,

  // Trinity operations
  useGetTrinityStatusQuery,
  useTriggerTrinityActionMutation,
  useGetTrinityProcessingHistoryQuery,
  useForceTrinityReprocessingMutation,

  // Health and admin operations
  useGetHealthStatusQuery,
  useRunSystemDiagnosticsMutation,
  useBulkDeleteMemoriesMutation,
  useExportMemories5DMutation,

  // Content management
  useGetMemoryContentQuery,
  useEditMemoryContentMutation,
  useGetMemoryEditHistoryQuery,
  useRestoreMemoryVersionMutation,

  // Analytics
  useGetMemoryAnalyticsQuery,
} = memory5dApi;

// Export API for store configuration
export default memory5dApi;