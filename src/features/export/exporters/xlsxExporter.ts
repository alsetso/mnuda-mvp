// Excel (XLSX) export functionality

import type { ExportData, ExportOptions, ExportResult } from '../types/exportTypes';

export class XlsxExporter {
  async export(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      // For now, we'll create a simple CSV that can be opened in Excel
      // In a full implementation, you'd use a library like 'xlsx' or 'exceljs'
      const csvContent = this.generateExcelCompatibleCsv(data, options);
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      
      return {
        success: true,
        filename: '',
        data: blob
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Excel export failed'
      };
    }
  }

  private generateExcelCompatibleCsv(data: ExportData, options: ExportOptions): string {
    const lines: string[] = [];
    
    // Session Information Sheet
    lines.push('SESSION INFORMATION');
    lines.push('Property,Value');
    lines.push(`Session Name,"${data.session.name}"`);
    lines.push(`Created,"${new Date(data.session.createdAt).toLocaleString()}"`);
    lines.push(`Last Accessed,"${new Date(data.session.lastAccessed).toLocaleString()}"`);
    lines.push(`Total Nodes,${data.session.nodeCount}`);
    lines.push(`Total Entities,${data.session.entityCount}`);
    lines.push(''); // Empty line

    // Entity Summary Sheet
    lines.push('ENTITY SUMMARY');
    lines.push('Entity Type,Count');
    lines.push(`Addresses,${data.summary.entityCounts.addresses}`);
    lines.push(`Persons,${data.summary.entityCounts.persons}`);
    lines.push(`Properties,${data.summary.entityCounts.properties}`);
    lines.push(`Phones,${data.summary.entityCounts.phones}`);
    lines.push(`Emails,${data.summary.entityCounts.emails}`);
    lines.push(`Images,${data.summary.entityCounts.images}`);
    lines.push(''); // Empty line

    // All Entities Sheet
    lines.push('ALL ENTITIES');
    lines.push('Entity ID,Type,Category,Node ID,Node Title,Source,Is Traceable,Primary Value,Details');
    
    data.nodes.forEach(node => {
      node.entities.forEach(entity => {
        const primaryValue = this.getEntityPrimaryValue(entity);
        const details = options.includeRawData 
          ? JSON.stringify(entity.rawData).replace(/"/g, '""')
          : this.getEntityDetails(entity);
        
        lines.push([
          entity.mnEntityId || '',
          entity.type,
          entity.category || '',
          node.id,
          `"${node.title}"`,
          entity.source,
          entity.isTraceable ? 'Yes' : 'No',
          `"${primaryValue}"`,
          `"${details}"`
        ].join(','));
      });
    });

    return lines.join('\n');
  }

  private getEntityPrimaryValue(entity: Record<string, unknown>): string {
    const data = entity.data as Record<string, unknown>;
    switch (entity.type) {
      case 'person':
        return (data.name as string) || 'Unknown Person';
      case 'address':
        return `${(data.street as string) || ''}, ${(data.city as string) || ''}, ${(data.state as string) || ''}`.replace(/^,\s*|,\s*$/g, '');
      case 'phone':
        return (data.number as string) || 'Unknown Phone';
      case 'email':
        return (data.email as string) || 'Unknown Email';
      case 'property':
        return (data.address as string) || 'Unknown Property';
      case 'image':
        return (data.caption as string) || 'Image';
      default:
        return 'Unknown Entity';
    }
  }

  private getEntityDetails(entity: Record<string, unknown>): string {
    // Use the pre-calculated summary from the export service
    return (entity.summary as string) || 'No additional details';
  }
}

export const xlsxExporter = new XlsxExporter();
