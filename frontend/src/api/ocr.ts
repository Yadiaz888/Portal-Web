import client from './client';

export const extractOcrData = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await client.post('/ocr/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return data.data;
};
