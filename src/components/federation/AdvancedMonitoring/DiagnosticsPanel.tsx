/**
 * Diagnostics Panel Component
 * 
 * System diagnostics, debugging tools, and health checks for federation system.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BugReportOutlined,
  ExpandMoreOutlined,
  PlayArrowOutlined,
  RefreshOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  WarningOutlined,
  InfoOutlined,
  NetworkCheckOutlined,
  SpeedOutlined,
  MemoryOutlined,
  StorageOutlined,
  CopyAllOutlined,
} from '@mui/icons-material';

interface DiagnosticsPanelProps {
  metrics: any;
  health: any;
  peers: any[];
  delegations: any[];
  systemStatus: any;
  timeRange: string;
  isLoading: boolean;
}

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  category: 'connectivity' | 'performance' | 'security' | 'data';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  result?: string;
  details?: any;
  duration?: number;
}

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  metrics,
  health,
  peers,
  delegations,
  systemStatus,
  timeRange,
  isLoading,
}) => {
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, DiagnosticTest>>(new Map());

  // Define diagnostic tests
  const diagnosticTests: DiagnosticTest[] = [
    {
      id: 'peer-connectivity',
      name: 'Peer Connectivity Check',
      description: 'Verify all peers are reachable and responding',
      category: 'connectivity',
      status: 'pending',
    },
    {
      id: 'trust-validation',
      name: 'Trust Relationship Validation',
      description: 'Check trust relationships for consistency',
      category: 'security',
      status: 'pending',
    },
    {
      id: 'delegation-pipeline',
      name: 'Delegation Pipeline Test',
      description: 'Test end-to-end delegation processing',
      category: 'performance',
      status: 'pending',
    },
    {
      id: 'data-integrity',
      name: 'Data Integrity Check',
      description: 'Verify data consistency across the federation',
      category: 'data',
      status: 'pending',
    },
    {
      id: 'network-latency',
      name: 'Network Latency Analysis',
      description: 'Measure network latency between peers',
      category: 'performance',
      status: 'pending',
    },
    {
      id: 'certificate-validation',
      name: 'Certificate Validation',
      description: 'Check all peer certificates for validity',
      category: 'security',
      status: 'pending',
    },
  ];

  // System diagnostics based on current state
  const systemDiagnostics = useMemo(() => {
    const diagnostics = {
      connectivity: {
        totalPeers: peers.length,
        healthyPeers: peers.filter(p => p.status === 'healthy' || p.status === 'connected').length,
        offlinePeers: peers.filter(p => p.status === 'offline').length,
        connectivityRate: peers.length > 0 ? (peers.filter(p => p.status !== 'offline').length / peers.length) * 100 : 0,
      },
      performance: {
        totalDelegations: delegations.length,
        avgResponseTime: metrics?.avg_delegation_time_ms || 0,
        successRate: delegations.length > 0 ? (delegations.filter(d => d.status === 'completed').length / delegations.length) * 100 : 0,
        pendingDelegations: delegations.filter(d => d.status === 'pending' || d.status === 'executing').length,
      },
      security: {
        trustedPeers: peers.filter(p => p.trust_level === 'trusted' || p.trust_level === 'full').length,
        untrustedPeers: peers.filter(p => p.trust_level === 'none').length,
        certificateIssues: peers.filter(p => !p.certificate || p.status === 'untrusted').length,
        trustCoverage: peers.length > 0 ? (peers.filter(p => p.trust_level !== 'none').length / peers.length) * 100 : 0,
      },
      data: {
        healthScore: health?.network_health ? health.network_health * 100 : 0,
        activeIssues: health?.issues?.length || 0,
        criticalIssues: health?.issues?.filter((i: any) => i.severity === 'critical').length || 0,
      },
    };

    return diagnostics;
  }, [peers, delegations, metrics, health]);

  // Run diagnostic test using real API calls
  const runDiagnosticTest = async (testId: string) => {
    setRunningTests(prev => new Set(prev).add(testId));
    
    const test = diagnosticTests.find(t => t.id === testId);
    if (!test) return;

    const startTime = Date.now();
    let result: DiagnosticTest;

    try {
      // Execute real diagnostic tests using federation API
      switch (testId) {
        case 'peer-connectivity':
          // Test connectivity to all peers
          const connectivityResults = await Promise.allSettled(
            peers.map(async (peer) => {
              try {
                const response = await fetch(`/api/federation/test-connection`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ peer_url: peer.url }),
                });
                return response.ok;
              } catch {
                return false;
              }
            })
          );
          
          const healthyCount = connectivityResults.filter(r => r.status === 'fulfilled' && r.value).length;
          const connectivityRate = peers.length > 0 ? (healthyCount / peers.length) * 100 : 0;
          
          result = {
            ...test,
            status: connectivityRate > 90 ? 'passed' : connectivityRate > 70 ? 'warning' : 'failed',
            result: `${healthyCount}/${peers.length} peers reachable`,
            details: {
              healthy: healthyCount,
              unreachable: peers.length - healthyCount,
              rate: connectivityRate.toFixed(1) + '%',
            },
            duration: Date.now() - startTime,
          };
          break;

        case 'trust-validation':
          // Validate trust relationships consistency
          try {
            const trustResponse = await fetch('/api/federation/trust/relationships');
            const trustData = await trustResponse.json();
            const relationships = trustData.data || [];
            
            const trustCoverage = peers.length > 0 ? 
              (peers.filter(p => p.trust_level !== 'none').length / peers.length) * 100 : 0;
            
            result = {
              ...test,
              status: trustCoverage > 80 ? 'passed' : trustCoverage > 50 ? 'warning' : 'failed',
              result: `${trustCoverage.toFixed(1)}% trust coverage`,
              details: {
                relationships: relationships.length,
                trusted: peers.filter(p => p.trust_level === 'trusted' || p.trust_level === 'full').length,
                coverage: trustCoverage.toFixed(1) + '%',
              },
              duration: Date.now() - startTime,
            };
          } catch (error) {
            result = {
              ...test,
              status: 'failed',
              result: 'Trust validation failed',
              error: 'Unable to fetch trust relationships',
              duration: Date.now() - startTime,
            };
          }
          break;

        case 'delegation-pipeline':
          // Test delegation pipeline with a simple test task
          try {
            if (peers.length === 0) {
              result = {
                ...test,
                status: 'warning',
                result: 'No peers available for testing',
                duration: Date.now() - startTime,
              };
              break;
            }

            const testPeer = peers.find(p => p.status === 'healthy' || p.status === 'connected');
            if (!testPeer) {
              result = {
                ...test,
                status: 'failed',
                result: 'No healthy peers available',
                duration: Date.now() - startTime,
              };
              break;
            }

            // Create a test delegation
            const testDelegation = await fetch('/api/federation/delegate/task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                target_substrate: testPeer.substrate_id,
                task_type: 'health_check',
                task_data: { test: true },
                priority: 1,
              }),
            });

            if (testDelegation.ok) {
              const successRate = delegations.length > 0 ? 
                (delegations.filter(d => d.status === 'completed').length / delegations.length) * 100 : 0;
              
              result = {
                ...test,
                status: successRate > 95 ? 'passed' : successRate > 80 ? 'warning' : 'failed',
                result: `Pipeline test successful - ${successRate.toFixed(1)}% success rate`,
                details: {
                  testPeer: testPeer.name,
                  successRate: successRate.toFixed(1) + '%',
                  totalDelegations: delegations.length,
                },
                duration: Date.now() - startTime,
              };
            } else {
              result = {
                ...test,
                status: 'failed',
                result: 'Test delegation failed',
                error: 'Unable to create test delegation',
                duration: Date.now() - startTime,
              };
            }
          } catch (error) {
            result = {
              ...test,
              status: 'failed',
              result: 'Delegation pipeline test failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              duration: Date.now() - startTime,
            };
          }
          break;

        case 'data-integrity':
          // Check federation health and data consistency
          try {
            const healthResponse = await fetch('/api/federation/health');
            const healthData = await healthResponse.json();
            const federationHealth = healthData.data;
            
            const healthScore = federationHealth?.network_health ? federationHealth.network_health * 100 : 0;
            
            result = {
              ...test,
              status: healthScore > 90 ? 'passed' : healthScore > 70 ? 'warning' : 'failed',
              result: `${healthScore.toFixed(1)}% health score`,
              details: {
                score: healthScore,
                issues: federationHealth?.issues?.length || 0,
                critical: federationHealth?.issues?.filter((i: any) => i.severity === 'critical').length || 0,
              },
              duration: Date.now() - startTime,
            };
          } catch (error) {
            result = {
              ...test,
              status: 'failed',
              result: 'Data integrity check failed',
              error: 'Unable to fetch federation health',
              duration: Date.now() - startTime,
            };
          }
          break;

        case 'network-latency':
          // Measure network latency to peers
          const latencyTests = await Promise.allSettled(
            peers.slice(0, 5).map(async (peer) => {
              const start = Date.now();
              try {
                const response = await fetch(`/api/federation/peers/${peer.id}`, {
                  method: 'GET',
                });
                return response.ok ? Date.now() - start : null;
              } catch {
                return null;
              }
            })
          );
          
          const validLatencies = latencyTests
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => (r as any).value);
          
          const avgLatency = validLatencies.length > 0 ? 
            validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length : 0;
          
          result = {
            ...test,
            status: avgLatency < 1000 ? 'passed' : avgLatency < 5000 ? 'warning' : 'failed',
            result: `${avgLatency.toFixed(0)}ms average latency`,
            details: {
              average: avgLatency,
              tested: validLatencies.length,
              threshold: 1000,
              status: avgLatency < 1000 ? 'Good' : avgLatency < 5000 ? 'Acceptable' : 'Poor',
            },
            duration: Date.now() - startTime,
          };
          break;

        case 'certificate-validation':
          // Validate peer certificates
          const certTests = await Promise.allSettled(
            peers.filter(p => p.certificate).map(async (peer) => {
              try {
                const response = await fetch(`/api/federation/peers/${peer.id}/certificate/validate`, {
                  method: 'POST',
                });
                const result = await response.json();
                return result.data?.isValid || false;
              } catch {
                return false;
              }
            })
          );
          
          const validCerts = certTests.filter(r => r.status === 'fulfilled' && r.value).length;
          const peersWithCerts = peers.filter(p => p.certificate).length;
          const certValidRate = peersWithCerts > 0 ? (validCerts / peersWithCerts) * 100 : 0;
          
          result = {
            ...test,
            status: certValidRate > 95 ? 'passed' : certValidRate > 80 ? 'warning' : 'failed',
            result: `${validCerts}/${peersWithCerts} certificates valid`,
            details: {
              valid: validCerts,
              invalid: peersWithCerts - validCerts,
              missing: peers.length - peersWithCerts,
              rate: certValidRate.toFixed(1) + '%',
            },
            duration: Date.now() - startTime,
          };
          break;

        default:
          result = {
            ...test,
            status: 'failed',
            result: 'Test not implemented',
            duration: Date.now() - startTime,
          };
      }
    } catch (error) {
      result = {
        ...test,
        status: 'failed',
        result: 'Test execution failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }

    setTestResults(prev => new Map(prev).set(testId, result));
    setRunningTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(testId);
      return newSet;
    });
  };

  const runAllTests = async () => {
    for (const test of diagnosticTests) {
      if (!runningTests.has(test.id)) {
        runDiagnosticTest(test.id);
        // Stagger test execution
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleOutlined color="success" />;
      case 'warning':
        return <WarningOutlined color="warning" />;
      case 'failed':
        return <ErrorOutlined color="error" />;
      case 'running':
        return <RefreshOutlined color="action" />;
      default:
        return <InfoOutlined color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'warning': return 'warning';
      case 'failed': return 'error';
      case 'running': return 'info';
      default: return 'default';
    }
  };

  const copyDiagnosticInfo = () => {
    const info = {
      timestamp: new Date().toISOString(),
      systemDiagnostics,
      testResults: Object.fromEntries(testResults),
      peers: peers.length,
      delegations: delegations.length,
      health: health?.overall_status,
    };
    
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
  };

  return (
    <Box>
      {/* Diagnostic Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NetworkCheckOutlined color="primary" />
                <Typography variant="subtitle2">Connectivity</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {systemDiagnostics.connectivity.connectivityRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {systemDiagnostics.connectivity.healthyPeers}/{systemDiagnostics.connectivity.totalPeers} peers healthy
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SpeedOutlined color="info" />
                <Typography variant="subtitle2">Performance</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {systemDiagnostics.performance.successRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                delegation success rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MemoryOutlined color="success" />
                <Typography variant="subtitle2">Security</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {systemDiagnostics.security.trustCoverage.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                trust coverage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StorageOutlined color="warning" />
                <Typography variant="subtitle2">Data Health</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {systemDiagnostics.data.healthScore.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                health score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diagnostic Tests */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportOutlined />
              <Typography variant="h6">Diagnostic Tests</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Copy diagnostic info">
                <IconButton onClick={copyDiagnosticInfo} size="small">
                  <CopyAllOutlined />
                </IconButton>
              </Tooltip>
              <Button
                startIcon={<PlayArrowOutlined />}
                onClick={runAllTests}
                variant="contained"
                size="small"
                disabled={runningTests.size > 0}
              >
                Run All Tests
              </Button>
            </Box>
          </Box>
        </Box>

        <List sx={{ py: 0 }}>
          {diagnosticTests.map((test, index) => {
            const isRunning = runningTests.has(test.id);
            const result = testResults.get(test.id);
            const status = isRunning ? 'running' : (result?.status || 'pending');

            return (
              <React.Fragment key={test.id}>
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {test.name}
                        </Typography>
                        <Chip
                          label={test.category}
                          size="small"
                          variant="outlined"
                        />
                        {result && (
                          <Chip
                            label={status}
                            size="small"
                            color={getStatusColor(status)}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {test.description}
                        </Typography>
                        {result && (
                          <Typography variant="caption" color="text.secondary">
                            {result.result} • Duration: {result.duration}ms
                          </Typography>
                        )}
                        {isRunning && (
                          <LinearProgress sx={{ mt: 1, width: 200 }} />
                        )}
                      </Box>
                    }
                  />
                  <Box>
                    <Button
                      startIcon={<PlayArrowOutlined />}
                      onClick={() => runDiagnosticTest(test.id)}
                      disabled={isRunning}
                      size="small"
                    >
                      {isRunning ? 'Running...' : 'Run Test'}
                    </Button>
                  </Box>
                </ListItem>
                {index < diagnosticTests.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>

      {/* Test Results Details */}
      {testResults.size > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Results Details
          </Typography>
          
          {Array.from(testResults.values()).map((result) => (
            <Accordion key={result.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(result.status)}
                  <Typography variant="subtitle1">{result.name}</Typography>
                  <Chip
                    label={result.status}
                    size="small"
                    color={getStatusColor(result.status)}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  {result.result}
                </Typography>
                
                {result.details && (
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {Object.entries(result.details).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                              {key.replace(/([A-Z])/g, ' $1')}
                            </TableCell>
                            <TableCell>{String(value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default DiagnosticsPanel;