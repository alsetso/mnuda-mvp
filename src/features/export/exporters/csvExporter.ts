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
    
    // Session header
    lines.push('Session Information');
    lines.push(`Session Name,${this.escapeCsv(data.session.name)}`);
    lines.push(`Created,${new Date(data.session.createdAt).toLocaleString()}`);
    lines.push(`Last Accessed,${new Date(data.session.lastAccessed).toLocaleString()}`);
    lines.push(`Total Nodes,${data.session.nodeCount}`);
    lines.push(`Total Entities,${data.session.entityCount}`);
    lines.push(`Location Tracking,${data.session.metadata.locationTrackingActive ? 'Active' : 'Inactive'}`);
    lines.push(''); // Empty line

    // Entity summary
    lines.push('Entity Summary');
    lines.push('Type,Count');
    lines.push(`Addresses,${data.summary.entityCounts.addresses}`);
    lines.push(`Persons,${data.summary.entityCounts.persons}`);
    lines.push(`Properties,${data.summary.entityCounts.properties}`);
    lines.push(`Phones,${data.summary.entityCounts.phones}`);
    lines.push(`Emails,${data.summary.entityCounts.emails}`);
    lines.push(`Images,${data.summary.entityCounts.images}`);
    lines.push(''); // Empty line

    // Detailed breakdown
    lines.push('Entity Breakdown by Type');
    lines.push('Entity Type,Total Count,Traceable,Non-Traceable');
    Object.entries(data.summary.breakdown.byEntityType).forEach(([type, breakdown]) => {
      lines.push(`${type},${breakdown.count},${breakdown.traceable},${breakdown.nonTraceable}`);
    });
    lines.push(''); // Empty line

    // All entities - using pre-structured data
    lines.push('All Entities');
    lines.push('Entity ID,Type,Category,Node ID,Node Title,Source,Is Traceable,Primary Value,Summary,Display Data');
    
    data.nodes.forEach(node => {
      node.entities.forEach(entity => {
        const displayDataStr = options.includeRawData && entity.rawData
          ? JSON.stringify(entity.rawData).replace(/"/g, '""')
          : Object.entries(entity.displayData).map(([key, value]) => `${key}: ${value}`).join('; ');
        
        lines.push([
          entity.mnEntityId,
          entity.type,
          entity.category,
          node.id,
          this.escapeCsv(node.title),
          entity.source,
          entity.isTraceable ? 'Yes' : 'No',
          this.escapeCsv(entity.primaryValue),
          this.escapeCsv(entity.summary),
          this.escapeCsv(displayDataStr)
        ].join(','));
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
