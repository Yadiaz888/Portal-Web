import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Needs service role key to bypass RLS for uploads from backend

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ No se ha configurado SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. La subida de archivos puede fallar.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export const STORAGE_BUCKET = 'gastos-archivos';

// Initialize bucket if it doesn't exist
export const initStorage = async () => {
  try {
    if (!supabaseUrl || !supabaseKey) return;
    const { data, error } = await supabaseClient.storage.getBucket(STORAGE_BUCKET);
    if (error && error.message.includes('not found')) {
      console.log(`📦 Creando bucket de storage: ${STORAGE_BUCKET}`);
      await supabaseClient.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    }
  } catch (err) {
    console.error('Error inicializando Supabase Storage:', err);
  }
};
