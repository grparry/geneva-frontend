import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  NotificationsActive as AlertIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as EnableIcon,
  Pause as DisableIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useObservabilityStore } from '../store/observabilityStore';
import { useUIStore } from '../store/uiStore';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'latency' | 'error_rate' | 'volume' | 'pattern' | 'custom';
  condition: string;
  threshold: number;
  comparison: '>' | '<' | '=' | '>=' | '<=';
  timeWindow: number; // minutes
  evaluationInterval: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  communicationTypes: string[];
  agentFilter?: string;
  actions: AlertAction[];
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface AlertAction {
  type: 'notification' | 'email' | 'webhook' | 'slack';
  config: Record<string, any>;
  enabled: boolean;
}

interface ActiveAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  metadata: Record<string, any>;
}

interface AlertingSystemProps {
  autoEvaluate?: boolean;
  evaluationInterval?: number;
}

export const AlertingSystem: React.FC<AlertingSystemProps> = ({
  autoEvaluate = true,
  evaluationInterval = 30 // seconds
}) => {
  // Store hooks
  const { streamCache, systemMetrics, addAlert } = useObservabilityStore();
  const { addNotification } = useUIStore();
  
  // Component state
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ActiveAlert | null>(null);
  const [ruleFormData, setRuleFormData] = useState<Partial<AlertRule>>({});
  const [evaluationResults, setEvaluationResults] = useState<Map<string, any>>(new Map());
  
  // Load default alert rules
  useEffect(() => {
    const defaultRules: AlertRule[] = [
      {
        id: 'latency-high',
        name: 'High Latency Alert',
        description: 'Triggers when response time exceeds threshold',
        type: 'latency',
        condition: 'avg_response_time',
        threshold: 5000,
        comparison: '>',
        timeWindow: 5,
        evaluationInterval: 30,
        severity: 'high',
        enabled: true,
        communicationTypes: ['claude', 'inter_agent', 'memory_service'],
        actions: [
          { type: 'notification', config: { title: 'High Latency Detected' }, enabled: true }
        ],
        createdAt: new Date().toISOString(),
        triggerCount: 0
      },
      {
        id: 'error-rate-critical',
        name: 'Critical Error Rate',
        description: 'Triggers when error rate exceeds 20%',
        type: 'error_rate',
        condition: 'error_rate',
        threshold: 20,
        comparison: '>',
        timeWindow: 10,
        evaluationInterval: 60,
        severity: 'critical',
        enabled: true,
        communicationTypes: ['claude', 'inter_agent', 'memory_service', 'external_api'],
        actions: [
          { type: 'notification', config: { title: 'Critical Error Rate' }, enabled: true }
        ],
        createdAt: new Date().toISOString(),
        triggerCount: 0
      },
      {
        id: 'volume-spike',
        name: 'Volume Spike Alert',
        description: 'Triggers when message volume spikes suddenly',
        type: 'volume',
        condition: 'message_volume',
        threshold: 100,
        comparison: '>',
        timeWindow: 5,
        evaluationInterval: 30,
        severity: 'medium',
        enabled: true,
        communicationTypes: ['inter_agent'],
        actions: [
          { type: 'notification', config: { title: 'Volume Spike Detected' }, enabled: true }
        ],
        createdAt: new Date().toISOString(),
        triggerCount: 0
      }
    ];
    
    setAlertRules(defaultRules);
  }, []);
  
  // Evaluate alert rules
  const evaluateAlertRules = useCallback(() => {
    const allMessages = Array.from(streamCache.values()).flat();
    const now = Date.now();
    const results = new Map();
    
    alertRules.forEach(rule => {
      if (!rule.enabled) return;
      
      const windowStart = now - (rule.timeWindow * 60 * 1000);
      const relevantMessages = allMessages.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        const typeMatch = rule.communicationTypes.length === 0 || 
                         rule.communicationTypes.includes(msg.communication_type);
        const agentMatch = !rule.agentFilter || 
                          msg.source_agent_id === rule.agentFilter || 
                          msg.target_agent_id === rule.agentFilter;
        
        return msgTime >= windowStart && typeMatch && agentMatch;
      });
      
      let currentValue = 0;
      let shouldTrigger = false;
      
      switch (rule.type) {
        case 'latency':
          const responseTimes = relevantMessages
            .filter(m => m.processing_duration_ms)
            .map(m => m.processing_duration_ms || 0);
          
          if (responseTimes.length > 0) {
            currentValue = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            shouldTrigger = evaluateCondition(currentValue, rule.threshold, rule.comparison);
          }
          break;
          
        case 'error_rate':
          if (relevantMessages.length > 0) {
            const errorMessages = relevantMessages.filter(m => 
              m.content.toLowerCase().includes('error') || 
              m.content.toLowerCase().includes('failed')
            );
            currentValue = (errorMessages.length / relevantMessages.length) * 100;
            shouldTrigger = evaluateCondition(currentValue, rule.threshold, rule.comparison);
          }
          break;
          
        case 'volume':
          currentValue = relevantMessages.length;
          shouldTrigger = evaluateCondition(currentValue, rule.threshold, rule.comparison);
          break;
          
        case 'pattern':
          // Custom pattern detection logic
          const patternMatches = relevantMessages.filter(m => 
            m.content.toLowerCase().includes(rule.condition.toLowerCase())
          );
          currentValue = patternMatches.length;
          shouldTrigger = evaluateCondition(currentValue, rule.threshold, rule.comparison);
          break;
      }
      
      results.set(rule.id, {
        currentValue,
        threshold: rule.threshold,
        shouldTrigger,
        messagesEvaluated: relevantMessages.length
      });
      
      // Trigger alert if conditions are met
      if (shouldTrigger) {
        const existingAlert = activeAlerts.find(a => a.ruleId === rule.id && a.status === 'active');
        
        if (!existingAlert) {
          const newAlert: ActiveAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `${rule.name}: ${rule.condition} ${rule.comparison} ${rule.threshold} (current: ${currentValue.toFixed(2)})`,
            triggeredAt: new Date().toISOString(),
            status: 'active',
            metadata: {
              currentValue,
              threshold: rule.threshold,
              messagesEvaluated: relevantMessages.length,
              timeWindow: rule.timeWindow
            }
          };
          
          setActiveAlerts(prev => [newAlert, ...prev]);
          
          // Execute alert actions
          rule.actions.forEach(action => {
            if (action.enabled) {
              executeAlertAction(action, newAlert, rule);
            }
          });
          
          // Update trigger count
          setAlertRules(prev => prev.map(r => 
            r.id === rule.id 
              ? { ...r, triggerCount: r.triggerCount + 1, lastTriggered: new Date().toISOString() }
              : r
          ));
        }
      }
    });
    
    setEvaluationResults(results);
  }, [alertRules, streamCache, activeAlerts]);
  
  const evaluateCondition = (value: number, threshold: number, comparison: string): boolean => {
    switch (comparison) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '=': return Math.abs(value - threshold) < 0.001;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  };
  
  const executeAlertAction = (action: AlertAction, alert: ActiveAlert, rule: AlertRule) => {
    switch (action.type) {
      case 'notification':
        addNotification({
          type: alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warning',
          title: action.config.title || 'Alert Triggered',
          message: alert.message
        });
        
        addAlert({
          type: alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warning',
          title: rule.name,
          message: alert.message
        });
        break;
        
      case 'email':
        // Email integration would go here
        console.log('Email alert:', action.config);
        break;
        
      case 'webhook':
        // Webhook integration would go here
        console.log('Webhook alert:', action.config);
        break;
        
      case 'slack':
        // Slack integration would go here
        console.log('Slack alert:', action.config);
        break;
    }
  };
  
  // Auto-evaluation
  useEffect(() => {
    if (autoEvaluate) {
      const interval = setInterval(evaluateAlertRules, evaluationInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoEvaluate, evaluationInterval, evaluateAlertRules]);
  
  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'user' }
        : alert
    ));
  };
  
  const resolveAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: 'user' }
        : alert
    ));
  };
  
  const createOrUpdateRule = () => {
    if (editingRule) {
      setAlertRules(prev => prev.map(rule => 
        rule.id === editingRule.id ? { ...rule, ...ruleFormData } as AlertRule : rule
      ));
    } else {
      const newRule: AlertRule = {
        id: `rule-${Date.now()}`,
        name: ruleFormData.name || 'New Rule',
        description: ruleFormData.description || '',
        type: ruleFormData.type || 'latency',
        condition: ruleFormData.condition || 'avg_response_time',
        threshold: ruleFormData.threshold || 1000,
        comparison: ruleFormData.comparison || '>',
        timeWindow: ruleFormData.timeWindow || 5,
        evaluationInterval: ruleFormData.evaluationInterval || 30,
        severity: ruleFormData.severity || 'medium',
        enabled: ruleFormData.enabled ?? true,
        communicationTypes: ruleFormData.communicationTypes || [],
        agentFilter: ruleFormData.agentFilter,
        actions: ruleFormData.actions || [
          { type: 'notification', config: { title: ruleFormData.name }, enabled: true }
        ],
        createdAt: new Date().toISOString(),
        triggerCount: 0
      };
      
      setAlertRules(prev => [newRule, ...prev]);
    }
    
    setIsCreatingRule(false);
    setEditingRule(null);
    setRuleFormData({});
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };
  
  const activeAlertsCount = activeAlerts.filter(a => a.status === 'active').length;
  const acknowledgedAlertsCount = activeAlerts.filter(a => a.status === 'acknowledged').length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Badge badgeContent={activeAlertsCount} color="error">
              <AlertIcon color="primary" />
            </Badge>
            <Typography variant="h6" fontWeight="bold">
              Alerting System
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={`${alertRules.filter(r => r.enabled).length} active rules`}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`${activeAlertsCount} active alerts`}
              color="error"
              variant="outlined"
              size="small"
            />
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreatingRule(true)}
            >
              New Rule
            </Button>
            
            <Tooltip title="Evaluate Rules Now">
              <IconButton onClick={evaluateAlertRules}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        
        {/* Quick Stats */}
        <Stack direction="row" spacing={2}>
          <Chip label={`${activeAlertsCount} Active`} color="error" size="small" />
          <Chip label={`${acknowledgedAlertsCount} Acknowledged`} color="warning" size="small" />
          <Chip label={`${activeAlerts.filter(a => a.status === 'resolved').length} Resolved`} color="success" size="small" />
        </Stack>
      </Paper>

      {/* Content */}
      <Stack direction="row" spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Active Alerts */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
            <Typography variant="h6" gutterBottom>
              Active Alerts ({activeAlertsCount})
            </Typography>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {activeAlerts.length === 0 ? (
                <Alert severity="success">
                  No active alerts. System monitoring is healthy.
                </Alert>
              ) : (
                <List>
                  {activeAlerts.map((alert, index) => (
                    <React.Fragment key={alert.id}>
                      <ListItem>
                        <ListItemIcon>
                          {alert.severity === 'critical' && <ErrorIcon color="error" />}
                          {alert.severity === 'high' && <WarningIcon color="error" />}
                          {alert.severity === 'medium' && <WarningIcon color="warning" />}
                          {alert.severity === 'low' && <WarningIcon color="info" />}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1">
                                {alert.ruleName}
                              </Typography>
                              <Chip 
                                label={alert.status}
                                size="small"
                                color={getStatusColor(alert.status) as any}
                                variant="outlined"
                              />
                            </Stack>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {alert.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(alert.triggeredAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            {alert.status === 'active' && (
                              <Button
                                size="small"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                            {alert.status !== 'resolved' && (
                              <Button
                                size="small"
                                color="success"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      {index < activeAlerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Box>
        
        {/* Alert Rules */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={1}>
            <Typography variant="h6" gutterBottom>
              Alert Rules ({alertRules.length})
            </Typography>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List>
                {alertRules.map((rule, index) => (
                  <React.Fragment key={rule.id}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1">
                                {rule.name}
                              </Typography>
                              <Chip 
                                label={rule.enabled ? 'enabled' : 'disabled'}
                                size="small"
                                color={rule.enabled ? 'success' : 'default'}
                                variant="outlined"
                              />
                              <Chip 
                                label={rule.severity}
                                size="small"
                                color={getSeverityColor(rule.severity) as any}
                                variant="outlined"
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {rule.description}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary">
                            Triggered: {rule.triggerCount}
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        <Stack direction="row" spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            <Stack spacing={1}>
                              <Typography variant="body2">
                                <strong>Condition:</strong> {rule.condition} {rule.comparison} {rule.threshold}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Time Window:</strong> {rule.timeWindow} minutes
                              </Typography>
                              <Typography variant="body2">
                                <strong>Evaluation:</strong> Every {rule.evaluationInterval} seconds
                              </Typography>
                              <Typography variant="body2">
                                <strong>Communication Types:</strong> {rule.communicationTypes.join(', ') || 'All'}
                              </Typography>
                            </Stack>
                          </Box>
                          
                          <Box>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingRule(rule);
                                  setRuleFormData(rule);
                                  setIsCreatingRule(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setAlertRules(prev => prev.map(r => 
                                    r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                                  ));
                                }}
                                color={rule.enabled ? 'warning' : 'success'}
                              >
                                {rule.enabled ? <DisableIcon /> : <EnableIcon />}
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setAlertRules(prev => prev.filter(r => r.id !== rule.id));
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                            
                            {evaluationResults.has(rule.id) && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Last Evaluation: {evaluationResults.get(rule.id)?.currentValue?.toFixed(2)} / {rule.threshold}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                    
                    {index < alertRules.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Paper>
        </Box>
      </Stack>
      
      {/* Create/Edit Rule Dialog */}
      <Dialog 
        open={isCreatingRule} 
        onClose={() => {
          setIsCreatingRule(false);
          setEditingRule(null);
          setRuleFormData({});
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Rule Name"
                value={ruleFormData.name || ''}
                onChange={(e) => setRuleFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={ruleFormData.severity || 'medium'}
                  label="Severity"
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={ruleFormData.description || ''}
              onChange={(e) => setRuleFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={ruleFormData.type || 'latency'}
                  label="Type"
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="latency">Latency</MenuItem>
                  <MenuItem value="error_rate">Error Rate</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                  <MenuItem value="pattern">Pattern</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Comparison</InputLabel>
                <Select
                  value={ruleFormData.comparison || '>'}
                  label="Comparison"
                  onChange={(e) => setRuleFormData(prev => ({ ...prev, comparison: e.target.value as any }))}
                >
                  <MenuItem value=">">Greater than</MenuItem>
                  <MenuItem value="<">Less than</MenuItem>
                  <MenuItem value=">=">Greater or equal</MenuItem>
                  <MenuItem value="<=">Less or equal</MenuItem>
                  <MenuItem value="=">Equal to</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Threshold"
                type="number"
                value={ruleFormData.threshold || 0}
                onChange={(e) => setRuleFormData(prev => ({ ...prev, threshold: Number(e.target.value) }))}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Time Window (minutes)"
                type="number"
                value={ruleFormData.timeWindow || 5}
                onChange={(e) => setRuleFormData(prev => ({ ...prev, timeWindow: Number(e.target.value) }))}
              />
              
              <TextField
                fullWidth
                label="Evaluation Interval (seconds)"
                type="number"
                value={ruleFormData.evaluationInterval || 30}
                onChange={(e) => setRuleFormData(prev => ({ ...prev, evaluationInterval: Number(e.target.value) }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => {
            setIsCreatingRule(false);
            setEditingRule(null);
            setRuleFormData({});
          }}>
            Cancel
          </Button>
          <Button onClick={createOrUpdateRule} variant="contained">
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};