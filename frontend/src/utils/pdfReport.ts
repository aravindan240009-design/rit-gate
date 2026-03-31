import { Platform } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';

type ReportColumn = { key: string; label: string };
type ReportRow = Record<string, any>;

const escapeHtml = (value: any): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export async function exportStyledPdfReport(params: {
  title: string;
  subtitle?: string;
  /** Section label above the table (e.g. "Exit records") */
  sectionHeading?: string;
  /** First footer line — system branding */
  brandFooterLine?: string;
  generatedAt?: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  filename?: string;
}) {
  const { title, subtitle, columns, rows } = params;
  const sectionHeading = params.sectionHeading ?? 'Report Details';
  const brandFooterLine = params.brandFooterLine ?? 'RIT Gate Management System';
  const timeStamp = params.generatedAt || new Date().toLocaleString();

  const headerCols = columns
    .map((c) => `<th>${escapeHtml(String(c.label).toUpperCase())}</th>`)
    .join('');
  const bodyRows = rows
    .map((row) => {
      const tds = columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #fff; }
          .banner {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #7c3aed 100%);
            padding: 20px 22px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 8px 24px rgba(79, 70, 235, 0.28);
          }
          .title { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px 0; letter-spacing: 0.02em; }
          .sub { color: rgba(255,255,255,0.92); font-size: 12px; margin: 0; line-height: 1.4; }
          .section {
            font-size: 13px;
            color: #4338ca;
            margin: 0 0 12px 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th {
            background: #4338ca;
            color: #fff;
            padding: 10px 8px;
            text-align: left;
            border: 1px solid #3730a3;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 9px;
          }
          td { padding: 9px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
          tr:nth-child(even) td { background: #f3f4f6; }
          tr:nth-child(odd) td { background: #fff; }
          .footer {
            margin-top: 28px;
            padding-top: 14px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
          }
          .footer-brand { font-weight: 700; color: #4f46e5; margin: 0 0 6px 0; font-size: 11px; }
          .footer-ts { margin: 0; }
        </style>
      </head>
      <body>
        <div class="banner">
          <p class="title">${escapeHtml(title)}</p>
          <p class="sub">${escapeHtml(subtitle || '')}</p>
        </div>
        <div class="section">${escapeHtml(sectionHeading)}</div>
        <table>
          <thead><tr>${headerCols}</tr></thead>
          <tbody>${bodyRows || `<tr><td colspan="${columns.length}">No records</td></tr>`}</tbody>
        </table>
        <div class="footer">
          <p class="footer-brand">${escapeHtml(brandFooterLine)}</p>
          <p class="footer-ts">Generated: ${escapeHtml(timeStamp)}</p>
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
    return;
  }

  const safeTitle = (params.filename || title || 'report').replace(/[^a-z0-9-_]/gi, '_');
  const stampedName = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const pdf = await generatePDF({
    html,
    fileName: stampedName.replace(/\.pdf$/i, ''),
    directory: 'Documents',
  });

  if (!pdf.filePath) return '';

  // Copy to public Downloads directory so the file appears in the device's Downloads app
  if (Platform.OS === 'android') {
    try {
      const downloadsDir = RNFS.DownloadDirectoryPath;
      const destPath = `${downloadsDir}/${stampedName}`;
      await RNFS.copyFile(pdf.filePath, destPath);
      // Trigger media scan so file appears immediately in Downloads app
      await RNFS.scanFile(destPath);
      return destPath;
    } catch (copyError) {
      // Fallback to internal path if copy fails
      console.warn('Failed to copy PDF to Downloads:', copyError);
      return `file://${pdf.filePath}`;
    }
  }

  return `file://${pdf.filePath}`;
}
