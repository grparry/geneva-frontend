/**
 * Error boundary component for analytics sections
 */

import React, { Component, ReactNode } from 'react';
import { Box, Button, Typography, Alert, AlertTitle } from '@mui/material';
import { RefreshRounded, WarningAmberRounded } from '@mui/icons-material';
import type { AnalyticsErrorFallbackProps } from '../../api/analyticsConfig';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<AnalyticsErrorFallbackProps>;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Analytics Error Boundary]', {
      componentName: this.props.componentName,
      error,
      errorInfo,
    });
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
            componentName={this.props.componentName}
          />
        );
      }

      return <DefaultErrorFallback
        error={this.state.error}
        resetErrorBoundary={this.resetErrorBoundary}
        componentName={this.props.componentName}
      />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<AnalyticsErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName,
}) => {
  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
      }}
    >
      <Alert
        severity="error"
        sx={{
          width: '100%',
          maxWidth: 600,
          mb: 3,
        }}
        icon={<WarningAmberRounded />}
      >
        <AlertTitle>
          {componentName ? `Error in ${componentName}` : 'Analytics Error'}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 1 }}>
          We encountered an error while loading analytics data.
        </Typography>
        {error.message && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {error.message}
          </Typography>
        )}
      </Alert>

      <Button
        variant="contained"
        startIcon={<RefreshRounded />}
        onClick={resetErrorBoundary}
        sx={{ mt: 2 }}
      >
        Try Again
      </Button>
    </Box>
  );
};

// Analytics-specific error fallback with more context
export const AnalyticsErrorFallback: React.FC<AnalyticsErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName,
}) => {
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                        error.message.toLowerCase().includes('fetch');
  const isAuthError = error.message.toLowerCase().includes('auth') || 
                      error.message.toLowerCase().includes('401');

  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        bgcolor: 'background.paper',
        borderRadius: 2,
      }}
    >
      <WarningAmberRounded 
        sx={{ 
          fontSize: 64, 
          color: 'error.main', 
          mb: 2,
          opacity: 0.8,
        }} 
      />
      
      <Typography variant="h6" gutterBottom>
        {componentName ? `${componentName} Unavailable` : 'Analytics Unavailable'}
      </Typography>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center" 
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {isNetworkError && 'Unable to connect to the analytics service. Please check your network connection.'}
        {isAuthError && 'Your session has expired. Please log in again to view analytics.'}
        {!isNetworkError && !isAuthError && 'An unexpected error occurred while loading analytics data.'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<RefreshRounded />}
          onClick={resetErrorBoundary}
        >
          Retry
        </Button>
        
        {isAuthError && (
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/login'}
          >
            Log In
          </Button>
        )}
      </Box>

      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            width: '100%',
            maxWidth: 600,
          }}
        >
          <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
            {error.stack}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AnalyticsErrorBoundary;