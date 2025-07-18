/**
 * Optimized chart components with lazy loading and performance enhancements
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { debounce } from 'lodash';

// Lazy load heavy chart components
const LazyTreemap = React.lazy(() => import('recharts').then(module => ({ default: module.Treemap })));
const LazyRadarChart = React.lazy(() => import('recharts').then(module => ({ default: module.RadarChart })));
const LazySankey = React.lazy(() => import('recharts').then(module => ({ default: module.Sankey as unknown as React.ComponentType<any> })));

// Chart loading component
const ChartLoader: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height,
      bgcolor: 'background.paper',
      borderRadius: 1,
    }}
  >
    <CircularProgress />
  </Box>
);

// Base chart props
interface BaseChartProps {
  data: any[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  onDataPointClick?: (data: any, index: number) => void;
  responsive?: boolean;
  animationDuration?: number;
  throttleResize?: number;
}

// Memoized tooltip component
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (value: any) => string;
}

const MemoizedTooltip = React.memo<TooltipProps>(({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="caption" fontWeight="medium">
        {typeof label === 'number' ? label.toString() : label}
      </Typography>
      {payload.map((entry: any, index: number) => (
        <Typography key={index} variant="caption" display="block" sx={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </Typography>
      ))}
    </Paper>
  );
});

// Optimized Line Chart
export const OptimizedLineChart: React.FC<BaseChartProps & {
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    type?: 'monotone' | 'linear' | 'step';
  }>;
  xDataKey: string;
  yAxisLabel?: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => string;
}> = React.memo(({
  data,
  height = 300,
  loading,
  error,
  lines,
  xDataKey,
  yAxisLabel,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  onDataPointClick,
  animationDuration = 500,
  throttleResize = 300,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  // Throttled resize handler
  const handleResize = useMemo(
    () => debounce(() => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions(prev => ({ ...prev, width }));
      }
    }, throttleResize),
    [throttleResize]
  );

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [handleResize]);

  // Memoize processed data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Add any data processing here
    return data;
  }, [data]);

  if (loading) return <ChartLoader height={height} />;
  if (error) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={processedData}
          onClick={onDataPointClick ? (data: any) => {
            if (data && data.activePayload) {
              onDataPointClick(data.activePayload[0].payload, Number(data.activeTooltipIndex) || 0);
            }
          } : undefined}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey={xDataKey}
            tickFormatter={xAxisFormatter}
            stroke={theme.palette.text.secondary}
          />
          <YAxis
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            tickFormatter={yAxisFormatter}
            stroke={theme.palette.text.secondary}
          />
          <Tooltip
            content={(props) => (
              <MemoizedTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                formatter={tooltipFormatter}
              />
            )}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type={line.type || 'monotone'}
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || theme.palette.primary.main}
              strokeWidth={line.strokeWidth || 2}
              dot={false}
              animationDuration={animationDuration}
              animationBegin={index * 100}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
});

// Optimized Area Chart with gradient
export const OptimizedAreaChart: React.FC<BaseChartProps & {
  areas: Array<{
    dataKey: string;
    name: string;
    color?: string;
    fillOpacity?: number;
    stackId?: string;
  }>;
  xDataKey: string;
  tooltipFormatter?: (value: any) => string;
}> = React.memo(({ data, height = 300, loading, error, areas, xDataKey, tooltipFormatter, animationDuration = 500 }) => {
  const theme = useTheme();
  
  // Generate unique gradient IDs
  const gradientIds = useMemo(() => 
    areas.map((area, index) => `gradient-${area.dataKey}-${index}`), 
    [areas]
  );

  if (loading) return <ChartLoader height={height} />;
  if (error) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          {areas.map((area, index) => (
            <linearGradient key={gradientIds[index]} id={gradientIds[index]} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color || theme.palette.primary.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={area.color || theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey={xDataKey} stroke={theme.palette.text.secondary} />
        <YAxis stroke={theme.palette.text.secondary} />
        <Tooltip
          content={(props) => (
            <MemoizedTooltip
              active={props.active}
              payload={props.payload}
              label={props.label}
              formatter={tooltipFormatter}
            />
          )}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name}
            stackId={area.stackId}
            stroke={area.color || theme.palette.primary.main}
            fillOpacity={1}
            fill={`url(#${gradientIds[index]})`}
            animationDuration={animationDuration}
            animationBegin={index * 100}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
});

// Optimized Pie Chart with animations
export const OptimizedPieChart: React.FC<BaseChartProps & {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  tooltipFormatter?: (value: any) => string;
}> = React.memo(({
  data,
  height = 300,
  loading,
  error,
  dataKey,
  nameKey,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  tooltipFormatter,
  onDataPointClick,
  animationDuration = 500,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handlePieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const handlePieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  if (loading) return <ChartLoader height={height} />;
  if (error) {
    return (
      <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabels ? (entry) => `${entry[nameKey]}: ${entry[dataKey]}` : undefined}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          animationDuration={animationDuration}
          onMouseEnter={handlePieEnter}
          onMouseLeave={handlePieLeave}
          onClick={onDataPointClick ? (data, index) => onDataPointClick(data, index) : undefined}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              style={{
                filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                cursor: onDataPointClick ? 'pointer' : 'default',
                transition: 'filter 0.3s ease',
              }}
            />
          ))}
        </Pie>
        <Tooltip
          content={(props) => (
            <MemoizedTooltip
              active={props.active}
              payload={props.payload}
              label={props.label}
              formatter={tooltipFormatter}
            />
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

// Chart wrapper with error boundary
export class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">Failed to render chart</Typography>
        </Paper>
      );
    }

    return this.props.children;
  }
}

// Hook for responsive chart dimensions
export const useChartDimensions = (containerRef: React.RefObject<HTMLElement>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: isMobile ? 250 : isTablet ? 350 : 400,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions(prev => ({
          ...prev,
          width,
        }));
      }
    };

    updateDimensions();
    const debouncedUpdate = debounce(updateDimensions, 300);
    
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      debouncedUpdate.cancel();
    };
  }, [containerRef, isMobile, isTablet]);

  return dimensions;
};

export default {
  OptimizedLineChart,
  OptimizedAreaChart,
  OptimizedPieChart,
  ChartErrorBoundary,
  useChartDimensions,
};