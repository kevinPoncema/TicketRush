import { Injectable } from '@nestjs/common';
import { Order } from '../models/order.entity';
import PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import { PassThrough } from 'stream';

@Injectable()
export class PdfService {

  private async fetchImageAsBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const contentType = response.headers.get('content-type');

      if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  async generateOrderPdf(order: Order): Promise<PassThrough> {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = new PassThrough();

    doc.pipe(stream);

    for (let i = 0; i < order.tickets.length; i++) {
      const ticket = order.tickets[i];
      const event = ticket.ticketTier.event;
      const tenantConfig = event.tenant?.tenantConfig;
      const brandColor = tenantConfig?.brandColor || '#8b5cf6';

      if (i > 0) doc.addPage();

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f9fafb');

      // Ticket Wrapper
      const startX = 50;
      const startY = 80;
      const width = doc.page.width - 100;
      const height = 600;

      // Draw Main Ticket Body with Shadow
      doc.rect(startX + 5, startY + 5, width, height).fill('#e5e7eb'); // shadow
      doc.rect(startX, startY, width, height).fill('#ffffff').stroke('#e5e7eb').lineWidth(1).stroke();

      // Header Area (Brand Color)
      doc.rect(startX, startY, width, 120).fill(brandColor);

      // Header Text
      const tenantName = event.tenant?.name || 'VANTAGE';

      // Load logo if exists and compatible (JPEG/PNG)
      let logoBuffer: Buffer | null = null;
      if (tenantConfig?.logoUrl) {
        logoBuffer = await this.fetchImageAsBuffer(tenantConfig.logoUrl);
      }

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, startX + 20, startY + 20, { fit: [80, 80] });
          doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('ENTRADA', startX + 110, startY + 45, { align: 'left', width: width - 120 });
          doc.fontSize(12).font('Helvetica').text(`Por: ${tenantName}`, startX + 110, startY + 75, { align: 'left', width: width - 120 });
        } catch {
          // Fallback if image still fails rendering
          doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('TICKET DE ENTRADA', startX, startY + 45, { align: 'center', width });
          doc.fontSize(12).font('Helvetica').text(`Organizado por: ${tenantName}`, startX, startY + 80, { align: 'center', width });
        }
      } else {
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('TICKET DE ENTRADA', startX, startY + 45, { align: 'center', width });
        doc.fontSize(12).font('Helvetica').text(`Organizado por: ${tenantName}`, startX, startY + 80, { align: 'center', width });
      }

      // Event Info
      doc.fillColor('#111827').fontSize(28).font('Helvetica-Bold').text(event.name.toUpperCase(), startX, startY + 160, { align: 'center', width });

      // Dashed separator
      doc.moveTo(startX + 20, startY + 220).lineTo(startX + width - 20, startY + 220).dash(5, { space: 5 }).stroke('#d1d5db');
      doc.undash();

      // Ticket Tier & Details
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#6b7280').text('ZONA / CATEGORÍA', startX + 40, startY + 250);
      doc.fontSize(18).fillColor(brandColor).text(ticket.ticketTier.name.toUpperCase(), startX + 40, startY + 270);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#6b7280').text('TITULAR DE LA ORDEN', startX + width / 2, startY + 250);
      doc.fontSize(18).fillColor('#111827').text(order.client.name, startX + width / 2, startY + 270);

      // Dashed separator
      doc.moveTo(startX + 20, startY + 330).lineTo(startX + width - 20, startY + 330).dash(5, { space: 5 }).stroke('#d1d5db');
      doc.undash();

      // QR Code Generation
      const payload = JSON.stringify({ ticketId: ticket.id, signature: ticket.signature });
      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });

      // Render QR
      const qrSize = 180;
      doc.image(qrDataUrl, (doc.page.width - qrSize) / 2, startY + 360, { fit: [qrSize, qrSize] });

      // Ticket ID Footer
      doc.fontSize(10).font('Helvetica').fillColor('#9ca3af').text(`TICKET ID: ${ticket.id.split('-')[0].toUpperCase()}`, startX, startY + 560, { align: 'center', width });

      // Cutout effect (Left and Right semicircles)
      doc.circle(startX, startY + 220, 15).fill('#f9fafb');
      doc.circle(startX + width, startY + 220, 15).fill('#f9fafb');
      doc.circle(startX, startY + 330, 15).fill('#f9fafb');
      doc.circle(startX + width, startY + 330, 15).fill('#f9fafb');
    }

    doc.end();
    return stream;
  }
}
