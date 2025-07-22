import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { apiClient } from '../../api/client';

interface OntologyVersion {
  version_id: string;
  version_number: string;
  created_at: string;
  created_by: string;
  description?: string;
  is_current: boolean;
  change_summary?: {
    added: number;
    modified: number;
    removed: number;
  };
}

interface OntologyChange {
  change_type: 'added' | 'modified' | 'removed';
  element_type: 'concept' | 'relationship' | 'property';
  element_id: string;
  element_name: string;
  namespace?: string;
  before?: any;
  after?: any;
  impact_level: 'low' | 'medium' | 'high';
  affected_agents?: string[];
}

interface OntologyDiff {
  from_version: OntologyVersion;
  to_version: OntologyVersion;
  changes: OntologyChange[];
  summary: {
    total_changes: number;
    breaking_changes: number;
    additions: number;
    modifications: number;
    removals: number;
    affected_namespaces: string[];
  };
  validation_status?: 'valid' | 'warnings' | 'errors';
  validation_messages?: string[];
}

interface OntologyDiffViewerProps {
  currentVersionId?: string;
  onProposalCreate?: (diff: OntologyDiff) => void;
}

export const OntologyDiffViewer: React.FC<OntologyDiffViewerProps> = ({
  currentVersionId,
  onProposalCreate,
}) => {
  const [versions, setVersions] = useState<OntologyVersion[]>([]);
  const [fromVersion, setFromVersion] = useState<string>('');
  const [toVersion, setToVersion] = useState<string>('');
  const [diff, setDiff] = useState<OntologyDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const response = await apiClient.get('/ontology/versions');
      const versionList = response.data as OntologyVersion[];
      setVersions(versionList);
      
      // Set default selections
      if (versionList.length >= 2) {
        const current = versionList.find(v => v.is_current) || versionList[0];
        const previous = versionList[1];
        setFromVersion(previous.version_id);
        setToVersion(current.version_id);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
      // Use mock data for demo
      const mockVersions: OntologyVersion[] = [
        {
          version_id: 'v2.0.0',
          version_number: '2.0.0',
          created_at: new Date().toISOString(),
          created_by: 'system',
          description: 'Added federation support',
          is_current: true,
          change_summary: { added: 15, modified: 8, removed: 2 },
        },
        {
          version_id: 'v1.5.0',
          version_number: '1.5.0',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'admin',
          description: 'Enhanced memory lifecycle',
          is_current: false,
          change_summary: { added: 10, modified: 5, removed: 1 },
        },
        {
          version_id: 'v1.0.0',
          version_number: '1.0.0',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'system',
          description: 'Initial release',
          is_current: false,
          change_summary: { added: 50, modified: 0, removed: 0 },
        },
      ];
      setVersions(mockVersions);
      setFromVersion(mockVersions[1].version_id);
      setToVersion(mockVersions[0].version_id);
    }
  };

  const loadDiff = async () => {
    if (!fromVersion || !toVersion) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/ontology/diff', {
        params: { from: fromVersion, to: toVersion },
      });
      setDiff(response.data);
    } catch (err) {
      console.error('Failed to load diff:', err);
      // Use mock data for demo
      const fromVer = versions.find(v => v.version_id === fromVersion)!;
      const toVer = versions.find(v => v.version_id === toVersion)!;
      
      const mockDiff: OntologyDiff = {
        from_version: fromVer,
        to_version: toVer,
        changes: [
          {
            change_type: 'added',
            element_type: 'concept',
            element_id: 'geneva.federation.PeerSubstrate',
            element_name: 'PeerSubstrate',
            namespace: 'geneva.federation',
            after: {
              name: 'PeerSubstrate',
              description: 'Represents a federated substrate peer',
              properties: ['substrate_id', 'trust_level', 'capabilities'],
            },
            impact_level: 'high',
            affected_agents: ['federation_manager', 'trust_evaluator'],
          },
          {
            change_type: 'modified',
            element_type: 'property',
            element_id: 'geneva.core.Memory.vector_embedding',
            element_name: 'vector_embedding',
            namespace: 'geneva.core',
            before: { type: 'array', dimensions: 768 },
            after: { type: 'array', dimensions: 1536 },
            impact_level: 'high',
            affected_agents: ['semantic_retriever', 'substrate_indexer'],
          },
          {
            change_type: 'added',
            element_type: 'relationship',
            element_id: 'geneva.federation.delegates_to',
            element_name: 'delegates_to',
            namespace: 'geneva.federation',
            after: {
              from: 'geneva.core.Agent',
              to: 'geneva.federation.PeerSubstrate',
              cardinality: 'many-to-many',
            },
            impact_level: 'medium',
            affected_agents: ['federation_coordinator'],
          },
          {
            change_type: 'removed',
            element_type: 'concept',
            element_id: 'geneva.deprecated.LegacyMemory',
            element_name: 'LegacyMemory',
            namespace: 'geneva.deprecated',
            before: {
              name: 'LegacyMemory',
              description: 'Deprecated memory format',
            },
            impact_level: 'low',
            affected_agents: [],
          },
        ],
        summary: {
          total_changes: 4,
          breaking_changes: 2,
          additions: 2,
          modifications: 1,
          removals: 1,
          affected_namespaces: ['geneva.federation', 'geneva.core', 'geneva.deprecated'],
        },
        validation_status: 'warnings',
        validation_messages: [
          'Breaking change: vector_embedding dimension change may affect existing embeddings',
          'New concept PeerSubstrate requires agent updates',
        ],
      };
      setDiff(mockDiff);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <AddIcon color="success" />;
      case 'modified':
        return <EditIcon color="warning" />;
      case 'removed':
        return <RemoveIcon color="error" />;
      default:
        return null;
    }
  };

  const getImpactColor = (impact: string): 'error' | 'warning' | 'success' => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'success';
    }
  };

  const filteredChanges = diff?.changes.filter(change => {
    // Type filter
    if (filterType !== 'all' && change.change_type !== filterType) {
      return false;
    }
    
    // Impact filter
    if (filterImpact !== 'all' && change.impact_level !== filterImpact) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        change.element_name.toLowerCase().includes(query) ||
        change.element_id.toLowerCase().includes(query) ||
        (change.namespace && change.namespace.toLowerCase().includes(query))
      );
    }
    
    return true;
  }) || [];

  const exportDiff = () => {
    if (!diff) return;
    
    const data = JSON.stringify(diff, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontology-diff-${fromVersion}-to-${toVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Version Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>From Version</InputLabel>
              <Select
                value={fromVersion}
                onChange={(e) => setFromVersion(e.target.value)}
                label="From Version"
              >
                {versions.map((version) => (
                  <MenuItem key={version.version_id} value={version.version_id}>
                    {version.version_number} - {new Date(version.created_at).toLocaleDateString()}
                    {version.description && ` (${version.description})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }} display="flex" justifyContent="center">
            <CompareArrowsIcon color="action" fontSize="large" />
          </Grid>
          
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>To Version</InputLabel>
              <Select
                value={toVersion}
                onChange={(e) => setToVersion(e.target.value)}
                label="To Version"
              >
                {versions.map((version) => (
                  <MenuItem key={version.version_id} value={version.version_id}>
                    {version.version_number} - {new Date(version.created_at).toLocaleDateString()}
                    {version.is_current && ' (Current)'}
                    {version.description && ` (${version.description})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={12} display="flex" justifyContent="center" gap={2}>
            <Button
              variant="contained"
              onClick={loadDiff}
              disabled={!fromVersion || !toVersion || fromVersion === toVersion}
              startIcon={<SwapHorizIcon />}
            >
              Compare Versions
            </Button>
            {diff && (
              <Button
                variant="outlined"
                onClick={exportDiff}
                startIcon={<FileDownloadIcon />}
              >
                Export Diff
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Diff Summary */}
      {diff && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Changes
                  </Typography>
                  <Typography variant="h4">{diff.summary.total_changes}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Breaking Changes
                  </Typography>
                  <Typography variant="h4" color="error">
                    {diff.summary.breaking_changes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Namespaces
                  </Typography>
                  <Typography variant="h4">
                    {diff.summary.affected_namespaces.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Validation
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {diff.validation_status === 'valid' ? (
                      <>
                        <CheckCircleIcon color="success" />
                        <Typography color="success.main">Valid</Typography>
                      </>
                    ) : (
                      <>
                        <WarningIcon color="warning" />
                        <Typography color="warning.main">Warnings</Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Validation Messages */}
          {diff.validation_messages && diff.validation_messages.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Validation Warnings:
              </Typography>
              <List dense>
                {diff.validation_messages.map((msg, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={msg} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search changes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Change Type</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Change Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="added">Added</MenuItem>
                    <MenuItem value="modified">Modified</MenuItem>
                    <MenuItem value="removed">Removed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Impact Level</InputLabel>
                  <Select
                    value={filterImpact}
                    onChange={(e) => setFilterImpact(e.target.value)}
                    label="Impact Level"
                  >
                    <MenuItem value="all">All Levels</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Changes List */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Changes ({filteredChanges.length})
            </Typography>
            {filteredChanges.map((change, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    {getChangeIcon(change.change_type)}
                    <Box flex={1}>
                      <Typography>
                        {change.element_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {change.namespace} • {change.element_type}
                      </Typography>
                    </Box>
                    <Chip
                      label={change.impact_level}
                      size="small"
                      color={getImpactColor(change.impact_level)}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {change.before && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Before
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                            {JSON.stringify(change.before, null, 2)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                    {change.after && (
                      <Grid size={{ xs: 12, md: change.before ? 6 : 12 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          After
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                            {JSON.stringify(change.after, null, 2)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                    {change.affected_agents && change.affected_agents.length > 0 && (
                      <Grid size={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Affected Agents
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {change.affected_agents.map((agent) => (
                            <Chip key={agent} label={agent} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Create Proposal Button */}
          {onProposalCreate && (
            <Box mt={3} display="flex" justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => onProposalCreate(diff)}
                disabled={diff.summary.total_changes === 0}
              >
                Create Proposal from Changes
              </Button>
            </Box>
          )}
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};