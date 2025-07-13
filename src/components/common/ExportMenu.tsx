import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Typography,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import { ExportService, ExportOptions } from '../../utils/export';

export interface ExportMenuProps {
  data: any[];
  filename?: string;
  title?: string;
  headers?: string[];
  formats?: Array<'json' | 'csv' | 'xlsx' | 'pdf'>;
  buttonLabel?: string;
  onExport?: (format: string) => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  data,
  filename = 'export',
  title = 'Data Export',
  headers,
  formats = ['json', 'csv', 'xlsx', 'pdf'],
  buttonLabel = 'Export',
  onExport,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: ExportOptions['format']) => {
    try {
      ExportService.exportData(data, {
        format,
        filename,
        title,
        headers,
        includeTimestamp: true,
      });
      
      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      handleClose();
    }
  };

  const getIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <CodeIcon />;
      case 'csv':
        return <TableChartIcon />;
      case 'xlsx':
        return <DescriptionIcon />;
      case 'pdf':
        return <PictureAsPdfIcon />;
      default:
        return <GetAppIcon />;
    }
  };

  const getLabel = (format: string) => {
    switch (format) {
      case 'json':
        return 'Export as JSON';
      case 'csv':
        return 'Export as CSV';
      case 'xlsx':
        return 'Export as Excel';
      case 'pdf':
        return 'Export as PDF';
      default:
        return `Export as ${format.toUpperCase()}`;
    }
  };

  return (
    <>
      <Tooltip title={buttonLabel}>
        <IconButton onClick={handleClick} size="small">
          <GetAppIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Export Data
        </Typography>
        <Divider />
        
        {formats.map((format) => (
          <MenuItem
            key={format}
            onClick={() => handleExport(format as ExportOptions['format'])}
          >
            <ListItemIcon>{getIcon(format)}</ListItemIcon>
            <ListItemText primary={getLabel(format)} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};