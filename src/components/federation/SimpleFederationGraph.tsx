import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import { Substrate, SubstratePeer, PeerStatus, TrustLevel } from '../../types/federation';

interface SimpleFederationGraphProps {
  currentSubstrate: Substrate;
  peers: SubstratePeer[];
  selectedPeer?: SubstratePeer | null;
  onNodeClick?: (peer: SubstratePeer) => void;
  height?: number;
}

export const SimpleFederationGraph: React.FC<SimpleFederationGraphProps> = ({
  currentSubstrate,
  peers,
  selectedPeer,
  onNodeClick,
  height = 400
}) => {
  const theme = useTheme();

  const getTrustLevelColor = (trustLevel: TrustLevel) => {
    switch (trustLevel) {
      case TrustLevel.FULL:
        return theme.palette.success.main;
      case TrustLevel.TRUSTED:
        return theme.palette.success.light;
      case TrustLevel.VERIFIED:
        return theme.palette.warning.main;
      case TrustLevel.BASIC:
        return theme.palette.warning.light;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: PeerStatus) => {
    switch (status) {
      case PeerStatus.CONNECTED:
        return theme.palette.success.main;
      case PeerStatus.ERROR:
        return theme.palette.error.main;
      case PeerStatus.OFFLINE:
        return theme.palette.grey[500];
      default:
        return theme.palette.warning.main;
    }
  };

  // Calculate positions for peers in a circle around the center
  const peerPositions = useMemo(() => {
    const radius = Math.min(height, 400) * 0.35;
    const centerX = 50; // percentage
    const centerY = 50; // percentage

    return peers.map((peer, index) => {
      const angle = (index * 2 * Math.PI) / peers.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) * 0.8;
      const y = centerY + radius * Math.sin(angle) * 0.8;
      return { peer, x, y };
    });
  }, [peers, height]);

  return (
    <Paper elevation={2} sx={{ p: 2, height, position: 'relative', overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Federation Network Topology
      </Typography>
      
      <Box sx={{ position: 'relative', width: '100%', height: 'calc(100% - 40px)' }}>
        {/* SVG for connection lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {peerPositions.map(({ peer, x, y }) => (
            <g key={peer.id}>
              <line
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                stroke={getTrustLevelColor(peer.trust_level)}
                strokeWidth={peer.trust_level === TrustLevel.FULL ? 3 : 2}
                strokeDasharray={peer.status !== PeerStatus.CONNECTED ? "5,5" : undefined}
                opacity={0.6}
              />
            </g>
          ))}
        </svg>

        {/* Central node (current substrate) */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              border: '3px solid',
              borderColor: theme.palette.primary.dark,
              cursor: 'default'
            }}
          >
            <Typography variant="subtitle2" align="center">
              {currentSubstrate.name}
            </Typography>
            <Typography variant="caption">
              (Current)
            </Typography>
          </Paper>
        </Box>

        {/* Peer nodes */}
        {peerPositions.map(({ peer, x, y }) => (
          <Box
            key={peer.id}
            sx={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          >
            <Paper
              elevation={selectedPeer?.id === peer.id ? 4 : 2}
              onClick={() => onNodeClick?.(peer)}
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: getStatusColor(peer.status),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <Typography variant="caption" align="center" noWrap sx={{ maxWidth: 80 }}>
                {peer.name}
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(peer.status),
                  mt: 0.5
                }}
              />
            </Paper>
          </Box>
        ))}

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            p: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            Connection Trust:
          </Typography>
          {[TrustLevel.FULL, TrustLevel.TRUSTED, TrustLevel.VERIFIED, TrustLevel.BASIC].map(level => (
            <Box key={level} display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 2,
                  bgcolor: getTrustLevelColor(level)
                }}
              />
              <Typography variant="caption">{level}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};