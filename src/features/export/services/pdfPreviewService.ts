// PDF preview service for generating previews without downloading

import jsPDF from 'jspdf';
import type { ExportData } from '../types/exportTypes';
import type { PdfColumnConfig, ColumnConfig } from '../types/columnConfig';
import { DEFAULT_COLUMN_CONFIG, getEnabledColumns, getColumnWidths, getColumnHeaders } from '../types/columnConfig';

export class PdfPreviewService {
  /**
   * Generate a PDF preview and return as blob URL
   */
  async generatePreview(data: ExportData, columnConfig: PdfColumnConfig = DEFAULT_COLUMN_CONFIG): Promise<string> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      const lineHeight = 7;
      const sectionSpacing = 15;

      // Set font
      pdf.setFont('helvetica');

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(29, 209, 245); // #1dd1f5
      pdf.text('MNUDA', margin, yPosition);
      yPosition += lineHeight * 2;

      // Session info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Session: ${data.session.name}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Session summary - compact format
      yPosition = this.addSection(pdf, 'Session Summary', yPosition, pageWidth, margin, lineHeight);
      
      // Create a compact grid layout
      const leftCol = margin;
      const rightCol = margin + (pageWidth - margin * 2) / 2;
      
      // Left column
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Session ID: ${data.session.id}`, leftCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Created: ${new Date(data.session.createdAt).toLocaleString()}`, leftCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Last Accessed: ${new Date(data.session.lastAccessed).toLocaleString()}`, leftCol, yPosition);
      
      // Right column
      yPosition -= lineHeight * 2; // Move back up
      pdf.text(`Total Nodes: ${data.session.nodeCount}`, rightCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Total Entities: ${data.session.entityCount}`, rightCol, yPosition);
      yPosition += lineHeight;
      
      // Entity summary - compact grid
      yPosition += 5;
      pdf.setFontSize(10);
      pdf.text(`Properties: ${data.summary.entityCounts.properties || 0}`, leftCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Addresses: ${data.summary.entityCounts.addresses || 0}`, leftCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Phones: ${data.summary.entityCounts.phones || 0}`, leftCol, yPosition);
      
      yPosition -= lineHeight * 2; // Move back up
      pdf.text(`Emails: ${data.summary.entityCounts.emails || 0}`, rightCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Persons: ${data.summary.entityCounts.persons || 0}`, rightCol, yPosition);
      yPosition += lineHeight;
      pdf.text(`Images: ${data.summary.entityCounts.images || 0}`, rightCol, yPosition);
      
      yPosition += sectionSpacing;

      // Entities table
      yPosition = this.addSection(pdf, 'All Entities', yPosition, pageWidth, margin, lineHeight);
      
      // Get configured columns
      const enabledColumns = getEnabledColumns(columnConfig);
      const tableHeaders = getColumnHeaders(columnConfig);
      const colWidths = getColumnWidths(columnConfig);
      const tableStartX = margin;
      let currentX = tableStartX;
      
      // Header background
      pdf.setFillColor(248, 249, 250); // Light gray
      pdf.rect(tableStartX, yPosition - 3, pageWidth - (margin * 2), lineHeight + 2, 'F');
      
      // Header text
      for (let i = 0; i < tableHeaders.length; i++) {
        pdf.text(tableHeaders[i], currentX, yPosition);
        currentX += colWidths[i];
      }
      yPosition += lineHeight + 2;
      
      // Draw separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(tableStartX, yPosition, pageWidth - margin, yPosition);
      yPosition += 2;
      
      // Add all entities from all nodes
      const allEntities = data.nodes.flatMap(node => 
        node.entities.map(entity => ({
          ...entity,
          nodeTitle: node.title,
          nodeId: node.id
        }))
      );
      
      pdf.setFontSize(8);
      for (const entity of allEntities) {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
          
          // Redraw table header on new page
          pdf.setFontSize(9);
          pdf.setFillColor(248, 249, 250);
          pdf.rect(tableStartX, yPosition - 3, pageWidth - (margin * 2), lineHeight + 2, 'F');
          
          currentX = tableStartX;
          for (let i = 0; i < tableHeaders.length; i++) {
            pdf.text(tableHeaders[i], currentX, yPosition);
            currentX += colWidths[i];
          }
          yPosition += lineHeight + 2;
          
          pdf.setDrawColor(200, 200, 200);
          pdf.line(tableStartX, yPosition, pageWidth - margin, yPosition);
          yPosition += 2;
          
          pdf.setFontSize(8);
        }
        
        // Entity row
        currentX = tableStartX;
        const rowData = this.getEntityRowData(entity, enabledColumns);
        
        for (let i = 0; i < rowData.length; i++) {
          // Truncate text if too long
          let text = String(rowData[i]);
          const maxLength = Math.floor(colWidths[i] / 2); // Rough character limit based on width
          if (text.length > maxLength) {
            text = text.substring(0, maxLength - 3) + '...';
          }
          
          pdf.text(text, currentX, yPosition);
          currentX += colWidths[i];
        }
        yPosition += lineHeight;
      }

      // Convert to blob and create URL
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      return url;
    } catch (error) {
      throw new Error(`Failed to generate PDF preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addSection(pdf: jsPDF, title: string, yPosition: number, pageWidth: number, margin: number, lineHeight: number): number {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, margin, yPosition);
    yPosition += lineHeight + 5;
    
    // Draw line under title
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    
    return yPosition;
  }

  private getEntityRowData(entity: Record<string, unknown>, enabledColumns: ColumnConfig[]): string[] {
    return enabledColumns.map(column => {
      switch (column.id) {
        case 'entityId':
          return String(entity.mnEntityId || 'N/A');
        case 'type':
          return String(entity.type || 'N/A');
        case 'nodeTitle':
          return String(entity.nodeTitle || 'N/A');
        case 'primaryValue':
          return this.getEntityDisplayValue(entity);
        case 'summary':
          return String(entity.summary || 'N/A');
        case 'timestamp':
          return entity.timestamp ? new Date(entity.timestamp as number).toLocaleDateString() : 'N/A';
        case 'source':
          return String(entity.source || 'N/A');
        case 'isTraceable':
          return entity.isTraceable ? 'Yes' : 'No';
        case 'rawData':
          return entity.rawData ? JSON.stringify(entity.rawData) : 'N/A';
        default:
          return 'N/A';
      }
    });
  }

  private getEntityDisplayValue(entity: Record<string, unknown>): string {
    // Use the pre-calculated primary value from the export service
    return (entity.primaryValue as string) || 'Unknown Entity';
  }
}

export const pdfPreviewService = new PdfPreviewService();
