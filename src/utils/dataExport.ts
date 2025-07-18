/**
 * Data export utilities for analytics
 * Supports CSV, JSON, Excel, and PDF formats
 */

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

// Export format types
export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

// Export options
export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  columns?: Array<{
    field: string;
    header: string;
    width?: number;
    format?: (value: any) => string;
  }>;
  includeTimestamp?: boolean;
  includeHeaders?: boolean;
}

// Base exporter class
class DataExporter {
  // Generate filename with timestamp
  private generateFilename(baseFilename: string, extension: string, includeTimestamp = true): string {
    const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
    return `${baseFilename}${timestamp}.${extension}`;
  }

  // Export data in specified format
  async export(data: any[], options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'csv':
        await this.exportCSV(data, options);
        break;
      case 'json':
        await this.exportJSON(data, options);
        break;
      case 'excel':
        await this.exportExcel(data, options);
        break;
      case 'pdf':
        await this.exportPDF(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // Export as CSV
  private async exportCSV(data: any[], options: ExportOptions): Promise<void> {
    const filename = this.generateFilename(options.filename || 'export', 'csv', options.includeTimestamp);
    
    // Prepare headers
    const headers = options.columns?.map(col => col.header) || Object.keys(data[0] || {});
    const fields = options.columns?.map(col => col.field) || Object.keys(data[0] || {});
    
    // Build CSV content
    let csv = '';
    
    // Add metadata as comments
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        csv += `# ${key}: ${value}\n`;
      });
      csv += '\n';
    }
    
    // Add headers
    if (options.includeHeaders !== false) {
      csv += headers.map(h => this.escapeCSV(h)).join(',') + '\n';
    }
    
    // Add data rows
    data.forEach(row => {
      const values = fields.map((field, index) => {
        const value = row[field];
        const formatter = options.columns?.[index]?.format;
        const formatted = formatter ? formatter(value) : value;
        return this.escapeCSV(formatted);
      });
      csv += values.join(',') + '\n';
    });
    
    // Save file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  }

  // Escape CSV values
  private escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Escape if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  // Export as JSON
  private async exportJSON(data: any[], options: ExportOptions): Promise<void> {
    const filename = this.generateFilename(options.filename || 'export', 'json', options.includeTimestamp);
    
    // Prepare export object
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        title: options.title,
        description: options.description,
        recordCount: data.length,
        ...options.metadata,
      },
      data: data,
    };
    
    // Save file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, filename);
  }

  // Export as Excel
  private async exportExcel(data: any[], options: ExportOptions): Promise<void> {
    const filename = this.generateFilename(options.filename || 'export', 'xlsx', options.includeTimestamp);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add metadata sheet
    if (options.metadata || options.title || options.description) {
      const metadataSheet = XLSX.utils.aoa_to_sheet([
        ['Export Information'],
        [''],
        ['Title:', options.title || ''],
        ['Description:', options.description || ''],
        ['Export Date:', new Date().toISOString()],
        ['Record Count:', data.length],
        ...Object.entries(options.metadata || {}).map(([key, value]) => [key + ':', value]),
      ]);
      XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');
    }
    
    // Prepare data for Excel
    const headers = options.columns?.map(col => col.header) || Object.keys(data[0] || {});
    const fields = options.columns?.map(col => col.field) || Object.keys(data[0] || {});
    
    const excelData = data.map(row => {
      const excelRow: any = {};
      fields.forEach((field, index) => {
        const header = headers[index];
        const value = row[field];
        const formatter = options.columns?.[index]?.format;
        excelRow[header] = formatter ? formatter(value) : value;
      });
      return excelRow;
    });
    
    // Create data sheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const colWidths = headers.map((header, index) => {
      const customWidth = options.columns?.[index]?.width;
      if (customWidth) return { wch: customWidth };
      
      // Calculate width based on content
      const maxLength = Math.max(
        header.length,
        ...excelData.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;
    
    // Add data sheet
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Write file
    XLSX.writeFile(wb, filename);
  }

  // Export as PDF
  private async exportPDF(data: any[], options: ExportOptions): Promise<void> {
    const filename = this.generateFilename(options.filename || 'export', 'pdf', options.includeTimestamp);
    
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    // Add title
    if (options.title) {
      doc.setFontSize(16);
      doc.text(options.title, 14, 15);
    }
    
    // Add description
    if (options.description) {
      doc.setFontSize(10);
      doc.text(options.description, 14, 25);
    }
    
    // Add metadata
    if (options.metadata) {
      doc.setFontSize(8);
      let yPos = 35;
      Object.entries(options.metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPos);
        yPos += 5;
      });
    }
    
    // Prepare table data
    const headers = options.columns?.map(col => col.header) || Object.keys(data[0] || {});
    const fields = options.columns?.map(col => col.field) || Object.keys(data[0] || {});
    
    const tableData = data.map(row => {
      return fields.map((field, index) => {
        const value = row[field];
        const formatter = options.columns?.[index]?.format;
        return formatter ? formatter(value) : String(value || '');
      });
    });
    
    // Add table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: options.metadata ? 50 : (options.title ? 35 : 20),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Add footer
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    doc.save(filename);
  }
}

// Singleton instance
export const dataExporter = new DataExporter();

// React hook for data export
import { useState, useCallback } from 'react';

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (data: any[], options: ExportOptions) => {
    setIsExporting(true);
    setError(null);

    try {
      await dataExporter.export(data, options);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportData,
    isExporting,
    error,
  };
};

// Utility functions for common export scenarios
export const exportUtils = {
  // Export analytics KPI metrics
  exportKPIMetrics: (data: any[], format: ExportFormat = 'excel') => {
    return dataExporter.export(data, {
      format,
      filename: 'kpi_metrics',
      title: 'KPI Metrics Report',
      description: 'Key Performance Indicators for Geneva Analytics',
      columns: [
        { field: 'metric', header: 'Metric' },
        { field: 'value', header: 'Value', format: (v) => typeof v === 'number' ? v.toFixed(2) : v },
        { field: 'change', header: 'Change (%)', format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
        { field: 'target', header: 'Target', format: (v) => v?.toFixed(2) || 'N/A' },
        { field: 'status', header: 'Status' },
      ],
      metadata: {
        department: 'Analytics',
        period: 'Last 30 days',
      },
    });
  },

  // Export cost breakdown
  exportCostBreakdown: (data: any[], format: ExportFormat = 'excel') => {
    return dataExporter.export(data, {
      format,
      filename: 'cost_breakdown',
      title: 'Cost Breakdown Analysis',
      description: 'Detailed cost analysis by category and service',
      columns: [
        { field: 'category', header: 'Category' },
        { field: 'service', header: 'Service' },
        { field: 'cost', header: 'Cost ($)', format: (v) => v.toFixed(2) },
        { field: 'percentage', header: 'Percentage', format: (v) => `${v.toFixed(1)}%` },
        { field: 'trend', header: 'Trend', format: (v) => v > 0 ? '↑' : v < 0 ? '↓' : '→' },
      ],
    });
  },

  // Export workflow performance
  exportWorkflowPerformance: (data: any[], format: ExportFormat = 'excel') => {
    return dataExporter.export(data, {
      format,
      filename: 'workflow_performance',
      title: 'Workflow Performance Report',
      columns: [
        { field: 'workflow_name', header: 'Workflow' },
        { field: 'execution_count', header: 'Executions' },
        { field: 'success_rate', header: 'Success Rate', format: (v) => `${v.toFixed(1)}%` },
        { field: 'avg_duration', header: 'Avg Duration (s)', format: (v) => v.toFixed(2) },
        { field: 'total_cost', header: 'Total Cost ($)', format: (v) => v.toFixed(2) },
      ],
    });
  },

  // Export agent performance
  exportAgentPerformance: (data: any[], format: ExportFormat = 'excel') => {
    return dataExporter.export(data, {
      format,
      filename: 'agent_performance',
      title: 'Agent Performance Report',
      columns: [
        { field: 'agent_name', header: 'Agent' },
        { field: 'agent_type', header: 'Type' },
        { field: 'task_count', header: 'Tasks' },
        { field: 'success_rate', header: 'Success Rate', format: (v) => `${v.toFixed(1)}%` },
        { field: 'avg_response_time', header: 'Avg Response (ms)', format: (v) => v.toFixed(0) },
        { field: 'utilization', header: 'Utilization', format: (v) => `${v.toFixed(1)}%` },
      ],
    });
  },
};

export default dataExporter;