import client from './client';

export const searchSapFactura = async (nit: string) => {
  const { data } = await client.get(`/api/v1/sap/facturas`, { params: { nit } });
  return data.data;
};
