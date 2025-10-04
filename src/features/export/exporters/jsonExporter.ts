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
        generator: 'MNUDA Export Service',
        includeRawData: options.includeRawData || false,
        includeMetadata: options.includeMetadata || true,
        totalNodes: data.session.nodeCount,
        totalEntities: data.session.entityCount
      },
      session: {
        id: data.session.id,
        name: data.session.name,
        createdAt: new Date(data.session.createdAt).toISOString(),
        lastAccessed: new Date(data.session.lastAccessed).toISOString(),
        nodeCount: data.session.nodeCount,
        entityCount: data.session.entityCount,
        metadata: data.session.metadata
      },
      summary: {
        totalEntities: data.summary.totalEntities,
        entityCounts: data.summary.entityCounts,
        breakdown: {
          byNode: data.summary.breakdown.byNode.map(node => ({
            nodeId: node.nodeId,
            nodeTitle: node.nodeTitle,
            nodeType: node.nodeType,
            entityCount: node.entityCount,
            entityTypes: node.entityTypes
          })),
          byEntityType: data.summary.breakdown.byEntityType,
          bySource: data.summary.breakdown.bySource,
          byTraceability: data.summary.breakdown.byTraceability
        }
      },
      nodes: data.nodes.map(node => ({
        id: node.id,
        type: node.type,
        title: node.title,
        timestamp: new Date(node.timestamp).toISOString(),
        entityCount: node.entityCount,
        metadata: {
          apiName: node.metadata.apiName,
          hasCompleted: node.metadata.hasCompleted,
          status: node.metadata.status,
          address: node.metadata.address,
          personId: node.metadata.personId,
          clickedEntityId: node.metadata.clickedEntityId
        },
        entities: node.entities.map(entity => ({
          mnEntityId: entity.mnEntityId,
          type: entity.type,
          category: entity.category,
          parentNodeId: entity.parentNodeId,
          source: entity.source,
          isTraceable: entity.isTraceable,
          timestamp: new Date(entity.timestamp).toISOString(),
          primaryValue: entity.primaryValue,
          displayData: entity.displayData,
          summary: entity.summary,
          ...(options.includeRawData && entity.rawData ? { rawData: entity.rawData } : {})
        }))
      })),
      analytics: {
        entityTypeDistribution: Object.entries(data.summary.entityCounts).map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count,
          percentage: data.summary.totalEntities > 0 ? 
            ((count / data.summary.totalEntities) * 100).toFixed(1) : '0.0'
        })),
        sourceDistribution: Object.entries(data.summary.breakdown.bySource).map(([source, count]) => ({
          source,
          count
        })),
        traceabilityMetrics: {
          total: data.summary.totalEntities,
          traceable: data.summary.breakdown.byTraceability.traceable,
          nonTraceable: data.summary.breakdown.byTraceability.nonTraceable,
          traceabilityRate: data.summary.totalEntities > 0 ? 
            ((data.summary.breakdown.byTraceability.traceable / data.summary.totalEntities) * 100).toFixed(1) : '0.0'
        },
        nodePerformance: data.summary.breakdown.byNode.map(node => ({
          nodeId: node.nodeId,
          nodeTitle: node.nodeTitle,
          nodeType: node.nodeType,
          entityCount: node.entityCount,
          entityTypes: node.entityTypes,
          efficiency: data.summary.totalEntities > 0 ? 
            ((node.entityCount / data.summary.totalEntities) * 100).toFixed(1) : '0.0'
        }))
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

}

export const jsonExporter = new JsonExporter();
