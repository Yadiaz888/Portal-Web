export interface Factura {
  id: string;
  nFactura: string;
  tipoGasto: string;
  monto: number;
  fechaSolicitud: string;
  estadoLegalizacion: 'Creada' | 'Enviado a Aprobacion' | 'Aprobado Jefe' | 'Aprobado Contabilidad' | 'En validacion de pago' | 'Pagada' | 'Rechazado' | 'Cancelado';
  tipoProveedor?: 'Proveedor Extranjero' | 'Caja Menor';
  tipoComprobante?: string;
  descripcion?: string;
  solicitante?: string;
}
