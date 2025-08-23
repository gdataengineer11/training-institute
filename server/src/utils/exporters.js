import { Parser as Json2Csv } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import mime from 'mime';

export function sendCSV(res, rows, filename='enrollments.csv') {
  const parser = new Json2Csv();
  const csv = parser.parse(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

export async function sendXLSX(res, rows, filename='enrollments.xlsx') {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Enrollments');
  if (rows.length) ws.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }));
  rows.forEach(r => ws.addRow(r));
  res.setHeader('Content-Type', mime.getType('xlsx') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

export function sendPDF(res, rows, filename='enrollments.pdf') {
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.fontSize(16).text('Enrollments Export', { align: 'center' }).moveDown();
  rows.forEach((r) => doc.fontSize(10).text(JSON.stringify(r)));
  doc.end();
}
