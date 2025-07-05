import { useState, useEffect, useCallback } from 'react';
import {
  CapabilitySpec,
  CapabilityCategory,
  ConfidenceLevel,
  TaskComplexity,
  TaskFeasibilityRequest,
  TaskFeasibilityResult,
  CapabilityHint
} from '../types/capability';

interface UseCapabilityManagerOptions {
  enabled?: boolean;
  autoLoadCapabilities?: boolean;
}

interface UseCapabilityManagerReturn {
  capabilities: CapabilitySpec[];
  loading: boolean;
  error: string | null;
  validateTask: (request: TaskFeasibilityRequest) => Promise<TaskFeasibilityResult>;
  getCapabilityHints: (input: string) => CapabilityHint[];
  refreshCapabilities: () => Promise<void>;
  getCapabilitiesByCategory: (category: CapabilityCategory) => CapabilitySpec[];
  searchCapabilities: (query: string) => CapabilitySpec[];
}

// Mock data for testing
const MOCK_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'react-component-creation',
    name: 'React Component Development',
    description: 'Create functional React components with TypeScript, hooks, and Material-UI styling',
    category: CapabilityCategory.FRONTEND,
    confidence: ConfidenceLevel.HIGH,
    complexity: TaskComplexity.SIMPLE,
    tags: ['react', 'typescript', 'mui', 'hooks', 'components'],
    examples: [
      'Create a responsive navigation component',
      'Build a data table with sorting and filtering',
      'Implement a multi-step form wizard'
    ],
    limitations: ['Complex animations may require additional libraries'],
    prerequisites: ['React 18+', 'TypeScript', 'Material-UI'],
    estimatedTime: {
      simple: '30min - 1hr',
      moderate: '1-3hrs',
      complex: '3-8hrs'
    }
  },
  {
    id: 'api-integration',
    name: 'REST API Integration',
    description: 'Integrate with REST APIs using fetch, axios, or React Query for data management',
    category: CapabilityCategory.BACKEND,
    confidence: ConfidenceLevel.HIGH,
    complexity: TaskComplexity.MODERATE,
    tags: ['api', 'rest', 'fetch', 'axios', 'react-query'],
    examples: [
      'Set up API client with authentication',
      'Implement CRUD operations with error handling',
      'Add caching and optimistic updates'
    ],
    estimatedTime: {
      simple: '1-2hrs',
      moderate: '2-4hrs',
      complex: '4-8hrs'
    }
  },
  {
    id: 'state-management',
    name: 'State Management',
    description: 'Implement state management using Context API, Zustand, or Redux Toolkit',
    category: CapabilityCategory.FRONTEND,
    confidence: ConfidenceLevel.MEDIUM,
    complexity: TaskComplexity.MODERATE,
    tags: ['state', 'context', 'zustand', 'redux', 'management'],
    examples: [
      'Set up global auth state with Context',
      'Implement shopping cart with Zustand',
      'Create complex form state management'
    ],
    limitations: ['Complex Redux patterns may need review'],
    estimatedTime: {
      simple: '1hr',
      moderate: '2-4hrs',
      complex: '4-12hrs'
    }
  },
  {
    id: 'testing',
    name: 'Component Testing',
    description: 'Write unit and integration tests using Jest, React Testing Library, and Vitest',
    category: CapabilityCategory.TESTING,
    confidence: ConfidenceLevel.MEDIUM,
    complexity: TaskComplexity.MODERATE,
    tags: ['testing', 'jest', 'rtl', 'vitest', 'unit-tests'],
    examples: [
      'Test React components with user interactions',
      'Mock API calls and external dependencies',
      'Set up integration test suites'
    ],
    estimatedTime: {
      simple: '30min - 1hr',
      moderate: '1-3hrs',
      complex: '3-6hrs'
    }
  },
  {
    id: 'database-design',
    name: 'Database Schema Design',
    description: 'Design relational database schemas with PostgreSQL, including migrations and indexes',
    category: CapabilityCategory.DATABASE,
    confidence: ConfidenceLevel.MEDIUM,
    complexity: TaskComplexity.COMPLEX,
    tags: ['database', 'postgresql', 'schema', 'migrations', 'sql'],
    examples: [
      'Design user authentication tables',
      'Create e-commerce product catalog schema',
      'Set up audit logging and history tables'
    ],
    limitations: ['Advanced query optimization may need review'],
    estimatedTime: {
      simple: '1-2hrs',
      moderate: '2-6hrs',
      complex: '6-16hrs'
    }
  },
  {
    id: 'security-audit',
    name: 'Security Code Review',
    description: 'Review code for common security vulnerabilities and implement security best practices',
    category: CapabilityCategory.SECURITY,
    confidence: ConfidenceLevel.LOW,
    complexity: TaskComplexity.EXPERT,
    tags: ['security', 'audit', 'vulnerabilities', 'best-practices'],
    examples: [
      'Review authentication implementation',
      'Check for SQL injection vulnerabilities',
      'Audit API endpoint security'
    ],
    limitations: ['Requires expert security review for production systems'],
    prerequisites: ['Security knowledge', 'Understanding of attack vectors'],
    estimatedTime: {
      simple: '2-4hrs',
      moderate: '4-8hrs',
      complex: '8-24hrs'
    }
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    description: 'Optimize React application performance with code splitting, memoization, and bundle analysis',
    category: CapabilityCategory.FRONTEND,
    confidence: ConfidenceLevel.MEDIUM,
    complexity: TaskComplexity.COMPLEX,
    tags: ['performance', 'optimization', 'code-splitting', 'memoization'],
    examples: [
      'Implement lazy loading for routes',
      'Optimize large list rendering',
      'Reduce bundle size with tree shaking'
    ],
    estimatedTime: {
      simple: '2-4hrs',
      moderate: '4-8hrs',
      complex: '8-20hrs'
    }
  },
  {
    id: 'documentation',
    name: 'Technical Documentation',
    description: 'Create comprehensive documentation including API docs, README files, and code comments',
    category: CapabilityCategory.DOCUMENTATION,
    confidence: ConfidenceLevel.HIGH,
    complexity: TaskComplexity.SIMPLE,
    tags: ['documentation', 'readme', 'api-docs', 'comments'],
    examples: [
      'Write API documentation with OpenAPI',
      'Create setup and deployment guides',
      'Document component props and usage'
    ],
    estimatedTime: {
      simple: '1-2hrs',
      moderate: '2-4hrs',
      complex: '4-8hrs'
    }
  }
];

export const useCapabilityManager = (options: UseCapabilityManagerOptions = {}): UseCapabilityManagerReturn => {
  const { enabled = true, autoLoadCapabilities = true } = options;
  
  const [capabilities, setCapabilities] = useState<CapabilitySpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real implementation, this would be:
      // const response = await fetch('/api/capabilities');
      // const capabilities = await response.json();
      
      setCapabilities(MOCK_CAPABILITIES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capabilities');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const validateTask = useCallback(async (request: TaskFeasibilityRequest): Promise<TaskFeasibilityResult> => {
    // Simulate API call for task validation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock validation logic
    const description = request.description.toLowerCase();
    const isReactTask = description.includes('react') || description.includes('component');
    const isComplexTask = description.includes('complex') || description.includes('advanced');
    const isSecurityTask = description.includes('security') || description.includes('authentication');

    let feasible = true;
    let confidence = ConfidenceLevel.HIGH;
    let estimatedDuration = '2-4 hours';
    const requiredCapabilities: string[] = [];

    if (isReactTask) {
      requiredCapabilities.push('React Component Development');
      if (description.includes('state')) {
        requiredCapabilities.push('State Management');
      }
    }

    if (description.includes('api')) {
      requiredCapabilities.push('REST API Integration');
    }

    if (description.includes('test')) {
      requiredCapabilities.push('Component Testing');
      estimatedDuration = '3-6 hours';
    }

    if (isSecurityTask) {
      requiredCapabilities.push('Security Code Review');
      confidence = ConfidenceLevel.LOW;
      feasible = false;
    }

    if (isComplexTask) {
      confidence = ConfidenceLevel.MEDIUM;
      estimatedDuration = '8-16 hours';
    }

    return {
      id: `validation-${Date.now()}`,
      feasible,
      confidence,
      estimatedDuration,
      requiredCapabilities,
      suggestedApproach: isReactTask 
        ? 'Break down into smaller components, implement with TypeScript, add unit tests, and create documentation.'
        : 'Analyze requirements, create implementation plan, develop incrementally with testing.',
      potentialChallenges: isComplexTask 
        ? ['Complex state management', 'Performance considerations', 'Integration complexity']
        : ['Standard implementation challenges', 'Testing edge cases'],
      alternatives: feasible ? [] : ['Simplify requirements', 'Use existing solutions', 'Seek expert consultation'],
      reasoning: `Based on the task description, this ${feasible ? 'appears feasible' : 'may not be feasible'} with current capabilities. ${
        isSecurityTask ? 'Security tasks require expert review.' : ''
      } Confidence level: ${confidence.toLowerCase()}.`,
      timestamp: new Date().toISOString()
    };
  }, []);

  const getCapabilityHints = useCallback((input: string): CapabilityHint[] => {
    if (input.length < 3) return [];

    const inputLower = input.toLowerCase();
    const hints: CapabilityHint[] = [];

    capabilities.forEach(capability => {
      const matchesName = capability.name.toLowerCase().includes(inputLower);
      const matchesTags = capability.tags.some(tag => tag.toLowerCase().includes(inputLower));
      const matchesDescription = capability.description.toLowerCase().includes(inputLower);

      if (matchesName || matchesTags || matchesDescription) {
        hints.push({
          id: `hint-${capability.id}`,
          suggestion: capability.name,
          capability: capability.id,
          confidence: capability.confidence,
          reason: matchesName ? 'Capability name match' : 
                 matchesTags ? 'Tag match' : 'Description match'
        });
      }
    });

    return hints.slice(0, 5); // Limit to 5 hints
  }, [capabilities]);

  const getCapabilitiesByCategory = useCallback((category: CapabilityCategory): CapabilitySpec[] => {
    return capabilities.filter(cap => cap.category === category);
  }, [capabilities]);

  const searchCapabilities = useCallback((query: string): CapabilitySpec[] => {
    if (!query.trim()) return capabilities;

    const queryLower = query.toLowerCase();
    return capabilities.filter(capability => 
      capability.name.toLowerCase().includes(queryLower) ||
      capability.description.toLowerCase().includes(queryLower) ||
      capability.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }, [capabilities]);

  const refreshCapabilities = useCallback(async () => {
    await loadCapabilities();
  }, [loadCapabilities]);

  useEffect(() => {
    if (autoLoadCapabilities) {
      loadCapabilities();
    }
  }, [autoLoadCapabilities, loadCapabilities]);

  return {
    capabilities,
    loading,
    error,
    validateTask,
    getCapabilityHints,
    refreshCapabilities,
    getCapabilitiesByCategory,
    searchCapabilities
  };
};