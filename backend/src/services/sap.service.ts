import { SapFacturaRepository, SapFacturaFilters } from '../repositories/sapFactura.repository.js';

export const SapService = {
  async searchFacturas(filters: SapFacturaFilters) {
    return SapFacturaRepository.search(filters);
  },

  async getFacturaConDocumentos(globalDocumentId: string) {
    const factura = await SapFacturaRepository.findByGlobalDocumentId(globalDocumentId);
    if (!factura) return null;
    return factura;
  },

  async getFacturaPdf(globalDocumentId: string) {
    return SapFacturaRepository.findPdfBase64(globalDocumentId);
  },
};
