import { useState, useMemo } from "react";
import { useTareasTecnico } from "../Controladores/useTareasTecnico";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica' },
  alta: { color: '#f59e0b', bg: '#fff7ed', label: 'Alta' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja' },
};

export default function TareasView() {
  const { agrupado, cargando, error, cambiarEstado } = useTareasTecnico();
  const [moviendo, setMoviendo] = useState("");

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
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats.total}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase' }}>Tareas</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{stats.urgentes}</div>
            <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>Prioridad</div>
          </div>
        </div>
      </header>

      {cargando && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: '700' }}>Cargando tablero operativo...</div>}
      {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>{error}</div>}

      {/* Kanban Operativo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {agrupado.map((col) => (
          <div key={col.id} style={{ 
            background: '#f1f5f9', 
            borderRadius: '20px', 
            padding: '1.25rem',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.title}
              </h3>
              <span style={{ background: '#cbd5e1', color: '#475569', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
                {col.items.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {col.items.map((tarea) => {
                const estilo = PRIORIDAD_ESTILOS[tarea.prioridad] || PRIORIDAD_ESTILOS.media;
                return (
                  <article key={tarea.id} style={{
                    background: '#fff',
                    borderRadius: '18px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <span style={{ 
                        background: estilo.bg, 
                        color: estilo.color, 
                        padding: '4px 10px', 
                        borderRadius: '10px', 
                        fontSize: '0.7rem', 
                        fontWeight: '800',
                        textTransform: 'uppercase'
                      }}>
                        {estilo.label}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>#{tarea.id.slice(0, 5)}</span>
                    </div>

                    <h4 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#1e293b', fontWeight: '700', lineHeight: 1.4 }}>{tarea.titulo}</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                      <span>📍</span>
                      <span style={{ fontWeight: '500' }}>{tarea.municipio}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                      {tarea.estado !== "en_reparacion" && (
                        <button 
                          style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                          disabled={moviendo === tarea.id}
                          onClick={() => moverTarea(tarea.id, "en_reparacion")}
                        >
                          ▶ Iniciar
                        </button>
                      )}
                      {tarea.estado !== "completado" && (
                        <button 
                          style={{ flex: 1, background: '#ecfdf5', color: '#10b981', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                          disabled={moviendo === tarea.id}
                          onClick={() => moverTarea(tarea.id, "completado")}
                        >
                          ✓ Finalizar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
