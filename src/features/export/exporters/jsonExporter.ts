// JSON export functionality

import type { ExportData, ExportOptions, ExportResult } from '../types/exportTypes';

export class JsonExporter {
  async export(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      const jsonContent = this.generateJson(data, options);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      
      return {
        success: true,
        filename: '',
        data: blob
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'JSON export failed'
      };
    }
  }

  private generateJson(data: ExportData, options: ExportOptions): string {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        includeRawData: options.includeRawData || false,
        includeMetadata: options.includeMetadata || true
      },
      session: data.session,
      summary: data.summary,
      nodes: data.nodes.map(node => ({
        ...node,
        entities: node.entities.map(entity => ({
          ...entity,
          data: options.includeRawData ? entity.rawData : this.getEntitySummary(entity)
        }))
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  private getEntitySummary(entity: Record<string, unknown>): Record<string, unknown> {
    const summary: Record<string, unknown> = {
      type: entity.type,
      category: entity.category,
      primaryValue: entity.primaryValue,
      summary: entity.summary
    };

    // Add display data if available
    if (entity.displayData) {
      Object.assign(summary, entity.displayData);
    }

    return summary;
  }
}

export const jsonExporter = new JsonExporter();
