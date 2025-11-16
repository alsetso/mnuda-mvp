import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';

interface ExportLetterOptions {
  subject?: string;
  content: string;
  bureau: string;
  letterType: 'sent' | 'received';
  sentAt?: string;
  receivedAt?: string;
}

export async function exportLetterToPDF(options: ExportLetterOptions): Promise<void> {
  const { subject, content, bureau, letterType, sentAt, receivedAt } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const bureauName = bureau.charAt(0).toUpperCase() + bureau.slice(1);
  pdf.text(`${bureauName} - ${letterType === 'sent' ? 'Sent' : 'Received'} Letter`, margin, yPosition);
  yPosition += 10;

  // Subject
  if (subject) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject:', margin, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    const subjectLines = pdf.splitTextToSize(subject, maxWidth);
    pdf.text(subjectLines, margin, yPosition);
    yPosition += subjectLines.length * 5 + 5;
  }

  // Dates
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  if (sentAt) {
    pdf.text(`Sent: ${new Date(sentAt).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }
  if (receivedAt) {
    pdf.text(`Received: ${new Date(receivedAt).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 5;

  // Content - Convert HTML to plain text for PDF
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = DOMPurify.sanitize(content);
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const contentLines = pdf.splitTextToSize(plainText, maxWidth);

  // Handle page breaks
  for (let i = 0; i < contentLines.length; i++) {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(contentLines[i], margin, yPosition);
    yPosition += 6;
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `credit-letter-${bureau}-${dateStr}.pdf`;

  pdf.save(filename);
}

