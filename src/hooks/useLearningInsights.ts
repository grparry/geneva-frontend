import { useState, useEffect, useCallback } from 'react';
import {
  LearningInsight,
  LearningDashboardData,
  CollaborationMetrics,
  LearningTrend,
  TeamLearningData,
  TrendDirection,
  InsightType,
  InsightSeverity,
  LearningFilter
} from '../types/learning';

interface UseLearningInsightsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseLearningInsightsReturn {
  dashboardData: LearningDashboardData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  dismissInsight: (insightId: string) => Promise<void>;
  takeAction: (actionId: string) => Promise<void>;
  applyFilter: (filter: LearningFilter) => void;
  currentFilter: LearningFilter;
}

// Mock data for testing
const generateMockDashboardData = (): LearningDashboardData => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const mockInsights: LearningInsight[] = [
    {
      id: 'insight-1',
      type: InsightType.COLLABORATION_IMPROVEMENT,
      severity: InsightSeverity.HIGH,
      title: 'Frontend Team Shows Strong React Progress',
      description: 'The frontend development team has demonstrated significant improvement in React component development over the past 2 weeks.',
      pattern: 'React-related tasks are being completed 40% faster with 25% fewer clarification requests',
      recommendations: [
        'Consider advanced React patterns training for the team',
        'Document best practices discovered during recent projects',
        'Share successful component patterns across projects'
      ],
      impact: 'Projected 30% improvement in frontend delivery velocity',
      evidence: [
        '15 React components delivered with zero post-deployment issues',
        'Average task completion time reduced from 4.2 to 2.5 hours',
        'User satisfaction scores increased from 4.1 to 4.7'
      ],
      confidence: 0.89,
      timeframe: 'Last 2 weeks',
      affectedUsers: ['Alice Johnson', 'Bob Chen', 'Carol Davis'],
      relatedCapabilities: ['React Component Development', 'State Management', 'Testing'],
      actionItems: [
        {
          id: 'action-1',
          title: 'Schedule React Advanced Patterns Workshop',
          description: 'Organize a team workshop on advanced React patterns and performance optimization',
          priority: 'HIGH',
          estimatedEffort: '4 hours',
          potentialImpact: 'Further 20% efficiency gain',
          status: 'PENDING'
        },
        {
          id: 'action-2',
          title: 'Create Component Library Documentation',
          description: 'Document successful component patterns for reuse across projects',
          priority: 'MEDIUM',
          estimatedEffort: '8 hours',
          potentialImpact: 'Reduced development time for new components',
          status: 'IN_PROGRESS'
        }
      ],
      createdAt: weekAgo.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'insight-2',
      type: InsightType.KNOWLEDGE_GAP,
      severity: InsightSeverity.MEDIUM,
      title: 'API Integration Knowledge Gap Identified',
      description: 'Several team members are struggling with complex API integration patterns, leading to increased debugging time.',
      pattern: 'API-related tasks take 60% longer than estimated and require 3x more clarifications',
      recommendations: [
        'Provide API integration training focused on error handling',
        'Create API integration templates and examples',
        'Establish API design review process'
      ],
      impact: 'Addressing this gap could reduce API task duration by 40%',
      evidence: [
        '8 API integration tasks exceeded time estimates by >50%',
        '24 clarification requests related to API error handling',
        'Code review comments frequently mention API patterns'
      ],
      confidence: 0.76,
      timeframe: 'Last 3 weeks',
      affectedUsers: ['David Wilson', 'Emma Thompson', 'Frank Martinez'],
      relatedCapabilities: ['REST API Integration', 'Error Handling', 'Authentication'],
      actionItems: [
        {
          id: 'action-3',
          title: 'API Integration Best Practices Guide',
          description: 'Create comprehensive guide covering error handling, authentication, and testing',
          priority: 'HIGH',
          estimatedEffort: '12 hours',
          potentialImpact: 'Reduce API integration issues by 50%',
          status: 'PENDING'
        }
      ],
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'insight-3',
      type: InsightType.EFFICIENCY_GAIN,
      severity: InsightSeverity.LOW,
      title: 'Testing Automation Adoption Accelerating',
      description: 'Team adoption of automated testing practices is increasing, with positive impact on code quality.',
      pattern: 'Projects with automated tests have 70% fewer post-deployment issues',
      recommendations: [
        'Expand testing coverage to include integration tests',
        'Share testing success stories across teams',
        'Invest in advanced testing tools and frameworks'
      ],
      impact: 'Continued focus on testing could eliminate 80% of production bugs',
      evidence: [
        'Test coverage increased from 45% to 78% across active projects',
        'Bug reports decreased by 65% for projects with >70% test coverage',
        'Developer confidence scores improved by 40%'
      ],
      confidence: 0.82,
      timeframe: 'Last month',
      affectedUsers: ['Alice Johnson', 'Grace Lee', 'Henry Kim'],
      relatedCapabilities: ['Component Testing', 'Integration Testing', 'Test Automation'],
      actionItems: [
        {
          id: 'action-4',
          title: 'Advanced Testing Workshop Series',
          description: 'Multi-session workshop covering integration testing and E2E testing strategies',
          priority: 'MEDIUM',
          estimatedEffort: '16 hours',
          potentialImpact: 'Achieve 90% test coverage goal',
          status: 'COMPLETED'
        }
      ],
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  const mockMetrics: CollaborationMetrics = {
    period: '2024-01',
    totalSessions: 127,
    averageSessionDuration: 85, // minutes
    tasksCompleted: 89,
    tasksSuccessful: 76,
    clarificationsRequested: 134,
    clarificationsResolved: 118,
    capabilitiesUsed: [
      'React Component Development',
      'REST API Integration',
      'Component Testing',
      'State Management',
      'Performance Optimization',
      'Documentation'
    ],
    topPerformingAgents: [
      {
        agentId: 'iris_cto',
        agentName: 'Iris',
        sessionsInvolved: 45,
        successRate: 0.89,
        averageResponseTime: 3.1,
        userRating: 4.6,
        specializations: ['Architecture', 'API Design', 'Security']
      },
      {
        agentId: 'erik_cdo',
        agentName: 'Erik',
        sessionsInvolved: 38,
        successRate: 0.91,
        averageResponseTime: 2.7,
        userRating: 4.5,
        specializations: ['Development', 'Debugging', 'Code Review']
      }
    ],
    userSatisfactionScore: 4.4,
    knowledgeTransferEvents: 23,
    collaborationScore: 78
  };

  const mockTrends: LearningTrend[] = [
    {
      metric: 'task_success_rate',
      direction: TrendDirection.IMPROVING,
      changePercentage: 12.5,
      period: 'Last 30 days',
      data: [
        { timestamp: '2024-01-01', value: 72 },
        { timestamp: '2024-01-08', value: 75 },
        { timestamp: '2024-01-15', value: 79 },
        { timestamp: '2024-01-22', value: 82 },
        { timestamp: '2024-01-29', value: 85 }
      ],
      analysis: 'Task success rate has shown consistent improvement, driven by better requirement clarification and enhanced debugging capabilities.'
    },
    {
      metric: 'average_completion_time',
      direction: TrendDirection.IMPROVING,
      changePercentage: -18.3,
      period: 'Last 30 days',
      data: [
        { timestamp: '2024-01-01', value: 4.2 },
        { timestamp: '2024-01-08', value: 3.9 },
        { timestamp: '2024-01-15', value: 3.6 },
        { timestamp: '2024-01-22', value: 3.4 },
        { timestamp: '2024-01-29', value: 3.1 }
      ],
      analysis: 'Average task completion time has decreased significantly due to improved workflows and better tool adoption.'
    },
    {
      metric: 'clarification_efficiency',
      direction: TrendDirection.STABLE,
      changePercentage: 2.1,
      period: 'Last 30 days',
      data: [
        { timestamp: '2024-01-01', value: 85 },
        { timestamp: '2024-01-08', value: 87 },
        { timestamp: '2024-01-15', value: 86 },
        { timestamp: '2024-01-22', value: 88 },
        { timestamp: '2024-01-29', value: 87 }
      ],
      analysis: 'Clarification resolution rate remains consistently high, indicating stable communication patterns.'
    }
  ];

  const mockTeamData: TeamLearningData[] = [
    {
      userId: 'alice-001',
      userName: 'Alice Johnson',
      skillAreas: [
        {
          name: 'React Development',
          category: 'Frontend',
          currentLevel: 85,
          targetLevel: 90,
          progressRate: 2.3,
          lastUpdated: now.toISOString(),
          evidence: ['Completed 12 React components', 'Led team workshop']
        },
        {
          name: 'TypeScript',
          category: 'Programming',
          currentLevel: 78,
          targetLevel: 85,
          progressRate: 1.8,
          lastUpdated: now.toISOString(),
          evidence: ['Migrated 5 components to TypeScript']
        },
        {
          name: 'Testing',
          category: 'Quality Assurance',
          currentLevel: 72,
          targetLevel: 80,
          progressRate: 2.1,
          lastUpdated: now.toISOString(),
          evidence: ['Achieved 85% test coverage on recent project']
        }
      ],
      learningVelocity: 2.1,
      collaborationFrequency: 8.5,
      knowledgeSharing: 12,
      recentAchievements: [
        {
          id: 'ach-1',
          title: 'React Expert',
          description: 'Demonstrated advanced React patterns in team project',
          category: 'Technical',
          earnedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'Led to 30% faster component development'
        }
      ]
    },
    {
      userId: 'bob-002',
      userName: 'Bob Chen',
      skillAreas: [
        {
          name: 'API Development',
          category: 'Backend',
          currentLevel: 82,
          targetLevel: 88,
          progressRate: 1.5,
          lastUpdated: now.toISOString(),
          evidence: ['Designed 3 RESTful APIs']
        },
        {
          name: 'Database Design',
          category: 'Backend',
          currentLevel: 76,
          targetLevel: 85,
          progressRate: 1.2,
          lastUpdated: now.toISOString(),
          evidence: ['Optimized query performance by 40%']
        },
        {
          name: 'DevOps',
          category: 'Operations',
          currentLevel: 65,
          targetLevel: 75,
          progressRate: 0.8,
          lastUpdated: now.toISOString(),
          evidence: ['Set up CI/CD pipeline']
        }
      ],
      learningVelocity: 1.2,
      collaborationFrequency: 6.2,
      knowledgeSharing: 8,
      recentAchievements: [
        {
          id: 'ach-2',
          title: 'API Architect',
          description: 'Successfully designed scalable API architecture',
          category: 'Technical',
          earnedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'Improved system performance by 25%'
        }
      ]
    },
    {
      userId: 'carol-003',
      userName: 'Carol Davis',
      skillAreas: [
        {
          name: 'UI/UX Design',
          category: 'Design',
          currentLevel: 88,
          targetLevel: 92,
          progressRate: 1.7,
          lastUpdated: now.toISOString(),
          evidence: ['Redesigned 4 major user flows']
        },
        {
          name: 'Accessibility',
          category: 'Design',
          currentLevel: 71,
          targetLevel: 80,
          progressRate: 2.5,
          lastUpdated: now.toISOString(),
          evidence: ['Achieved WCAG 2.1 AA compliance']
        },
        {
          name: 'Prototyping',
          category: 'Design',
          currentLevel: 79,
          targetLevel: 85,
          progressRate: 1.3,
          lastUpdated: now.toISOString(),
          evidence: ['Created interactive prototypes for 3 features']
        }
      ],
      learningVelocity: 1.8,
      collaborationFrequency: 7.8,
      knowledgeSharing: 15,
      recentAchievements: [
        {
          id: 'ach-3',
          title: 'Accessibility Champion',
          description: 'Led accessibility improvements across the platform',
          category: 'Quality',
          earnedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'Improved accessibility score by 35%'
        }
      ]
    }
  ];

  return {
    insights: mockInsights,
    metrics: mockMetrics,
    trends: mockTrends,
    teamData: mockTeamData,
    recommendations: mockInsights.filter(i => i.actionItems.length > 0),
    lastUpdated: now.toISOString()
  };
};

export const useLearningInsights = (options: UseLearningInsightsOptions = {}): UseLearningInsightsReturn => {
  const { enabled = true, autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutes default
  
  const [dashboardData, setDashboardData] = useState<LearningDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<LearningFilter>({});

  const loadData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, this would be:
      // const response = await fetch('/api/learning/insights');
      // const data = await response.json();
      
      const data = generateMockDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning insights');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const dismissInsight = useCallback(async (insightId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove insight from local state
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          insights: prev.insights.filter(insight => insight.id !== insightId),
          recommendations: prev.recommendations.filter(insight => insight.id !== insightId)
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss insight');
    }
  }, []);

  const takeAction = useCallback(async (actionId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update action status in local state
      setDashboardData(prev => {
        if (!prev) return prev;
        
        const updatedInsights = prev.insights.map(insight => ({
          ...insight,
          actionItems: insight.actionItems.map(action =>
            action.id === actionId 
              ? { ...action, status: 'IN_PROGRESS' as const }
              : action
          )
        }));

        return {
          ...prev,
          insights: updatedInsights,
          recommendations: updatedInsights.filter(i => i.actionItems.length > 0)
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start action');
    }
  }, []);

  const applyFilter = useCallback((filter: LearningFilter) => {
    setCurrentFilter(filter);
    
    if (!dashboardData) return;

    // Apply filters to insights
    let filteredInsights = dashboardData.insights;

    if (filter.insightTypes && filter.insightTypes.length > 0) {
      filteredInsights = filteredInsights.filter(insight => 
        filter.insightTypes!.includes(insight.type)
      );
    }

    if (filter.severity && filter.severity.length > 0) {
      filteredInsights = filteredInsights.filter(insight => 
        filter.severity!.includes(insight.severity)
      );
    }

    if (filter.users && filter.users.length > 0) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.affectedUsers.some(user => filter.users!.includes(user))
      );
    }

    if (filter.timeRange) {
      const start = new Date(filter.timeRange.start);
      const end = new Date(filter.timeRange.end);
      filteredInsights = filteredInsights.filter(insight => {
        const insightDate = new Date(insight.createdAt);
        return insightDate >= start && insightDate <= end;
      });
    }

    setDashboardData(prev => prev ? {
      ...prev,
      insights: filteredInsights,
      recommendations: filteredInsights.filter(i => i.actionItems.length > 0)
    } : prev);
  }, [dashboardData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefresh && enabled) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, enabled, refreshInterval, loadData]);

  return {
    dashboardData,
    loading,
    error,
    refreshData,
    dismissInsight,
    takeAction,
    applyFilter,
    currentFilter
  };
};