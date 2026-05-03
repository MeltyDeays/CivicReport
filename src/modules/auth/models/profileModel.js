import { supabase } from "../../../core/supabaseClient";

export async function fetchProfileByUserId(usuarioId) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id,nombre_completo,rol,id_entidad")
    .eq("id", usuarioId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

