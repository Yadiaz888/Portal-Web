import client from './client';
import { Anticipo } from '../models/Anticipo';

const mapStatusToFrontend = (status: string): Anticipo['estadoSolicitud'] => {
  switch (status) {
    case 'PENDING': return 'Enviado a Aprobacion';
    case 'APPROVED_MANAGER': return 'Aprobado Jefe';
    case 'APPROVED_ACCOUNTANT': return 'Aprobado Contabilidad';
    case 'COMPLETED': return 'En validacion de pago';
    case 'PAID': return 'Pagado';
    case 'REJECTED': return 'Rechazado';
    case 'CANCELLED': return 'Cancelado';
    default: return status as Anticipo['estadoSolicitud'];
  }
};

const mapToFrontend = (data: any): Anticipo => ({
  id: data.id.toString(),
  nSolicitud: `N ${data.id}`,
  concepto: data.description || 'Sin concepto',
  anticipoAprobado: data.amount,
  fechaSolicitud: new Date(data.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  estadoSolicitud: mapStatusToFrontend(data.status),
  solicitante: data.createdBy?.name || data.createdBy?.email || 'Sin solicitante',
});

export const getAnticipos = async (): Promise<Anticipo[]> => {
  const response = await client.get<any[]>('/api/v1/anticipos');
  return response.data.map(mapToFrontend);
};

export const createAnticipo = async (data: Partial<Anticipo>): Promise<Anticipo> => {
  const backendData = {
    amount: data.anticipoAprobado || 0,
    currency: 'COP',
    description: data.concepto || '',
  };

  const response = await client.post<any>('/api/v1/anticipos', backendData);
  return mapToFrontend(response.data);
};

export const updateAnticipo = async (id: string, data: Partial<Anticipo>): Promise<Anticipo> => {
  if (!data.estadoSolicitud) {
    throw new Error('No es posible actualizar, accion no reconocida por el backend.');
  }

  const actionByStatus: Partial<Record<Anticipo['estadoSolicitud'], string>> = {
    'Aprobado Jefe': 'approve',
    'Aprobado Contabilidad': 'approve-accountant',
    'En validacion de pago': 'complete',
    'Pagado': 'pay',
    'Rechazado': 'reject',
    'Cancelado': 'cancel',
  };

  const action = actionByStatus[data.estadoSolicitud];
  if (!action && data.estadoSolicitud === 'Enviado a Aprobacion') {
    const response = await client.get<any>(`/api/v1/anticipos/${id}`);
    return mapToFrontend(response.data);
  }

  if (!action) {
    throw new Error('No es posible actualizar, accion no reconocida por el backend.');
  }

  try {
    const response = await client.patch<any>(`/api/v1/anticipos/${id}/${action}`);
    return mapToFrontend(response.data);
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

export const deleteAnticipo = async (id: string): Promise<void> => {
  try {
    await client.delete(`/api/v1/anticipos/${id}`);
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message);
  }
};
