import client from './client';

export const searchSapFactura = async (nit?: string, fechaEmision?: string) => {
  const params: any = {};
  if (nit) params.nit = nit;
  if (fechaEmision) params.fechaEmision = fechaEmision;
  const { data } = await client.get(`/api/v1/sap/facturas`, { params });
  return data.data;
};

export const extractXmlData = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await client.post('/api/v1/sap/xml', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return data.data;
};
