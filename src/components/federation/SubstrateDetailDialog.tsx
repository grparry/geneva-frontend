import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { DetailDialog } from '../common/DetailDialog';
import { Substrate, SubstratePeer, PeerStatus, TrustLevel } from '../../types/federation';
import { apiClient } from '../../api/client';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface SubstrateDetailDialogProps {
  open: boolean;
  onClose: () => void;
  substrate: Substrate | SubstratePeer | null;
  onDelegate?: () => void;
  onManageTrust?: () => void;
}

export const SubstrateDetailDialog: React.FC<SubstrateDetailDialogProps> = ({
  open,
  onClose,
  substrate,
  onDelegate,
  onManageTrust,
}) => {
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && substrate) {
      fetchDetailedInfo();
    }
  }, [open, substrate]);

  const fetchDetailedInfo = async () => {
    if (!substrate) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/federation/substrates/${substrate.id}/details`);
      setDetailedInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch substrate details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!substrate) return null;

  const overviewContent = (
    <Box>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Status
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {substrate.status === PeerStatus.CONNECTED ? (
              <CheckCircleIcon color="success" fontSize="small" />
            ) : (
              <ErrorIcon color="error" fontSize="small" />
            )}
            <Typography>{substrate.status}</Typography>
          </Box>
        </Grid>
        <Grid size={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Trust Level
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <LinearProgress
              variant="determinate"
              value={('trust_level' in substrate ? (substrate.trust_level === TrustLevel.FULL ? 100 : substrate.trust_level === TrustLevel.TRUSTED ? 80 : substrate.trust_level === TrustLevel.VERIFIED ? 60 : substrate.trust_level === TrustLevel.BASIC ? 40 : 20) : 50)}
              sx={{ width: 100, height: 8, borderRadius: 4 }}
            />
            <Typography>{('trust_level' in substrate ? (substrate.trust_level === TrustLevel.FULL ? 100 : substrate.trust_level === TrustLevel.TRUSTED ? 80 : substrate.trust_level === TrustLevel.VERIFIED ? 60 : substrate.trust_level === TrustLevel.BASIC ? 40 : 20) : 50)}%</Typography>
          </Box>
        </Grid>
        <Grid size={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Endpoints
          </Typography>
          <List dense>
            {((substrate as any).endpoints ? (substrate as any).endpoints : [substrate.url || `https://${substrate.id}.substrate.network`]).map((endpoint: string, index: number) => (
              <ListItem key={index}>
                <ListItemText
                  primary={endpoint}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );

  const capabilitiesContent = (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Available Capabilities
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
        {(Array.isArray(substrate.capabilities) ? substrate.capabilities : Object.keys(substrate.capabilities || {})).map((cap: string) => (
          <Chip key={cap} label={cap} size="small" variant="outlined" />
        ))}
      </Box>

      {detailedInfo?.resources && (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Resource Utilization
          </Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    CPU Usage
                  </Typography>
                  <Typography variant="h6">
                    {detailedInfo.resources.cpu_usage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Memory Usage
                  </Typography>
                  <Typography variant="h6">
                    {detailedInfo.resources.memory_usage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  const historyContent = (
    <Box>
      {detailedInfo?.recent_events ? (
        <List>
          {detailedInfo.recent_events.map((event: any, index: number) => (
            <ListItem key={index}>
              <ListItemText
                primary={event.description}
                secondary={new Date(event.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">No recent events</Typography>
      )}
    </Box>
  );

  const actions = (
    <>
      {onDelegate && (
        <Button onClick={onDelegate} color="primary">
          Delegate Task
        </Button>
      )}
      {onManageTrust && (
        <Button onClick={onManageTrust} color="primary">
          Manage Trust
        </Button>
      )}
      <Button onClick={onClose}>Close</Button>
    </>
  );

  return (
    <DetailDialog
      open={open}
      onClose={onClose}
      title={substrate.name}
      subtitle={`ID: ${substrate.id}`}
      entityType="Substrate"
      tabs={[
        { label: 'Overview', content: overviewContent },
        { label: 'Capabilities', content: capabilitiesContent },
        { label: 'History', content: historyContent },
      ]}
      actions={actions}
      navigateTo={`/federation/substrate/${substrate.id}`}
    />
  );
};