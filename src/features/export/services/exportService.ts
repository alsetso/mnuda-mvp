// Main export service that coordinates different export formats

import { sessionStorageService, SessionData, NodeData } from '@/features/session/services/sessionStorage';
import { csvExporter } from '../exporters/csvExporter';
import { jsonExporter } from '../exporters/jsonExporter';
import { xlsxExporter } from '../exporters/xlsxExporter';
import { pdfExporter } from '../exporters/pdfExporter';
import type { ExportOptions, ExportData, ExportResult, ExportFormat } from '../types/exportTypes';

interface StructuredEntity {
  mnEntityId: string;
  type: string;
  category: string;
  parentNodeId: string;
  source: string;
  isTraceable: boolean;
  timestamp: number;
  primaryValue: string;
  displayData: Record<string, string>;
  summary: string;
  rawData?: Record<string, unknown>;
}

export class ExportService {
  /**
   * Export current session data in the specified format
   */
  async exportSession(options: ExportOptions): Promise<ExportResult> {
    try {
      // Get current session data
      const currentSession = sessionStorageService.getCurrentSession();
      if (!currentSession) {
        return {
          success: false,
          filename: '',
          error: 'No active session found'
        };
      }

      // Prepare export data
      const exportData = this.prepareExportData(currentSession, options);
      
      // Generate filename if not provided
      const filename = options.filename || this.generateFilename(currentSession.name, options.format);
      
      // Export based on format
      let result: ExportResult;
      switch (options.format) {
        case 'csv':
          result = await csvExporter.export(exportData, options);
          break;
        case 'json':
          result = await jsonExporter.export(exportData, options);
          break;
        case 'xlsx':
          result = await xlsxExporter.export(exportData, options);
          break;
        case 'pdf':
          result = await pdfExporter.export(exportData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      result.filename = filename;
      return result;
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): Array<{ format: ExportFormat; label: string; description: string }> {
    return [
      {
        format: 'csv',
        label: 'CSV',
        description: 'Comma-separated values for spreadsheet applications'
      },
      {
        format: 'json',
        label: 'JSON',
        description: 'Structured data format for developers'
      },
      {
        format: 'xlsx',
        label: 'Excel',
        description: 'Microsoft Excel workbook format'
      },
      {
        format: 'pdf',
        label: 'PDF',
        description: 'Portable document format for reports'
      }
    ];
  }

  /**
   * Prepare comprehensive export data from session - Single source of truth for all data structuring
   */
  private prepareExportData(session: SessionData, options: ExportOptions): ExportData {
    const nodes = sessionStorageService.getNodes();
    const entitySummary = sessionStorageService.getEntitySummary();
    const allEntities = sessionStorageService.getAllEntities();

    // Group entities by node and prepare structured entity data
    const entitiesByNode = new Map<string, StructuredEntity[]>();
    allEntities.forEach(entity => {
      if (!entitiesByNode.has(entity.parentNodeId)) {
        entitiesByNode.set(entity.parentNodeId, []);
      }
      entitiesByNode.get(entity.parentNodeId)!.push(this.structureEntityData(entity, options));
    });

    // Prepare comprehensive nodes data with all necessary information
    const nodesData = nodes.map(node => ({
      id: node.mnNodeId,
      type: node.type,
      title: node.customTitle || this.getDefaultNodeTitle(node),
      timestamp: node.timestamp,
      entityCount: entitiesByNode.get(node.mnNodeId)?.length || 0,
      entities: entitiesByNode.get(node.mnNodeId) || [],
      // Additional node metadata for comprehensive export
      metadata: {
        apiName: node.apiName,
        hasCompleted: node.hasCompleted,
        status: node.status,
        address: node.address,
        personId: node.personId,
        clickedEntityId: node.clickedEntityId
      }
    }));

    // Prepare comprehensive session data
    const sessionData = {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      nodeCount: nodes.length,
      entityCount: entitySummary.total,
      // Additional session metadata
        metadata: {
          locationTrackingActive: session.locationTrackingActive
        }
    };

    // Prepare comprehensive summary with detailed breakdowns
    const summaryData = {
      totalEntities: entitySummary.total,
      entityCounts: entitySummary,
      // Additional summary data for comprehensive export
      breakdown: {
        byNode: nodesData.map(node => ({
          nodeId: node.id,
          nodeTitle: node.title,
          nodeType: node.type,
          entityCount: node.entityCount,
          entityTypes: this.getEntityTypeBreakdown(node.entities)
        })),
        byEntityType: this.getDetailedEntityTypeBreakdown(allEntities),
        bySource: this.getEntitySourceBreakdown(allEntities),
        byTraceability: this.getTraceabilityBreakdown(allEntities)
      }
    };

    return {
      session: sessionData,
      nodes: nodesData,
      summary: summaryData
    };
  }

  /**
   * Structure individual entity data for consistent export formatting
   */
  private structureEntityData(entity: Record<string, unknown>, options: ExportOptions): StructuredEntity {
    const structuredEntity: StructuredEntity = {
      mnEntityId: (entity.mnEntityId as string) || 'N/A',
      type: entity.type as string,
      category: (entity.category as string) || 'N/A',
      parentNodeId: entity.parentNodeId as string,
      source: entity.source as string,
      isTraceable: entity.isTraceable as boolean,
      timestamp: (entity.timestamp as number) || Date.now(),
      // Primary display value for all exporters
      primaryValue: this.getEntityPrimaryValue(entity),
      // Formatted display data for all exporters
      displayData: this.getEntityDisplayData(entity),
      // Raw data (conditionally included)
      rawData: options.includeRawData ? entity.data as Record<string, unknown> : undefined,
      // Summary data for quick reference
      summary: this.getEntitySummary(entity)
    };

    return structuredEntity;
  }

  /**
   * Get primary display value for any entity type
   */
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

  /**
   * Get formatted display data for any entity type
   */
  private getEntityDisplayData(entity: Record<string, unknown>): Record<string, string> {
    const data = entity.data as Record<string, unknown>;
    const displayData: Record<string, string> = {
      type: entity.type as string,
      category: (entity.category as string) || 'N/A',
      source: entity.source as string
    };

    switch (entity.type) {
      case 'person':
        if (data.name) displayData.name = data.name as string;
        if (data.age) displayData.age = String(data.age);
        if (data.lives_in) displayData.livesIn = data.lives_in as string;
        if (data.telephone) displayData.phone = data.telephone as string;
        if (data.born) displayData.born = data.born as string;
        break;
      case 'address':
        if (data.street) displayData.street = data.street as string;
        if (data.city) displayData.city = data.city as string;
        if (data.state) displayData.state = data.state as string;
        if (data.postal) displayData.postal = data.postal as string;
        if (data.county) displayData.county = data.county as string;
        if (data.date_range) displayData.dateRange = data.date_range as string;
        break;
      case 'phone':
        if (data.number) displayData.number = data.number as string;
        if (data.phone_type) displayData.phoneType = data.phone_type as string;
        if (data.provider) displayData.provider = data.provider as string;
        if (data.last_reported) displayData.lastReported = data.last_reported as string;
        break;
      case 'email':
        if (data.email) displayData.email = data.email as string;
        break;
      case 'property':
        if (data.address) displayData.address = data.address as string;
        if (data.beds) displayData.beds = String(data.beds);
        if (data.baths) displayData.baths = String(data.baths);
        if (data.sqft) displayData.sqft = String(data.sqft);
        if (data.estimate) displayData.estimate = `$${(data.estimate as number).toLocaleString()}`;
        break;
      case 'image':
        if (data.caption) displayData.caption = data.caption as string;
        if (data.url) displayData.url = data.url as string;
        break;
    }

    return displayData;
  }

  /**
   * Get entity summary for quick reference
   */
  private getEntitySummary(entity: Record<string, unknown>): string {
    const details: string[] = [];
    
    const data = entity.data as Record<string, unknown>;
    switch (entity.type) {
      case 'person':
        if (data.age) details.push(`Age: ${data.age}`);
        if (data.lives_in) details.push(`Lives in: ${data.lives_in}`);
        if (data.telephone) details.push(`Phone: ${data.telephone}`);
        break;
      case 'address':
        if (data.postal) details.push(`ZIP: ${data.postal}`);
        if (data.county) details.push(`County: ${data.county}`);
        if (data.date_range) details.push(`Date Range: ${data.date_range}`);
        break;
      case 'phone':
        if (data.phone_type) details.push(`Type: ${data.phone_type}`);
        if (data.provider) details.push(`Provider: ${data.provider}`);
        if (data.last_reported) details.push(`Last Reported: ${data.last_reported}`);
        break;
      case 'property':
        if (data.beds) details.push(`Beds: ${data.beds}`);
        if (data.baths) details.push(`Baths: ${data.baths}`);
        if (data.sqft) details.push(`Sq Ft: ${data.sqft}`);
        if (data.estimate) details.push(`Estimate: $${(data.estimate as number).toLocaleString()}`);
        break;
    }
    
    return details.join('; ');
  }

  /**
   * Get entity type breakdown for a node
   */
  private getEntityTypeBreakdown(entities: StructuredEntity[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    entities.forEach(entity => {
      breakdown[entity.type] = (breakdown[entity.type] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get detailed entity type breakdown across all entities
   */
  private getDetailedEntityTypeBreakdown(entities: Record<string, unknown>[]): Record<string, { count: number; categories: Record<string, number>; sources: Record<string, number>; traceable: number; nonTraceable: number }> {
    const breakdown: Record<string, { count: number; categories: Record<string, number>; sources: Record<string, number>; traceable: number; nonTraceable: number }> = {};
    entities.forEach(entity => {
      const entityType = entity.type as string;
      if (!breakdown[entityType]) {
        breakdown[entityType] = {
          count: 0,
          categories: {},
          sources: {},
          traceable: 0,
          nonTraceable: 0
        };
      }
      breakdown[entityType].count++;
      
      // Category breakdown
      const category = (entity.category as string) || 'uncategorized';
      breakdown[entityType].categories[category] = (breakdown[entityType].categories[category] || 0) + 1;
      
      // Source breakdown
      const source = entity.source as string;
      breakdown[entityType].sources[source] = (breakdown[entityType].sources[source] || 0) + 1;
      
      // Traceability breakdown
      if (entity.isTraceable) {
        breakdown[entityType].traceable++;
      } else {
        breakdown[entityType].nonTraceable++;
      }
    });
    return breakdown;
  }

  /**
   * Get entity source breakdown
   */
  private getEntitySourceBreakdown(entities: Record<string, unknown>[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    entities.forEach(entity => {
      const source = entity.source as string;
      breakdown[source] = (breakdown[source] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get traceability breakdown
   */
  private getTraceabilityBreakdown(entities: Record<string, unknown>[]): { traceable: number; nonTraceable: number } {
    let traceable = 0;
    let nonTraceable = 0;
    entities.forEach(entity => {
      if (entity.isTraceable) {
        traceable++;
      } else {
        nonTraceable++;
      }
    });
    return { traceable, nonTraceable };
  }

  /**
   * Generate default node title
   */
  private getDefaultNodeTitle(node: NodeData): string {
    switch (node.type) {
      case 'start':
        return 'Start Node';
      case 'userFound':
        return 'User Location';
      case 'api-result':
        return `${node.apiName || 'API'} Result`;
      case 'people-result':
        return 'Person Details';
      default:
        return 'Unknown Node';
    }
  }

  /**
   * Generate filename for export
   */
  private generateFilename(sessionName: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const cleanName = sessionName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanName}_${timestamp}.${format}`;
  }
}

export const exportService = new ExportService();
