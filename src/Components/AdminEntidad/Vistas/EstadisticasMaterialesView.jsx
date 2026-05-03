import { useMemo, useState } from "react";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { useEstadisticasMateriales } from "../Controladores/useEstadisticasMateriales";

const PRIORIDAD_COLORES = {
  critica: '#ef4444',
  alta: '#f59e0b',
  media: '#3b82f6',
  baja: '#10b981',
  sin_prioridad: '#94a3b8'
};

export default function EstadisticasMaterialesView() {
  const { perfil } = useAuth();
  const entidadId = perfil?.id_entidad;
  const { resumen, cargando, error } = useEstadisticasMateriales(entidadId);
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");

  const filtrado = useMemo(() => {
    return resumen.filter((row) => filtroPrioridad === "todas" || row.prioridad === filtroPrioridad);
  }, [resumen, filtroPrioridad]);

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
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
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Análisis de Insumos</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Métricas de consumo y promedios por tipo de incidencia.</p>
        </div>
        <select 
          style={{ padding: '12px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: '700', cursor: 'pointer' }}
          value={filtroPrioridad} 
          onChange={(e) => setFiltroPrioridad(e.target.value)}
        >
          <option value="todas" style={{ color: '#000' }}>Toda prioridad</option>
          <option value="critica" style={{ color: '#000' }}>Crítica</option>
          <option value="alta" style={{ color: '#000' }}>Alta</option>
          <option value="media" style={{ color: '#000' }}>Media</option>
          <option value="baja" style={{ color: '#000' }}>Baja</option>
        </select>
      </header>

      {cargando && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontWeight: '700' }}>
          Calculando métricas...
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {filtrado.map((row) => (
          <article key={`${row.material_id}-${row.prioridad}-${row.categoria}`} style={{ 
            background: '#fff', borderRadius: '24px', padding: '1.5rem', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: PRIORIDAD_COLORES[row.prioridad] || '#cbd5e1' }}></div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#1e293b' }}>{row.material_nombre}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}>
                  {row.categoria}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: (PRIORIDAD_COLORES[row.prioridad] + '15'), color: PRIORIDAD_COLORES[row.prioridad], textTransform: 'uppercase' }}>
                  {row.prioridad}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Promedio</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1e293b' }}>
                  {Math.round(row.promedio * 100) / 100} 
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', marginLeft: '4px', color: '#64748b' }}>{row.unidad_medida}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Muestras</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1e293b' }}>{row.muestras}</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
              Consumo Total Histórico: {Math.round(row.total * 100) / 100} {row.unidad_medida}
            </div>
          </article>
        ))}
      </div>

      {!cargando && filtrado.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Sin datos estadísticos</h3>
          <p style={{ color: '#64748b' }}>No hay suficientes muestras para generar promedios en este filtro.</p>
        </div>
      )}
    </section>
  );
}
