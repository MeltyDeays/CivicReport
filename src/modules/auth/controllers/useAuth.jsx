import { useEffect, useMemo, useState, createContext, useContext } from "react";
import { supabase } from "../../../core/supabaseClient";
import { signInWithEmail, signOut, getSession, registroCiudadano as registroCiudadanoModel, registroInstitucional as registroInstitucionalModel, registroTecnico as registroTecnicoModel, vincularCodigoTecnico as vincularCodigoTecnicoModel } from "../models/authModel";
import { fetchProfileByUserId } from "../models/profileModel";

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
  const [perfil, setPerfil] = useState(null);

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
          
          if (activo) setPerfil(perfilActual);
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

      if (!activo) return;
      
      setSesion(nuevaSesion);
      if (nuevaSesion?.user?.id) {
        try {
          const perfilActual = await fetchProfileByUserId(nuevaSesion.user.id).catch(() => null);
          if (activo) {
            setPerfil(perfilActual);
            setCargandoSesion(false);
          }
        } catch {
          if (activo) {
            setPerfil(null);
            setCargandoSesion(false);
          }
        }
      } else {
        if (activo) {
          setPerfil(null);
          setCargandoSesion(false);
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

  const rol = useMemo(() => mapRolToAppRole(perfil?.rol), [perfil]);

  const actions = useMemo(() => {
    return {
      async login(email, password) {
        const respuesta = await signInWithEmail(email, password);
        const sesionNueva = respuesta.session;
        setSesion(sesionNueva);
        if (sesionNueva?.user?.id) {
          const perfilActual = await fetchProfileByUserId(sesionNueva.user.id);
          setPerfil(perfilActual);
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

