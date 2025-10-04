// Excel (XLSX) export functionality

import * as XLSX from 'xlsx';
import type { ExportData, ExportOptions, ExportResult } from '../types/exportTypes';

export class XlsxExporter {
  async export(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Create multiple sheets for comprehensive data export
      this.createOverviewSheet(workbook, data);
      this.createEntitiesSheet(workbook, data, options);
      this.createNodesSheet(workbook, data);
      this.createSummarySheet(workbook, data);
      this.createEntityBreakdownSheet(workbook, data);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        type: 'array', 
        bookType: 'xlsx',
        compression: true
      });
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
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

  /**
   * Create Overview sheet with session summary and key metrics
   */
  private createOverviewSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const overviewData = [
      ['MNUDA Session Export', ''],
      ['Generated:', new Date().toLocaleString()],
      ['', ''],
      ['SESSION INFORMATION', ''],
      ['Session Name:', data.session.name],
      ['Session ID:', data.session.id],
      ['Created:', new Date(data.session.createdAt).toLocaleString()],
      ['Last Accessed:', new Date(data.session.lastAccessed).toLocaleString()],
      ['Total Nodes:', data.session.nodeCount],
      ['Total Entities:', data.session.entityCount],
      ['', ''],
      ['ENTITY BREAKDOWN', ''],
      ['Addresses:', data.summary.entityCounts.addresses],
      ['Persons:', data.summary.entityCounts.persons],
      ['Properties:', data.summary.entityCounts.properties],
      ['Phones:', data.summary.entityCounts.phones],
      ['Emails:', data.summary.entityCounts.emails],
      ['Images:', data.summary.entityCounts.images],
      ['', ''],
      ['NODE BREAKDOWN', ''],
      ...data.summary.breakdown.byNode.map(node => [
        `${node.nodeTitle} (${node.nodeType})`,
        `${node.entityCount} entities`
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(overviewData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 },
      { width: 30 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Overview');
  }

  /**
   * Create comprehensive Entities sheet with all entity data
   */
  private createEntitiesSheet(workbook: XLSX.WorkBook, data: ExportData, options: ExportOptions): void {
    const headers = [
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
      headers.push('Raw Data');
    }

    const entityData = [headers];

    data.nodes.forEach(node => {
      node.entities.forEach(entity => {
        const row = [
          entity.mnEntityId || '',
          entity.type,
          entity.category || '',
          node.id,
          node.title,
          entity.source,
          entity.isTraceable ? 'Yes' : 'No',
          entity.primaryValue,
          entity.summary,
          new Date(entity.timestamp).toLocaleString(),
          this.formatDisplayData(entity.displayData)
        ];

        if (options.includeRawData) {
          row.push(entity.rawData ? JSON.stringify(entity.rawData, null, 2) : '');
        }

        entityData.push(row);
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(entityData);
    
    // Set column widths for better readability
    worksheet['!cols'] = [
      { width: 20 }, // Entity ID
      { width: 12 }, // Type
      { width: 15 }, // Category
      { width: 20 }, // Node ID
      { width: 25 }, // Node Title
      { width: 15 }, // Source
      { width: 12 }, // Is Traceable
      { width: 30 }, // Primary Value
      { width: 40 }, // Summary
      { width: 20 }, // Timestamp
      { width: 50 }, // Display Data
      ...(options.includeRawData ? [{ width: 60 }] : []) // Raw Data
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entities');
  }

  /**
   * Create Nodes sheet with node information and metadata
   */
  private createNodesSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const headers = [
      'Node ID',
      'Type',
      'Title',
      'Created',
      'Entity Count',
      'API Name',
      'Status',
      'Has Completed',
      'Person ID',
      'Clicked Entity ID',
      'Address'
    ];

    const nodeData = [headers];

    data.nodes.forEach(node => {
      const address = node.metadata.address 
        ? `${node.metadata.address.street || ''}, ${node.metadata.address.city || ''}, ${node.metadata.address.state || ''} ${node.metadata.address.zip || ''}`.replace(/^,\s*|,\s*$/g, '')
        : '';

      nodeData.push([
        node.id,
        node.type,
        node.title,
        new Date(node.timestamp).toLocaleString(),
        String(node.entityCount),
        node.metadata.apiName || '',
        node.metadata.status || '',
        node.metadata.hasCompleted ? 'Yes' : 'No',
        node.metadata.personId || '',
        node.metadata.clickedEntityId || '',
        address
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(nodeData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 20 }, // Node ID
      { width: 12 }, // Type
      { width: 25 }, // Title
      { width: 20 }, // Created
      { width: 12 }, // Entity Count
      { width: 15 }, // API Name
      { width: 12 }, // Status
      { width: 12 }, // Has Completed
      { width: 20 }, // Person ID
      { width: 20 }, // Clicked Entity ID
      { width: 40 }  // Address
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nodes');
  }

  /**
   * Create Summary sheet with detailed analytics
   */
  private createSummarySheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const summaryData = [
      ['SESSION ANALYTICS', ''],
      ['', ''],
      ['ENTITY TYPE BREAKDOWN', ''],
      ['Type', 'Count', 'Percentage'],
      ...Object.entries(data.summary.entityCounts).map(([type, count]) => [
        type.charAt(0).toUpperCase() + type.slice(1),
        count,
        `${((count / data.summary.totalEntities) * 100).toFixed(1)}%`
      ]),
      ['', ''],
      ['SOURCE BREAKDOWN', ''],
      ['Source', 'Count'],
      ...Object.entries(data.summary.breakdown.bySource).map(([source, count]) => [
        source,
        count
      ]),
      ['', ''],
      ['TRACEABILITY BREAKDOWN', ''],
      ['Traceable', data.summary.breakdown.byTraceability.traceable],
      ['Non-Traceable', data.summary.breakdown.byTraceability.nonTraceable],
      ['', ''],
      ['NODE PERFORMANCE', ''],
      ['Node Title', 'Type', 'Entity Count', 'Entity Types'],
      ...data.summary.breakdown.byNode.map(node => [
        node.nodeTitle,
        node.nodeType,
        node.entityCount,
        Object.entries(node.entityTypes).map(([type, count]) => `${type}: ${count}`).join(', ')
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 50 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
  }

  /**
   * Create Entity Breakdown sheet with detailed entity type analysis
   */
  private createEntityBreakdownSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const breakdownData = [
      ['DETAILED ENTITY BREAKDOWN', ''],
      ['', ''],
      ['BY ENTITY TYPE', ''],
      ['Type', 'Count', 'Categories', 'Sources', 'Traceable', 'Non-Traceable'],
      ...Object.entries(data.summary.breakdown.byEntityType).map(([type, details]) => [
        type.charAt(0).toUpperCase() + type.slice(1),
        details.count,
        Object.entries(details.categories).map(([cat, count]) => `${cat}: ${count}`).join(', '),
        Object.entries(details.sources).map(([src, count]) => `${src}: ${count}`).join(', '),
        details.traceable,
        details.nonTraceable
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(breakdownData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // Type
      { width: 10 }, // Count
      { width: 40 }, // Categories
      { width: 40 }, // Sources
      { width: 12 }, // Traceable
      { width: 15 }  // Non-Traceable
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entity Breakdown');
  }

  /**
   * Format display data for Excel readability
   */
  private formatDisplayData(displayData: Record<string, string>): string {
    return Object.entries(displayData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }
}

export const xlsxExporter = new XlsxExporter();
