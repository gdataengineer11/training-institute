// server/src/utils/exporters.js
import { Parser as CSVParser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export function sendCSV(res, rows, filename = 'export.csv') {
  const fields = Object.keys(rows[0] || { id: 1 });
  const parser = new CSVParser({ fields });
  const csv = parser.parse(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

export async function sendXLSX(res, rows, filename = 'export.xlsx') {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  const headers = Object.keys(rows[0] || { id: 1 });
  ws.addRow(headers);
  rows.forEach(r => ws.addRow(headers.map(h => r[h])));
  const buf = await wb.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buf));
}

export function sendPDF(res, rows, filename = 'export.pdf') {
  const doc = new PDFDocument({ margin: 32, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.fontSize(16).text('Export', { underline: true });
  doc.moveDown();
  const headers = Object.keys(rows[0] || { id: 1 });
  doc.fontSize(10).text(headers.join(' | '));
  doc.moveDown(0.5);
  rows.forEach(r => doc.text(headers.map(h => (r[h] ?? '')).join(' | ')));
  doc.end();
}
