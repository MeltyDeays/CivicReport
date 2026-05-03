import { supabase } from "../../../core/supabaseClient";

/**
 * Modelo de Gestión de Personal y Cuadrillas
 * Tablas: perfiles (tecnicos), cuadrillas_base, cuadrilla_miembros
 */
export const cuadrillasModel = {
  /** Obtiene todos los técnicos activos de la entidad */
  async listarTecnicosEntidad(entidadId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, especialidad")
      .eq("id_entidad", entidadId)
      .eq("rol", "tecnico")
      .order("nombre_completo");
      
    if (error) throw new Error(error.message);
    return data || [];
  },

  /** Obtiene las cuadrillas de la entidad con sus miembros */
  async listarCuadrillas(entidadId) {
    const { data, error } = await supabase
      .from("cuadrillas_base")
      .select(`
        id, nombre, tamano_maximo, id_lider, activa,
        perfiles!cuadrillas_base_id_lider_fkey (id, nombre_completo, especialidad),
        cuadrilla_miembros (
          id_empleado,
          perfiles (id, nombre_completo, especialidad)
        )
      `)
      .eq("id_entidad", entidadId)
      .order("creado_el", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /** Crea una nueva cuadrilla y asigna a sus miembros iniciales */
  async crearCuadrilla({ id_entidad, nombre, tamano_maximo, id_lider, miembrosIds }) {
    // 1. Crear cuadrilla base
    const { data: cuadrilla, error: errCuadrilla } = await supabase
      .from("cuadrillas_base")
      .insert([{ id_entidad, nombre, tamano_maximo, id_lider }])
      .select("id")
      .single();

    if (errCuadrilla) throw new Error(errCuadrilla.message);

    // 2. Insertar miembros
    if (miembrosIds && miembrosIds.length > 0) {
      const miembros = miembrosIds.map((id_empleado) => ({
        id_cuadrilla: cuadrilla.id,
        id_empleado,
      }));
      const { error: errMiembros } = await supabase
        .from("cuadrilla_miembros")
        .insert(miembros);
        
      if (errMiembros) throw new Error(errMiembros.message);
    }
    
    return cuadrilla.id;
  },

  /** Actualizar estado de cuadrilla (activar/desactivar) */
  async toggleActiva(cuadrillaId, activa) {
    const { error } = await supabase
      .from("cuadrillas_base")
      .update({ activa })
      .eq("id", cuadrillaId);
      
    if (error) throw new Error(error.message);
  },
  
  /** Eliminar cuadrilla (cascade eliminará miembros) */
  async eliminarCuadrilla(cuadrillaId) {
    const { error } = await supabase
      .from("cuadrillas_base")
      .delete()
      .eq("id", cuadrillaId);
      
    if (error) throw new Error(error.message);
  },

  /** Obtiene los códigos de invitación generados por la entidad */
  async listarInvitaciones(entidadId) {
    const { data, error } = await supabase
      .from("invitaciones_empleados")
      .select("id, codigo, especialidad, usado, creado_el, entidad_id")
      .eq("entidad_id", entidadId)
      .order("creado_el", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /** Genera un nuevo código de invitación para reclutar personal */
  async generarInvitacion(entidadId, especialidad) {
    const prefijos = {
      ingeniero: "ING", operador_maquinaria: "OP", albanil: "ALB",
      electricista: "ELE", fontanero: "FON", general: "GEN"
    };
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigo = `TEC-${prefijos[especialidad] || 'GEN'}-${randomCode}`;

    const { data, error } = await supabase
      .from("invitaciones_empleados")
      .insert([{ entidad_id: entidadId, especialidad, codigo }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Elimina un código de invitación que aún no ha sido usado */
  async eliminarInvitacion(invitacionId) {
    const { error } = await supabase
      .from("invitaciones_empleados")
      .delete()
      .eq("id", invitacionId)
      .eq("usado", false); // Solo permitir eliminar si no está usado
    if (error) throw new Error(error.message);
  },

  /** Actualiza la especialidad de un código de invitación no usado */
  async editarInvitacion(invitacionId, nuevaEspecialidad) {
    const { data, error } = await supabase
      .from("invitaciones_empleados")
      .update({ especialidad: nuevaEspecialidad })
      .eq("id", invitacionId)
      .eq("usado", false)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
};
