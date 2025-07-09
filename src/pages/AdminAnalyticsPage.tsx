import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import ExecutiveAnalyticsDashboard from '../components/analytics/ExecutiveAnalyticsDashboard';
import WorkflowAnalytics from '../components/analytics/WorkflowAnalytics';
import CostAnalysisDashboard from '../components/analytics/CostAnalysisDashboard';
import CustomReportBuilder from '../components/analytics/CustomReportBuilder';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
      sx={{ height: '100%' }}
    >
      {value === index && children}
    </Box>
  );
}

export const AdminAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'ppt') => {
    console.log('Exporting report in format:', format);
    // In a real implementation, this would generate and download the report
  };

  const handleScheduleReport = () => {
    console.log('Opening schedule report dialog');
    // In a real implementation, this would open a scheduling interface
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Executive Dashboard" />
          <Tab label="Workflow Analytics" />
          <Tab label="Cost Analysis" />
          <Tab label="Custom Reports" />
        </Tabs>
      </Paper>
      
      <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
        <TabPanel value={activeTab} index={0}>
          <ExecutiveAnalyticsDashboard 
            onExportReport={handleExportReport}
            onScheduleReport={handleScheduleReport}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <WorkflowAnalytics />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <CostAnalysisDashboard />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <CustomReportBuilder />
        </TabPanel>
      </Box>
    </Box>
  );
};