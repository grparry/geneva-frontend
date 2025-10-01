/**
 * Memory5DBrowserPage
 * Main 5D Memory browsing page with real-time WebSocket updates
 */

import React, { useState } from 'react';
import { Box, Snackbar, Alert, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import { Memory5DBrowser } from '../../components/memory5d';
import { useMemory5DWebSocket } from '../../services/memory5d/websocket';
import { useMemory5DToast } from '../../hooks/useMemory5DToast';
import type { Memory5DWebSocketMessage } from '../../services/memory5d/websocket';

export const Memory5DBrowserPage: React.FC = () => {
  const { toast, showSuccess, showWarning, showError, showInfo, hideToast } = useMemory5DToast();
  const [wsConnected, setWsConnected] = useState(false);

  const currentProject = useSelector((state: any) => state.auth?.currentProject);
  const projectId = currentProject?.id || '00000000-0000-0000-0000-000000000000';

  const handleWebSocketEvent = (event: Memory5DWebSocketMessage) => {
    switch (event.event) {
      case 'memory_created':
        showSuccess(`Memory created: ${event.data?.memory_id?.slice(0, 8) || 'New memory'}`);
        break;

      case 'memory_updated':
        showInfo(`Memory updated: ${event.data?.memory_id?.slice(0, 8) || 'Memory'}`);
        break;

      case 'memory_deleted':
        showInfo(`Memory deleted: ${event.data?.memory_id?.slice(0, 8) || 'Memory'}`);
        break;

      case 'memory_batch_operation':
        showInfo(`Batch operation: ${event.data?.count || '?'} memories affected`);
        break;

      case 'trinity_processing_started':
        showInfo(`Trinity processing started for memory ${event.data?.memory_id?.slice(0, 8)}`);
        break;

      case 'trinity_processing_complete':
        showSuccess(
          `Trinity processing complete for memory ${event.data?.memory_id?.slice(0, 8)}`
        );
        break;

      case 'trinity_processing_failed':
        showError(
          `Trinity processing failed: ${event.data?.error || 'Unknown error'}`
        );
        break;

      case 'consolidation_triggered':
        showInfo(
          `Memory consolidation triggered: ${event.data?.source_tier} → ${event.data?.target_tier}`
        );
        break;

      case 'consolidation_complete':
        showSuccess(
          `Consolidation complete: ${event.data?.consolidated_count || '?'} memories processed`
        );
        break;

      case 'working_memory_capacity_alert':
        showWarning(
          `⚠️ Working memory capacity: ${event.data?.current_count || '?'} items (Miller's Law: 7±2)`
        );
        break;

      case 'constraint_violation':
        showError(
          `Constraint violation: ${event.data?.violation_type || 'Unknown'} - ${
            event.data?.details || 'See logs for details'
          }`
        );
        break;

      default:
        console.log('Unhandled 5D memory event:', event.event);
    }
  };

  const handleWebSocketError = (error: Error) => {
    showError(`WebSocket connection error: ${error.message}`);
  };

  const { connect, disconnect } = useMemory5DWebSocket({
    projectId,
    onEvent: handleWebSocketEvent,
    onError: handleWebSocketError,
    onConnectionChange: setWsConnected,
  });

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Memory5DBrowser
        showDimensionStats={true}
        enableCrossDimensionalSearch={true}
        onMemorySelect={(memory) => {
          console.log('Selected memory:', memory);
        }}
      />

      <Snackbar
        open={toast !== null}
        autoHideDuration={toast?.duration || 4000}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert onClose={hideToast} severity={toast.severity} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      {!wsConnected && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1,
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            🔌 WebSocket disconnected
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={connect}
            sx={{ minWidth: 100 }}
          >
            Connect
          </Button>
        </Box>
      )}

      {wsConnected && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            bgcolor: 'success.light',
            color: 'success.contrastText',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 2,
          }}
        >
          ✅ Real-time updates connected
          <Button
            variant="outlined"
            size="small"
            onClick={disconnect}
            sx={{
              minWidth: 100,
              color: 'success.contrastText',
              borderColor: 'success.contrastText',
              '&:hover': {
                borderColor: 'success.contrastText',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Disconnect
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Memory5DBrowserPage;