import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}
import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  title?: string;
  headers?: string[];
  includeTimestamp?: boolean;
}

export class ExportService {
  static exportData(data: any[], options: ExportOptions): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = options.filename || `export-${timestamp}`;

    switch (options.format) {
      case 'json':
        this.exportJSON(data, filename);
        break;
      case 'csv':
        this.exportCSV(data, filename, options.headers);
        break;
      case 'xlsx':
        this.exportXLSX(data, filename, options.headers);
        break;
      case 'pdf':
        this.exportPDF(data, filename, options.title || 'Export', options.headers);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static exportJSON(data: any[], filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadFile(blob, `${filename}.json`);
  }

  private static exportCSV(data: any[], filename: string, headers?: string[]): void {
    if (!data.length) return;

    const keys = headers || Object.keys(data[0]);
    const csv = [
      keys.join(','),
      ...data.map(row =>
        keys.map(key => {
          const value = this.getNestedValue(row, key);
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, `${filename}.csv`);
  }

  private static exportXLSX(data: any[], filename: string, headers?: string[]): void {
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private static exportPDF(data: any[], filename: string, title: string, headers?: string[]): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

    if (!data.length) {
      doc.text('No data available', 14, 40);
    } else {
      const keys = headers || Object.keys(data[0]);
      const tableData = data.map(row =>
        keys.map(key => this.getNestedValue(row, key))
      );

      (doc as any).autoTable({
        head: [keys],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    doc.save(`${filename}.pdf`);
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}

// Export presets for common data types
export const ExportPresets = {
  federationPeers: {
    headers: ['id', 'name', 'status', 'trust_level', 'capabilities', 'last_seen'],
    title: 'Federation Peers Report',
  },
  ontologyAgents: {
    headers: ['id', 'name', 'type', 'version', 'capabilities', 'success_rate'],
    title: 'Agent Registry Report',
  },
  topologyNodes: {
    headers: ['id', 'name', 'type', 'status', 'metrics.cpu', 'metrics.memory', 'trust_level'],
    title: 'Topology Nodes Report',
  },
  delegationTasks: {
    headers: ['id', 'task_type', 'source', 'target', 'status', 'created_at', 'completed_at'],
    title: 'Delegation History Report',
  },
};