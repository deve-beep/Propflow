const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * Converts an array of flat objects to a CSV string.
 */
const toCSV = (rows, fields) => {
  if (!rows.length) return '';
  const parser = new Parser({ fields: fields || Object.keys(rows[0]) });
  return parser.parse(rows);
};

/**
 * Streams a simple tabular PDF report directly to the response.
 * Kept intentionally plain (title + table) — this is a data export, not a
 * marketing document, so legibility matters more than styling.
 */
const streamPdfReport = (res, { title, columns, rows, filename }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename || 'report.pdf'}"`);
  doc.pipe(res);

  doc.fontSize(18).text(title, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#666').text(`Generated: ${new Date().toLocaleString('en-IN')}`);
  doc.moveDown(1);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;
  const startX = doc.page.margins.left;
  let y = doc.y;

  const drawRow = (values, isHeader = false) => {
    doc.fontSize(9).fillColor(isHeader ? '#000' : '#333');
    values.forEach((val, i) => {
      doc.text(String(val ?? ''), startX + i * colWidth, y, { width: colWidth - 5, ellipsis: true });
    });
    y += 18;
    if (isHeader) {
      doc
        .moveTo(startX, y - 4)
        .lineTo(startX + pageWidth, y - 4)
        .strokeColor('#ccc')
        .stroke();
    }
  };

  drawRow(columns, true);
  rows.forEach((row) => {
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
      drawRow(columns, true);
    }
    drawRow(columns.map((c) => row[c]));
  });

  doc.end();
};

module.exports = { toCSV, streamPdfReport };
