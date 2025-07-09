/**
 * Cognitive Memory TypeScript Types
 * Complete type definitions for Geneva's Cognitive Memory system
 */

// Core cognitive memory interfaces
export interface CognitiveMemory {
  id: string;
  content: string;
  memory_type: 'llm' | 'observation' | 'decision';
  tier: 1 | 2 | 3 | 4;
  risk_score: number; // 0.0-1.0
  concepts: string[];
  importance: number; // 0.0-1.0
  created_at: string;
  updated_at: string;
  status: 'active' | 'processed' | 'consolidated';
  consolidation_source?: string[];
  project_id: string;
  properties?: Record<string, any>;
}

// Tier hierarchy definitions
export type CognitiveTier = 1 | 2 | 3 | 4;

export interface TierDefinition {
  tier: CognitiveTier;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const TIER_DEFINITIONS: Record<CognitiveTier, TierDefinition> = {
  1: {
    tier: 1,
    name: 'Raw Interactions',
    description: 'Original events, direct observations',
    color: '#e3f2fd',
    icon: '📝'
  },
  2: {
    tier: 2,
    name: 'Tactical Patterns',
    description: 'Operational insights, domain-specific',
    color: '#f3e5f5',
    icon: '🎯'
  },
  3: {
    tier: 3,
    name: 'Strategic Understanding',
    description: 'Cross-functional patterns, trends',
    color: '#e8f5e8',
    icon: '🧠'
  },
  4: {
    tier: 4,
    name: 'Institutional Knowledge',
    description: 'Company wisdom, strategic insights',
    color: '#fff3e0',
    icon: '🏛️'
  }
};

// Security risk levels
export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityRiskDefinition {
  level: SecurityRiskLevel;
  name: string;
  description: string;
  color: string;
  range: [number, number]; // [min, max] risk score range
}

export const SECURITY_RISK_DEFINITIONS: Record<SecurityRiskLevel, SecurityRiskDefinition> = {
  low: {
    level: 'low',
    name: 'Low Risk',
    description: 'Minimal security concerns',
    color: '#4caf50',
    range: [0.0, 0.25]
  },
  medium: {
    level: 'medium',
    name: 'Medium Risk',
    description: 'Moderate security attention needed',
    color: '#ff9800',
    range: [0.25, 0.50]
  },
  high: {
    level: 'high',
    name: 'High Risk',
    description: 'Significant security concerns',
    color: '#f44336',
    range: [0.50, 0.75]
  },
  critical: {
    level: 'critical',
    name: 'Critical Risk',
    description: 'Immediate security action required',
    color: '#d32f2f',
    range: [0.75, 1.0]
  }
};

// API response interfaces
export interface CognitiveMemoriesResponse {
  memories: CognitiveMemory[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface TierStatsResponse {
  tier_distribution: Record<string, {
    count: number;
    percentage: number;
  }>;
  total_memories: number;
}

export interface ConceptsResponse {
  concepts: ConceptUsage[];
  total: number;
}

export interface ConceptUsage {
  concept: string;
  count: number;
  percentage: number;
}

// Search and filtering interfaces
export interface CognitiveSearchParams {
  query?: string;
  filters?: {
    tier?: CognitiveTier[];
    risk_score?: {
      min?: number;
      max?: number;
    };
    concepts?: string[];
    memory_type?: ('llm' | 'observation' | 'decision')[];
    date_range?: {
      start: string;
      end: string;
    };
    importance?: {
      min?: number;
      max?: number;
    };
    status?: ('active' | 'processed' | 'consolidated')[];
  };
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'importance' | 'risk_score' | 'tier';
  sort_order?: 'asc' | 'desc';
}

export interface CognitiveSearchRequest {
  query?: string;
  filters?: CognitiveSearchParams['filters'];
  limit?: number;
  offset?: number;
}

// Component prop interfaces
export interface CognitiveMemoryBrowserProps {
  projectId?: string;
  initialTier?: CognitiveTier;
  onMemorySelect?: (memory: CognitiveMemory) => void;
  compact?: boolean;
  showStats?: boolean;
}

export interface CognitiveSearchProps {
  onSearch: (params: CognitiveSearchParams) => void;
  onMemorySelect?: (memory: CognitiveMemory) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  compact?: boolean;
}

export interface SecurityDashboardProps {
  projectId?: string;
  timeRange?: string;
  showAlerts?: boolean;
  onRiskLevelSelect?: (level: SecurityRiskLevel) => void;
  compact?: boolean;
}

export interface ConceptExplorerProps {
  projectId?: string;
  onConceptSelect?: (concept: string) => void;
  showUsageStats?: boolean;
  maxConcepts?: number;
  compact?: boolean;
}

export interface CognitiveStatsProps {
  projectId?: string;
  refreshInterval?: number;
  showDetailedBreakdown?: boolean;
  compact?: boolean;
}

export interface MemoryCardProps {
  memory: CognitiveMemory;
  selected?: boolean;
  onSelect?: (memory: CognitiveMemory) => void;
  showFullContent?: boolean;
  showMetadata?: boolean;
  compact?: boolean;
}

// Redux state interfaces
export interface CognitiveState {
  memories: {
    items: CognitiveMemory[];
    loading: boolean;
    error: string | null;
    total: number;
    hasMore: boolean;
  };
  tiers: {
    stats: TierStatsResponse | null;
    loading: boolean;
    error: string | null;
  };
  concepts: {
    items: ConceptUsage[];
    loading: boolean;
    error: string | null;
  };
  search: {
    results: CognitiveMemory[];
    loading: boolean;
    error: string | null;
    params: CognitiveSearchParams;
  };
  security: {
    memories: Record<SecurityRiskLevel, CognitiveMemory[]>;
    loading: boolean;
    error: string | null;
  };
  ui: {
    selectedMemory: string | null;
    selectedTier: CognitiveTier | null;
    selectedConcept: string | null;
    showAdvancedFilters: boolean;
    viewMode: 'browser' | 'search' | 'security' | 'concepts';
  };
}

// Utility types
export interface CognitiveMemoryFilter {
  label: string;
  value: string;
  count?: number;
  active: boolean;
}

export interface TierNavigationItem {
  tier: CognitiveTier;
  name: string;
  count: number;
  percentage: number;
  active: boolean;
}

export interface SecurityAlert {
  id: string;
  memory_id: string;
  risk_level: SecurityRiskLevel;
  message: string;
  created_at: string;
  acknowledged: boolean;
}

// Analytics interfaces
export interface CognitiveAnalytics {
  processing_stats: {
    total_processed: number;
    processing_rate: number;
    error_rate: number;
    avg_processing_time: number;
  };
  tier_trends: {
    tier: CognitiveTier;
    trend: 'increasing' | 'decreasing' | 'stable';
    change_percentage: number;
  }[];
  concept_trends: {
    concept: string;
    trend: 'rising' | 'falling' | 'stable';
    usage_count: number;
  }[];
  security_overview: {
    total_high_risk: number;
    avg_risk_score: number;
    risk_trend: 'improving' | 'worsening' | 'stable';
  };
}

// Export utility functions
export const getRiskLevel = (score: number): SecurityRiskLevel => {
  if (score <= 0.25) return 'low';
  if (score <= 0.50) return 'medium';
  if (score <= 0.75) return 'high';
  return 'critical';
};

export const getRiskColor = (score: number): string => {
  const level = getRiskLevel(score);
  return SECURITY_RISK_DEFINITIONS[level].color;
};

export const getTierColor = (tier: CognitiveTier): string => {
  return TIER_DEFINITIONS[tier].color;
};

export const formatRiskScore = (score: number): string => {
  return `${(score * 100).toFixed(1)}%`;
};

export const formatImportance = (importance: number): string => {
  return `${(importance * 100).toFixed(0)}%`;
};