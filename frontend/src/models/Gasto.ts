export type TipoDocumento = 'Documento fiscal' | 'Recibo';

export interface GastoFiscal {
  id: string;
  tipo: 'Documento fiscal';
  razonSocial: string;
  nFactura: string;
  tipoGasto: string;
  montoTotal: number;
  fechaInicio: string;
  tipoComprobante: string;
  descripcion: string;
  archivoUrl?: string;
}

export interface GastoRecibo {
  id: string;
  tipo: 'Recibo';
  nFactura: string;
  montoTotal: number;
  fechaInicio: string;
  tipoComprobante: string;
  descripcion: string;
  archivoUrl?: string;
}

export type Gasto = GastoFiscal | GastoRecibo;

export interface DetalleFacturaFicha {
  n: number;
  fechaGasto: string;
  concepto: string;
  proveedor: string;
  nFactura: string;
  valor: number;
}

export interface FichaLiquidacion {
  anticipoAprobado: number;
  gastosLiquidados: number;
  saldo: number;
  detalleFacturas: DetalleFacturaFicha[];
}
