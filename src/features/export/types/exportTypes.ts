// Export types and interfaces

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeRawData?: boolean;
  includeMetadata?: boolean;
  groupByNode?: boolean;
  groupByEntityType?: boolean;
  filename?: string;
}

export interface ExportData {
  session: {
    id: string;
    name: string;
    createdAt: number;
    lastAccessed: number;
    nodeCount: number;
    entityCount: number;
    metadata: {
      locationTrackingActive: boolean;
    };
  };
  nodes: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: number;
    entityCount: number;
    entities: Array<{
      mnEntityId: string;
      type: string;
      category: string;
      parentNodeId: string;
      source: string;
      isTraceable: boolean;
      timestamp: number;
      // Pre-structured data for all exporters
      primaryValue: string;
      displayData: Record<string, string>;
      summary: string;
      rawData?: Record<string, unknown>;
    }>;
    metadata: {
      apiName?: string;
      hasCompleted?: boolean;
      status?: string;
        address?: Record<string, unknown>;
      personId?: string;
      clickedEntityId?: string;
    };
  }>;
  summary: {
    totalEntities: number;
    entityCounts: {
      addresses: number;
      persons: number;
      properties: number;
      phones: number;
      emails: number;
      images: number;
    };
    breakdown: {
      byNode: Array<{
        nodeId: string;
        nodeTitle: string;
        nodeType: string;
        entityCount: number;
        entityTypes: Record<string, number>;
      }>;
      byEntityType: Record<string, {
        count: number;
        categories: Record<string, number>;
        sources: Record<string, number>;
        traceable: number;
        nonTraceable: number;
      }>;
      bySource: Record<string, number>;
      byTraceability: {
        traceable: number;
        nonTraceable: number;
      };
    };
  };
}

export interface ExportResult {
  success: boolean;
  filename: string;
  data?: Blob;
  error?: string;
}
