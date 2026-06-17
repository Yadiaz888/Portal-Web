import client from './client';

export interface GastoArchivo {
  id: number;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt?: string;
}

export const uploadGastoArchivo = async (gastoId: string | number, file: File): Promise<GastoArchivo> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post<GastoArchivo>(
    `/api/v1/gastos/${gastoId}/archivos`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const listGastoArchivos = async (gastoId: string | number): Promise<GastoArchivo[]> => {
  const response = await client.get<GastoArchivo[]>(`/api/v1/gastos/${gastoId}/archivos`);
  return response.data;
};

export const deleteGastoArchivo = async (gastoId: string | number, archivoId: number): Promise<void> => {
  await client.delete(`/api/v1/gastos/${gastoId}/archivos/${archivoId}`);
};

export const getGastoArchivoBlobUrl = async (gastoId: string | number, archivoId: number): Promise<string> => {
  const { data } = await client.get(
    `/api/v1/gastos/${gastoId}/archivos/${archivoId}/download`,
    { responseType: 'arraybuffer' },
  );
  const blob = new Blob([data], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};
