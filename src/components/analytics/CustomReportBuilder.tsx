import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Switch,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Tooltip,
  Menu,
  ListSubheader,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Drawer,
  AppBar,
  Toolbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  PieChart as PieIcon,
  Timeline as TimelineIcon,
  Functions as MetricIcon,
  FilterList as FilterIcon,
  Palette as ThemeIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  dataSource: string;
  visualization?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  metrics?: string[];
  dimensions?: string[];
  filters?: Filter[];
  size: 'small' | 'medium' | 'large' | 'full';
  config?: any;
}

interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: ReportWidget[];
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'html';
}

const CustomReportBuilder: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<ReportWidget | null>(null);

  // Mock data sources
  const dataSources = [
    { id: 'workflows', name: 'Workflow Executions', category: 'Operations' },
    { id: 'agents', name: 'Agent Performance', category: 'Operations' },
    { id: 'costs', name: 'Cost Analytics', category: 'Financial' },
    { id: 'errors', name: 'Error Analysis', category: 'Quality' },
    { id: 'usage', name: 'Resource Usage', category: 'Infrastructure' },
    { id: 'users', name: 'User Activity', category: 'Engagement' }
  ];

  // Mock metrics and dimensions
  const availableMetrics = {
    workflows: ['count', 'success_rate', 'avg_duration', 'total_cost'],
    agents: ['tasks_completed', 'success_rate', 'utilization', 'avg_response_time'],
    costs: ['total_cost', 'api_cost', 'token_cost', 'infra_cost'],
    errors: ['error_count', 'error_rate', 'mttr', 'severity_score'],
    usage: ['cpu_usage', 'memory_usage', 'storage_usage', 'api_calls'],
    users: ['active_users', 'sessions', 'engagement_rate', 'retention_rate']
  };

  const availableDimensions = {
    workflows: ['workflow_name', 'status', 'date', 'department'],
    agents: ['agent_name', 'agent_type', 'date', 'task_type'],
    costs: ['service', 'category', 'date', 'department'],
    errors: ['error_type', 'severity', 'component', 'date'],
    usage: ['resource_type', 'service', 'date', 'region'],
    users: ['user_segment', 'device', 'location', 'date']
  };

  // Mock report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'exec-summary',
      name: 'Executive Summary',
      description: 'High-level KPIs and trends for leadership',
      category: 'Executive',
      widgets: [
        {
          id: 'kpi-1',
          type: 'metric',
          title: 'Total Workflows',
          dataSource: 'workflows',
          metrics: ['count'],
          size: 'small'
        },
        {
          id: 'kpi-2',
          type: 'metric',
          title: 'Success Rate',
          dataSource: 'workflows',
          metrics: ['success_rate'],
          size: 'small'
        },
        {
          id: 'chart-1',
          type: 'chart',
          title: 'Daily Workflow Trends',
          dataSource: 'workflows',
          visualization: 'line',
          metrics: ['count', 'success_rate'],
          dimensions: ['date'],
          size: 'large'
        }
      ]
    },
    {
      id: 'cost-analysis',
      name: 'Cost Analysis Report',
      description: 'Detailed cost breakdown and optimization opportunities',
      category: 'Financial',
      widgets: [
        {
          id: 'cost-total',
          type: 'metric',
          title: 'Total Monthly Cost',
          dataSource: 'costs',
          metrics: ['total_cost'],
          size: 'medium'
        },
        {
          id: 'cost-breakdown',
          type: 'chart',
          title: 'Cost by Category',
          dataSource: 'costs',
          visualization: 'pie',
          metrics: ['total_cost'],
          dimensions: ['category'],
          size: 'medium'
        }
      ]
    }
  ];

  const steps = ['Report Details', 'Select Template', 'Add Widgets', 'Configure', 'Preview & Share'];

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  const addWidget = (type: ReportWidget['type']) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type} Widget`,
      dataSource: dataSources[0].id,
      size: 'medium',
      metrics: [],
      dimensions: [],
      filters: []
    };

    if (type === 'chart') {
      newWidget.visualization = 'line';
    }

    setWidgets([...widgets, newWidget]);
    setSelectedWidget(newWidget);
    setWidgetDrawerOpen(true);
  };

  const updateWidget = (widgetId: string, updates: Partial<ReportWidget>) => {
    setWidgets(widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  };

  const deleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const applyTemplate = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setWidgets(template.widgets);
      setSelectedTemplate(templateId);
    }
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart': return <ChartIcon />;
      case 'table': return <TableIcon />;
      case 'metric': return <MetricIcon />;
      case 'text': return <ReportIcon />;
      default: return <ChartIcon />;
    }
  };

  const getSizeWidth = (size: string) => {
    switch (size) {
      case 'small': return 3;
      case 'medium': return 6;
      case 'large': return 9;
      case 'full': return 12;
      default: return 6;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Report Name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Choose a Template
            </Typography>
            <Grid container spacing={2}>
              {reportTemplates.map((template) => (
                <Grid size={{ xs: 12, md: 6 }} key={template.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedTemplate === template.id ? 2 : 1,
                      borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => applyTemplate(template.id)}
                  >
                    <CardContent>
                      <Typography variant="h6">{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.description}
                      </Typography>
                      <Chip label={template.category} size="small" />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {template.widgets.length} widgets
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedTemplate === 'blank' ? 2 : 1,
                    borderColor: selectedTemplate === 'blank' ? 'primary.main' : 'divider',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    setWidgets([]);
                    setSelectedTemplate('blank');
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AddIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="h6">Blank Report</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start from scratch
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Report Widgets</Typography>
              <Box>
                <Button startIcon={<AddIcon />} onClick={() => addWidget('chart')}>
                  Add Chart
                </Button>
                <Button startIcon={<AddIcon />} onClick={() => addWidget('table')}>
                  Add Table
                </Button>
                <Button startIcon={<AddIcon />} onClick={() => addWidget('metric')}>
                  Add Metric
                </Button>
              </Box>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="widgets">
                {(provided) => (
                  <Box {...provided.droppableProps} ref={provided.innerRef}>
                    {widgets.map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              mb: 2,
                              opacity: snapshot.isDragging ? 0.5 : 1,
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper'
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box {...provided.dragHandleProps}>
                                  <DragIcon />
                                </Box>
                                {getWidgetIcon(widget.type)}
                                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                                  {widget.title}
                                </Typography>
                                <Chip label={widget.type} size="small" />
                                <Chip label={widget.size} size="small" variant="outlined" />
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedWidget(widget);
                                    setWidgetDrawerOpen(true);
                                  }}
                                >
                                  <SettingsIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => deleteWidget(widget.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configure Report Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Default Time Range</InputLabel>
                  <Select defaultValue="30d">
                    <MenuItem value="7d">Last 7 days</MenuItem>
                    <MenuItem value="30d">Last 30 days</MenuItem>
                    <MenuItem value="90d">Last 90 days</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Refresh Interval</InputLabel>
                  <Select defaultValue="manual">
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="5m">Every 5 minutes</MenuItem>
                    <MenuItem value="1h">Every hour</MenuItem>
                    <MenuItem value="1d">Daily</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Export Options
                </Typography>
                <FormControlLabel
                  control={<Checkbox defaultChecked />}
                  label="Enable PDF Export"
                />
                <FormControlLabel
                  control={<Checkbox defaultChecked />}
                  label="Enable Excel Export"
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Enable API Access"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Report Preview</Typography>
              <Box>
                <Button
                  startIcon={<PreviewIcon />}
                  onClick={() => setPreviewMode(!previewMode)}
                  variant={previewMode ? 'contained' : 'outlined'}
                >
                  {previewMode ? 'Edit Mode' : 'Preview Mode'}
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  sx={{ ml: 1 }}
                >
                  Save Report
                </Button>
                <Button
                  startIcon={<ScheduleIcon />}
                  onClick={() => setScheduleDialogOpen(true)}
                  sx={{ ml: 1 }}
                >
                  Schedule
                </Button>
                <Button
                  startIcon={<ShareIcon />}
                  onClick={() => setShareDialogOpen(true)}
                  sx={{ ml: 1 }}
                >
                  Share
                </Button>
              </Box>
            </Box>

            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={2}>
                {widgets.map((widget) => (
                  <Grid size={{ xs: 12, sm: getSizeWidth(widget.size) }} key={widget.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {widget.title}
                        </Typography>
                        <Box
                          sx={{
                            height: widget.type === 'metric' ? 100 : 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'action.hover'
                          }}
                        >
                          {getWidgetIcon(widget.type)}
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {widget.type} preview
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Custom Report Builder
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(activeStep - 1)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => setActiveStep(activeStep + 1)}
            disabled={activeStep === steps.length - 1}
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Paper>

      {/* Widget Configuration Drawer */}
      <Drawer
        anchor="right"
        open={widgetDrawerOpen}
        onClose={() => setWidgetDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Configure Widget
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setWidgetDrawerOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {selectedWidget && (
          <Box sx={{ p: 3 }}>
            <TextField
              fullWidth
              label="Widget Title"
              value={selectedWidget.title}
              onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Data Source</InputLabel>
              <Select
                value={selectedWidget.dataSource}
                onChange={(e) => updateWidget(selectedWidget.id, { dataSource: e.target.value })}
              >
                {dataSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedWidget.type === 'chart' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Visualization Type</InputLabel>
                <Select
                  value={selectedWidget.visualization}
                  onChange={(e) => updateWidget(selectedWidget.id, { visualization: e.target.value as any })}
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                  <MenuItem value="area">Area Chart</MenuItem>
                  <MenuItem value="scatter">Scatter Plot</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Size</InputLabel>
              <Select
                value={selectedWidget.size}
                onChange={(e) => updateWidget(selectedWidget.id, { size: e.target.value as any })}
              >
                <MenuItem value="small">Small (1/4)</MenuItem>
                <MenuItem value="medium">Medium (1/2)</MenuItem>
                <MenuItem value="large">Large (3/4)</MenuItem>
                <MenuItem value="full">Full Width</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              Metrics
            </Typography>
            <Autocomplete
              multiple
              options={availableMetrics[selectedWidget.dataSource as keyof typeof availableMetrics] || []}
              value={selectedWidget.metrics || []}
              onChange={(e, value) => updateWidget(selectedWidget.id, { metrics: value })}
              renderInput={(params) => <TextField {...params} placeholder="Select metrics" />}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Dimensions
            </Typography>
            <Autocomplete
              multiple
              options={availableDimensions[selectedWidget.dataSource as keyof typeof availableDimensions] || []}
              value={selectedWidget.dimensions || []}
              onChange={(e, value) => updateWidget(selectedWidget.id, { dimensions: value })}
              renderInput={(params) => <TextField {...params} placeholder="Select dimensions" />}
              sx={{ mb: 2 }}
            />
          </Box>
        )}
      </Drawer>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Frequency</InputLabel>
            <Select defaultValue="weekly">
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="time"
            label="Send Time"
            defaultValue="09:00"
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Recipients"
            placeholder="Enter email addresses separated by commas"
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select defaultValue="pdf">
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="html">HTML Email</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setScheduleDialogOpen(false)}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Report</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Share this report with team members or generate a public link
          </Alert>

          <TextField
            fullWidth
            label="Share with users"
            placeholder="Enter email addresses"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={<Switch />}
            label="Generate public link"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={<Checkbox />}
            label="Allow viewers to export data"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<ShareIcon />} onClick={() => setShareDialogOpen(false)}>
            Share Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomReportBuilder;