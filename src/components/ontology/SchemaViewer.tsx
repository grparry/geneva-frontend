import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { JSONSchema7 } from 'json-schema';

interface SchemaViewerProps {
  schema: JSONSchema7;
  title: string;
  expanded?: boolean;
}

type SchemaProperty = JSONSchema7 & {
  name?: string;
};

export const SchemaViewer: React.FC<SchemaViewerProps> = ({
  schema,
  title,
  expanded = true,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<string[]>(expanded ? ['root'] : []);

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpandedNodes(nodeIds);
  };

  const getTypeColor = (type: string | string[] | undefined): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (Array.isArray(type)) {
      type = type[0];
    }
    switch (type) {
      case 'string':
        return 'success';
      case 'number':
      case 'integer':
        return 'info';
      case 'boolean':
        return 'warning';
      case 'object':
        return 'primary';
      case 'array':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderSchemaNode = (
    node: SchemaProperty,
    nodeId: string,
    depth: number = 0,
    parentRequired: string[] = []
  ): React.ReactNode => {
    const nodeName = node.name || nodeId.split('.').pop() || '';
    const isRequired = parentRequired.includes(nodeName);
    const hasChildren = node.properties || node.items;

    const nodeLabel = (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        py={0.5}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
            borderRadius: 1,
          },
        }}
      >
        <Typography
          variant="body2"
          fontWeight={isRequired ? 'bold' : 'normal'}
          sx={{ fontFamily: 'monospace' }}
        >
          {nodeName}
        </Typography>
        
        <Chip
          label={Array.isArray(node.type) ? node.type.join(' | ') : node.type || 'any'}
          size="small"
          color={getTypeColor(node.type)}
          sx={{ height: 20 }}
        />
        
        {isRequired && (
          <Chip label="required" size="small" color="error" sx={{ height: 20 }} />
        )}
        
        {node.enum && (
          <Chip
            label={`enum: ${node.enum.length}`}
            size="small"
            variant="outlined"
            sx={{ height: 20 }}
          />
        )}
        
        {node.description && (
          <Tooltip title={node.description} placement="right">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        
        {depth > 0 && (
          <Tooltip title="Copy path">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(nodeId.replace('root.', ''));
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );

    if (!hasChildren) {
      return (
        <TreeItem key={nodeId} nodeId={nodeId} label={nodeLabel}>
          {node.enum && (
            <Box pl={3} pb={1}>
              <Typography variant="caption" color="textSecondary">
                Allowed values:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                {node.enum.map((value, index) => (
                  <Chip
                    key={index}
                    label={JSON.stringify(value)}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontFamily: 'monospace' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          {node.default !== undefined && (
            <Box pl={3} pb={1}>
              <Typography variant="caption" color="textSecondary">
                Default: {JSON.stringify(node.default)}
              </Typography>
            </Box>
          )}
        </TreeItem>
      );
    }

    return (
      <TreeItem key={nodeId} nodeId={nodeId} label={nodeLabel}>
        {node.properties &&
          Object.entries(node.properties).map(([key, value]) => {
            const childNode = value as SchemaProperty;
            childNode.name = key;
            return renderSchemaNode(
              childNode,
              `${nodeId}.${key}`,
              depth + 1,
              (node.required || []) as string[]
            );
          })}
        {node.items && (
          <TreeItem
            nodeId={`${nodeId}.items`}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  [items]
                </Typography>
                <Chip
                  label={(node.items as any).type || 'any'}
                  size="small"
                  color={getTypeColor((node.items as any).type)}
                  sx={{ height: 20 }}
                />
              </Box>
            }
          >
            {(node.items as any).properties &&
              Object.entries((node.items as any).properties).map(([key, value]) => {
                const childNode = value as SchemaProperty;
                childNode.name = key;
                return renderSchemaNode(
                  childNode,
                  `${nodeId}.items.${key}`,
                  depth + 2,
                  ((node.items as any).required || []) as string[]
                );
              })}
          </TreeItem>
        )}
      </TreeItem>
    );
  };

  // For simple schemas, show a table view
  const isSimpleSchema = schema.properties && Object.keys(schema.properties).length < 10 && 
    !Object.values(schema.properties).some((prop: any) => prop.type === 'object' || prop.type === 'array');

  if (isSimpleSchema) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schema.properties &&
                Object.entries(schema.properties).map(([key, prop]) => {
                  const property = prop as SchemaProperty;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {key}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={property.type || 'any'}
                          size="small"
                          color={getTypeColor(property.type)}
                        />
                      </TableCell>
                      <TableCell>
                        {schema.required?.includes(key) ? '✓' : ''}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {property.description || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // For complex schemas, show tree view
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          expanded={expandedNodes}
          onNodeToggle={handleToggle}
        >
          {renderSchemaNode(schema, 'root', 0, [])}
        </TreeView>
      </Paper>
      
      {/* Schema metadata */}
      <Box mt={2} display="flex" gap={2}>
        {schema.required && (
          <Typography variant="caption" color="textSecondary">
            Required fields: {schema.required.length}
          </Typography>
        )}
        {schema.properties && (
          <Typography variant="caption" color="textSecondary">
            Total fields: {Object.keys(schema.properties).length}
          </Typography>
        )}
      </Box>
    </Box>
  );
};