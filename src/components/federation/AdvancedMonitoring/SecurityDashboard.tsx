/**
 * Security Dashboard Component
 * 
 * Security monitoring and threat detection for federation system.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  SecurityOutlined,
  WarningOutlined,
  ErrorOutlined,
  ShieldOutlined,
  LockOutlined,
  VpnKeyOutlined,
  BugReportOutlined,
  CheckCircleOutlined,
  BlockOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';

interface SecurityDashboardProps {
  metrics: any;
  health: any;
  peers: any[];
  delegations: any[];
  auditEntries: any[];
  timeRange: string;
  isLoading: boolean;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  metrics,
  health,
  peers,
  delegations,
  auditEntries,
  timeRange,
  isLoading,
}) => {
  // Calculate security metrics
  const securityMetrics = useMemo(() => {
    if (!peers.length) return null;

    // Trust analysis
    const trustDistribution = {
      none: peers.filter(p => p.trust_level === 'none').length,
      basic: peers.filter(p => p.trust_level === 'basic').length,
      verified: peers.filter(p => p.trust_level === 'verified').length,
      trusted: peers.filter(p => p.trust_level === 'trusted').length,
      full: peers.filter(p => p.trust_level === 'full').length,
    };

    const trustedPercentage = peers.length > 0 ? 
      ((trustDistribution.trusted + trustDistribution.full) / peers.length) * 100 : 0;

    // Security incidents
    const securityIncidents = auditEntries.filter(entry => 
      entry.action_type.includes('violation') || 
      entry.action_type.includes('revoke') ||
      entry.action_type.includes('block')
    );

    const recentIncidents = securityIncidents.filter(incident => {
      const incidentTime = new Date(incident.timestamp);
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24); // Last 24 hours
      return incidentTime > cutoff;
    });

    // Failed authentication attempts
    const authFailures = auditEntries.filter(entry => 
      entry.action_type.includes('auth_failed') ||
      entry.action_type.includes('certificate_invalid')
    );

    // Untrusted peer activities
    const untrustedActivities = delegations.filter(d => {
      const sourcePeer = peers.find(p => p.substrate_id === d.source_substrate);
      const targetPeer = peers.find(p => p.substrate_id === d.target_substrate);
      return (sourcePeer && sourcePeer.trust_level === 'none') || 
             (targetPeer && targetPeer.trust_level === 'none');
    });

    // Certificate status
    const certificateIssues = peers.filter(p => 
      !p.certificate || p.status === 'untrusted'
    ).length;

    // Error patterns that might indicate security issues
    const suspiciousErrors = delegations.filter(d => 
      d.status === 'failed' && 
      d.error && 
      (d.error.includes('unauthorized') || 
       d.error.includes('forbidden') || 
       d.error.includes('certificate'))
    );

    return {
      trustDistribution,
      trustedPercentage,
      securityIncidents: securityIncidents.length,
      recentIncidents: recentIncidents.length,
      authFailures: authFailures.length,
      untrustedActivities: untrustedActivities.length,
      certificateIssues,
      suspiciousErrors: suspiciousErrors.length,
      totalPeers: peers.length,
    };
  }, [peers, delegations, auditEntries]);

  // Identify security threats
  const securityThreats = useMemo(() => {
    if (!securityMetrics) return [];

    const threats = [];

    if (securityMetrics.recentIncidents > 5) {
      threats.push({
        severity: 'high',
        type: 'Elevated Security Incidents',
        description: `${securityMetrics.recentIncidents} security incidents in the last 24 hours`,
        recommendation: 'Review trust relationships and peer access',
      });
    }

    if (securityMetrics.authFailures > 10) {
      threats.push({
        severity: 'medium',
        type: 'Authentication Failures',
        description: `${securityMetrics.authFailures} authentication failures detected`,
        recommendation: 'Check certificate validity and network security',
      });
    }

    if (securityMetrics.trustedPercentage < 50) {
      threats.push({
        severity: 'medium',
        type: 'Low Trust Coverage',
        description: `Only ${securityMetrics.trustedPercentage.toFixed(1)}% of peers are trusted`,
        recommendation: 'Establish trust relationships with reliable peers',
      });
    }

    if (securityMetrics.certificateIssues > 0) {
      threats.push({
        severity: 'medium',
        type: 'Certificate Issues',
        description: `${securityMetrics.certificateIssues} peers have certificate problems`,
        recommendation: 'Update or renew peer certificates',
      });
    }

    if (securityMetrics.untrustedActivities > 20) {
      threats.push({
        severity: 'low',
        type: 'Untrusted Peer Activity',
        description: `${securityMetrics.untrustedActivities} activities from untrusted peers`,
        recommendation: 'Monitor untrusted peer behavior',
      });
    }

    return threats;
  }, [securityMetrics]);

  const getThreatColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getThreatIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <ErrorOutlined />;
      case 'medium': return <WarningOutlined />;
      case 'low': return <BugReportOutlined />;
      default: return <SecurityOutlined />;
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'full': return 'success';
      case 'trusted': return 'success';
      case 'verified': return 'info';
      case 'basic': return 'warning';
      case 'none': return 'error';
      default: return 'primary';
    }
  };

  if (!securityMetrics) {
    return (
      <Alert severity="info">
        Loading security analysis data...
      </Alert>
    );
  }

  return (
    <Box>
      {/* Security Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShieldOutlined color="primary" />
                <Typography variant="subtitle2">Trust Coverage</Typography>
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {securityMetrics.trustedPercentage.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {securityMetrics.trustDistribution.trusted + securityMetrics.trustDistribution.full} of {securityMetrics.totalPeers} peers
              </Typography>
              <LinearProgress
                variant="determinate"
                value={securityMetrics.trustedPercentage}
                color={securityMetrics.trustedPercentage > 70 ? 'success' : 'warning'}
                sx={{ mt: 1, height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningOutlined color="error" />
                <Typography variant="subtitle2">Security Incidents</Typography>
              </Box>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {securityMetrics.recentIncidents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                in last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockOutlined color="warning" />
                <Typography variant="subtitle2">Auth Failures</Typography>
              </Box>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {securityMetrics.authFailures}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                authentication failures
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VpnKeyOutlined color="info" />
                <Typography variant="subtitle2">Cert Issues</Typography>
              </Box>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {securityMetrics.certificateIssues}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                certificate problems
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Security Threats */}
      {securityThreats.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {securityThreats.length} Security Issue{securityThreats.length !== 1 ? 's' : ''} Detected
          </Typography>
          <Typography variant="body2">
            Review the security dashboard below for detailed analysis and recommendations.
          </Typography>
        </Alert>
      )}

      {/* Detailed Security Analysis */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trust Level Distribution
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              {Object.entries(securityMetrics.trustDistribution).map(([level, count]) => (
                <Box key={level} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {level} Trust
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {count} peers
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={securityMetrics.totalPeers > 0 ? (count / securityMetrics.totalPeers) * 100 : 0}
                    color={getTrustLevelColor(level)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<VerifiedUserOutlined />}
                label={`${securityMetrics.trustDistribution.trusted + securityMetrics.trustDistribution.full} Trusted`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<BlockOutlined />}
                label={`${securityMetrics.trustDistribution.none} Untrusted`}
                color="error"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Threats & Recommendations
            </Typography>
            
            {securityThreats.length > 0 ? (
              <List dense>
                {securityThreats.map((threat, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                      {getThreatIcon(threat.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {threat.type}
                          </Typography>
                          <Chip
                            label={threat.severity}
                            size="small"
                            color={getThreatColor(threat.severity)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {threat.description}
                          </Typography>
                          <Typography variant="caption" color="info.main">
                            Recommendation: {threat.recommendation}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3 }}>
                <CheckCircleOutlined color="success" />
                <Typography variant="body2" color="success.main">
                  No active security threats detected. System security posture is good.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Security Events */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Security Events ({timeRange})
        </Typography>
        
        {auditEntries.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Peer</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditEntries.slice(0, 10).map((event, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.action_type}
                        size="small"
                        color={
                          event.action_type.includes('violation') ? 'error' :
                          event.action_type.includes('upgrade') ? 'success' :
                          'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {event.peer_name || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {event.old_trust_level && event.new_trust_level && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip label={event.old_trust_level} size="small" variant="outlined" />
                          <Typography variant="caption">→</Typography>
                          <Chip label={event.new_trust_level} size="small" variant="outlined" />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>
                        {event.reason || 'No details available'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No security events recorded for the selected time period.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default SecurityDashboard;