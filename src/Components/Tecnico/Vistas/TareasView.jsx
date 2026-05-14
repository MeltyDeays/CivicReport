import { useState, useMemo } from "react";
import { useTareasTecnico } from "../Controladores/useTareasTecnico";
import ModalDetalleReporte from "../../../modals/ReportDetailModal";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica' },
  alta: { color: '#f59e0b', bg: '#fff7ed', label: 'Alta' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja' },
};

const COL_COLORES = {
  pendiente: '#64748b',
  en_reparacion: '#2563eb',
  completado: '#10b981',
  rechazado: '#ef4444',
};

export default function TareasView() {
  const { agrupado, historial, statsHistorial, cargando, error, cambiarEstado } = useTareasTecnico();
  const [moviendo, setMoviendo] = useState("");
  const [vistaActiva, setVistaActiva] = useState("kanban"); // "kanban" | "historial"
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // H026: Modal de comentario de cierre
  const [modalCierre, setModalCierre] = useState(null); // { denunciaId, nuevoEstado, titulo }
  const [comentarioCierre, setComentarioCierre] = useState("");
  const [errorComentario, setErrorComentario] = useState("");

  const stats = useMemo(() => {
    if (!agrupado) return { total: 0, urgentes: 0 };
    let total = 0;
    let urgentes = 0;
    agrupado.forEach(col => {
      total += col.items.length;
      urgentes += col.items.filter(i => i.prioridad === 'critica' || i.prioridad === 'alta').length;
    });
    return { total, urgentes };
  }, [agrupado]);

  /** Determina si un estado es final (no se puede mover más) */
  const esFinal = (estado) => estado === "completado" || estado === "rechazado";

  /** Para estados NO finales: mover directamente */
  const moverTarea = async (denunciaId, nuevoEstado) => {
    setMoviendo(denunciaId);
    try {
      await cambiarEstado(denunciaId, nuevoEstado);
    } catch (e) {
      console.error(e);
    } finally {
      setMoviendo("");
    }
  };

  /** Para estados FINALES: abrir modal de comentario obligatorio */
  const abrirModalCierre = (denunciaId, nuevoEstado, titulo) => {
    setModalCierre({ denunciaId, nuevoEstado, titulo });
    setComentarioCierre("");
    setErrorComentario("");
  };

  /** Confirmar cierre con comentario obligatorio */
  const confirmarCierre = async () => {
    const texto = comentarioCierre.trim();
    if (texto.length < 10) {
      setErrorComentario("El comentario de cierre debe tener al menos 10 caracteres.");
      return;
    }
    setMoviendo(modalCierre.denunciaId);
    try {
      await cambiarEstado(modalCierre.denunciaId, modalCierre.nuevoEstado, texto);
      setModalCierre(null);
    } catch (e) {
      setErrorComentario(e.message);
    } finally {
      setMoviendo("");
    }
  };

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100%' }}>
      {/* Header Premium para Técnico */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        color: '#fff',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Panel de Operaciones</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Gestiona los reportes asignados a tu cuadrilla y actualiza el progreso en tiempo real.</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {vistaActiva === "kanban" ? (
            <>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats.total}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase' }}>Tareas</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{stats.urgentes}</div>
                <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>Prioridad</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>{statsHistorial.completadas}</div>
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase' }}>Completadas</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{statsHistorial.rechazadas}</div>
                <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>Rechazadas</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#60a5fa' }}>{statsHistorial.ratio}%</div>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Resolución</div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Toggles (Kanban vs Historial) */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setVistaActiva("kanban")}
          style={{ 
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
            background: vistaActiva === "kanban" ? '#1e293b' : '#e2e8f0', 
            color: vistaActiva === "kanban" ? '#fff' : '#64748b',
            transition: 'all 0.2s', boxShadow: vistaActiva === "kanban" ? '0 4px 12px rgba(30, 41, 59, 0.2)' : 'none'
          }}
        >
          📋 Tablero Kanban
        </button>
        <button 
          onClick={() => setVistaActiva("historial")}
          style={{ 
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
            background: vistaActiva === "historial" ? '#1e293b' : '#e2e8f0', 
            color: vistaActiva === "historial" ? '#fff' : '#64748b',
            transition: 'all 0.2s', boxShadow: vistaActiva === "historial" ? '0 4px 12px rgba(30, 41, 59, 0.2)' : 'none'
          }}
        >
          📊 Historial de Cierres
        </button>
      </div>

      {cargando && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: '700' }}>Cargando tablero operativo...</div>}
      {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>{error}</div>}

      {vistaActiva === "kanban" ? (
        /* Kanban Operativo — fluido */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {agrupado.map((col) => (
          <div key={col.id} style={{ 
            background: '#fff', 
            borderRadius: '20px', 
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Column Header */}
            <div style={{ 
              padding: '14px 18px', 
              background: COL_COLORES[col.key] || '#64748b',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.title}
              </h3>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '500px' }}>
              {col.items.map((tarea) => {
                const estilo = PRIORIDAD_ESTILOS[tarea.prioridad] || PRIORIDAD_ESTILOS.media;
                const finalizada = esFinal(tarea.estado);
                return (
                  <article key={tarea.id} style={{
                    background: finalizada ? '#f8fafc' : '#fff',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: `1px solid ${finalizada ? '#e2e8f0' : '#e2e8f0'}`,
                    opacity: finalizada ? 0.7 : 1,
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => !finalizada && (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <span style={{ 
                        background: estilo.bg, color: estilo.color, 
                        padding: '4px 10px', borderRadius: '10px', 
                        fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase'
                      }}>
                        {estilo.label}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>#{tarea.id.slice(0, 5)}</span>
                    </div>

                    <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#1e293b', fontWeight: '700', lineHeight: 1.4 }}>{tarea.titulo}</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', marginBottom: '14px' }}>
                      <span>📍</span>
                      <span style={{ fontWeight: '500' }}>{tarea.municipio}</span>
                    </div>

                    {/* Comentario de cierre (si ya fue cerrado) */}
                    {finalizada && tarea.comentario_cierre && (
                      <div style={{
                        background: tarea.estado === 'completado' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${tarea.estado === 'completado' ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: '10px', padding: '10px', marginBottom: '10px',
                        fontSize: '0.8rem', color: '#475569', lineHeight: 1.5
                      }}>
                        <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.7rem', textTransform: 'uppercase', color: tarea.estado === 'completado' ? '#16a34a' : '#dc2626' }}>
                          📝 Comentario de cierre:
                        </strong>
                        {tarea.comentario_cierre}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <button 
                        style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => setReporteSeleccionado(tarea)}
                      >
                        🗺️ Mapa
                      </button>
                      
                      {!finalizada && (
                        <>
                          {tarea.estado !== "en_reparacion" && (
                            <button 
                              style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                              disabled={moviendo === tarea.id}
                              onClick={() => moverTarea(tarea.id, "en_reparacion")}
                            >
                              ▶ Iniciar
                            </button>
                          )}
                          <button 
                            style={{ flex: 1, background: '#ecfdf5', color: '#10b981', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                            disabled={moviendo === tarea.id}
                            onClick={() => abrirModalCierre(tarea.id, "completado", tarea.titulo)}
                          >
                            ✓ Resuelto
                          </button>
                          <button 
                            style={{ flex: 1, background: '#fef2f2', color: '#dc2626', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                            disabled={moviendo === tarea.id}
                            onClick={() => abrirModalCierre(tarea.id, "rechazado", tarea.titulo)}
                          >
                            ✖ Rechazar
                          </button>
                        </>
                      )}
                    </div>

                    {/* Badge para estados finales */}
                    {finalizada && (
                      <div style={{ 
                        textAlign: 'center', padding: '8px', borderRadius: '10px', 
                        background: tarea.estado === 'completado' ? '#ecfdf5' : '#fef2f2',
                        color: tarea.estado === 'completado' ? '#10b981' : '#ef4444',
                        fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                        marginTop: '10px'
                      }}>
                        {tarea.estado === 'completado' ? '✅ Caso Resuelto' : '🚫 Caso Rechazado'}
                      </div>
                    )}
                  </article>
                );
              })}

              {col.items.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2.5rem 1rem',
                  border: '2px dashed #e2e8f0', borderRadius: '16px',
                  color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600'
                }}>
                  Sin tareas aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      ) : (
        /* Vista de Historial (H051) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {historial.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ margin: 0, fontWeight: '700', color: '#64748b' }}>No hay tareas cerradas</h3>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Las tareas que marques como completadas o rechazadas aparecerán aquí.</p>
            </div>
          )}
          {historial.map(tarea => {
            const estilo = PRIORIDAD_ESTILOS[tarea.prioridad] || PRIORIDAD_ESTILOS.media;
            const esExito = tarea.estado === 'completado';
            return (
              <article key={tarea.id} style={{ 
                background: '#fff', borderRadius: '16px', padding: '1.5rem', border: `1px solid ${esExito ? '#bbf7d0' : '#fecaca'}`,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: esExito ? '#10b981' : '#ef4444' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <span style={{ background: esExito ? '#ecfdf5' : '#fef2f2', color: esExito ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                    {esExito ? '✅ Resuelto' : '🚫 Rechazado'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>{new Date(tarea.actualizado_el || tarea.creado_el).toLocaleDateString()}</span>
                </div>

                <h4 style={{ margin: '0 0 10px', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700', lineHeight: 1.4 }}>{tarea.titulo}</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                  <span>📍</span>
                  <span style={{ fontWeight: '500' }}>{tarea.municipio}</span>
                  <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                  <span style={{ background: estilo.bg, color: estilo.color, padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '700' }}>
                    {estilo.label}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>
                    Comentario de Cierre:
                  </strong>
                  {tarea.comentario_cierre || <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Sin comentarios</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ────────── Modal de Comentario de Cierre (H026) ────────── */}
      {modalCierre && (
        <div
          onClick={() => setModalCierre(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: '2rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px', width: 'min(520px, 95%)',
              overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: modalCierre.nuevoEstado === 'completado'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '1.5rem 2rem', color: '#fff'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>
                {modalCierre.nuevoEstado === 'completado' ? '✅ Marcar como Resuelto' : '🚫 Rechazar Reporte'}
              </h2>
              <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                {modalCierre.titulo}
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              <label style={{
                display: 'block', fontSize: '0.85rem', fontWeight: '800',
                color: '#475569', marginBottom: '10px', textTransform: 'uppercase'
              }}>
                {modalCierre.nuevoEstado === 'completado'
                  ? 'Describe cómo se resolvió el problema *'
                  : 'Justifica por qué se rechaza este reporte *'
                }
              </label>
              <textarea
                rows={4}
                placeholder={modalCierre.nuevoEstado === 'completado'
                  ? 'Ej: Se reparó el bache con mezcla asfáltica en caliente. Superficie nivelada y compactada.'
                  : 'Ej: Se inspeccionó la zona y no se encontró la irregularidad reportada. Reporte falso.'
                }
                value={comentarioCierre}
                onChange={(e) => { setComentarioCierre(e.target.value); setErrorComentario(""); }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  border: errorComentario ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  background: '#f8fafc', fontSize: '0.95rem', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
                  transition: 'border 0.2s'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {errorComentario ? (
                  <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>{errorComentario}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mínimo 10 caracteres</span>
                )}
                <span style={{ color: comentarioCierre.trim().length >= 10 ? '#10b981' : '#94a3b8', fontSize: '0.8rem', fontWeight: '700' }}>
                  {comentarioCierre.trim().length}/10
                </span>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setModalCierre(null)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px',
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#475569', fontWeight: '700', cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCierre}
                  disabled={moviendo === modalCierre.denunciaId || comentarioCierre.trim().length < 10}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                    background: comentarioCierre.trim().length >= 10
                      ? (modalCierre.nuevoEstado === 'completado' ? '#10b981' : '#ef4444')
                      : '#cbd5e1',
                    color: '#fff', fontWeight: '800', cursor: comentarioCierre.trim().length >= 10 ? 'pointer' : 'not-allowed',
                    fontSize: '0.95rem', transition: 'all 0.2s',
                    boxShadow: comentarioCierre.trim().length >= 10 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {moviendo === modalCierre.denunciaId ? 'Procesando...' : 'Confirmar Cierre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reporteSeleccionado && (
        <ModalDetalleReporte
          reporte={reporteSeleccionado}
          alCerrar={() => setReporteSeleccionado(null)}
          soloLectura
        />
      )}
    </section>
  );
}
