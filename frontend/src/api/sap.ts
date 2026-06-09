import client from './client';

export const searchSapFactura = async (nit: string) => {
  const { data } = await client.get(`/sap/facturas`, { params: { nit } });
  return data.data;
};
