import { supabase } from "../../../core/supabaseClient";

export const estadisticasAdminEntidadModel = {
  async listarUsoMateriales(entidadId) {
    return await supabase
      .from("uso_materiales_reparacion")
      .select(
        "material_id,cantidad_usada,prioridad_denuncia,categoria_denuncia,fecha_aplicacion,materiales(id,nombre,unidad_medida)"
      )
      .eq("entidad_id", entidadId)
      .order("fecha_aplicacion", { ascending: false });
  },
};

