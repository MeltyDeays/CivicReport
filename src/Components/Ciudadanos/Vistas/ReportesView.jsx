import { useMemo, useState } from "react";
import ModalDetalleReporte from "../../../modals/ReportDetailModal";
import ModalFormularioReporte from "../../../modals/ReportFormModal";
import PaymentModal from "../../../modals/PaymentModal";
import { formatearFecha } from "../../../utils/formatters";
import { useDenunciasCiudadano } from "../Controladores/useDenunciasCiudadano";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";

export default function CiudadanoReportesView() {
  const { vincularCodigoTecnico } = useAuth();
  const { reportes, meta, crear, actualizar, eliminar, actualizarFirmaLocal } = useDenunciasCiudadano();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroDep, setFiltroDep] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos");
  
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("crear");
  const [reporteEnEdicion, setReporteEnEdicion] = useState(null);
  const [denunciaPago, setDenunciaPago] = useState(null);

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((item) => {
      const coincideBusqueda = item.titulo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || item.estado === filtroEstado;
      const coincideDep = filtroDep === "todos" || item.departamento === filtroDep;
      const coincideUrgencia = filtroUrgencia === "todos" || item.urgencia === filtroUrgencia;
      return coincideBusqueda && coincideEstado && coincideDep && coincideUrgencia;
    });
  }, [reportes, busqueda, filtroEstado, filtroDep, filtroUrgencia]);

  const estadisticas = useMemo(() => {
    const total = reportes.length;
    const criticos = reportes.filter((item) => item.urgencia === "critica").length;
    const enProgreso = reportes.filter((item) => item.estado === "en_reparacion").length;
    const completados = reportes.filter((item) => item.estado === "completado").length;
    return { total, criticos, enProgreso, completados };
  }, [reportes]);

  const abrirCrear = () => {
    setModoFormulario("crear");
    setReporteEnEdicion(null);
    setModalFormularioAbierto(true);
  };

  const abrirEditar = (reporte) => {
    setModoFormulario("editar");
    setReporteEnEdicion(reporte);
    setModalFormularioAbierto(true);
  };

  const guardarReporte = async (payload) => {
    if (modoFormulario === "editar" && reporteEnEdicion?.id) {
      const actualizado = await actualizar(reporteEnEdicion.id, payload);
      setReporteSeleccionado(actualizado);
      return;
    }
    await crear(payload);
  };

  const borrarReporte = async (reporte) => {
    const confirmar = window.confirm(`Se eliminara el reporte "${reporte.titulo}". Deseas continuar?`);
    if (!confirmar) return;
    await eliminar(reporte.id);
    setReporteSeleccionado(null);
  };

  const manejarVincular = async () => {
    const codigo = window.prompt("Ingresa tu código de invitación de empleado (ej. ENACAL-2026):");
    if (!codigo) return;
    try {
      await vincularCodigoTecnico(codigo.trim().toUpperCase());
      alert("¡Felicidades! Tu cuenta ha sido ascendida a Técnico. Recargando la página...");
      window.location.reload();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const getStatusLabel = (estado) => {
    switch(estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_reparacion': return 'En Reparación';
      case 'completado': return 'Completado';
      case 'rechazado': return 'Rechazado';
      default: return estado;
    }
  };

  return (
    <section>
      {/* Header Estilo Banner Premium */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1f64ff 0%, #1248c7 100%)', 
        borderRadius: '16px', 
        padding: '2rem', 
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(31, 100, 255, 0.3)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>Reportes Ciudadanos</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Ayuda a mejorar tu comunidad reportando problemas en la infraestructura</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={manejarVincular} style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            backdropFilter: 'blur(10px)'
          }}>
            💼 Vincular Código
          </button>
          <button onClick={abrirCrear} style={{ 
            background: '#fff', 
            color: '#1f64ff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            📝 Nueva Denuncia
          </button>
        </div>
      </div>

      {/* Grid de Estadísticas con Estilo del Diseño */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800' }}>{estadisticas.total}</div>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>Total Reportes</div>
        </div>
        <div style={{ background: '#fff1f2', padding: '1.5rem', borderRadius: '16px', border: '1px solid #ffe4e6' }}>
          <div style={{ color: '#e11d48', fontSize: '2rem', fontWeight: '800' }}>{estadisticas.criticos}</div>
          <div style={{ color: '#fb7185', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>Urgencia Crítica</div>
        </div>
        <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e0f2fe' }}>
          <div style={{ color: '#0369a1', fontSize: '2rem', fontWeight: '800' }}>{estadisticas.enProgreso}</div>
          <div style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>En Progreso</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '16px', border: '1px solid #dcfce7' }}>
          <div style={{ color: '#15803d', fontSize: '2rem', fontWeight: '800' }}>{estadisticas.completados}</div>
          <div style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>Completados</div>
        </div>
      </div>

      {/* Toolbar con Filtros Avanzados */}
      <div style={{ 
        background: '#fff', 
        padding: '1rem', 
        borderRadius: '16px', 
        border: '1px solid #eef2f6', 
        display: 'grid', 
        gridTemplateColumns: '1fr auto auto auto', 
        gap: '1rem',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input
            style={{ paddingLeft: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', height: '42px', width: '100%' }}
            placeholder="Buscar reportes..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
        <select className="minimal-select" style={{ height: '42px', width: '200px' }} value={filtroDep} onChange={(e) => setFiltroDep(e.target.value)}>
          <option value="todos">Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </select>
        <select className="minimal-select" style={{ height: '42px', width: '160px' }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_reparacion">En progreso</option>
          <option value="completado">Completado</option>
        </select>
        <select className="minimal-select" style={{ height: '42px', width: '160px' }} value={filtroUrgencia} onChange={(e) => setFiltroUrgencia(e.target.value)}>
          <option value="todos">Todas las urgencias</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: '600' }}>
        🔍 {reportesFiltrados.length} resultados encontrados
      </div>

      {/* Grid de Cards Estilo Instagram/Figma */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {reportesFiltrados.map((item) => (
          <article key={item.id} style={{ 
            background: '#fff', 
            borderRadius: '20px', 
            overflow: 'hidden', 
            border: '1px solid #eef2f6',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => setReporteSeleccionado(item)}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Imagen con Badges */}
            <div style={{ position: 'relative', height: '200px' }}>
              <img 
                src={item.url_imagen || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' fill='%23f1f5f9'%3E%3Crect width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E"} 
                alt={item.titulo} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ 
                  background: item.urgencia === 'critica' ? '#fee2e2' : '#fef3c7', 
                  color: item.urgencia === 'critica' ? '#ef4444' : '#d97706',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'capitalize'
                }}>
                  ● {item.urgencia}
                </span>
              </div>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span style={{ 
                  background: 'rgba(255,255,255,0.9)', color: '#1e293b',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  🕒 {getStatusLabel(item.estado)}
                </span>
              </div>
            </div>

            {/* Contenido Card */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {{ Bache: '🕳️', Semaforo: '🚦', Drenaje: '💧', Alumbrado: '💡', Puente: '🌉', Otro: '📋' }[item.categoria] || '📋'}
                </span>
                <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase' }}>{item.categoria}</span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{item.titulo}</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.descripcion}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '16px' }}>
                <span>📍</span>
                <span style={{ fontWeight: '500' }}>{item.direccion}, {item.municipio}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>{formatearFecha(item.creado_el)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                    ✍️ {item.firmas || 0}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ModalDetalleReporte
        reporte={reporteSeleccionado}
        alCerrar={() => setReporteSeleccionado(null)}
        alEditar={abrirEditar}
        alEliminar={borrarReporte}
        alCambiarFirma={actualizarFirmaLocal}
      />
      <ModalFormularioReporte
        abierto={modalFormularioAbierto}
        modo={modoFormulario}
        reporteInicial={reporteEnEdicion}
        alCerrar={() => setModalFormularioAbierto(false)}
        alGuardar={guardarReporte}
      />
      <PaymentModal
        abierto={Boolean(denunciaPago)}
        denuncia={denunciaPago}
        alCerrar={() => setDenunciaPago(null)}
        alExito={() => { setDenunciaPago(null); }}
      />
    </section>
  );
}
