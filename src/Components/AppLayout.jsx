import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import { procesarConsultaChatbot } from "../services/iaService";

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

  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      remitente: "bot",
      texto: "¡Hola! Soy CivicReport's Bot 🤖. Puedo generar gráficos interactivos sobre tus denuncias, categorías y cuadrillas de forma personalizada según tus datos reales. ¿Qué deseas ver hoy?",
      fecha: new Date().toISOString()
    }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoMensaje, setCargandoMensaje] = useState(false);

  const manejarEnviarMensaje = async (e) => {
    if (e) e.preventDefault();
    if (!nuevoMensaje.trim() || cargandoMensaje) return;

    const textoUsuario = nuevoMensaje;
    setNuevoMensaje("");
    setMensajes((prev) => [...prev, { remitente: "usuario", texto: textoUsuario, fecha: new Date().toISOString() }]);
    setCargandoMensaje(true);

    try {
      const res = await procesarConsultaChatbot(textoUsuario, perfil?.id_entidad);
      setMensajes((prev) => [
        ...prev,
        { remitente: "bot", texto: res.texto, grafico: res.grafico, fecha: new Date().toISOString() }
      ]);
    } catch (err) {
      console.error(err);
      setMensajes((prev) => [
        ...prev,
        { remitente: "bot", texto: "Ocurrió un error al consultar con el asistente virtual.", fecha: new Date().toISOString() }
      ]);
    } finally {
      setCargandoMensaje(false);
    }
  };

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

        {/* 🤖 Widget Flotante del Chatbot de IA: CivicReport's Bot */}
        {rol === "admin" && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'system-ui, sans-serif' }}>
            <style>{`
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
              }
            `}</style>
            {!chatAbierto ? (
              <button
                onClick={() => setChatAbierto(true)}
                style={{
                  width: '60px', height: '60px', borderRadius: '30px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.35)', transition: 'transform 0.2s',
                  fontSize: '24px', color: '#fff'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                💬
              </button>
            ) : (
              <div style={{
                width: '380px', height: '560px', borderRadius: '20px',
                background: '#fff', boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0'
              }}>
                {/* Cabecera */}
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>
                      🤖
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px' }}>CivicReport's Bot</div>
                      <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: '600' }}>En línea • Asistente Virtual</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatAbierto(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                  >
                    ×
                  </button>
                </div>

                {/* Historial de Mensajes */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {mensajes.map((msg, idx) => {
                    const esBot = msg.remitente === "bot";
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignSelf: esBot ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                        <div style={{
                          background: esBot ? '#fff' : '#10b981',
                          color: esBot ? '#1e293b' : '#fff',
                          padding: '12px 16px', borderRadius: esBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                          fontSize: '13px', lineHeight: '1.5', fontWeight: '500',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          border: esBot ? '1px solid #e2e8f0' : 'none'
                        }}>
                          {msg.texto}

                          {/* Renderizado Dinámico de Gráficos Solicitados */}
                          {esBot && msg.grafico && msg.grafico.datos && (
                            <div style={{
                              marginTop: '12px', background: '#0f172a', padding: '14px',
                              borderRadius: '12px', border: '1px solid #1e293b', color: '#fff'
                            }}>
                              <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' }}>
                                📊 Gráfico Generado (Datos Entidad)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {msg.grafico.datos.map((d, i) => {
                                  const valores = msg.grafico.datos.map(item => item.valor);
                                  const maxVal = Math.max(...valores, 1);
                                  const pct = Math.round((d.valor / maxVal) * 100);
                                  return (
                                    <div key={i}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '3px', fontWeight: '600' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{d.etiqueta}</span>
                                        <span>{d.valor}</span>
                                      </div>
                                      <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                          width: `${pct}%`, height: '100%',
                                          background: `linear-gradient(90deg, hsl(${120 + i * 40}, 75%, 50%) 0%, hsl(${120 + i * 40}, 85%, 42%) 100%)`,
                                          borderRadius: '4px', transition: 'width 0.5s ease-out'
                                        }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', alignSelf: esBot ? 'flex-start' : 'flex-end', fontWeight: '600' }}>
                          Hace un momento
                        </span>
                      </div>
                    );
                  })}
                  {cargandoMensaje && (
                    <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#fff', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                      <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }}></span>
                      <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }}></span>
                    </div>
                  )}
                </div>

                {/* Input de Mensajes */}
                <form onSubmit={manejarEnviarMensaje} style={{
                  padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff',
                  display: 'flex', gap: '10px', alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={e => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe lo que quieres graficar..."
                    disabled={cargandoMensaje}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid #cbd5e1',
                      fontSize: '13px', outline: 'none', background: '#f8fafc'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={cargandoMensaje || !nuevoMensaje.trim()}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: nuevoMensaje.trim() ? '#10b981' : '#e2e8f0',
                      color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', transition: 'background 0.2s'
                    }}
                  >
                    ➔
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
