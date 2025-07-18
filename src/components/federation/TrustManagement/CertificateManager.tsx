/**
 * Certificate Manager Component
 * 
 * Interface for managing security certificates and cryptographic verification.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  SecurityOutlined,
  VerifiedUserOutlined,
  CertificateOutlined,
  DownloadOutlined,
  UploadOutlined,
  RefreshOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  InfoOutlined,
} from '@mui/icons-material';

// Federation types and components
import { SubstratePeer, TrustLevel, CertificateInfo } from '../../../types/federation';
import { TrustLevelBadge, PeerStatusIcon } from '../shared';

interface CertificateManagerProps {
  peers: SubstratePeer[];
  isLoading: boolean;
}

interface CertificateStatus {
  peer: SubstratePeer;
  certificate?: CertificateInfo;
  status: 'valid' | 'expired' | 'revoked' | 'missing' | 'invalid';
  expiresAt?: string;
  issuer?: string;
}

// Mock certificate data for demonstration
const mockCertificates: Record<string, CertificateInfo> = {
  'peer-1': {
    id: 'cert-1',
    peer_id: 'peer-1',
    certificate_pem: '-----BEGIN CERTIFICATE-----\nMIICxjCCAa4...\n-----END CERTIFICATE-----',
    public_key_pem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----',
    fingerprint: 'sha256:1234567890abcdef...',
    issuer: 'Geneva Federation CA',
    subject: 'CN=Substrate-Alpha,O=Geneva,C=US',
    valid_from: '2024-01-01T00:00:00Z',
    valid_until: '2025-01-01T00:00:00Z',
    serial_number: '1234567890',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  'peer-2': {
    id: 'cert-2',
    peer_id: 'peer-2',
    certificate_pem: '-----BEGIN CERTIFICATE-----\nMIICxjCCAa4...\n-----END CERTIFICATE-----',
    public_key_pem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----',
    fingerprint: 'sha256:abcdef1234567890...',
    issuer: 'Geneva Federation CA',
    subject: 'CN=Substrate-Beta,O=Geneva,C=US',
    valid_from: '2023-12-01T00:00:00Z',
    valid_until: '2024-02-01T00:00:00Z', // Expired
    serial_number: '0987654321',
    status: 'expired',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
};

const CertificateManager: React.FC<CertificateManagerProps> = ({
  peers,
  isLoading,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<SubstratePeer | null>(null);
  const [certificateContent, setCertificateContent] = useState('');
  const [uploading, setUploading] = useState(false);

  // Calculate certificate statuses
  const certificateStatuses = useMemo((): CertificateStatus[] => {
    return peers.map(peer => {
      const cert = mockCertificates[peer.id];
      let status: CertificateStatus['status'] = 'missing';
      
      if (cert) {
        const now = new Date();
        const validUntil = new Date(cert.valid_until);
        const validFrom = new Date(cert.valid_from);
        
        if (cert.status === 'revoked') {
          status = 'revoked';
        } else if (now > validUntil) {
          status = 'expired';
        } else if (now < validFrom) {
          status = 'invalid';
        } else {
          status = 'valid';
        }
      }
      
      return {
        peer,
        certificate: cert,
        status,
        expiresAt: cert?.valid_until,
        issuer: cert?.issuer,
      };
    });
  }, [peers]);

  // Get certificate statistics
  const certStats = useMemo(() => {
    const total = certificateStatuses.length;
    const valid = certificateStatuses.filter(s => s.status === 'valid').length;
    const expired = certificateStatuses.filter(s => s.status === 'expired').length;
    const missing = certificateStatuses.filter(s => s.status === 'missing').length;
    const revoked = certificateStatuses.filter(s => s.status === 'revoked').length;
    
    return { total, valid, expired, missing, revoked };
  }, [certificateStatuses]);

  const handleUploadCertificate = (peer: SubstratePeer) => {
    setSelectedPeer(peer);
    setCertificateContent('');
    setUploadDialogOpen(true);
  };

  const handleSubmitCertificate = async () => {
    if (!selectedPeer || !certificateContent.trim()) return;

    setUploading(true);
    try {
      // In a real implementation, this would upload the certificate
      console.log('Uploading certificate for peer:', selectedPeer.name);
      console.log('Certificate content:', certificateContent);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Failed to upload certificate:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadCertificate = (cert: CertificateInfo) => {
    const blob = new Blob([cert.certificate_pem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.subject.split('=')[1]}-certificate.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRevokeCertificate = async (cert: CertificateInfo) => {
    // In a real implementation, this would revoke the certificate
    console.log('Revoking certificate:', cert.id);
  };

  const getStatusColor = (status: CertificateStatus['status']) => {
    switch (status) {
      case 'valid': return 'success';
      case 'expired': return 'warning';
      case 'revoked': return 'error';
      case 'missing': return 'default';
      case 'invalid': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: CertificateStatus['status']) => {
    switch (status) {
      case 'valid': return <CheckCircleOutlined />;
      case 'expired': return <WarningOutlined />;
      case 'revoked': return <ErrorOutlined />;
      case 'missing': return <InfoOutlined />;
      case 'invalid': return <ErrorOutlined />;
      default: return <InfoOutlined />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Box>
      {/* Certificate Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {certStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Peers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {certStats.valid}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valid Certs
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {certStats.expired}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expired
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="text.secondary" fontWeight="bold">
              {certStats.missing}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Missing
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 2.4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {certStats.revoked}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Revoked
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Certificate List */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Certificate Status
      </Typography>

      <Grid container spacing={2}>
        {certificateStatuses.map((certStatus) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={certStatus.peer.id}>
            <Card variant="outlined">
              <CardContent>
                {/* Peer Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PeerStatusIcon status={certStatus.peer.status} size="small" withTooltip={false} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {certStatus.peer.name}
                  </Typography>
                  <TrustLevelBadge level={certStatus.peer.trust_level} size="small" />
                </Box>

                {/* Certificate Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    icon={getStatusIcon(certStatus.status)}
                    label={certStatus.status.toUpperCase()}
                    size="small"
                    color={getStatusColor(certStatus.status)}
                  />
                  {certStatus.certificate && (
                    <Tooltip title="Certificate present">
                      <CertificateOutlined fontSize="small" color="action" />
                    </Tooltip>
                  )}
                </Box>

                {/* Certificate Details */}
                {certStatus.certificate ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Issuer: {certStatus.issuer}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Serial: {certStatus.certificate.serial_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Valid Until: {formatDate(certStatus.certificate.valid_until)}
                    </Typography>
                    
                    {certStatus.status === 'valid' && certStatus.expiresAt && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Expires in {getDaysUntilExpiry(certStatus.expiresAt)} days
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, getDaysUntilExpiry(certStatus.expiresAt) / 365 * 100))}
                          sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                          color={getDaysUntilExpiry(certStatus.expiresAt) < 30 ? 'warning' : 'success'}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No certificate available for this peer.
                  </Alert>
                )}
              </CardContent>

              <CardActions>
                {certStatus.certificate ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Download certificate">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadCertificate(certStatus.certificate!)}
                      >
                        <DownloadOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh certificate">
                      <IconButton size="small">
                        <RefreshOutlined />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Button
                    size="small"
                    startIcon={<UploadOutlined />}
                    onClick={() => handleUploadCertificate(certStatus.peer)}
                  >
                    Upload Certificate
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Certificate Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Upload Certificate
        </DialogTitle>
        
        <DialogContent>
          {selectedPeer && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Upload a security certificate for <strong>{selectedPeer.name}</strong>
              </Typography>
              
              <TextField
                fullWidth
                label="Certificate (PEM format)"
                multiline
                rows={12}
                value={certificateContent}
                onChange={(e) => setCertificateContent(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                sx={{ fontFamily: 'monospace' }}
              />
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Please paste the certificate in PEM format. The certificate will be validated before storage.
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitCertificate}
            variant="contained"
            disabled={!certificateContent.trim() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Certificate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateManager;