import { supabase } from "../core/supabaseClient";
import { aPuntoWkt, parsearPuntoGeo } from "../utils/formatters";

const TABLA = "denuncias";

const CAMPOS_BASE =
  "id,id_ciudadano,entidad_id,titulo,descripcion,estado,prioridad,categoria,ubicacion,url_imagen,direccion,departamento,municipio,es_destacado,fecha_fin_destacado,creado_el,actualizado_el,firmas:firmas(count)";

function normalizarReporte(fila) {
  if (!fila) return null;
  const geo = parsearPuntoGeo(fila.ubicacion);
  const totalFirmas = Array.isArray(fila.firmas) ? fila.firmas[0]?.count || 0 : Number(fila.firmas) || 0;
  return {
    ...fila,
    categoria: fila.categoria || "Otro",
    urgencia: fila.prioridad || "media",
    direccion: fila.direccion || "Direccion pendiente",
    departamento: fila.departamento || "Managua",
    municipio: fila.municipio || "Managua",
    firmas: totalFirmas,
    lat: geo?.lat,
    lng: geo?.lng,
  };
}

export async function obtenerReportes() {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select(CAMPOS_BASE)
      .order("creado_el", { ascending: false });

    if (error) {
      console.error("Error cargando denuncias:", error.message);
      return { data: [], source: "error", error: error.message };
    }

    return {
      data: (data || []).map(normalizarReporte),
      source: "supabase",
      error: null,
    };
  } catch (e) {
    console.error("Excepción en obtenerReportes:", e.message);
    return { data: [], source: "error", error: e.message };
  }
}

export async function crearReporte(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para reportar.");

  // La asignación de entidad la maneja el trigger de BD `asignar_entidad_por_categoria`
  // No duplicar lógica en el frontend
  const insercion = {
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    estado: "pendiente",
    prioridad: payload.prioridad || "media",
    categoria: payload.categoria || "Otro",
    url_imagen: payload.url_imagen || null,
    direccion: payload.direccion || null,
    departamento: payload.departamento || null,
    municipio: payload.municipio || null,
    id_ciudadano: user.id,
    // entidad_id se asigna automáticamente via trigger `trg_auto_asignar_entidad`
    ubicacion: aPuntoWkt(payload.lat, payload.lng),
  };

  const { data, error } = await supabase
    .from(TABLA)
    .insert([insercion])
    .select(CAMPOS_BASE)
    .single();

  if (error) {
    console.error("Error Supabase al insertar:", error);
    throw new Error(error.message);
  }

  return normalizarReporte(data);
}

export async function actualizarReporte(idReporte, payload) {
  const actualizacion = {
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    prioridad: payload.prioridad || "media",
    categoria: payload.categoria || "Otro",
    url_imagen: payload.url_imagen || null,
    direccion: payload.direccion || null,
    departamento: payload.departamento || null,
    municipio: payload.municipio || null,
    // actualizado_el lo maneja el trigger de BD `update_actualizado_el_column`
    ubicacion: aPuntoWkt(payload.lat, payload.lng),
  };

  const { data, error } = await supabase
    .from(TABLA)
    .update(actualizacion)
    .eq("id", idReporte)
    .select(CAMPOS_BASE)
    .single();

  if (error) throw new Error(error.message);
  return normalizarReporte(data);
}

export async function eliminarReporte(idReporte) {
  const { error } = await supabase.from(TABLA).delete().eq("id", idReporte);
  if (error) throw new Error(error.message);
}
