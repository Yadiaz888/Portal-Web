import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Small placeholder base64 PDF (real content would be much larger)
const PDF_PLACEHOLDER = 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9MZW5ndGggMjc0L0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCvkMlAwUDC1NNEzMlcocU0uLUpVslIqS80rKU4tKU0tBgA+iwh8CmVuZHN0cmVhbQplbmRvYmoK';

// Small placeholder base64 XML
const XML_PLACEHOLDER = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPEludm9pY2UgeG1sbnM9InVybjpvYXNpczpuYW1lczpzcGVjaWZpY2F0aW9uOnVibDpzY2hlbWE6eHNkOkludm9pY2UtMiI+CiAgPElEPkZWMTQwMjU8L0lEPgogIDxJc3N1ZURhdGU+MjAyNC0wMS0xNTwvSXNzdWVEYXRlPgo8L0ludm9pY2U+';

const SAP_FACTURAS = [
  {
    globalDocumentId: 'COL-FE-20260603-001',
    countryDocumentId: 'fe6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    date: new Date('2026-06-03T00:00:00.000Z'),
    documentTypeName: 'Factura de Venta',
    seriesNumber: 'FV14025',
    series: 'FV',
    number: '14025',
    documentSenderCode: '8301144002',
    documentSenderName: 'RENTING COLOMBIA S.A.S',
    documentReceiverCode: '9005123451',
    documentReceiverName: 'JUSTTIME S.A.S',
    netAmount: 4621848.74,
    taxAmount: 879151.26,
    totalAmount: 5501000.00,
    currencyType: 'COP',
    pdfBase64: PDF_PLACEHOLDER,
    xmlBase64: XML_PLACEHOLDER,
  },
  {
    globalDocumentId: 'COL-FE-20260605-001',
    countryDocumentId: 'ab1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    date: new Date('2026-06-05T00:00:00.000Z'),
    documentTypeName: 'Factura de Venta',
    seriesNumber: 'SP14025',
    series: 'SP',
    number: '14025',
    documentSenderCode: '8605275461',
    documentSenderName: 'SEGURIDAD EL PENTAGONO LTDA',
    documentReceiverCode: '9005123451',
    documentReceiverName: 'JUSTTIME S.A.S',
    netAmount: 2100840.34,
    taxAmount: 399159.66,
    totalAmount: 2500000.00,
    currencyType: 'COP',
    pdfBase64: PDF_PLACEHOLDER,
    xmlBase64: XML_PLACEHOLDER,
  },
  {
    globalDocumentId: 'COL-FE-20260610-001',
    countryDocumentId: 'cd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    date: new Date('2026-06-10T00:00:00.000Z'),
    documentTypeName: 'Factura de Venta',
    seriesNumber: 'FV14089',
    series: 'FV',
    number: '14089',
    documentSenderCode: '8301144002',
    documentSenderName: 'RENTING COLOMBIA S.A.S',
    documentReceiverCode: '9005123451',
    documentReceiverName: 'JUSTTIME S.A.S',
    netAmount: 3361344.54,
    taxAmount: 638655.46,
    totalAmount: 4000000.00,
    currencyType: 'COP',
    pdfBase64: PDF_PLACEHOLDER,
    xmlBase64: XML_PLACEHOLDER,
  },
  {
    globalDocumentId: 'COL-FE-20260612-001',
    countryDocumentId: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    date: new Date('2026-06-12T00:00:00.000Z'),
    documentTypeName: 'Factura de Venta',
    seriesNumber: 'SP14102',
    series: 'SP',
    number: '14102',
    documentSenderCode: '8605275461',
    documentSenderName: 'SEGURIDAD EL PENTAGONO LTDA',
    documentReceiverCode: '9005123451',
    documentReceiverName: 'JUSTTIME S.A.S',
    netAmount: 1680672.27,
    taxAmount: 319327.73,
    totalAmount: 2000000.00,
    currencyType: 'COP',
    pdfBase64: PDF_PLACEHOLDER,
    xmlBase64: XML_PLACEHOLDER,
  },
  {
    globalDocumentId: 'COL-FE-20260615-001',
    countryDocumentId: '9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
    date: new Date('2026-06-15T00:00:00.000Z'),
    documentTypeName: 'Factura de Venta',
    seriesNumber: 'TI00201',
    series: 'TI',
    number: '00201',
    documentSenderCode: '9014567895',
    documentSenderName: 'TECNOLOGIA INTEGRAL S.A.S',
    documentReceiverCode: '9005123451',
    documentReceiverName: 'JUSTTIME S.A.S',
    netAmount: 840336.13,
    taxAmount: 159663.87,
    totalAmount: 1000000.00,
    currencyType: 'COP',
    pdfBase64: PDF_PLACEHOLDER,
    xmlBase64: XML_PLACEHOLDER,
  },
];

async function main() {
  console.log('Seeding SAP Facturas...');

  for (const factura of SAP_FACTURAS) {
    await prisma.sapFactura.upsert({
      where: { globalDocumentId: factura.globalDocumentId },
      update: {},
      create: factura,
    });
  }

  console.log(`✓ ${SAP_FACTURAS.length} facturas SAP insertadas.`);
}

main()
  .catch((err) => {
    console.error('Seed SAP failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
