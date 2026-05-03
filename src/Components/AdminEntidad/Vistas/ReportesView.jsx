import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { useReportesAdminEntidad } from "../Controladores/useReportesAdminEntidad";
import RepairOrderModal from "../../../modals/RepairOrderModal";
import { agregarAlTablero } from "../../../services/kanbanService";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica' },
  alta: { color: '#f59e0b', bg: '#fff7ed', label: 'Alta' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja' },
};

const ESTADO_ESTILOS = {
  pendiente: { label: 'Pendiente', color: '#64748b', bg: '#f1f5f9' },
  validando: { label: 'En Validación', color: '#8b5cf6', bg: '#f5f3ff' },
  en_reparacion: { label: 'En Reparación', color: '#3b82f6', bg: '#eff6ff' },
  completado: { label: 'Completado', color: '#10b981', bg: '#ecfdf5' },
  rechazado: { label: 'Rechazado', color: '#ef4444', bg: '#fef2f2' },
};

export default function AdminEntidadReportesView() {
  const { perfil } = useAuth();
  const { items, cargar } = useReportesAdminEntidad();
  const [busqueda, setBusqueda] = useState("");
  const [prioridad, setPrioridad] = useState("todas");
  const [denunciaOrden, setDenunciaOrden] = useState(null);
  const [enTablero, setEnTablero] = useState({});
  const [agregando, setAgregando] = useState("");

  const manejarAgregarTablero = useCallback(async (item) => {
    setAgregando(item.id);
    try {
      const res = await agregarAlTablero(item.id);
      if (res.error) {
        alert(res.error);
      } else {
        setEnTablero(prev => ({ ...prev, [item.id]: true }));
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setAgregando("");
    }
  }, []);

  const filtrados = useMemo(() => {
    return items.filter((item) => {
      const coincideBusqueda = item.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                               item.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const coincidePrioridad = prioridad === "todas" || item.prioridad === prioridad;
      return coincideBusqueda && coincidePrioridad;
    });
  }, [items, busqueda, prioridad]);

  const estadisticas = useMemo(() => {
    const total = items.length;
    const criticos = items.filter((item) => item.prioridad === "critica").length;
    const enReparacion = items.filter((item) => item.estado === "en_reparacion").length;
    const completados = items.filter((item) => item.estado === "completado").length;
    return { total, criticos, enReparacion, completados };
  }, [items]);

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100%' }}>
      {/* Header Premium con Gradiente */}
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
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Gestión de Denuncias</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
            Panel administrativo para el seguimiento y resolución de incidencias ciudadanas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/admin/proyectos" style={{ padding: '12px 24px', borderRadius: '14px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}>
            📊 Ver Tablero
          </Link>
          <Link to="/admin/mapa-calor" style={{ padding: '12px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: '700', border: '1px solid rgba(255,255,255,0.2)' }}>
            🗺️ Mapa
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <article style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Total Reportes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>{estadisticas.total}</div>
        </article>
        <article style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #fee2e2', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Prioridad Crítica</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444' }}>{estadisticas.criticos}</div>
        </article>
        <article style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #eff6ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>En Proceso</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#3b82f6' }}>{estadisticas.enReparacion}</div>
        </article>
        <article style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #ecfdf5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Resueltos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>{estadisticas.completados}</div>
        </article>
      </div>

      {/* Toolbar con Filtros */}
      <div style={{ background: '#fff', padding: '1rem', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem' }}
            placeholder="Buscar por título o descripción..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
        <select 
          style={{ padding: '0 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', color: '#475569' }}
          value={prioridad} 
          onChange={(event) => setPrioridad(event.target.value)}
        >
          <option value="todas">Todas las prioridades</option>
          <option value="critica">🔴 Crítica</option>
          <option value="alta">🟠 Alta</option>
          <option value="media">🔵 Media</option>
          <option value="baja">🟢 Baja</option>
        </select>
      </div>

      {/* Listado de Denuncias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ margin: 0 }}>No se encontraron reportes</h3>
            <p>Asegúrate de que la entidad del usuario administrador coincida con la categoría de los reportes.</p>
          </div>
        ) : (
          filtrados.map((item) => {
            const estiloPrio = PRIORIDAD_ESTILOS[item.prioridad] || PRIORIDAD_ESTILOS.media;
            const estiloEst = ESTADO_ESTILOS[item.estado] || ESTADO_ESTILOS.pendiente;
            return (
              <article key={item.id} style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ background: estiloPrio.bg, color: estiloPrio.color, padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                      {estiloPrio.label}
                    </span>
                    <span style={{ background: estiloEst.bg, color: estiloEst.color, padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                      {estiloEst.label}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', marginLeft: '8px' }}>📍 {item.municipio}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '700' }}>{item.titulo}</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.95rem' }}>{item.descripcion?.substring(0, 100)}...</p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Categoría</div>
                    <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '700' }}>{item.categoria}</div>
                  </div>
                  <button 
                    disabled={enTablero[item.id] || agregando === item.id}
                    onClick={() => manejarAgregarTablero(item)}
                    style={{ 
                      background: enTablero[item.id] ? '#ecfdf5' : '#eff6ff', 
                      color: enTablero[item.id] ? '#10b981' : '#2563eb', 
                      border: `1px solid ${enTablero[item.id] ? '#a7f3d0' : '#bfdbfe'}`, 
                      padding: '12px 16px', borderRadius: '12px', fontWeight: '700', 
                      fontSize: '0.8rem', cursor: enTablero[item.id] ? 'default' : 'pointer', 
                      transition: 'all 0.2s', whiteSpace: 'nowrap' 
                    }}
                  >
                    {enTablero[item.id] ? '✅ En Tablero' : agregando === item.id ? '⏳...' : '📌 Al Tablero'}
                  </button>
                  <button 
                    style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    onClick={() => setDenunciaOrden(item)}
                  >
                    🛠️ Orden
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <RepairOrderModal
        abierto={Boolean(denunciaOrden)}
        entidadId={perfil?.id_entidad}
        tecnicoId={perfil?.id || null}
        denuncia={denunciaOrden}
        alCerrar={() => setDenunciaOrden(null)}
        alConfirmar={cargar}
      />
    </section>
  );
}
