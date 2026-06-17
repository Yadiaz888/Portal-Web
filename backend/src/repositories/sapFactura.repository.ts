import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SapFacturaFilters {
  nit?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const SapFacturaRepository = {
  async search(filters: SapFacturaFilters) {
    const where: any = {};

    if (filters.nit) {
      where.documentSenderCode = { contains: filters.nit };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
      }
    }

    return prisma.sapFactura.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        globalDocumentId: true,
        date: true,
        documentTypeName: true,
        seriesNumber: true,
        series: true,
        number: true,
        documentSenderCode: true,
        documentSenderName: true,
        documentReceiverCode: true,
        documentReceiverName: true,
        netAmount: true,
        taxAmount: true,
        totalAmount: true,
        currencyType: true,
        // omit base64 fields for list view (only fetch on selection)
      },
    });
  },

  async findByGlobalDocumentId(globalDocumentId: string) {
    return prisma.sapFactura.findUnique({
      where: { globalDocumentId },
    });
  },

  async findPdfBase64(globalDocumentId: string) {
    return prisma.sapFactura.findUnique({
      where: { globalDocumentId },
      select: { pdfBase64: true },
    });
  },
};
