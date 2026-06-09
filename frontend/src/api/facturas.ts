import client from './client';
import { Factura } from '../models/Factura';

const mapStatusToFrontend = (status: string): Factura['estadoLegalizacion'] => {
  switch (status) {
    case 'PENDING': return 'Creada';
    case 'APPROVED_MANAGER': return 'Aprobado Jefe';
    case 'APPROVED_ACCOUNTANT': return 'Aprobado Contabilidad';
    case 'COMPLETED': return 'En validacion de pago';
    case 'PAID': return 'Pagada';
    case 'REJECTED': return 'Rechazado';
    case 'CANCELLED': return 'Cancelado';
    default: return status as Factura['estadoLegalizacion'];
  }
};

const mapToFrontend = (data: any): Factura => ({
  id: data.id.toString(),
  nFactura: data.invoiceNumber || `N ${data.id}`,
  tipoGasto: data.description || 'Otros',
  monto: data.amount,
  fechaSolicitud: new Date(data.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  estadoLegalizacion: mapStatusToFrontend(data.status),
  tipoProveedor: data.vendor ? 'Proveedor Extranjero' : 'Caja Menor',
  descripcion: data.description,
  solicitante: data.createdBy?.name || data.createdBy?.email || 'Sin solicitante',
});

export const getFacturas = async (): Promise<Factura[]> => {
  const response = await client.get<any[]>('/api/v1/facturas');
  return response.data.map(mapToFrontend);
};

export const createFactura = async (data: Partial<Factura>): Promise<Factura> => {
  const backendData = {
    amount: data.monto || 0,
    currency: 'COP',
    description: data.descripcion || data.tipoGasto || '',
    vendor: data.tipoProveedor || '',
    invoiceNumber: data.nFactura || '',
  };

  const response = await client.post<any>('/api/v1/facturas', backendData);
  return mapToFrontend(response.data);
};

export const updateFactura = async (id: string, data: Partial<Factura>): Promise<Factura> => {
  if (!data.estadoLegalizacion) {
    throw new Error('No es posible actualizar, accion no reconocida por el backend.');
  }

  const actionByStatus: Partial<Record<Factura['estadoLegalizacion'], string>> = {
    'Aprobado Jefe': 'approve',
    'Aprobado Contabilidad': 'approve-accountant',
    'En validacion de pago': 'complete',
    'Pagada': 'pay',
    'Rechazado': 'reject',
    'Cancelado': 'cancel',
  };

  const action = actionByStatus[data.estadoLegalizacion];
  if (!action && data.estadoLegalizacion === 'Creada') {
    const response = await client.get<any>(`/api/v1/facturas/${id}`);
    return mapToFrontend(response.data);
  }

  if (!action) {
    throw new Error('No es posible actualizar, accion no reconocida por el backend.');
  }

  try {
    const response = await client.patch<any>(`/api/v1/facturas/${id}/${action}`);
    return mapToFrontend(response.data);
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

export const deleteFactura = async (id: string): Promise<void> => {
  try {
    await client.delete(`/api/v1/facturas/${id}`);
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message);
  }
};
