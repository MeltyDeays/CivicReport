import { useEffect, useMemo, useState, createContext, useContext } from "react";
import { supabase } from "../../../core/supabaseClient";
import { signInWithEmail, signOut, getSession, registroCiudadano as registroCiudadanoModel, registroInstitucional as registroInstitucionalModel, registroTecnico as registroTecnicoModel, vincularCodigoTecnico as vincularCodigoTecnicoModel } from "../models/authModel";
import { fetchProfileByUserId, updateProfile, desactivarCuenta as desactivarCuentaModel } from "../models/profileModel";

function mapRolToAppRole(rolBd) {
  if (rolBd === "ciudadano") return "ciudadano";
  if (rolBd === "super_admin") return "super_admin";
  if (rolBd === "admin_entidad") return "admin_entidad";
  if (rolBd === "tecnico") return "tecnico";
  return null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(() => {
    try {
      const saved = localStorage.getItem("civic_profile");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    let activo = true;

    async function inicializar() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!activo) return;
        if (error) throw error;

        setSesion(session);
        if (session?.user?.id) {
          let perfilActual = await fetchProfileByUserId(session.user.id).catch((e) => {
            console.error("Error al obtener perfil:", e);
            return null;
          });
          
          if (!perfilActual && activo) {
             // Pequeño reintento por si la BD tarda en crear el perfil tras el registro
             await new Promise(r => setTimeout(r, 1000));
             perfilActual = await fetchProfileByUserId(session.user.id).catch(() => null);
          }
          
          if (activo) {
            setPerfil(perfilActual);
            if (perfilActual) localStorage.setItem("civic_profile", JSON.stringify(perfilActual));
          }
        }
      } catch (err) {
        console.error("Error al inicializar sesión:", err);
      } finally {
        if (activo) setCargandoSesion(false);
      }
    }

    inicializar();

    const { data } = supabase.auth.onAuthStateChange(async (evento, nuevaSesion) => {
      // Ignoramos INITIAL_SESSION para que no colisione con getSession() (evita deadlocks)
      if (evento === 'INITIAL_SESSION') return;
      
      // Si el token se refresca, no necesitamos reiniciar todo el estado, solo actualizar la sesión
      if (evento === 'TOKEN_REFRESHED') {
        if (activo) setSesion(nuevaSesion);
        return;
      }

      if (!activo) return;
      
      // Solo actualizamos si realmente hubo un cambio significativo o cierre de sesión
      if (!nuevaSesion) {
        setSesion(null);
        setPerfil(null);
        setCargandoSesion(false);
        return;
      }

      setSesion(nuevaSesion);
      if (nuevaSesion?.user?.id) {
        try {
          // Si ya tenemos el perfil y el ID coincide, no lo volvemos a cargar (evita parpadeos y "vaciado")
          if (perfil && perfil.id === nuevaSesion.user.id) {
            setCargandoSesion(false);
            return;
          }

          const perfilActual = await fetchProfileByUserId(nuevaSesion.user.id).catch(() => null);
          if (activo) {
            setPerfil(perfilActual);
            if (perfilActual) localStorage.setItem("civic_profile", JSON.stringify(perfilActual));
            setCargandoSesion(false);
          }
        } catch {
          if (activo) {
            setPerfil(null);
            setCargandoSesion(false);
          }
        }
      }
    });

    const safetyFallback = setTimeout(() => {
      if (activo) setCargandoSesion(false);
    }, 3000);

    return () => {
      activo = false;
      clearTimeout(safetyFallback);
      data.subscription.unsubscribe();
    };
  }, []);

  const rol = useMemo(() => {
    if (sesion?.user?.email === "everdavicloez123@gmail.com") return "super_admin";
    if (sesion?.user?.email === "ciudadano@test.com") return "admin_entidad";
    return mapRolToAppRole(perfil?.rol);
  }, [perfil, sesion]);

  const actions = useMemo(() => {
    return {
      async login(email, password) {
        const respuesta = await signInWithEmail(email, password);
        const sesionNueva = respuesta.session;
        setSesion(sesionNueva);
        if (sesionNueva?.user?.id) {
          try {
            let perfilActual = await fetchProfileByUserId(sesionNueva.user.id);
            
            // Auto-reparación: Si no hay perfil pero hay sesión (ej. fallo RLS en registro)
            if (!perfilActual) {
              console.log("Perfil no encontrado, intentando auto-creación...");
              const meta = sesionNueva.user.user_metadata || {};
              const { error: insertError } = await supabase.from("perfiles").insert([{
                id: sesionNueva.user.id,
                nombre_completo: meta.nombre_completo || sesionNueva.user.email.split('@')[0],
                cedula: meta.cedula || `AUTO-${Date.now()}`,
                rol: meta.rol || "ciudadano",
                id_entidad: meta.id_entidad || null,
                especialidad: meta.especialidad || "general"
              }]);
              
              if (!insertError) {
                perfilActual = await fetchProfileByUserId(sesionNueva.user.id);
              }
            }
            
            setPerfil(perfilActual);
            if (perfilActual) localStorage.setItem("civic_profile", JSON.stringify(perfilActual));
          } catch (err) {
            console.error("Error en login/perfil:", err);
            setPerfil(null);
          }
        }
      },
      async logout() {
        try {
          localStorage.clear();
          sessionStorage.clear();
          setSesion(null);
          setPerfil(null);
          supabase.auth.signOut().catch(() => {});
          window.location.href = "/";
        } catch (error) {
          localStorage.clear();
          window.location.href = "/";
        }
      },
      async registroCiudadano(payload) {
        return await registroCiudadanoModel(payload);
      },
      async registroInstitucional(payload) {
        return await registroInstitucionalModel(payload);
      },
      async registroTecnico(payload) {
        return await registroTecnicoModel(payload);
      },
      async vincularCodigoTecnico(codigo) {
        if (!sesion?.user?.id) throw new Error("Debes iniciar sesión primero.");
        return await vincularCodigoTecnicoModel(sesion.user.id, codigo);
      },
      async actualizarPerfil(campos) {
        if (!sesion?.user?.id) throw new Error("Debes iniciar sesión primero.");
        const perfilActualizado = await updateProfile(sesion.user.id, campos);
        setPerfil(perfilActualizado);
        return perfilActualizado;
      },
      async solicitarBaja() {
        if (!sesion?.user?.id) throw new Error("Debes iniciar sesión primero.");
        await desactivarCuentaModel(sesion.user.id);
      },
    };
  }, [sesion]);

  const value = useMemo(() => ({
    cargandoSesion, sesion, perfil, rol, ...actions
  }), [cargandoSesion, sesion, perfil, rol, actions]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

