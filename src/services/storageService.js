import { supabase } from "../core/supabaseClient";

const BUCKET_EVIDENCIAS = "evidencias";

/**
 * Sube un archivo a Supabase Storage (bucket: evidencias).
 * Retorna la URL pública del archivo subido.
 */
export const uploadFile = async (bucket, file) => {
  const bucketFinal = bucket || BUCKET_EVIDENCIAS;
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketFinal)
    .upload(fileName, file);

  if (error) {
    throw new Error(`Error subiendo archivo: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketFinal)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

/**
 * Sube una imagen de evidencia/justificación al bucket evidencias.
 */
export const uploadEvidencia = async (file) => {
  return uploadFile(BUCKET_EVIDENCIAS, file);
};
