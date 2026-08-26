import { Injectable } from '@nestjs/common';
import { Order } from '../models/order.entity';
import PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import { PassThrough } from 'stream';

@Injectable()
export class PdfService {
  async generateOrderPdf(order: Order): Promise<PassThrough> {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();

    doc.pipe(stream);

    doc.fontSize(25).text('TicketRush', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Orden: ${order.id}`);
    doc.text(`Cliente: ${order.client.name} (${order.client.email})`);
    doc.text(`PIN de Recuperación: ${order.accessPin}`);
    doc.moveDown();

    for (let i = 0; i < order.tickets.length; i++) {
      const ticket = order.tickets[i];
      const eventName = ticket.ticketTier.event.name;

      if (i > 0) doc.addPage();

      doc.fontSize(20).text(eventName, { align: 'center' });
      doc.fontSize(14).text(`Ticket ID: ${ticket.id}`, { align: 'center' });
      doc.text(`Categoría: ${ticket.ticketTier.name}`, { align: 'center' });

      const payload = JSON.stringify({ ticketId: ticket.id, signature: ticket.signature });
      const qrDataUrl = await QRCode.toDataURL(payload);

      doc.image(qrDataUrl, (doc.page.width - 200) / 2, doc.y + 20, { fit: [200, 200] });
    }

    doc.end();
    return stream;
  }
}
