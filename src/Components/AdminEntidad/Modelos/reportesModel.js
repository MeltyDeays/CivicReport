import { supabase } from "../../../core/supabaseClient";

export const adminEntidadReportesModel = {
  async listar(entidadId) {
    let query = supabase
      .from("denuncias")
      .select("id,entidad_id,titulo,descripcion,estado,prioridad,categoria,url_imagen,direccion,departamento,municipio,ubicacion,creado_el,actualizado_el");

    if (entidadId) {
      // Obtener la categoría de la entidad para mapeo inteligente
      const { data: entidadInfo } = await supabase
        .from("entidades_admin")
        .select("nombre, categoria")
        .eq("id", entidadId)
        .single();

      const categoriaEntidad = entidadInfo?.categoria || "";
      
      // Mapeo: categoría de entidad → categorías de denuncia que atiende
      const MAPA_CATEGORIAS = {
        "Energía": ["Alumbrado"],
        "Agua": ["Drenaje"],
        "Vialidad": ["Bache", "Semaforo", "Puente"],
      };

      const categoriasCompatibles = MAPA_CATEGORIAS[categoriaEntidad] || [];

      if (categoriasCompatibles.length > 0) {
        query = query.or(`entidad_id.eq.${entidadId},categoria.in.(${categoriasCompatibles.join(',')})`);
      } else {
        query = query.eq("entidad_id", entidadId);
      }
    }

    const { data, error } = await query.order("creado_el", { ascending: false });
    return { data, error };
  },
};
