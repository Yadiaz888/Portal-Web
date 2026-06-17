import client from './client';

export interface SapSearchParams {
  nit?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const searchSapFactura = async (params: SapSearchParams) => {
  const query: any = {};
  if (params.nit) query.nit = params.nit;
  if (params.dateFrom) query.dateFrom = params.dateFrom;
  if (params.dateTo) query.dateTo = params.dateTo;
  const { data } = await client.get(`/api/v1/sap/facturas`, { params: query });
  return data.data;
};

export const getSapFacturaDocumentos = async (globalDocumentId: string) => {
  const { data } = await client.get(`/api/v1/sap/facturas/${encodeURIComponent(globalDocumentId)}`);
  return data.data;
};

export const getSapFacturaPdfBlobUrl = async (globalDocumentId: string): Promise<string> => {
  const { data } = await client.get(
    `/api/v1/sap/facturas/${encodeURIComponent(globalDocumentId)}/pdf`,
    { responseType: 'arraybuffer' },
  );
  const blob = new Blob([data], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

export const extractXmlData = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/api/v1/sap/xml', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};
