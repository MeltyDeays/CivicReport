import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../core/supabaseClient";

const enlacesAdmin = [
  { to: "/admin/reportes", label: "Gestion de Reportes" },
  { to: "/admin/proyectos", label: "Tablero de Proyectos" },
  { to: "/admin/cuadrillas", label: "Cuadrillas y Personal" },
  { to: "/admin/mapa-calor", label: "Mapa de Calor" },
  { to: "/admin/inventario", label: "Inventario" },
  { to: "/admin/solicitudes", label: "Solicitudes" },
  { to: "/admin/estadisticas-materiales", label: "Estadisticas" },
];

const enlacesSuperAdmin = [{ to: "/super/dashboard", label: "Dashboard" }];

export default function DisenoAplicacion({ rol, rolReal, nombreUsuario, alCerrarSesion, sesion, perfil }) {
  const [cerrando, setCerrando] = useState(false);
  const [esEncargado, setEsEncargado] = useState(false);
  const location = useLocation();
  const esCiudadano = rol === "ciudadano";
  const esSuperAdmin = rol === "super_admin";
  const esTecnico = rol === "tecnico";

  // Verificar si el técnico es encargado de alguna cuadrilla
  useEffect(() => {
    if (esTecnico && perfil?.id) {
      const verificarCargo = async () => {
        const { data, count } = await supabase
          .from("cuadrilla_obra")
          .select("*", { count: 'exact', head: true })
          .eq("id_tecnico_encargado", perfil.id);
        
        setEsEncargado(count > 0);
      };
      verificarCargo();
    }
  }, [esTecnico, perfil?.id]);

  const enlacesTecnico = [
    { to: "/tecnico/tareas", label: "Mis Tareas" },
    // Solo mostrar Recursos si es encargado
    ...(esEncargado ? [{ to: "/tecnico/recursos", label: "Recursos" }] : []),
  ];

  const enlaces = esTecnico
    ? enlacesTecnico
    : esSuperAdmin
      ? enlacesSuperAdmin
      : enlacesAdmin;

  const etiquetaRol = esCiudadano
    ? "Ciudadano"
    : esTecnico
      ? "Técnico"
      : esSuperAdmin
        ? "Super Admin"
        : "Panel Administrativo";

  const manejarCerrarSesion = async () => {
    setCerrando(true);
    try {
      await alCerrarSesion();
    } catch {
      setCerrando(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      
      {!esCiudadano && (
        <aside className="sidebar" style={{ width: '280px', background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '2rem' }}>
            <h2 className="brand" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>CivicReports</h2>
            <p className="role-tag" style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginTop: '4px' }}>{etiquetaRol}</p>
          </div>
          
          <nav className="nav-links" style={{ flex: 1, padding: '0 1rem' }}>
            {enlaces.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {rolReal === "tecnico" && (
            <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
              <NavLink
                to="/ciudadano/reportes"
                className="nav-link"
                style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6' }}
              >
                🔄 Ir a Modo Ciudadano
              </NavLink>
            </div>
          )}

          <button className="sidebar-logout" onClick={manejarCerrarSesion} disabled={cerrando} style={{ margin: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {cerrando ? "Saliendo..." : "Cerrar Sesión"}
          </button>
        </aside>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {esCiudadano && (
          <header style={{ 
            height: '70px', 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 2rem',
            zIndex: 10,
            position: 'sticky',
            top: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '900', fontSize: '1.4rem' }}>CivicReports</h2>
              <nav style={{ display: 'flex', gap: '8px' }}>
                <NavLink to="/ciudadano/reportes" style={({ isActive }) => ({ padding: '8px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', color: isActive ? '#1f64ff' : '#64748b', background: isActive ? '#f0f7ff' : 'transparent' })}>📊 Reportes</NavLink>
                <NavLink to="/ciudadano/sugerencias" style={({ isActive }) => ({ padding: '8px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', color: isActive ? '#1f64ff' : '#64748b', background: isActive ? '#f0f7ff' : 'transparent' })}>💡 Sugerencias</NavLink>
              </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{nombreUsuario}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Ciudadano Activo</div>
              </div>
              
              {rolReal === "tecnico" && (
                <NavLink to="/tecnico/tareas" style={{ padding: '8px 16px', borderRadius: '10px', background: '#f8fafc', color: '#334155', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', border: '1px solid #e2e8f0' }}>🛠️ Modo Técnico</NavLink>
              )}

              <button onClick={manejarCerrarSesion} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>🚪</button>
            </div>
          </header>
        )}

        <main className="content" style={{ flex: 1, overflowY: 'auto', padding: esCiudadano ? '2rem' : '0' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
