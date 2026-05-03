import { supabase } from "../../../core/supabaseClient";

/**
 * Modelo de Tareas del Técnico
 * Queries filtradas por técnico asignado
 */
export const tareasTecnicoModel = {
  /** Listar denuncias asignadas al técnico via uso_materiales_reparacion */
  async listarAsignadas(tecnicoId) {
    // Buscar tareas_kanban donde id_responsable sea el técnico
    const { data: tareas } = await supabase
      .from("tareas_kanban")
      .select("id_denuncia")
      .eq("id_responsable", tecnicoId);

    const ids = [...new Set((tareas || []).map(t => t.id_denuncia))];
    if (!ids.length) return { data: [], error: null };

    return await supabase
      .from("denuncias")
      .select("id,titulo,descripcion,estado,prioridad,categoria,municipio,departamento,url_imagen,creado_el,actualizado_el")
      .in("id", ids)
      .order("creado_el", { ascending: false });
  },

  /** Cambiar estado de una denuncia con comentario */
  async cambiarEstado(denunciaId, nuevoEstado, comentario) {
    const payload = {
      estado: nuevoEstado,
    };

    const { error } = await supabase
      .from("denuncias")
      .update(payload)
      .eq("id", denunciaId);

    if (error) throw new Error(error.message);
    return nuevoEstado;
  },

  /** Listar recursos asignados a una denuncia */
  async listarRecursos(denunciaId) {
    return await supabase
      .from("recursos_asignados")
      .select("id,id_material,cantidad_asignada,estado_solicitud,justificacion_extra,url_foto_justificacion,creado_el,materiales(id,nombre,unidad_medida)")
      .eq("id_denuncia", denunciaId)
      .order("creado_el", { ascending: false });
  },

  /** Solicitar recurso extra con foto justificativa */
  async solicitarRecursoExtra({ denunciaId, materialId, cantidad, justificacion, urlFoto }) {
    const { error } = await supabase
      .from("recursos_asignados")
      .insert([{
        id_denuncia: denunciaId,
        id_material: materialId,
        cantidad_asignada: cantidad,
        estado_solicitud: "pendiente_revision",
        justificacion_extra: justificacion,
        url_foto_justificacion: urlFoto || null,
      }]);

    if (error) throw new Error(error.message);
  },

  /** Subir foto justificativa a Supabase Storage */
  async subirFoto(archivo) {
    const nombre = `justificaciones/${Date.now()}_${archivo.name}`;
    const { data, error } = await supabase.storage
      .from("evidencias")
      .upload(nombre, archivo, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(`Error subiendo foto: ${error.message}`);

    const { data: urlData } = supabase.storage.from("evidencias").getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  /** Listar técnicos de la misma entidad (para cuadrilla) */
  async listarCompaneros(entidadId, tecnicoActualId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id,nombre_completo")
      .eq("id_entidad", entidadId)
      .eq("rol", "tecnico")
      .neq("id", tecnicoActualId)
      .order("nombre_completo");

    if (error) return [];
    return data || [];
  },

  /** Crear cuadrilla de trabajo */
  async crearCuadrilla(denunciaId, encargadoId, ayudanteIds) {
    const filas = ayudanteIds.map((id) => ({
      id_denuncia: denunciaId,
      id_tecnico_encargado: encargadoId,
      id_tecnico_ayudante: id,
    }));

    const { error } = await supabase.from("cuadrilla_obra").insert(filas);
    if (error) throw new Error(error.message);
  },
};
