/**
 * 5D Memory Architecture TypeScript Types
 * Complete type definitions for Geneva's 5D Memory Management System
 *
 * The 5 Dimensions:
 * 1. Cognitive Type - What kind of mental process produced this memory
 * 2. Temporal Tier - When/how this memory should be consolidated
 * 3. Organizational Scope - Who/what organizational level this affects
 * 4. Security Classification - How sensitive this information is
 * 5. Ontological Schema - What domain knowledge structure this represents
 */

// ============================================================================
// DIMENSION 1: COGNITIVE TYPE
// ============================================================================

export type CognitiveType = 'observation' | 'analysis' | 'decision' | 'reflection' | 'pattern' | 'insight';

export interface CognitiveTypeDefinition {
  type: CognitiveType;
  name: string;
  description: string;
  color: string;
  icon: string;
  validation_rules: string[];
}

export const COGNITIVE_TYPE_DEFINITIONS: Record<CognitiveType, CognitiveTypeDefinition> = {
  observation: {
    type: 'observation',
    name: 'Direct Observation',
    description: 'Raw facts, events, data points directly perceived or recorded',
    color: '#e3f2fd',
    icon: '👁️',
    validation_rules: ['Must contain factual content', 'Minimal interpretation']
  },
  analysis: {
    type: 'analysis',
    name: 'Analytical Reasoning',
    description: 'Logical breakdown, cause-effect relationships, data interpretation',
    color: '#f3e5f5',
    icon: '🔬',
    validation_rules: ['Must show reasoning process', 'Include supporting evidence']
  },
  decision: {
    type: 'decision',
    name: 'Decision Point',
    description: 'Choices made, paths selected, commitments established',
    color: '#e8f5e8',
    icon: '⚖️',
    validation_rules: ['Must identify decision maker', 'Include rationale']
  },
  reflection: {
    type: 'reflection',
    name: 'Reflective Thinking',
    description: 'Meta-cognitive thoughts, lessons learned, retrospective insights',
    color: '#fff3e0',
    icon: '🤔',
    validation_rules: ['Must show self-awareness', 'Reference past experience']
  },
  pattern: {
    type: 'pattern',
    name: 'Pattern Recognition',
    description: 'Recurring themes, systematic relationships, structural insights',
    color: '#fce4ec',
    icon: '🔄',
    validation_rules: ['Must identify multiple instances', 'Show systematic nature']
  },
  insight: {
    type: 'insight',
    name: 'Strategic Insight',
    description: 'High-level understanding, breakthrough realizations, paradigm shifts',
    color: '#e0f2f1',
    icon: '💡',
    validation_rules: ['Must demonstrate deep understanding', 'Show broader implications']
  }
};

// ============================================================================
// DIMENSION 2: TEMPORAL TIER
// ============================================================================

export type TemporalTier = 'immediate' | 'session' | 'tactical' | 'strategic' | 'institutional';

export interface TemporalTierDefinition {
  tier: TemporalTier;
  name: string;
  description: string;
  retention_period: string;
  consolidation_priority: number; // 1-5, higher = more urgent
  color: string;
  icon: string;
}

export const TEMPORAL_TIER_DEFINITIONS: Record<TemporalTier, TemporalTierDefinition> = {
  immediate: {
    tier: 'immediate',
    name: 'Immediate Context',
    description: 'Current conversation, active workflow context',
    retention_period: '1-2 hours',
    consolidation_priority: 5,
    color: '#ffcdd2',
    icon: '⚡'
  },
  session: {
    tier: 'session',
    name: 'Session Memory',
    description: 'Single work session, meeting, or task completion',
    retention_period: '1-7 days',
    consolidation_priority: 4,
    color: '#f8bbd9',
    icon: '📝'
  },
  tactical: {
    tier: 'tactical',
    name: 'Tactical Knowledge',
    description: 'Project-specific learnings, operational insights',
    retention_period: '1-6 months',
    consolidation_priority: 3,
    color: '#e1bee7',
    icon: '🎯'
  },
  strategic: {
    tier: 'strategic',
    name: 'Strategic Understanding',
    description: 'Cross-project patterns, domain expertise',
    retention_period: '6 months - 2 years',
    consolidation_priority: 2,
    color: '#c8e6c9',
    icon: '🧠'
  },
  institutional: {
    tier: 'institutional',
    name: 'Institutional Wisdom',
    description: 'Foundational knowledge, core principles, organizational DNA',
    retention_period: 'Permanent',
    consolidation_priority: 1,
    color: '#ffe0b2',
    icon: '🏛️'
  }
};

// ============================================================================
// DIMENSION 3: ORGANIZATIONAL SCOPE
// ============================================================================

export type OrganizationalScope = 'personal' | 'team' | 'department' | 'organization' | 'ecosystem';

export interface OrganizationalScopeDefinition {
  scope: OrganizationalScope;
  name: string;
  description: string;
  sharing_level: 'private' | 'limited' | 'internal' | 'public';
  color: string;
  icon: string;
}

export const ORGANIZATIONAL_SCOPE_DEFINITIONS: Record<OrganizationalScope, OrganizationalScopeDefinition> = {
  personal: {
    scope: 'personal',
    name: 'Personal Knowledge',
    description: 'Individual insights, personal workflows, private notes',
    sharing_level: 'private',
    color: '#e8eaf6',
    icon: '👤'
  },
  team: {
    scope: 'team',
    name: 'Team Knowledge',
    description: 'Team processes, shared context, collaborative insights',
    sharing_level: 'limited',
    color: '#e0f2f1',
    icon: '👥'
  },
  department: {
    scope: 'department',
    name: 'Department Knowledge',
    description: 'Cross-team patterns, departmental procedures, functional expertise',
    sharing_level: 'internal',
    color: '#fff3e0',
    icon: '🏢'
  },
  organization: {
    scope: 'organization',
    name: 'Organization Knowledge',
    description: 'Company-wide insights, strategic principles, cultural knowledge',
    sharing_level: 'internal',
    color: '#fce4ec',
    icon: '🏛️'
  },
  ecosystem: {
    scope: 'ecosystem',
    name: 'Ecosystem Knowledge',
    description: 'Industry insights, market patterns, external relationships',
    sharing_level: 'public',
    color: '#e1f5fe',
    icon: '🌐'
  }
};

// ============================================================================
// DIMENSION 4: SECURITY CLASSIFICATION
// ============================================================================

export type SecurityClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export interface SecurityClassificationDefinition {
  classification: SecurityClassification;
  name: string;
  description: string;
  access_level: number; // 1-5, higher = more restricted
  handling_requirements: string[];
  color: string;
  icon: string;
}

export const SECURITY_CLASSIFICATION_DEFINITIONS: Record<SecurityClassification, SecurityClassificationDefinition> = {
  public: {
    classification: 'public',
    name: 'Public Information',
    description: 'Can be shared externally, no restrictions',
    access_level: 1,
    handling_requirements: ['No special handling required'],
    color: '#4caf50',
    icon: '🌍'
  },
  internal: {
    classification: 'internal',
    name: 'Internal Use',
    description: 'Company internal, not for external sharing',
    access_level: 2,
    handling_requirements: ['Employees only', 'No external sharing'],
    color: '#2196f3',
    icon: '🏢'
  },
  confidential: {
    classification: 'confidential',
    name: 'Confidential',
    description: 'Limited access, business sensitive information',
    access_level: 3,
    handling_requirements: ['Need to know basis', 'Authorized personnel only'],
    color: '#ff9800',
    icon: '🔒'
  },
  restricted: {
    classification: 'restricted',
    name: 'Restricted',
    description: 'Highly sensitive, strict access controls',
    access_level: 4,
    handling_requirements: ['Executive approval required', 'Audit trail mandatory'],
    color: '#f44336',
    icon: '🛡️'
  },
  top_secret: {
    classification: 'top_secret',
    name: 'Top Secret',
    description: 'Maximum security, strategic/legal sensitivity',
    access_level: 5,
    handling_requirements: ['C-level approval only', 'Legal review required', 'Encrypted storage'],
    color: '#9c27b0',
    icon: '🔐'
  }
};

// ============================================================================
// DIMENSION 5: ONTOLOGICAL SCHEMA
// ============================================================================

export type OntologicalSchema = 'technical' | 'business' | 'interpersonal' | 'creative' | 'operational' | 'strategic';

export interface OntologicalSchemaDefinition {
  schema: OntologicalSchema;
  name: string;
  description: string;
  knowledge_domains: string[];
  reasoning_patterns: string[];
  color: string;
  icon: string;
}

export const ONTOLOGICAL_SCHEMA_DEFINITIONS: Record<OntologicalSchema, OntologicalSchemaDefinition> = {
  technical: {
    schema: 'technical',
    name: 'Technical Knowledge',
    description: 'Code, systems, architecture, engineering principles',
    knowledge_domains: ['Software Development', 'Infrastructure', 'Data', 'Security', 'DevOps'],
    reasoning_patterns: ['Systematic debugging', 'Performance optimization', 'Scalability analysis'],
    color: '#e3f2fd',
    icon: '⚙️'
  },
  business: {
    schema: 'business',
    name: 'Business Knowledge',
    description: 'Market dynamics, financial models, strategic planning',
    knowledge_domains: ['Finance', 'Marketing', 'Sales', 'Operations', 'Strategy'],
    reasoning_patterns: ['ROI analysis', 'Market sizing', 'Competitive positioning'],
    color: '#e8f5e8',
    icon: '💼'
  },
  interpersonal: {
    schema: 'interpersonal',
    name: 'Interpersonal Knowledge',
    description: 'Team dynamics, communication patterns, relationship building',
    knowledge_domains: ['Leadership', 'Communication', 'Conflict Resolution', 'Team Building'],
    reasoning_patterns: ['Empathy mapping', 'Stakeholder analysis', 'Cultural awareness'],
    color: '#fff3e0',
    icon: '🤝'
  },
  creative: {
    schema: 'creative',
    name: 'Creative Knowledge',
    description: 'Design thinking, innovation processes, artistic insights',
    knowledge_domains: ['Design', 'Innovation', 'User Experience', 'Branding', 'Content'],
    reasoning_patterns: ['Design thinking', 'Brainstorming', 'Aesthetic evaluation'],
    color: '#fce4ec',
    icon: '🎨'
  },
  operational: {
    schema: 'operational',
    name: 'Operational Knowledge',
    description: 'Processes, procedures, workflow optimization',
    knowledge_domains: ['Process Management', 'Quality Assurance', 'Resource Planning', 'Logistics'],
    reasoning_patterns: ['Process optimization', 'Resource allocation', 'Bottleneck analysis'],
    color: '#f3e5f5',
    icon: '⚡'
  },
  strategic: {
    schema: 'strategic',
    name: 'Strategic Knowledge',
    description: 'Long-term planning, vision setting, transformational insights',
    knowledge_domains: ['Vision', 'Transformation', 'Governance', 'Risk Management', 'Innovation'],
    reasoning_patterns: ['Systems thinking', 'Scenario planning', 'Strategic analysis'],
    color: '#e0f2f1',
    icon: '🎯'
  }
};

// ============================================================================
// CORE 5D MEMORY INTERFACE
// ============================================================================

export interface Memory5D {
  // Core identification
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;

  // Content
  content: string;
  summary?: string;
  metadata: Record<string, any>;

  // The 5 Dimensions
  cognitive_type: CognitiveType;
  temporal_tier: TemporalTier;
  organizational_scope: OrganizationalScope;
  security_classification: SecurityClassification;
  ontological_schema: OntologicalSchema;

  // Processing state
  processing_status: 'pending' | 'processing' | 'processed' | 'consolidated' | 'archived' | 'error';
  validation_status: 'valid' | 'invalid' | 'pending_validation';
  consolidation_source_ids?: string[];

  // Analytics and scoring
  importance_score: number; // 0.0-1.0
  confidence_score: number; // 0.0-1.0
  coherence_score: number; // Cross-dimensional consistency

  // Trinity agent processing
  bradley_processed_at?: string;
  greta_processed_at?: string;
  thedra_processed_at?: string;

  // Relationships
  related_memory_ids: string[];
  concept_tags: string[];

  // Versioning
  version: number;
  parent_memory_id?: string;
  child_memory_ids: string[];
}

// ============================================================================
// SEARCH AND FILTERING INTERFACES
// ============================================================================

export interface Memory5DFilters {
  cognitive_type?: CognitiveType[];
  temporal_tier?: TemporalTier[];
  organizational_scope?: OrganizationalScope[];
  security_classification?: SecurityClassification[];
  ontological_schema?: OntologicalSchema[];

  processing_status?: Memory5D['processing_status'][];
  validation_status?: Memory5D['validation_status'][];

  importance_range?: {
    min: number;
    max: number;
  };
  confidence_range?: {
    min: number;
    max: number;
  };
  coherence_range?: {
    min: number;
    max: number;
  };

  date_range?: {
    start: string;
    end: string;
  };

  concept_tags?: string[];
  content_query?: string;

  processed_by_trinity?: {
    bradley?: boolean;
    greta?: boolean;
    thedra?: boolean;
  };
}

export interface Memory5DSearchRequest {
  query?: string;
  filters?: Memory5DFilters;
  cross_dimensional_search?: boolean;
  include_related?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: keyof Memory5D;
  sort_order?: 'asc' | 'desc';
}

export interface Memory5DSearchResponse {
  memories: Memory5D[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  search_metadata: {
    query_time_ms: number;
    dimensions_searched: string[];
    cross_dimensional_matches: number;
  };
}

// ============================================================================
// BROWSING AND NAVIGATION INTERFACES
// ============================================================================

export interface DimensionalBrowseRequest {
  dimension: 'cognitive_type' | 'temporal_tier' | 'organizational_scope' | 'security_classification' | 'ontological_schema';
  value: string;
  include_cross_dimensional?: boolean;
  limit?: number;
  offset?: number;
}

export interface DimensionalStats {
  cognitive_type: Record<CognitiveType, { count: number; percentage: number }>;
  temporal_tier: Record<TemporalTier, { count: number; percentage: number }>;
  organizational_scope: Record<OrganizationalScope, { count: number; percentage: number }>;
  security_classification: Record<SecurityClassification, { count: number; percentage: number }>;
  ontological_schema: Record<OntologicalSchema, { count: number; percentage: number }>;
  total_memories: number;
  cross_dimensional_coherence: number;
}

// ============================================================================
// TRINITY AGENT INTERFACES
// ============================================================================

export interface TrinityProcessingStatus {
  bradley: {
    status: 'idle' | 'processing' | 'error';
    last_processed_at?: string;
    memories_in_queue: number;
    avg_processing_time_seconds: number;
  };
  greta: {
    status: 'idle' | 'processing' | 'error';
    last_processed_at?: string;
    memories_in_queue: number;
    avg_processing_time_seconds: number;
  };
  thedra: {
    status: 'idle' | 'processing' | 'error';
    last_processed_at?: string;
    memories_in_queue: number;
    avg_processing_time_seconds: number;
  };
  overall_health: 'healthy' | 'degraded' | 'unhealthy';
}

export interface TrinityAgentAction {
  agent: 'bradley' | 'greta' | 'thedra';
  action: 'reprocess' | 'validate' | 'consolidate' | 'archive';
  memory_ids: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
}

// ============================================================================
// MEMORY CONTENT MANAGEMENT INTERFACES
// ============================================================================

export interface Memory5DContent {
  memory_id: string;
  content: string;
  rendered_content?: string; // Processed/formatted content
  content_type: 'text' | 'markdown' | 'structured';
  word_count: number;
  readability_score?: number;

  edit_history: {
    edited_at: string;
    edited_by: string;
    changes_summary: string;
    version: number;
  }[];
}

export interface Memory5DEditRequest {
  memory_id: string;
  new_content: string;
  edit_reason: string;
  maintain_dimensional_consistency?: boolean;
  auto_revalidate?: boolean;
}

// ============================================================================
// HEALTH AND DIAGNOSTICS INTERFACES
// ============================================================================

export interface Memory5DHealthStatus {
  system_status: 'healthy' | 'degraded' | 'unhealthy';
  total_memories: number;
  processing_backlog: number;
  validation_errors: number;

  dimensional_health: {
    cognitive_type: { valid: number; invalid: number };
    temporal_tier: { valid: number; invalid: number };
    organizational_scope: { valid: number; invalid: number };
    security_classification: { valid: number; invalid: number };
    ontological_schema: { valid: number; invalid: number };
  };

  trinity_agents: TrinityProcessingStatus;

  performance_metrics: {
    avg_search_time_ms: number;
    avg_retrieval_time_ms: number;
    cache_hit_rate: number;
    storage_utilization: number;
  };
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface Memory5DBrowserProps {
  projectId?: string;
  initialFilters?: Memory5DFilters;
  onMemorySelect?: (memory: Memory5D) => void;
  enableCrossDimensionalSearch?: boolean;
  showDimensionStats?: boolean;
  compact?: boolean;
}

export interface DimensionFilterProps {
  dimension: keyof Memory5DFilters;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  showCounts?: boolean;
  maxSelections?: number;
}

export interface Memory5DCardProps {
  memory: Memory5D;
  selected?: boolean;
  onSelect?: (memory: Memory5D) => void;
  showAllDimensions?: boolean;
  enableQuickEdit?: boolean;
  compact?: boolean;
}

export interface TrinityAgentPanelProps {
  onAgentAction?: (action: TrinityAgentAction) => void;
  refreshInterval?: number;
  showDetailedMetrics?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS AND HELPERS
// ============================================================================

export const validateMemory5D = (memory: Partial<Memory5D>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate required dimensions
  if (!memory.cognitive_type) errors.push('Missing cognitive_type');
  if (!memory.temporal_tier) errors.push('Missing temporal_tier');
  if (!memory.organizational_scope) errors.push('Missing organizational_scope');
  if (!memory.security_classification) errors.push('Missing security_classification');
  if (!memory.ontological_schema) errors.push('Missing ontological_schema');

  // Validate content
  if (!memory.content || memory.content.trim().length === 0) {
    errors.push('Content cannot be empty');
  }

  // Validate scores
  if (memory.importance_score !== undefined && (memory.importance_score < 0 || memory.importance_score > 1)) {
    errors.push('Importance score must be between 0 and 1');
  }
  if (memory.confidence_score !== undefined && (memory.confidence_score < 0 || memory.confidence_score > 1)) {
    errors.push('Confidence score must be between 0 and 1');
  }

  return { valid: errors.length === 0, errors };
};

export const getSecurityClearanceLevel = (classification: SecurityClassification): number => {
  return SECURITY_CLASSIFICATION_DEFINITIONS[classification].access_level;
};

export const canAccessMemory = (userClearanceLevel: number, memoryClassification: SecurityClassification): boolean => {
  return userClearanceLevel >= getSecurityClearanceLevel(memoryClassification);
};

export const getDimensionColor = (dimension: keyof Memory5DFilters, value: string): string => {
  switch (dimension) {
    case 'cognitive_type':
      return COGNITIVE_TYPE_DEFINITIONS[value as CognitiveType]?.color || '#gray';
    case 'temporal_tier':
      return TEMPORAL_TIER_DEFINITIONS[value as TemporalTier]?.color || '#gray';
    case 'organizational_scope':
      return ORGANIZATIONAL_SCOPE_DEFINITIONS[value as OrganizationalScope]?.color || '#gray';
    case 'security_classification':
      return SECURITY_CLASSIFICATION_DEFINITIONS[value as SecurityClassification]?.color || '#gray';
    case 'ontological_schema':
      return ONTOLOGICAL_SCHEMA_DEFINITIONS[value as OntologicalSchema]?.color || '#gray';
    default:
      return '#gray';
  }
};

export const formatDimensionValue = (dimension: keyof Memory5DFilters, value: string): string => {
  switch (dimension) {
    case 'cognitive_type':
      return COGNITIVE_TYPE_DEFINITIONS[value as CognitiveType]?.name || value;
    case 'temporal_tier':
      return TEMPORAL_TIER_DEFINITIONS[value as TemporalTier]?.name || value;
    case 'organizational_scope':
      return ORGANIZATIONAL_SCOPE_DEFINITIONS[value as OrganizationalScope]?.name || value;
    case 'security_classification':
      return SECURITY_CLASSIFICATION_DEFINITIONS[value as SecurityClassification]?.name || value;
    case 'ontological_schema':
      return ONTOLOGICAL_SCHEMA_DEFINITIONS[value as OntologicalSchema]?.name || value;
    default:
      return value;
  }
};

export const calculateCoherenceScore = (memory: Memory5D): number => {
  // This would be implemented with actual coherence calculation logic
  // For now, returning the stored value or a default
  return memory.coherence_score || 0.8;
};

export const getDimensionIcon = (dimension: keyof Memory5DFilters, value: string): string => {
  switch (dimension) {
    case 'cognitive_type':
      return COGNITIVE_TYPE_DEFINITIONS[value as CognitiveType]?.icon || '❓';
    case 'temporal_tier':
      return TEMPORAL_TIER_DEFINITIONS[value as TemporalTier]?.icon || '❓';
    case 'organizational_scope':
      return ORGANIZATIONAL_SCOPE_DEFINITIONS[value as OrganizationalScope]?.icon || '❓';
    case 'security_classification':
      return SECURITY_CLASSIFICATION_DEFINITIONS[value as SecurityClassification]?.icon || '❓';
    case 'ontological_schema':
      return ONTOLOGICAL_SCHEMA_DEFINITIONS[value as OntologicalSchema]?.icon || '❓';
    default:
      return '❓';
  }
};