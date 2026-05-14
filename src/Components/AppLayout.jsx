import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../core/supabaseClient";

const enlacesAdmin = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/admin/reportes", label: "Reportes", icon: "📄" },
  { to: "/admin/proyectos", label: "Proyectos", icon: "📋" },
  { to: "/admin/mapa-calor", label: "Mapa de Calor", icon: "🗺️" },
  { to: "/admin/cuadrillas", label: "Personal", icon: "👥" },
  { to: "/admin/inventario", label: "Inventario", icon: "📦" },
  { to: "/admin/solicitudes", label: "Solicitudes", icon: "📩" },
  { to: "/admin/estadisticas-materiales", label: "Estadísticas", icon: "📈" },
];

const enlacesSuperAdmin = [{ to: "/super/dashboard", label: "Dashboard", icon: "📊" }];

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
        try {
          const { data } = await supabase
            .from("cuadrilla_obra")
            .select("id")
            .eq("id_tecnico_encargado", perfil.id)
            .limit(1);
          setEsEncargado((data?.length || 0) > 0);
        } catch {
          setEsEncargado(true);
        }
      };
      verificarCargo();
    }
  }, [esTecnico, perfil?.id]);

  const enlacesTecnico = [
    { to: "/tecnico/tareas", label: "Mis Tareas", icon: "🔧" },
    ...(esEncargado ? [{ to: "/tecnico/recursos", label: "Recursos", icon: "📦" }] : []),
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
    <div className="app-shell" style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>
      
      {!esCiudadano && (
        <aside style={{
          width: '260px',
          minWidth: '260px',
          background: 'linear-gradient(180deg, #0c1929 0%, #111d2e 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 50
        }}>
          {/* Branding */}
          <div style={{
            padding: '24px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
            }}>
              📍
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em' }}>CivicReports</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{etiquetaRol}</div>
            </div>
          </div>

          {/* User Card */}
          <div style={{
            margin: '4px 16px 20px',
            padding: '14px 16px',
            background: 'rgba(37,99,235,0.12)',
            borderRadius: '14px',
            border: '1px solid rgba(37,99,235,0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '800',
                color: '#fff'
              }}>
                {(nombreUsuario || "AG").substring(0, 2).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nombreUsuario || "Agente Gubernamental"}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                  Nicaragua
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {enlaces.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                })}
              >
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {location.pathname === item.to && (
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>›</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Técnico: modo ciudadano */}
          {rolReal === "tecnico" && (
            <div style={{ padding: '0 12px', marginBottom: '8px' }}>
              <NavLink
                to="/ciudadano/reportes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#3b82f6',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59,130,246,0.15)'
                }}
              >
                🔄 Ir a Modo Ciudadano
              </NavLink>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={manejarCerrarSesion}
            disabled={cerrando}
            style={{
              margin: '12px 16px 20px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <span>↩</span> {cerrando ? "Saliendo..." : "Salir"}
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
                <NavLink to="/ciudadano/perfil" style={({ isActive }) => ({ padding: '8px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', color: isActive ? '#1f64ff' : '#64748b', background: isActive ? '#f0f7ff' : 'transparent' })}>👤 Mi Perfil</NavLink>
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
