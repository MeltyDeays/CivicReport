import { supabase } from "../../../core/supabaseClient";
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}
/**
 * H001 — Registro Ciudadano
 * Crea usuario en auth.users + perfil en tabla perfiles con rol "ciudadano".
 */
export async function registroCiudadano({ email, password, cedula, nombreCompleto }) {
  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw new Error(authError.message);
  const userId = authData.user?.id;
  if (!userId) throw new Error("No se pudo obtener el ID del usuario creado.");
  // 2. Crear perfil ciudadano
  const { error: perfilError } = await supabase.from("perfiles").insert([{
    id: userId,
    cedula,
    nombre_completo: nombreCompleto,
    rol: "ciudadano",
    id_entidad: null,
  }]);
  if (perfilError) throw new Error(`Usuario creado pero falló el perfil: ${perfilError.message}`);
  return authData;
}
/**
 * H022 — Registro Institucional (Admin Entidad)
 * Valida código de invitación → Crea usuario → Crea perfil con rol "admin_entidad" → Marca código como usado.
 */
export async function registroInstitucional({ email, password, nombreCompleto, cedula, codigoInvitacion }) {
  // 1. Validar que el código exista y no haya sido usado
  const { data: entidad, error: entidadError } = await supabase
    .from("entidades_admin")
    .select("id, nombre, esta_usado")
    .eq("codigo_invitacion", codigoInvitacion)
    .single();
  if (entidadError || !entidad) throw new Error("Código de invitación inválido o no encontrado.");
  if (entidad.esta_usado) throw new Error(`El código ya fue reclamado por la entidad "${entidad.nombre}".`);
  // 2. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw new Error(authError.message);
  const userId = authData.user?.id;
  if (!userId) throw new Error("No se pudo obtener el ID del usuario creado.");
  // 3. Crear perfil admin_entidad vinculado a la entidad
  // Para AdminEntidad, cedula y nombreCompleto son opcionales en el UI, se autogeneran para la BD
  const cedulaFinal = cedula || `ADMIN-${Date.now()}`;
  const nombreFinal = nombreCompleto || `Administrador de ${entidad.nombre}`;
  const { error: perfilError } = await supabase.from("perfiles").insert([{
    id: userId,
    cedula: cedulaFinal,
    nombre_completo: nombreFinal,
    rol: "admin_entidad",
    id_entidad: entidad.id,
  }]);
  if (perfilError) throw new Error(`Usuario creado pero falló el perfil: ${perfilError.message}`);
  // 4. Marcar código como usado
  await supabase
    .from("entidades_admin")
    .update({ esta_usado: true })
    .eq("id", entidad.id);
  return { ...authData, entidadNombre: entidad.nombre };
}
/**
 * H026 / V7 — Registro Técnico
 * Valida código de invitación (no lo marca como usado) → Crea usuario → Crea perfil con rol "tecnico" y "especialidad".
 */
export async function registroTecnico({ email, password, nombreCompleto, cedula, codigoInvitacion }) {
  // 1. Validar que la invitación exista, no esté usada
  const { data: invitacion, error: invError } = await supabase
    .from("invitaciones_empleados")
    .select("id, entidad_id, especialidad, usado")
    .eq("codigo", codigoInvitacion)
    .single();
  if (invError || !invitacion) throw new Error("Código de invitación inválido o no encontrado.");
  if (invitacion.usado) throw new Error("Este código de invitación ya ha sido utilizado.");
  // 2. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw new Error(authError.message);
  const userId = authData.user?.id;
  if (!userId) throw new Error("No se pudo obtener el ID del usuario creado.");
  // 3. Crear perfil tecnico vinculado a la entidad
  const { error: perfilError } = await supabase.from("perfiles").insert([{
    id: userId,
    cedula,
    nombre_completo: nombreCompleto,
    rol: "tecnico",
    id_entidad: invitacion.entidad_id,
    especialidad: invitacion.especialidad,
  }]);
  if (perfilError) throw new Error(`Usuario creado pero falló el perfil: ${perfilError.message}`);
  // 4. Marcar la invitación como usada
  await supabase
    .from("invitaciones_empleados")
    .update({ usado: true })
    .eq("id", invitacion.id);
  return { ...authData, entidadId: invitacion.entidad_id };
}
/**
 * H024 — Ascenso a Técnico
 * Vincula una cuenta de Ciudadano existente a un código de invitación de empleado.
 */
export async function vincularCodigoTecnico(userId, codigoInvitacion) {
  // 1. Validar que la invitación exista y no haya sido usada
  const { data: invitacion, error: invError } = await supabase
    .from("invitaciones_empleados")
    .select("id, entidad_id, usado, especialidad")
    .eq("codigo", codigoInvitacion)
    .single();
  if (invError || !invitacion) throw new Error("Código de invitación inválido o no encontrado.");
  if (invitacion.usado) throw new Error("Este código de invitación ya ha sido utilizado.");
  // 2. Ascender el perfil
  const { error: perfilError } = await supabase
    .from("perfiles")
    .update({
      rol: "tecnico",
      id_entidad: invitacion.entidad_id,
      especialidad: invitacion.especialidad,
    })
    .eq("id", userId);
  if (perfilError) throw new Error(`Fallo al vincular perfil: ${perfilError.message}`);
  // 3. Marcar la invitación como usada
  await supabase
    .from("invitaciones_empleados")
    .update({ usado: true })
    .eq("id", invitacion.id);
  return true;
}
