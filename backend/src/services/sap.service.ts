import { HttpError } from '../errors/httpError.js';

const MOCK_FACTURAS = [
  {
    sapDocId: 'SAP-100001',
    nitProveedor: '900.123.456-7',
    razonSocial: 'PROVEEDOR TECNOLOGICO S.A.S',
    numeroFactura: 'FE-1029',
    fechaEmision: '2023-10-15',
    subtotal: 840336,
    iva: 159664,
    amount: 1000000,
    description: 'Compra de equipos de cómputo',
    currency: 'COP',
  },
  {
    sapDocId: 'SAP-100002',
    nitProveedor: '800.987.654-3',
    razonSocial: 'SERVICIOS GENERALES LTDA',
    numeroFactura: 'FE-2045',
    fechaEmision: '2023-10-15',
    subtotal: 420168,
    iva: 79832,
    amount: 500000,
    description: 'Mantenimiento de oficinas',
    currency: 'COP',
  },
  {
    sapDocId: 'SAP-100003',
    nitProveedor: '900.123.456-7',
    razonSocial: 'PROVEEDOR TECNOLOGICO S.A.S',
    numeroFactura: 'FE-1030',
    fechaEmision: '2023-11-01',
    subtotal: 1680672,
    iva: 319328,
    amount: 2000000,
    description: 'Licencias de software',
    currency: 'COP',
  },
  {
    sapDocId: 'SAP-100004',
    nitProveedor: '901.234.567-8',
    razonSocial: 'ASESORIAS EMPRESARIALES SAS',
    numeroFactura: 'FE-3001',
    fechaEmision: '2023-11-01',
    subtotal: 1260504,
    iva: 239496,
    amount: 1500000,
    description: 'Consultoría financiera',
    currency: 'COP',
  }
];

export const SapService = {
  /**
   * Simula buscar facturas electrónicas de SAP por NIT de proveedor y/o fecha de emisión
   */
  async searchFacturas(nit?: string, fechaEmision?: string) {
    let result = MOCK_FACTURAS;
    if (nit) {
      result = result.filter(f => f.nitProveedor.includes(nit));
    }
    if (fechaEmision) {
      result = result.filter(f => f.fechaEmision === fechaEmision);
    }
    return result;
  }
};
