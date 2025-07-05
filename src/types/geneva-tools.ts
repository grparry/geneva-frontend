// Geneva Tool Visualization Types

export enum ToolType {
  SEMANTIC_SEARCH = 'semantic_search',
  MEMORY_ACCESS = 'memory_access',
  KNOWLEDGE_GRAPH = 'knowledge_graph',
  PROJECT_CONSTRAINT = 'project_constraint',
  SUBSTRATE_INDEXER = 'substrate_indexer',
  SUBSTRATE_READER = 'substrate_reader',
  SUBSTRATE_WRITER = 'substrate_writer',
  VALIDATOR = 'validator',
  CODEX_CLASSIFIER = 'codex_classifier',
  CODEX_STORAGE = 'codex_storage'
}

export enum ToolStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  PROCESSING = 'processing',
  ERROR = 'error',
  SUCCESS = 'success'
}

export enum FlowDirection {
  INPUT = 'input',
  OUTPUT = 'output',
  BIDIRECTIONAL = 'bidirectional'
}

export interface ToolNode {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  status: ToolStatus;
  position: { x: number; y: number };
  capabilities: string[];
  currentOperation?: string;
  performance: {
    executionTime: number;
    successRate: number;
    lastUsed: string;
  };
  connections: ToolConnection[];
}

export interface ToolConnection {
  id: string;
  sourceId: string;
  targetId: string;
  direction: FlowDirection;
  dataType: string;
  isActive: boolean;
  throughput: number; // operations per minute
  latency: number; // milliseconds
}

export interface ToolFlowExecution {
  id: string;
  name: string;
  description: string;
  steps: ToolFlowStep[];
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-1
  currentStepIndex: number;
}

export interface ToolFlowStep {
  id: string;
  toolId: string;
  operation: string;
  input: any;
  output?: any;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: ToolStatus;
  errorMessage?: string;
}

export interface SemanticSearchQuery {
  id: string;
  query: string;
  timestamp: string;
  results: SemanticSearchResult[];
  executionTime: number;
  projectId: string;
  userId: string;
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    type: string;
    source: string;
    timestamp: string;
    tags: string[];
  };
  context: string;
  projectId: string;
}

export interface MemoryAccess {
  id: string;
  operation: 'read' | 'write' | 'update' | 'delete';
  targetType: 'node' | 'relationship' | 'property';
  targetId: string;
  content?: any;
  timestamp: string;
  userId: string;
  projectId: string;
  success: boolean;
  duration: number;
}

export interface ProjectConstraint {
  id: string;
  type: 'permission' | 'resource' | 'business_rule' | 'security';
  name: string;
  description: string;
  rule: string;
  isActive: boolean;
  projectId: string;
  createdAt: string;
  lastChecked: string;
  violations: ConstraintViolation[];
}

export interface ConstraintViolation {
  id: string;
  constraintId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userId: string;
  resolved: boolean;
  resolutionNote?: string;
}

export interface GenevaToolMetrics {
  totalOperations: number;
  averageResponseTime: number;
  successRate: number;
  activeConnections: number;
  dataTransferred: number; // MB
  memoryUsage: number; // MB
  cpuUtilization: number; // percentage
  period: string;
}

export interface ToolPerformanceData {
  toolId: string;
  toolName: string;
  metrics: {
    timestamp: string;
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
  }[];
  trends: {
    responseTime: 'improving' | 'stable' | 'degrading';
    throughput: 'improving' | 'stable' | 'degrading';
    reliability: 'improving' | 'stable' | 'degrading';
  };
}

export interface CodeEditorSession {
  id: string;
  name: string;
  files: CodeFile[];
  activeFileId: string;
  collaborators: Collaborator[];
  createdAt: string;
  lastModified: string;
  projectId: string;
}

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  cursors: EditorCursor[];
  selections: EditorSelection[];
  breakpoints: number[];
  lastModified: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  currentFile?: string;
  cursorPosition?: { line: number; column: number };
}

export interface EditorCursor {
  userId: string;
  line: number;
  column: number;
  color: string;
}

export interface EditorSelection {
  userId: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  color: string;
}

export interface TaskPlanNode {
  id: string;
  type: 'task' | 'milestone' | 'decision' | 'parallel' | 'merge';
  title: string;
  description: string;
  position: { x: number; y: number };
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
}

export interface TaskPlanConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'dependency' | 'parallel' | 'conditional';
  condition?: string;
}

export interface TaskPlan {
  id: string;
  name: string;
  description: string;
  nodes: TaskPlanNode[];
  connections: TaskPlanConnection[];
  createdAt: string;
  lastModified: string;
  projectId: string;
  createdBy: string;
}