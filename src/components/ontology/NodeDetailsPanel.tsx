import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  Chip,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CategoryIcon from '@mui/icons-material/Category';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import ExtensionIcon from '@mui/icons-material/Extension';
import { apiClient } from '../../api/client';

interface OntologyNode {
  id: string;
  name: string;
  type: string;
  namespace: string;
  description?: string;
  importance: number;
  metadata: Record<string, any>;
}

interface ElementRelations {
  element_id: string;
  incoming: Array<{
    source: string;
    target: string;
    type: string;
    label: string;
    strength: number;
  }>;
  outgoing: Array<{
    source: string;
    target: string;
    type: string;
    label: string;
    strength: number;
  }>;
  related_elements: OntologyNode[];
}

interface NodeDetailsPanelProps {
  node: OntologyNode;
  onClose: () => void;
  onEdit?: (node: OntologyNode) => void;
  onExport?: (node: OntologyNode) => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onEdit,
  onExport,
}) => {
  const [relatedData, setRelatedData] = useState<ElementRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadRelatedData();
  }, [node.id]);

  const loadRelatedData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/ontology/elements/${node.id}/related`);
      setRelatedData(response.data);
    } catch (error) {
      console.error('Failed to load related data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getElementIcon = (type: string) => {
    const icons: Record<string, React.ReactElement> = {
      entity: <AccountTreeIcon fontSize="small" />,
      concept: <CategoryIcon fontSize="small" />,
      relation: <LinkIcon fontSize="small" />,
      property: <SettingsIcon fontSize="small" />,
      capability: <ExtensionIcon fontSize="small" />,
    };
    return icons[type] || <CategoryIcon fontSize="small" />;
  };

  const exportElement = async () => {
    try {
      const response = await apiClient.get(`/api/ontology/export/${node.id}`, {
        params: { format: 'json' },
      });
      
      // Download the exported data
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${node.name}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      onExport?.(node);
    } catch (error) {
      console.error('Failed to export element:', error);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{node.name}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Basic Information */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="subtitle2" color="textSecondary">
            Type
          </Typography>
          <Chip
            label={node.type}
            size="small"
            color="primary"
            icon={getElementIcon(node.type)}
          />
        </Box>

        <Typography variant="subtitle2" color="textSecondary">
          Namespace
        </Typography>
        <Typography variant="body2" mb={1}>
          {node.namespace}
        </Typography>

        <Typography variant="subtitle2" color="textSecondary">
          Description
        </Typography>
        <Typography variant="body2" mb={1}>
          {node.description || 'No description available'}
        </Typography>

        <Typography variant="subtitle2" color="textSecondary">
          Importance
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 100,
              height: 8,
              bgcolor: 'grey.300',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${node.importance * 100}%`,
                height: '100%',
                bgcolor: 'primary.main',
              }}
            />
          </Box>
          <Typography variant="caption">{(node.importance * 100).toFixed(0)}%</Typography>
        </Box>
      </Box>

      {/* Properties (for entities) */}
      {node.type === 'entity' && node.metadata.properties && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Properties
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Required</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {node.metadata.properties.map((prop: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{prop.name || prop}</TableCell>
                    <TableCell>{prop.type || 'string'}</TableCell>
                    <TableCell>{prop.required ? '✓' : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Related Elements */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        relatedData && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Related Elements
            </Typography>
            
            {/* Incoming Relationships */}
            {relatedData.incoming.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Incoming ({relatedData.incoming.length})
                </Typography>
                <List dense>
                  {relatedData.incoming.map((rel, index) => {
                    const relatedElement = relatedData.related_elements.find(
                      (e) => e.id === rel.source
                    );
                    return (
                      <ListItem key={index}>
                        <ListItemIcon>{getElementIcon(relatedElement?.type || '')}</ListItemIcon>
                        <ListItemText
                          primary={relatedElement?.name || rel.source}
                          secondary={`${rel.label} → ${node.name}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Outgoing Relationships */}
            {relatedData.outgoing.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Outgoing ({relatedData.outgoing.length})
                </Typography>
                <List dense>
                  {relatedData.outgoing.map((rel, index) => {
                    const relatedElement = relatedData.related_elements.find(
                      (e) => e.id === rel.target
                    );
                    return (
                      <ListItem key={index}>
                        <ListItemIcon>{getElementIcon(relatedElement?.type || '')}</ListItemIcon>
                        <ListItemText
                          primary={relatedElement?.name || rel.target}
                          secondary={`${node.name} → ${rel.label}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Box>
        )
      )}

      {/* Metadata */}
      {Object.keys(node.metadata).length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Metadata
          </Typography>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
              {JSON.stringify(node.metadata, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}

      {/* Actions */}
      <Box display="flex" gap={1}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => {
            setEditMode(true);
            onEdit?.(node);
          }}
          size="small"
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={exportElement}
          size="small"
        >
          Export
        </Button>
      </Box>
    </Box>
  );
};