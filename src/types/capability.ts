// Capability types for Claude Code integration

export enum CapabilityCategory {
  CODE_GENERATION = 'code_generation',
  CODE_ANALYSIS = 'code_analysis',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  REFACTORING = 'refactoring',
  API_DESIGN = 'api_design',
  ARCHITECTURE = 'architecture',
  DEPLOYMENT = 'deployment',
  SECURITY = 'security',
  DATABASE = 'database',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DEVOPS = 'devops',
  DATA_ANALYSIS = 'data_analysis'
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskComplexity {
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
  EXPERT = 'EXPERT'
}

export interface CapabilitySpec {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  confidence: ConfidenceLevel;
  complexity: TaskComplexity;
  tags: string[];
  examples: string[];
  limitations?: string[];
  prerequisites?: string[];
  estimatedTime?: {
    simple: string;
    moderate: string;
    complex: string;
  };
}

export interface TaskFeasibilityRequest {
  description: string;
  context?: string;
  requirements?: string[];
  timeframe?: string;
  complexity?: TaskComplexity;
}

export interface TaskFeasibilityResult {
  id: string;
  feasible: boolean;
  confidence: ConfidenceLevel;
  estimatedDuration: string;
  requiredCapabilities: string[];
  suggestedApproach: string;
  potentialChallenges: string[];
  alternatives?: string[];
  reasoning: string;
  timestamp: string;
}

export interface CapabilityFilter {
  categories?: CapabilityCategory[];
  confidence?: ConfidenceLevel[];
  complexity?: TaskComplexity[];
  searchTerm?: string;
}

export interface CapabilityHint {
  id: string;
  suggestion: string;
  capability: string;
  confidence: ConfidenceLevel;
  reason: string;
}