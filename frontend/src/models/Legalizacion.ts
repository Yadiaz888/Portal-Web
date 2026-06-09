export interface Legalizacion {
  id: string;
  nSolicitud: string;
  concepto: string;
  monto: number;
  fechaSolicitud: string;
  estadoLegalizacion: 'Creado' | 'Enviado a Aprobacion' | 'Aprobado Jefe' | 'Aprobado Contabilidad' | 'En validacion de pago' | 'Pagado' | 'Rechazado' | 'Cancelado';
  solicitante?: string;
}
