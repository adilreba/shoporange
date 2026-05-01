/**
 * PDF Generation Utility
 * Lightweight invoice/order PDF creation using pdf-lib
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  companyInfo?: {
    name: string;
    address: string;
    taxOffice?: string;
    taxNumber?: string;
    phone?: string;
    email?: string;
  };
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  // Helper to draw text
  const drawText = (text: string, x: number, yPos: number, options: { size?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
    const size = options.size || 10;
    const f = options.bold ? fontBold : font;
    const color = options.color ? rgb(options.color[0], options.color[1], options.color[2]) : rgb(0.2, 0.2, 0.2);
    page.drawText(text, { x, y: yPos, size, font: f, color });
  };

  // Helper to draw line
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  };

  // === HEADER ===
  drawText(data.companyInfo?.name || 'AtusHome', margin, y, { size: 20, bold: true, color: [0.15, 0.15, 0.15] });
  y -= 22;
  drawText('Ticari Fatura', margin, y, { size: 12, color: [0.4, 0.4, 0.4] });

  // Order info (right side)
  const rightX = width - margin - 150;
  drawText(`Fatura No: ${data.orderId}`, rightX, y + 22, { size: 9 });
  drawText(`Tarih: ${new Date(data.createdAt).toLocaleDateString('tr-TR')}`, rightX, y + 10, { size: 9 });

  y -= 30;
  drawLine(margin, y, width - margin, y);
  y -= 20;

  // === COMPANY INFO ===
  if (data.companyInfo) {
    drawText('SATICI', margin, y, { size: 10, bold: true, color: [0.4, 0.4, 0.4] });
    y -= 14;
    drawText(data.companyInfo.name, margin, y, { size: 10 });
    y -= 12;
    drawText(data.companyInfo.address, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
    y -= 12;
    if (data.companyInfo.taxOffice && data.companyInfo.taxNumber) {
      drawText(`Vergi Dairesi: ${data.companyInfo.taxOffice} / ${data.companyInfo.taxNumber}`, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
      y -= 12;
    }
    if (data.companyInfo.phone) {
      drawText(`Tel: ${data.companyInfo.phone}`, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
      y -= 12;
    }
    y -= 10;
  }

  // === CUSTOMER INFO ===
  drawText('ALICI', margin, y, { size: 10, bold: true, color: [0.4, 0.4, 0.4] });
  y -= 14;
  drawText(data.customerName, margin, y, { size: 10 });
  y -= 12;
  drawText(data.customerEmail, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
  y -= 12;
  if (data.customerPhone) {
    drawText(data.customerPhone, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
    y -= 12;
  }
  drawText(`${data.shippingAddress.street}, ${data.shippingAddress.city} ${data.shippingAddress.postalCode}`, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
  y -= 12;

  y -= 20;
  drawLine(margin, y, width - margin, y);
  y -= 20;

  // === ITEMS TABLE HEADER ===
  const colProduct = margin;
  const colQty = width - margin - 180;
  const colPrice = width - margin - 100;
  const colTotal = width - margin - 20;

  drawText('Ürün', colProduct, y, { size: 9, bold: true, color: [0.4, 0.4, 0.4] });
  drawText('Adet', colQty, y, { size: 9, bold: true, color: [0.4, 0.4, 0.4] });
  drawText('Birim Fiyat', colPrice, y, { size: 9, bold: true, color: [0.4, 0.4, 0.4] });
  drawText('Toplam', colTotal, y, { size: 9, bold: true, color: [0.4, 0.4, 0.4] });
  y -= 10;
  drawLine(margin, y, width - margin, y);
  y -= 14;

  // === ITEMS ===
  for (const item of data.items) {
    drawText(item.name, colProduct, y, { size: 9 });
    drawText(`${item.quantity}`, colQty, y, { size: 9 });
    drawText(`${item.price.toFixed(2)} TL`, colPrice, y, { size: 9 });
    drawText(`${(item.quantity * item.price).toFixed(2)} TL`, colTotal, y, { size: 9 });
    y -= 14;
  }

  y -= 6;
  drawLine(margin, y, width - margin, y);
  y -= 20;

  // === TOTALS ===
  const totalsX = width - margin - 150;
  drawText('Ara Toplam:', totalsX, y, { size: 9, color: [0.4, 0.4, 0.4] });
  drawText(`${data.subtotal.toFixed(2)} TL`, colTotal, y, { size: 9 });
  y -= 14;

  drawText('Kargo:', totalsX, y, { size: 9, color: [0.4, 0.4, 0.4] });
  drawText(`${data.shippingCost.toFixed(2)} TL`, colTotal, y, { size: 9 });
  y -= 14;

  drawText('KDV (%20):', totalsX, y, { size: 9, color: [0.4, 0.4, 0.4] });
  drawText(`${data.taxAmount.toFixed(2)} TL`, colTotal, y, { size: 9 });
  y -= 14;

  drawLine(totalsX - 10, y, width - margin, y);
  y -= 16;

  drawText('GENEL TOPLAM:', totalsX, y, { size: 11, bold: true });
  drawText(`${data.total.toFixed(2)} TL`, colTotal, y, { size: 11, bold: true });
  y -= 20;

  drawText(`Ödeme Yöntemi: ${data.paymentMethod}`, margin, y, { size: 9, color: [0.4, 0.4, 0.4] });
  y -= 30;

  // === FOOTER ===
  drawLine(margin, y, width - margin, y);
  y -= 16;
  drawText('Bu belge elektronik ortamda oluşturulmuş olup imza gerektirmez.', margin, y, { size: 8, color: [0.5, 0.5, 0.5] });
  y -= 12;
  drawText('6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında düzenlenmiştir.', margin, y, { size: 8, color: [0.5, 0.5, 0.5] });

  return await pdfDoc.save();
}
