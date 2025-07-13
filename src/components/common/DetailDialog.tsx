import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  entityType?: string;
  entityId?: string;
  tabs?: Array<{
    label: string;
    content: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  navigateTo?: string;
}

export const DetailDialog: React.FC<DetailDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  entityType,
  entityId,
  tabs = [],
  actions,
  maxWidth = 'md',
  fullWidth = true,
  navigateTo,
}) => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNavigate = () => {
    if (navigateTo) {
      navigate(navigateTo);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="detail-dialog-title"
    >
      <DialogTitle id="detail-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">{title}</Typography>
              {entityType && (
                <Chip label={entityType} size="small" color="primary" />
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {navigateTo && (
              <Tooltip title="Open in new view">
                <IconButton onClick={handleNavigate} size="small">
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {tabs.length > 0 && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </Box>
          <DialogContent>
            {tabs.map((tab, index) => (
              <TabPanel key={index} value={tabValue} index={index}>
                {tab.content}
              </TabPanel>
            ))}
          </DialogContent>
        </>
      )}

      {tabs.length === 0 && actions && (
        <DialogContent>
          <Typography>No content available</Typography>
        </DialogContent>
      )}

      {actions && (
        <>
          <Divider />
          <DialogActions>{actions}</DialogActions>
        </>
      )}
    </Dialog>
  );
};