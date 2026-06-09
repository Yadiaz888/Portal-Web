import client from './client';

export type GastoStatus =
  | 'CREADO'
  | 'ENVIADO_A_JEFE'
  | 'ENVIADO_A_CONTABILIDAD'
  | 'LIQUIDADO'
  | 'RECHAZADO';

export interface GastoItem {
  id: number;
  amount: number;
  currency: string;
  description?: string;
  tipo: 'RECIBO' | 'FACTURA' | 'OTRO';
  origen: 'MANUAL' | 'ELECTRONICA' | 'NO_ELECTRONICA';
  status: GastoStatus;
  legalizacionId: number;
  createdById: number;
  createdBy?: { id: number; name?: string; email: string };
  nitProveedor?: string;
  razonSocial?: string;
  numeroFactura?: string;
  fechaEmision?: string;
  subtotal?: number;
  iva?: number;
  sapDocId?: string;
  ocrConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGastoPayload {
  amount: number;
  currency?: string;
  description?: string;
  tipo: 'RECIBO' | 'FACTURA' | 'OTRO';
  origen?: 'MANUAL' | 'ELECTRONICA' | 'NO_ELECTRONICA';
  legalizacionId: number;
  nitProveedor?: string;
  razonSocial?: string;
  numeroFactura?: string;
  fechaEmision?: string;
  subtotal?: number;
  iva?: number;
  sapDocId?: string;
  ocrConfidence?: number;
}

export interface UpdateGastoPayload {
  amount?: number;
  currency?: string;
  description?: string;
  tipo?: 'RECIBO' | 'FACTURA' | 'OTRO';
  nitProveedor?: string;
  razonSocial?: string;
  numeroFactura?: string;
  fechaEmision?: string;
  subtotal?: number;
  iva?: number;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const getGastos = async (params?: {
  legalizacionId?: number;
  createdById?: number;
  skip?: number;
  take?: number;
}): Promise<GastoItem[]> => {
  const response = await client.get<GastoItem[]>('/api/v1/gastos', { params });
  return response.data;
};

export const getGastoById = async (id: number): Promise<GastoItem> => {
  const response = await client.get<GastoItem>(`/api/v1/gastos/${id}`);
  return response.data;
};

export const createGasto = async (data: CreateGastoPayload): Promise<GastoItem> => {
  const response = await client.post<GastoItem>('/api/v1/gastos', data);
  return response.data;
};

export const updateGasto = async (id: number, data: UpdateGastoPayload): Promise<GastoItem> => {
  const response = await client.patch<GastoItem>(`/api/v1/gastos/${id}`, data);
  return response.data;
};

export const deleteGasto = async (id: number): Promise<void> => {
  await client.delete(`/api/v1/gastos/${id}`);
};

// ─── Transiciones de estado ───────────────────────────────────────────────────

/** CREADO → ENVIADO_A_JEFE (creador / ADMIN) */
export const sendGastoToManager = async (id: number): Promise<GastoItem> => {
  const response = await client.post<GastoItem>(`/api/v1/gastos/${id}/send-to-manager`);
  return response.data;
};

/** ENVIADO_A_JEFE → ENVIADO_A_CONTABILIDAD (MANAGER / ADMIN) */
export const sendGastoToAccountant = async (id: number): Promise<GastoItem> => {
  const response = await client.post<GastoItem>(`/api/v1/gastos/${id}/send-to-accountant`);
  return response.data;
};

/** ENVIADO_A_CONTABILIDAD → LIQUIDADO (ACCOUNTANT / ADMIN) */
export const liquidateGasto = async (id: number): Promise<GastoItem> => {
  const response = await client.post<GastoItem>(`/api/v1/gastos/${id}/liquidate`);
  return response.data;
};

/** Cualquier estado activo → RECHAZADO (ACCOUNTANT / ADMIN) */
export const rejectGasto = async (id: number, reason?: string): Promise<GastoItem> => {
  const response = await client.post<GastoItem>(`/api/v1/gastos/${id}/reject`, { reason });
  return response.data;
};
