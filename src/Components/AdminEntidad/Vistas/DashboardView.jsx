import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useReportesAdminEntidad } from "../Controladores/useReportesAdminEntidad";
import { supabase } from "../../../core/supabaseClient";
import { formatearFecha } from "../../../utils/formatters";
import { useNotificaciones } from "../Controladores/useNotificaciones";

const URGENCIA_COLORES = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica' },
  alta: { color: '#f97316', bg: '#fff7ed', label: 'Alta' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja' },
};

export default function AdminDashboardView() {
  const { items } = useReportesAdminEntidad();
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [totalFirmas, setTotalFirmas] = useState(0);

  // Contar firmas SOLO de denuncias vinculadas a esta entidad
  useEffect(() => {
    if (items.length === 0) { setTotalFirmas(0); return; }
    const ids = items.map(i => i.id);
    (async () => {
      const { count } = await supabase
        .from("firmas")
        .select("id", { count: "exact", head: true })
        .in("id_denuncia", ids);
      setTotalFirmas(count || 0);
    })();
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const criticos = items.filter(i => i.prioridad === 'critica').length;
    const enProgreso = items.filter(i => i.estado === 'en_reparacion').length;
    const completados = items.filter(i => i.estado === 'completado').length;
    return { total, criticos, enProgreso, completados };
  }, [items]);

  // Reportes por departamento para gráfica de barras
  const porDepartamento = useMemo(() => {
    const conteo = {};
    items.forEach(i => {
      const dep = i.departamento || 'Otro';
      conteo[dep] = (conteo[dep] || 0) + 1;
    });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [items]);

  // Reportes por urgencia para donut
  const porUrgencia = useMemo(() => {
    const conteo = {};
    items.forEach(i => {
      const u = i.urgencia || i.prioridad || 'media';
      conteo[u] = (conteo[u] || 0) + 1;
    });
    return Object.entries(conteo);
  }, [items]);

  // Reportes recientes
  const recientes = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.creado_el) - new Date(a.creado_el))
      .slice(0, 5);
  }, [items]);

  const maxBar = porDepartamento.length > 0 ? Math.max(...porDepartamento.map(d => d[1])) : 1;

  // Fecha formateada
  const hoy = new Date();
  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaHoy = hoy.toLocaleDateString('es-NI', opcionesFecha);

  return (
    <section style={{ padding: '28px 32px', background: '#f1f5f9', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
          Resumen general de reportes e infraestructura — {fechaHoy} · Nicaragua
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Total Reportes */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px'
          }}>📄</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{stats.total}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Reportes</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>+{stats.total} esta semana</div>
        </div>

        {/* Urgencia Crítica */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: '#ef4444'
          }}>⚠️</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', lineHeight: 1 }}>{stats.criticos}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Urgencia Crítica</div>
          <div style={{ fontSize: '12px', color: '#f87171' }}>Requieren atención</div>
        </div>

        {/* Proyectos Activos */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px'
          }}>📋</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{stats.enProgreso}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Proyectos Activos</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>En desarrollo</div>
        </div>

        {/* Completados */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1px solid #dcfce7', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px'
          }}>✅</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>{stats.completados}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Completados</div>
          <div style={{ fontSize: '12px', color: '#10b981' }}>Este mes</div>
        </div>
      </div>

      {/* Banner Firmas */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '16px', padding: '20px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}>✍️</div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
              {totalFirmas.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: '2px' }}>
              Firmas Digitales Ciudadanas en {items.length} propuestas
            </div>
          </div>
        </div>
        <Link to="/admin/reportes" style={{
          background: 'rgba(255,255,255,0.2)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '10px 20px', borderRadius: '10px',
          textDecoration: 'none', fontWeight: '700', fontSize: '13px',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          Ver Propuestas →
        </Link>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Bar Chart - Reportes por Departamento */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Reportes por Departamento
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', paddingBottom: '30px', position: 'relative' }}>
            {/* Y axis labels */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: '30px', width: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[maxBar, Math.round(maxBar * 0.75), Math.round(maxBar * 0.5), Math.round(maxBar * 0.25), 0].map((v, i) => (
                <span key={i} style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>{v}</span>
              ))}
            </div>
            {/* Bars */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', marginLeft: '36px', height: '100%' }}>
              {porDepartamento.map(([dep, count]) => (
                <div key={dep} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${(count / maxBar) * 140}px`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '6px 6px 2px 2px',
                    minHeight: '8px',
                    transition: 'height 0.5s ease'
                  }} />
                  <span style={{
                    fontSize: '10px', color: '#64748b', fontWeight: '600',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '60px', textAlign: 'center'
                  }}>
                    {dep.length > 8 ? dep.substring(0, 8) + '.' : dep}
                  </span>
                </div>
              ))}
              {porDepartamento.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Sin datos aún
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Donut - Por Urgencia */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Por Urgencia
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {/* CSS Donut */}
            {porUrgencia.length > 0 ? (
              <>
                <div style={{
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: (() => {
                    const total = porUrgencia.reduce((s, [, c]) => s + c, 0);
                    let acc = 0;
                    const stops = porUrgencia.map(([u, c]) => {
                      const start = (acc / total) * 360;
                      acc += c;
                      const end = (acc / total) * 360;
                      const col = URGENCIA_COLORES[u]?.color || '#94a3b8';
                      return `${col} ${start}deg ${end}deg`;
                    });
                    return `conic-gradient(${stops.join(', ')})`;
                  })(),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: '800', color: '#0f172a'
                  }}>
                    {items.length}
                  </div>
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  {porUrgencia.map(([u, c]) => {
                    const estilo = URGENCIA_COLORES[u] || { color: '#94a3b8', label: u };
                    return (
                      <div key={u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: estilo.color }} />
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{estilo.label || u}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '2rem', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>Sin datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Acceso Rápido */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Acceso Rápido
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { to: '/admin/reportes', icon: '📄', label: 'Ver todos los reportes' },
              { to: '/admin/proyectos', icon: '📋', label: 'Tablero de Proyectos' },
              { to: '/admin/mapa-calor', icon: '🗺️', label: 'Mapa de Calor' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px', textDecoration: 'none',
                color: '#334155', fontWeight: '600', fontSize: '14px',
                transition: 'background 0.15s',
                background: 'transparent'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '18px' }}>{link.icon}</span>
                <span style={{ flex: 1 }}>{link.label}</span>
                <span style={{ color: '#cbd5e1', fontSize: '14px' }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Reportes Recientes */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Reportes Recientes
            </h3>
            <Link to="/admin/reportes" style={{
              fontSize: '13px', color: '#3b82f6', fontWeight: '600', textDecoration: 'none'
            }}>
              Ver todos
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {recientes.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No hay reportes aún
              </div>
            )}
            {recientes.map(item => {
              const urg = URGENCIA_COLORES[item.urgencia || item.prioridad] || URGENCIA_COLORES.media;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '12px',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: '#e2e8f0', overflow: 'hidden', flexShrink: 0
                  }}>
                    {item.url_imagen ? (
                      <img src={item.url_imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: '#f1f5f9' }}>
                        {item.problematica?.icono || '📋'}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '14px', fontWeight: '600', color: '#0f172a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {item.titulo}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginTop: '2px' }}>
                      📍 {item.municipio}, {item.departamento}
                    </div>
                  </div>
                  {/* Badge */}
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                    fontWeight: '700', whiteSpace: 'nowrap',
                    background: urg.bg, color: urg.color,
                    border: `1px solid ${urg.color}30`
                  }}>
                    ● {urg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Notificaciones */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', maxHeight: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Notificaciones
              {noLeidas > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 8px',
                  borderRadius: '12px', fontWeight: '700'
                }}>
                  {noLeidas} nuevas
                </span>
              )}
            </h3>
            {noLeidas > 0 && (
              <button 
                onClick={marcarTodasLeidas}
                style={{
                  fontSize: '12px', color: '#3b82f6', fontWeight: '600', 
                  background: 'transparent', border: 'none', cursor: 'pointer'
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            {notificaciones.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No tienes notificaciones
              </div>
            ) : (
              notificaciones.map(n => {
                const esCritica = n.tipo === 'critica';
                const colorBorde = esCritica ? '#ef4444' : '#3b82f6';
                const fondoLeida = n.leida ? 'transparent' : (esCritica ? '#fef2f2' : '#eff6ff');
                
                const getIcono = (tipo) => {
                  switch(tipo) {
                    case 'critica': return '🚨';
                    case 'asignacion': return '👤';
                    case 'cambio_estado': return '🔄';
                    default: return '📄';
                  }
                };

                return (
                  <div key={n.id} style={{
                    display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px',
                    background: fondoLeida, 
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: n.leida ? '#e2e8f0' : 'transparent',
                    borderLeftColor: colorBorde, borderLeftWidth: '4px', borderLeftStyle: 'solid',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>
                      {getIcono(n.tipo)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '13px', fontWeight: n.leida ? '600' : '700', color: '#0f172a' }}>
                          {n.titulo}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                          {new Date(n.creado_el).toLocaleDateString('es-NI', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '12px', color: '#64748b', marginTop: '4px',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {n.mensaje}
                      </div>
                      {!n.leida && (
                        <button 
                          onClick={() => marcarLeida(n.id)}
                          style={{
                            marginTop: '8px', fontSize: '11px', color: '#3b82f6', 
                            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600'
                          }}
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
