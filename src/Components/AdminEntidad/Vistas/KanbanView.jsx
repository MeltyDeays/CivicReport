import { useMemo } from "react";
import { COLUMNAS_KANBAN, DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";
import { useKanbanAdmin } from "../Controladores/useKanbanAdmin";
import { formatearFecha } from "../../../utils/formatters";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica', emoji: '🔴' },
  alta: { color: '#f59e0b', bg: '#fff7ed', label: 'Alta', emoji: '🟠' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media', emoji: '🔵' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja', emoji: '🟢' },
};

const CATEGORIA_ICONOS = {
  Bache: '🕳️', Semaforo: '🚦', Drenaje: '💧', Alumbrado: '💡', Puente: '🌉', Otro: '📋'
};

const COLUMN_COLORS = {
  pendiente: { header: '#64748b', accent: '#e2e8f0' },
  en_reparacion: { header: '#2563eb', accent: '#bfdbfe' },
  completado: { header: '#10b981', accent: '#a7f3d0' },
};

export default function AdminEntidadKanbanView() {
  const vm = useKanbanAdmin();

  const agrupado = useMemo(() => {
    return COLUMNAS_KANBAN.map((column) => ({
      ...column,
      items: vm.tareasActivas.filter((t) => t.indice_columna === column.id),
    }));
  }, [vm.tareasActivas]);

  const totalActivas = vm.tareasActivas.length;

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Tablero de Proyectos</h1>
            <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '4px' }}>
              {totalActivas} {totalActivas === 1 ? 'tarea activa' : 'tareas activas'} en el tablero
            </p>
          </div>
          {/* Botón Historial */}
          <button
            onClick={() => vm.setMostrarHistorial(true)}
            style={{
              background: '#1e293b', color: '#fff', border: 'none', padding: '12px 20px',
              borderRadius: '14px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s'
            }}
          >
            📂 Historial ({vm.historial.length})
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '1.5rem', padding: '12px 16px',
        background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', alignItems: 'center'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700' }}>Filtrar:</span>
        <select
          value={vm.filtroDept}
          onChange={(e) => vm.cambiarDepartamento(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
            background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '0.85rem'
          }}
        >
          <option value="Todos">Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {vm.filtroDept !== "Todos" && (
          <select
            value={vm.filtroCity}
            onChange={(e) => vm.setFiltroCity(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '0.85rem'
            }}
          >
            <option value="Todos">Todos los municipios</option>
            {vm.ciudadesDisponibles.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Columnas Kanban */}
      {vm.cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          Cargando tablero...
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem', alignItems: 'start'
        }}>
          {agrupado.map((column) => {
            const colStyle = COLUMN_COLORS[column.key] || COLUMN_COLORS.pendiente;
            return (
              <div key={column.id} style={{
                background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0',
                overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)'
              }}>
                {/* Column Header */}
                <div style={{
                  padding: '16px 20px', background: colStyle.header,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <h3 style={{
                    margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#fff',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {column.title}
                  </h3>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                    padding: '2px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800'
                  }}>
                    {column.items.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60vh' }}>
                  {column.items.map((item) => {
                    const prio = PRIORIDAD_ESTILOS[item.prioridad] || PRIORIDAD_ESTILOS.media;
                    const isMoving = vm.idMoviendo === item.id;
                    return (
                      <article key={item.id} style={{
                        background: '#f8fafc', borderRadius: '16px', padding: '14px',
                        border: '1px solid #e2e8f0', transition: 'all 0.2s',
                        opacity: isMoving ? 0.5 : 1
                      }}>
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            background: prio.bg, color: prio.color,
                            padding: '3px 8px', borderRadius: '8px',
                            fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase'
                          }}>
                            {prio.emoji} {prio.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                            {CATEGORIA_ICONOS[item.categoria] || '📋'} {item.categoria}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#1e293b', fontWeight: '700', lineHeight: 1.3 }}>
                          {item.titulo}
                        </h4>
                        <p style={{ margin: '0 0 10px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>
                          📍 {item.municipio}, {item.departamento}
                        </p>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                          {/* Mover izquierda */}
                          {column.id > 0 && (
                            <button
                              disabled={isMoving}
                              onClick={() => vm.manejarMover(item.id, column.id - 1)}
                              style={{
                                flex: 1, padding: '7px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                background: '#fff', color: '#475569', fontSize: '0.75rem', fontWeight: '700',
                                cursor: 'pointer', transition: 'all 0.15s'
                              }}
                              title={`Mover a ${COLUMNAS_KANBAN[column.id - 1]?.title}`}
                            >
                              ← {COLUMNAS_KANBAN[column.id - 1]?.title}
                            </button>
                          )}

                          {/* Quitar del tablero (solo desde Cola) */}
                          {column.id === 0 && (
                            <button
                              disabled={isMoving}
                              onClick={() => vm.manejarQuitar(item.id)}
                              style={{
                                padding: '7px 10px', borderRadius: '10px', border: '1px solid #fee2e2',
                                background: '#fef2f2', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700',
                                cursor: 'pointer', transition: 'all 0.15s'
                              }}
                              title="Quitar del tablero"
                            >
                              🗑️
                            </button>
                          )}

                          {/* Mover derecha */}
                          {column.id < 2 && (
                            <button
                              disabled={isMoving}
                              onClick={() => vm.manejarMover(item.id, column.id + 1)}
                              style={{
                                flex: 1, padding: '7px', borderRadius: '10px', border: '1px solid #dbeafe',
                                background: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: '700',
                                cursor: 'pointer', transition: 'all 0.15s'
                              }}
                              title={`Mover a ${COLUMNAS_KANBAN[column.id + 1]?.title}`}
                            >
                              {COLUMNAS_KANBAN[column.id + 1]?.title} →
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}

                  {column.items.length === 0 && (
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
            );
          })}
        </div>
      )}

      {/* Modal Historial */}
      {vm.mostrarHistorial && (
        <div
          className="modal-backdrop"
          onClick={() => vm.setMostrarHistorial(false)}
          style={{ backdropFilter: 'blur(8px)', padding: '2rem', background: 'rgba(15,23,42,0.6)' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(700px, 95%)', padding: 0, overflow: 'hidden',
              borderRadius: '24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              padding: '1.5rem 2rem', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>📂 Historial de Completados</h2>
                <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
                  Tareas completadas hace más de 8 horas
                </p>
              </div>
              <button
                onClick={() => vm.setMostrarHistorial(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
                  fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#f8fafc' }}>
              
              {/* Filtros del Historial */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem', padding: '12px',
                background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)', alignItems: 'center'
              }}>
                <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0 12px' }}>
                  <span style={{ fontSize: '0.9rem' }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Buscar tarea..." 
                    value={vm.histBusqueda}
                    onChange={(e) => vm.setHistBusqueda(e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '10px 8px', outline: 'none', width: '100%', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}
                  />
                </div>
                
                <select
                  value={vm.histFiltroPrio}
                  onChange={(e) => vm.setHistFiltroPrio(e.target.value)}
                  style={{
                    padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                    background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '0.85rem', outline: 'none'
                  }}
                >
                  <option value="todas">Todas las prioridades</option>
                  <option value="critica">🔴 Crítica</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="media">🔵 Media</option>
                  <option value="baja">🟢 Baja</option>
                </select>

                <select
                  value={vm.histFiltroDept}
                  onChange={(e) => vm.cambiarHistDepartamento(e.target.value)}
                  style={{
                    padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                    background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '0.85rem', outline: 'none'
                  }}
                >
                  <option value="Todos">Todos los departamentos</option>
                  {Object.keys(DEPARTAMENTOS_NICARAGUA).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {vm.histFiltroDept !== "Todos" && (
                  <select
                    value={vm.histFiltroCity}
                    onChange={(e) => vm.setHistFiltroCity(e.target.value)}
                    style={{
                      padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                      background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '0.85rem', outline: 'none'
                    }}
                  >
                    <option value="Todos">Todos los municipios</option>
                    {vm.histCiudadesDisponibles.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              {vm.historial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ fontWeight: '600' }}>No hay tareas completadas en el historial aún.</p>
                  <p style={{ fontSize: '0.85rem' }}>Las tareas completadas aparecerán aquí después de 8 horas.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {vm.historial.map((item) => {
                    const prio = PRIORIDAD_ESTILOS[item.prioridad] || PRIORIDAD_ESTILOS.media;
                    return (
                      <article key={item.id} style={{
                        background: '#fff', borderRadius: '14px', padding: '14px 18px',
                        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '1rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
                            <span style={{
                              background: prio.bg, color: prio.color, padding: '2px 8px',
                              borderRadius: '6px', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase'
                            }}>
                              {prio.label}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              {CATEGORIA_ICONOS[item.categoria] || '📋'} {item.categoria}
                            </span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', fontWeight: '700' }}>{item.titulo}</h4>
                          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                            📍 {item.municipio} · Completado: {formatearFecha(item.fecha_fin)}
                          </p>
                        </div>
                        <span style={{
                          background: '#ecfdf5', color: '#10b981', padding: '4px 12px',
                          borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', whiteSpace: 'nowrap'
                        }}>
                          ✅ Resuelto
                        </span>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
