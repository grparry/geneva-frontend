/**
 * Virtualized table component for handling large datasets efficiently
 * Uses react-window for windowing and performance optimization
 */

import React, { useMemo, useCallback, forwardRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  LinearProgress,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Table column definition
export interface VirtualizedColumn<T = any> {
  id: string;
  label: string;
  numeric?: boolean;
  width?: number | string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  sticky?: boolean;
}

// Sort direction type
type Order = 'asc' | 'desc';

// Table props
interface VirtualizedTableProps<T = any> {
  columns: VirtualizedColumn<T>[];
  data: T[];
  rowHeight?: number;
  headerHeight?: number;
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  getRowId?: (row: T) => string;
  sortable?: boolean;
  defaultOrderBy?: string;
  defaultOrder?: Order;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  emptyMessage?: string;
  maxHeight?: number;
}

// Row component
const VirtualizedRow = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    rows: any[];
    columns: VirtualizedColumn[];
    onRowClick?: (row: any, index: number) => void;
    getRowId?: (row: any) => string;
    selectedRows?: Set<string>;
    theme: any;
  };
}>(({ index, style, data }) => {
  const { rows, columns, onRowClick, getRowId, selectedRows, theme } = data;
  const row = rows[index];
  const rowId = getRowId ? getRowId(row) : index.toString();
  const isSelected = selectedRows?.has(rowId);

  const handleClick = () => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isSelected 
          ? alpha(theme.palette.primary.main, 0.08)
          : index % 2 === 0 
          ? theme.palette.background.paper 
          : alpha(theme.palette.action.hover, 0.02),
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (onRowClick) {
          e.currentTarget.style.backgroundColor = alpha(theme.palette.action.hover, 0.04);
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isSelected
          ? alpha(theme.palette.primary.main, 0.08)
          : index % 2 === 0
          ? theme.palette.background.paper
          : alpha(theme.palette.action.hover, 0.02);
      }}
    >
      {columns.map((column, columnIndex) => {
        const value = row[column.id];
        const formattedValue = column.format ? column.format(value, row) : value;
        
        return (
          <div
            key={column.id}
            style={{
              minWidth: column.minWidth || 100,
              width: column.width || 'auto',
              flex: column.width ? `0 0 ${column.width}` : 1,
              padding: '16px',
              textAlign: column.align || 'left',
              borderRight: columnIndex < columns.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedValue}
          </div>
        );
      })}
    </div>
  );
});

// Header component
const VirtualizedHeader = React.memo<{
  columns: VirtualizedColumn[];
  orderBy: string;
  order: Order;
  onSort?: (column: string) => void;
  theme: any;
}>(({ columns, orderBy, order, onSort, theme }) => {
  return (
    <div
      style={{
        display: 'flex',
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `2px solid ${theme.palette.divider}`,
        zIndex: 1,
      }}
    >
      {columns.map((column, index) => (
        <div
          key={column.id}
          style={{
            minWidth: column.minWidth || 100,
            width: column.width || 'auto',
            flex: column.width ? `0 0 ${column.width}` : 1,
            padding: '16px',
            fontWeight: 'bold',
            textAlign: column.align || 'left',
            borderRight: index < columns.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          {column.sortable !== false && onSort ? (
            <TableSortLabel
              active={orderBy === column.id}
              direction={orderBy === column.id ? order : 'asc'}
              onClick={() => onSort(column.id)}
              style={{ width: '100%', justifyContent: column.align || 'flex-start' }}
            >
              {column.label}
            </TableSortLabel>
          ) : (
            <Typography variant="subtitle2">{column.label}</Typography>
          )}
        </div>
      ))}
    </div>
  );
});

// Main virtualized table component
export const VirtualizedTable = <T extends Record<string, any>>({
  columns,
  data,
  rowHeight = 52,
  headerHeight = 56,
  loading = false,
  onRowClick,
  getRowId,
  sortable = true,
  defaultOrderBy = '',
  defaultOrder = 'asc',
  selectedRows,
  onSelectionChange,
  emptyMessage = 'No data available',
  maxHeight = 600,
}: VirtualizedTableProps<T>) => {
  const theme = useTheme();
  const [orderBy, setOrderBy] = React.useState(defaultOrderBy);
  const [order, setOrder] = React.useState<Order>(defaultOrder);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, orderBy, order, sortable]);

  // Handle sort
  const handleSort = useCallback((columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  }, [orderBy, order]);

  // Row click handler with selection support
  const handleRowClick = useCallback((row: T, index: number) => {
    if (onSelectionChange && getRowId) {
      const rowId = getRowId(row);
      const newSelection = new Set(selectedRows);
      
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      
      onSelectionChange(newSelection);
    }
    
    if (onRowClick) {
      onRowClick(row, index);
    }
  }, [onSelectionChange, getRowId, selectedRows, onRowClick]);

  // Item data for row renderer
  const itemData = useMemo(() => ({
    rows: sortedData,
    columns,
    onRowClick: handleRowClick,
    getRowId,
    selectedRows,
    theme,
  }), [sortedData, columns, handleRowClick, getRowId, selectedRows, theme]);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: maxHeight, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <VirtualizedHeader
        columns={columns}
        orderBy={orderBy}
        order={order}
        onSort={sortable ? handleSort : undefined}
        theme={theme}
      />
      
      {/* Virtualized rows */}
      <Box sx={{ flex: 1 }}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              height={height}
              itemCount={sortedData.length}
              itemSize={() => rowHeight}
              width={width}
              itemData={itemData}
            >
              {VirtualizedRow}
            </List>
          )}
        </AutoSizer>
      </Box>
    </Paper>
  );
};

// Export utilities for external use
export const createColumn = <T extends Record<string, any>>(
  column: VirtualizedColumn<T>
): VirtualizedColumn<T> => column;

export const formatters = {
  currency: (value: number) => `$${value.toFixed(2)}`,
  percentage: (value: number) => `${value.toFixed(1)}%`,
  number: (value: number, decimals: number = 0) => value.toFixed(decimals),
  date: (value: string | Date) => new Date(value).toLocaleDateString(),
  dateTime: (value: string | Date) => new Date(value).toLocaleString(),
};

export default VirtualizedTable;