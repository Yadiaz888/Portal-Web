import { GastoItem } from '../api/gastos';
import { formatCurrency } from './formatters';

interface GastoReportLabels {
  status: Record<string, string>;
  tipo: Record<string, string>;
  origen: Record<string, string>;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 36;

const normalizePdfText = (value: unknown): string => {
  const text = value === null || value === undefined || value === '' ? '-' : String(value);
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const escapePdfText = (text: string): string =>
  normalizePdfText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const truncate = (text: unknown, maxLength: number): string => {
  const normalized = normalizePdfText(text);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
};

const textLine = (x: number, y: number, text: string, size = 9, font = 'F1') =>
  `BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET\n`;

const rect = (x: number, y: number, width: number, height: number, fillGray?: number) => {
  const fill = fillGray === undefined ? '' : `${fillGray} g ${x} ${y} ${width} ${height} re f 0 g\n`;
  return `${fill}${x} ${y} ${width} ${height} re S\n`;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const buildPageContent = (
  rows: GastoItem[],
  pageIndex: number,
  totalPages: number,
  totalRows: number,
  totalAmount: number,
  labels: GastoReportLabels,
) => {
  let y = PAGE_HEIGHT - 44;
  let content = '';

  content += textLine(MARGIN_X, y, 'Informe de gastos', 18, 'F2');
  content += textLine(420, y + 2, `Pagina ${pageIndex + 1} de ${totalPages}`, 9);
  y -= 18;
  content += textLine(MARGIN_X, y, `Generado: ${new Date().toLocaleString('es-CO')}`, 9);
  y -= 18;

  if (pageIndex === 0) {
    content += rect(MARGIN_X, y - 26, 523, 34, 0.96);
    content += textLine(MARGIN_X + 10, y - 4, `Registros incluidos: ${totalRows}`, 10, 'F2');
    content += textLine(MARGIN_X + 190, y - 4, `Total reportado: ${formatCurrency(totalAmount)}`, 10, 'F2');
    content += textLine(MARGIN_X + 390, y - 4, 'Fuente: listado General', 10, 'F2');
    y -= 48;
  }

  const columns = [
    { label: 'ID', x: 42 },
    { label: 'Fecha', x: 72 },
    { label: 'Tipo', x: 123 },
    { label: 'Origen', x: 178 },
    { label: 'Estado', x: 252 },
    { label: 'Solicitante', x: 335 },
    { label: 'Monto', x: 462 },
  ];

  content += rect(MARGIN_X, y - 7, 523, 18, 0.92);
  for (const column of columns) {
    content += textLine(column.x, y, column.label, 8, 'F2');
  }
  y -= 22;

  rows.forEach((gasto, index) => {
    if (index % 2 === 0) content += rect(MARGIN_X, y - 5, 523, 33, 0.98);
    content += textLine(42, y + 10, `#${gasto.id}`, 8);
    content += textLine(72, y + 10, formatDate(gasto.createdAt), 8);
    content += textLine(123, y + 10, labels.tipo[gasto.tipo] ?? gasto.tipo, 8);
    content += textLine(178, y + 10, labels.origen[gasto.origen] ?? gasto.origen, 8);
    content += textLine(252, y + 10, labels.status[gasto.status] ?? gasto.status, 8);
    content += textLine(335, y + 10, truncate(gasto.createdBy?.name ?? gasto.createdBy?.email, 18), 8);
    content += textLine(462, y + 10, `${formatCurrency(gasto.amount)} ${gasto.currency}`, 8);

    const proveedor = gasto.razonSocial ? `Proveedor: ${gasto.razonSocial}` : 'Proveedor: -';
    const factura = gasto.numeroFactura ? `Factura: ${gasto.numeroFactura}` : 'Factura: -';
    content += textLine(42, y - 3, truncate(`${proveedor} | ${factura}`, 78), 7);
    content += textLine(42, y - 14, truncate(`Concepto: ${gasto.description ?? '-'}`, 105), 7);
    y -= 37;
  });

  content += textLine(MARGIN_X, 28, 'Portal de gastos - informe generado automaticamente', 8);
  return content;
};

const buildPdf = (pageContents: string[]) => {
  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  const firstPageId = 5;
  const firstContentId = firstPageId + pageContents.length;

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  const pageIds = pageContents.map((_, index) => firstPageId + index);
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  pageContents.forEach((content, index) => {
    const pageId = firstPageId + index;
    const contentId = firstContentId + index;
    objects[pageId] =
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

export const downloadGastosPdfReport = (gastos: GastoItem[], labels: GastoReportLabels) => {
  const rowsPerPage = 17;
  const pages = Math.max(1, Math.ceil(gastos.length / rowsPerPage));
  const totalAmount = gastos.reduce((sum, gasto) => sum + gasto.amount, 0);
  const pageContents = Array.from({ length: pages }, (_, pageIndex) =>
    buildPageContent(
      gastos.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage),
      pageIndex,
      pages,
      gastos.length,
      totalAmount,
      labels,
    ),
  );

  const blob = new Blob([buildPdf(pageContents)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `informe-gastos-${date}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
