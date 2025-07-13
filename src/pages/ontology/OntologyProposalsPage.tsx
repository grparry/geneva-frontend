import React, { useState } from 'react';
import { Box, Typography, Button, Tabs, Tab } from '@mui/material';
import { ProposalSubmissionForm } from '../../components/ontology/ProposalSubmissionForm';
import { OntologyDiffViewer } from '../../components/ontology/OntologyDiffViewer';

export const OntologyProposalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Ontology Proposals
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Submit Proposal" />
        <Tab label="Version Comparison" />
      </Tabs>

      <Box sx={{ height: 'calc(100% - 120px)' }}>
        {activeTab === 0 && <ProposalSubmissionForm />}
        {activeTab === 1 && <OntologyDiffViewer />}
      </Box>
    </Box>
  );
};