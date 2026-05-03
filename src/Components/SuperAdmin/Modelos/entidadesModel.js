import { supabase } from "../../../core/supabaseClient";

export const entidadesSuperAdminModel = {
  async listar() {
    return await supabase
      .from("entidades_admin")
      .select("id,nombre,sector,categoria,codigo_invitacion,esta_usado,email_contacto")
      .order("nombre");
  },
};

