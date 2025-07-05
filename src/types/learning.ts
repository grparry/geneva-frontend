// Learning insights and analytics types

export enum InsightType {
  PATTERN_RECOGNITION = 'pattern_recognition',
  COLLABORATION_IMPROVEMENT = 'collaboration_improvement',
  SKILL_DEVELOPMENT = 'skill_development',
  EFFICIENCY_GAIN = 'efficiency_gain',
  QUALITY_IMPROVEMENT = 'quality_improvement',
  KNOWLEDGE_GAP = 'knowledge_gap',
  TOOL_ADOPTION = 'tool_adoption',
  PROCESS_OPTIMIZATION = 'process_optimization'
}

export enum InsightSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TrendDirection {
  IMPROVING = 'IMPROVING',
  DECLINING = 'DECLINING',
  STABLE = 'STABLE',
  VOLATILE = 'VOLATILE'
}

export interface LearningInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  pattern: string;
  recommendations: string[];
  impact: string;
  evidence: string[];
  confidence: number; // 0-1
  timeframe: string;
  affectedUsers: string[];
  relatedCapabilities: string[];
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedEffort: string;
  potentialImpact: string;
  assignedTo?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  dueDate?: string;
}

export interface CollaborationMetrics {
  period: string; // e.g., "2024-01", "week-2024-01"
  totalSessions: number;
  averageSessionDuration: number;
  tasksCompleted: number;
  tasksSuccessful: number;
  clarificationsRequested: number;
  clarificationsResolved: number;
  capabilitiesUsed: string[];
  topPerformingAgents: AgentPerformance[];
  userSatisfactionScore: number;
  knowledgeTransferEvents: number;
  collaborationScore: number; // Composite score 0-100
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  sessionsInvolved: number;
  successRate: number;
  averageResponseTime: number;
  userRating: number;
  specializations: string[];
}

export interface TeamLearningData {
  userId: string;
  userName: string;
  skillAreas: SkillArea[];
  learningVelocity: number; // Skills improved per week
  collaborationFrequency: number;
  knowledgeSharing: number;
  recentAchievements: Achievement[];
}

export interface SkillArea {
  name: string;
  category: string;
  currentLevel: number; // 0-100
  targetLevel: number;
  progressRate: number; // Change per week
  lastUpdated: string;
  evidence: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  earnedAt: string;
  impact: string;
}

export interface LearningTrend {
  metric: string;
  direction: TrendDirection;
  changePercentage: number;
  period: string;
  data: TrendDataPoint[];
  analysis: string;
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface LearningFilter {
  timeRange?: {
    start: string;
    end: string;
  };
  insightTypes?: InsightType[];
  severity?: InsightSeverity[];
  users?: string[];
  agents?: string[];
  capabilities?: string[];
}

export interface LearningDashboardData {
  insights: LearningInsight[];
  metrics: CollaborationMetrics;
  trends: LearningTrend[];
  teamData: TeamLearningData[];
  recommendations: LearningInsight[];
  lastUpdated: string;
}