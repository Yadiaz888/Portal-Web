import client from './client';
import { Legalizacion } from '../models/Legalizacion';
import { Gasto, FichaLiquidacion } from '../models/Gasto';

const mapStatusToFrontend = (status: string): Legalizacion['estadoLegalizacion'] => {
  switch (status) {
    case 'PENDING': return 'Creado';
    case 'APPROVED_MANAGER': return 'Aprobado Jefe';
    case 'APPROVED_ACCOUNTANT': return 'Aprobado Contabilidad';
    case 'COMPLETED': return 'En validacion de pago';
    case 'PAID': return 'Pagado';
    case 'REJECTED': return 'Rechazado';
    case 'CANCELLED': return 'Cancelado';
    default: return status as Legalizacion['estadoLegalizacion'];
  }
};

const mapToFrontend = (data: any): Legalizacion => ({
  id: data.id.toString(),
  nSolicitud: `N ${data.id}`,
  concepto: data.description || 'Legalizacion',
  monto: data.amount,
  fechaSolicitud: new Date(data.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  estadoLegalizacion: mapStatusToFrontend(data.status),
  solicitante: data.createdBy?.name || data.createdBy?.email || 'Sin solicitante',
});

export const getLegalizaciones = async (): Promise<Legalizacion[]> => {
  const response = await client.get<any[]>('/api/v1/legalizaciones');
  return response.data.map(mapToFrontend);
};

export const updateLegalizacion = async (id: string, data: Partial<Legalizacion>): Promise<Legalizacion> => {
  if (!data.estadoLegalizacion) {
    throw new Error('No es posible actualizar, accion no reconocida por el backend.');
  }

  const actionByStatus: Partial<Record<Legalizacion['estadoLegalizacion'], string>> = {
    'Aprobado Jefe': 'approve',
    'Aprobado Contabilidad': 'approve-accountant',
    'En validacion de pago': 'complete',
    'Pagado': 'pay',
    'Rechazado': 'reject',
    'Cancelado': 'cancel',
  };

  const action = actionByStatus[data.estadoLegalizacion];
  if (!action && data.estadoLegalizacion === 'Creado') {
    const response = await client.get<any>(`/api/v1/legalizaciones/${id}`);
    return mapToFrontend(response.data);
  }

  if (!action) {
    throw new Error('No es posible actualizar, accion no reconocida por el backend.');
  }

  try {
    const response = await client.patch<any>(`/api/v1/legalizaciones/${id}/${action}`);
    return mapToFrontend(response.data);
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

export const deleteLegalizacion = async (id: string): Promise<void> => {
  try {
    await client.delete(`/api/v1/legalizaciones/${id}`);
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message);
  }
};

export const getGastosBySolicitud = async (id: string): Promise<Gasto[]> => {
  const response = await client.get<any[]>(`/api/v1/gastos?legalizacionId=${id}`);
  return response.data.map((g: any) => ({
    id: g.id.toString(),
    tipo: g.tipo === 'FACTURA' ? 'Documento fiscal' : 'Recibo',
    nFactura: g.tipo === 'FACTURA' ? `G-${g.id}` : '-',
    montoTotal: g.amount,
    fechaInicio: new Date(g.createdAt).toISOString().split('T')[0],
    tipoComprobante: g.tipo,
    descripcion: g.description || '',
    tipoGasto: 'General',
  } as Gasto));
};

export const getFichaLiquidacion = async (id: string): Promise<FichaLiquidacion | null> => {
  const response = await client.get<FichaLiquidacion>(`/api/v1/gastos/liquidacion/${id}`);
  return response.data;
};

export const createGasto = async (solicitudId: string, data: Partial<Gasto>): Promise<Gasto> => {
  const backendData = {
    amount: data.montoTotal || 0,
    currency: 'COP',
    description: data.descripcion || '',
    tipo: data.tipo === 'Documento fiscal' ? 'FACTURA' : 'RECIBO',
    legalizacionId: Number(solicitudId),
  };

  const response = await client.post<any>('/api/v1/gastos', backendData);
  return {
    id: response.data.id.toString(),
    tipo: response.data.tipo === 'FACTURA' ? 'Documento fiscal' : 'Recibo',
    nFactura: response.data.tipo === 'FACTURA' ? `G-${response.data.id}` : '-',
    montoTotal: response.data.amount,
    fechaInicio: new Date(response.data.createdAt).toISOString().split('T')[0],
    tipoComprobante: response.data.tipo,
    descripcion: response.data.description || '',
    tipoGasto: 'General',
  } as Gasto;
};

export const updateGasto = async (_solicitudId?: string, id?: string, data?: Partial<Gasto>): Promise<Gasto> => {
  if (!id) throw new Error('ID requerido');
  const backendData: any = {};
  if (data?.montoTotal) backendData.amount = data.montoTotal;
  if (data?.descripcion) backendData.description = data.descripcion;
  if (data?.tipo) backendData.tipo = data.tipo === 'Documento fiscal' ? 'FACTURA' : 'RECIBO';

  const response = await client.patch<any>(`/api/v1/gastos/${id}`, backendData);
  return {
    id: response.data.id.toString(),
    tipo: response.data.tipo === 'FACTURA' ? 'Documento fiscal' : 'Recibo',
    nFactura: response.data.tipo === 'FACTURA' ? `G-${response.data.id}` : '-',
    montoTotal: response.data.amount,
    fechaInicio: new Date(response.data.createdAt).toISOString().split('T')[0],
    tipoComprobante: response.data.tipo,
    descripcion: response.data.description || '',
    tipoGasto: 'General',
  } as Gasto;
};

export const deleteGasto = async (_solicitudId: string, id: string): Promise<void> => {
  await client.delete(`/api/v1/gastos/${id}`);
};

export const updateFichaLiquidacion = async (_id?: string, _data?: Partial<FichaLiquidacion>): Promise<FichaLiquidacion> => {
  throw new Error('La ficha de liquidación se calcula automáticamente en el backend.');
};
