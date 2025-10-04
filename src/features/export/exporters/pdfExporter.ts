// PDF export functionality

import jsPDF from 'jspdf';
import type { ExportData, ExportResult } from '../types/exportTypes';
import type { PdfColumnConfig, ColumnConfig } from '../types/columnConfig';
import { DEFAULT_COLUMN_CONFIG, getEnabledColumns, getColumnWidths, getColumnHeaders } from '../types/columnConfig';

export class PdfExporter {
  async export(data: ExportData, columnConfig: PdfColumnConfig = DEFAULT_COLUMN_CONFIG): Promise<ExportResult> {
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
      yPosition += 5; // Small spacing
      pdf.setFontSize(10);
      pdf.setTextColor(29, 209, 245); // Brand color
      pdf.text('Entity Breakdown:', leftCol, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      const entityCounts = data.summary.entityCounts;
      
      // First row of entities
      const entityRow1 = `Addresses: ${entityCounts.addresses}  |  Persons: ${entityCounts.persons}  |  Properties: ${entityCounts.properties}`;
      pdf.text(entityRow1, leftCol, yPosition);
      yPosition += lineHeight;
      
      // Second row of entities
      const entityRow2 = `Phones: ${entityCounts.phones}  |  Emails: ${entityCounts.emails}  |  Images: ${entityCounts.images}`;
      pdf.text(entityRow2, leftCol, yPosition);
      yPosition += sectionSpacing;

      // All Entities Table
      yPosition = this.addSection(pdf, 'All Entities', yPosition, pageWidth, margin, lineHeight);
      
      // Get configured columns
      const enabledColumns = getEnabledColumns(columnConfig);
      const tableHeaders = getColumnHeaders(columnConfig);
      const colWidths = getColumnWidths(columnConfig);
      const tableStartX = margin;
      
      // Draw table header
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
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
      
      yPosition += sectionSpacing;

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      
      return {
        success: true,
        filename: '',
        data: pdfBlob
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'PDF export failed'
      };
    }
  }

  private addSection(pdf: jsPDF, title: string, yPosition: number, pageWidth: number, margin: number, lineHeight: number): number {
    // Check if we need a new page
    if (yPosition > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(29, 209, 245); // #1dd1f5
    pdf.text(title, margin, yPosition);
    yPosition += lineHeight;

    // Underline
    pdf.setDrawColor(29, 209, 245);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight * 2;

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

export const pdfExporter = new PdfExporter();
