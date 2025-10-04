// CSV export functionality

import type { ExportData, ExportOptions, ExportResult } from '../types/exportTypes';

export class CsvExporter {
  async export(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      const csvContent = this.generateCsv(data, options);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      return {
        success: true,
        filename: '',
        data: blob
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'CSV export failed'
      };
    }
  }

  private generateCsv(data: ExportData, options: ExportOptions): string {
    const lines: string[] = [];
    
    // Export metadata
    lines.push('MNUDA Session Export');
    lines.push(`Generated,${new Date().toISOString()}`);
    lines.push(`Format,CSV`);
    lines.push(`Version,1.0`);
    lines.push(''); // Empty line

    // Session Information
    lines.push('SESSION INFORMATION');
    lines.push('Property,Value');
    lines.push(`Session Name,${this.escapeCsv(data.session.name)}`);
    lines.push(`Session ID,${this.escapeCsv(data.session.id)}`);
    lines.push(`Created,${new Date(data.session.createdAt).toISOString()}`);
    lines.push(`Last Accessed,${new Date(data.session.lastAccessed).toISOString()}`);
    lines.push(`Total Nodes,${data.session.nodeCount}`);
    lines.push(`Total Entities,${data.session.entityCount}`);
    lines.push(`Location Tracking,${data.session.metadata.locationTrackingActive ? 'Active' : 'Inactive'}`);
    lines.push(''); // Empty line

    // Entity Summary
    lines.push('ENTITY SUMMARY');
    lines.push('Entity Type,Count,Percentage');
    const totalEntities = data.summary.totalEntities;
    Object.entries(data.summary.entityCounts).forEach(([type, count]) => {
      const percentage = totalEntities > 0 ? ((count / totalEntities) * 100).toFixed(1) : '0.0';
      lines.push(`${type.charAt(0).toUpperCase() + type.slice(1)},${count},${percentage}%`);
    });
    lines.push(''); // Empty line

    // Source Breakdown
    lines.push('SOURCE BREAKDOWN');
    lines.push('Source,Count');
    Object.entries(data.summary.breakdown.bySource).forEach(([source, count]) => {
      lines.push(`${source},${count}`);
    });
    lines.push(''); // Empty line

    // Traceability Breakdown
    lines.push('TRACEABILITY BREAKDOWN');
    lines.push('Type,Count');
    lines.push(`Traceable,${data.summary.breakdown.byTraceability.traceable}`);
    lines.push(`Non-Traceable,${data.summary.breakdown.byTraceability.nonTraceable}`);
    lines.push(''); // Empty line

    // Node Summary
    lines.push('NODE SUMMARY');
    lines.push('Node ID,Node Title,Node Type,Entity Count,API Name,Status,Has Completed,Created');
    data.nodes.forEach(node => {
      lines.push([
        node.id,
        this.escapeCsv(node.title),
        node.type,
        node.entityCount,
        node.metadata.apiName || '',
        node.metadata.status || '',
        node.metadata.hasCompleted ? 'Yes' : 'No',
        new Date(node.timestamp).toISOString()
      ].join(','));
    });
    lines.push(''); // Empty line

    // Detailed Entity Breakdown
    lines.push('ENTITY BREAKDOWN BY TYPE');
    lines.push('Entity Type,Total Count,Traceable,Non-Traceable,Categories,Sources');
    Object.entries(data.summary.breakdown.byEntityType).forEach(([type, breakdown]) => {
      const categories = Object.entries(breakdown.categories).map(([cat, count]) => `${cat}: ${count}`).join('; ');
      const sources = Object.entries(breakdown.sources).map(([src, count]) => `${src}: ${count}`).join('; ');
      lines.push([
        type.charAt(0).toUpperCase() + type.slice(1),
        breakdown.count,
        breakdown.traceable,
        breakdown.nonTraceable,
        this.escapeCsv(categories),
        this.escapeCsv(sources)
      ].join(','));
    });
    lines.push(''); // Empty line

    // All Entities - Comprehensive Data
    const entityHeaders = [
      'Entity ID',
      'Type',
      'Category',
      'Node ID',
      'Node Title',
      'Source',
      'Is Traceable',
      'Primary Value',
      'Summary',
      'Timestamp',
      'Display Data'
    ];

    if (options.includeRawData) {
      entityHeaders.push('Raw Data');
    }

    lines.push('ALL ENTITIES');
    lines.push(entityHeaders.join(','));
    
    data.nodes.forEach(node => {
      node.entities.forEach(entity => {
        const displayDataStr = Object.entries(entity.displayData)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        
        const row = [
          entity.mnEntityId || '',
          entity.type,
          entity.category || '',
          node.id,
          this.escapeCsv(node.title),
          entity.source,
          entity.isTraceable ? 'Yes' : 'No',
          this.escapeCsv(entity.primaryValue),
          this.escapeCsv(entity.summary),
          new Date(entity.timestamp).toISOString(),
          this.escapeCsv(displayDataStr)
        ];

        if (options.includeRawData) {
          row.push(this.escapeCsv(entity.rawData ? JSON.stringify(entity.rawData) : ''));
        }
        
        lines.push(row.join(','));
      });
    });

    return lines.join('\n');
  }


  private escapeCsv(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

export const csvExporter = new CsvExporter();
