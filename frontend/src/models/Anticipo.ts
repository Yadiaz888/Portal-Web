export interface Anticipo {
  id: string;
  nSolicitud: string;
  concepto: string;
  anticipoAprobado: number;
  fechaSolicitud: string;
  estadoSolicitud: 'Creado' | 'Enviado a Aprobacion' | 'Aprobado Jefe' | 'Aprobado Contabilidad' | 'En validacion de pago' | 'Pagado' | 'Rechazado' | 'Cancelado';
  solicitante?: string;
}
