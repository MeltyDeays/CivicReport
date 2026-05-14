import { useEffect, useState, useCallback } from "react";
import { formatearFecha } from "../utils/formatters";
import { firmarReporte, retirarFirma, verificarFirma, contarFirmas } from "../services/firmasService";

export default function ModalDetalleReporte({ reporte, alCerrar, alEditar, alEliminar, alCambiarFirma, alPagar, usuarioId }) {
  const [yaFirmo, setYaFirmo] = useState(false);
  const [totalFirmas, setTotalFirmas] = useState(0);
  const [procesando, setProcesando] = useState(false);

  const cargarEstadoFirma = useCallback(async () => {
    if (!reporte?.id) return;
    try {
      const [firmado, total] = await Promise.all([
        verificarFirma(reporte.id),
        contarFirmas(reporte.id)
      ]);
      setYaFirmo(firmado);
      setTotalFirmas(total);
    } catch {
      setTotalFirmas(reporte.firmas || 0);
    }
  }, [reporte?.id, reporte?.firmas]);

  useEffect(() => {
    cargarEstadoFirma();
  }, [cargarEstadoFirma]);

  if (!reporte) return null;

  const toggleFirma = async () => {
    setProcesando(true);
    try {
      if (yaFirmo) {
        await retirarFirma(reporte.id);
        setYaFirmo(false);
        const nuevas = Math.max(0, totalFirmas - 1);
        setTotalFirmas(nuevas);
        alCambiarFirma?.(reporte.id, nuevas);
      } else {
        await firmarReporte(reporte.id);
        setYaFirmo(true);
        const nuevas = totalFirmas + 1;
        setTotalFirmas(nuevas);
        alCambiarFirma?.(reporte.id, nuevas);
      }
    } catch (e) {
      console.error("Error toggling firma:", e.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={alCerrar} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()} style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                {reporte.categoria}
              </span>
              <span style={{ 
                background: reporte.urgencia === 'critica' ? '#fee2e2' : '#fef3c7', 
                color: reporte.urgencia === 'critica' ? '#ef4444' : '#d97706',
                padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase'
              }}>
                {reporte.urgencia}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>{reporte.titulo}</h3>
          </div>
          <button onClick={alCerrar} style={{ 
            background: '#f1f5f9', border: 'none', width: '36px', height: '36px', 
            borderRadius: '50%', color: '#64748b', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s'
          }} onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}>
            ✕
          </button>
        </div>
        {reporte.url_imagen ? (
          <div style={{ width: '100%', height: '240px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <img src={reporte.url_imagen} alt={reporte.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : null}
        <div style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
          <p style={{ margin: 0 }}>{reporte.descripcion}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Estado</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{reporte.estado}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Fecha</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{formatearFecha(reporte.creado_el)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Ubicación</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{reporte.municipio}, {reporte.departamento}</span>
          </div>
        </div>

        {/* H026: Mostrar comentario de cierre si existe */}
        {(reporte.estado === "completado" || reporte.estado === "rechazado") && reporte.comentario_cierre && (
          <div style={{
            marginTop: '16px', padding: '16px', borderRadius: '12px',
            background: reporte.estado === "completado" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${reporte.estado === "completado" ? "#bbf7d0" : "#fecaca"}`,
            color: '#334155'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: reporte.estado === "completado" ? "#16a34a" : "#dc2626" }}>
              {reporte.estado === "completado" ? "✅ Resolución del Técnico:" : "🚫 Razón del Rechazo:"}
            </strong>
            <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{reporte.comentario_cierre}"
            </p>
          </div>
        )}

        {/* ─── Botón de Firma Funcional (H011 + H014) ─── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: '8px 0', padding: '20px',
          background: yaFirmo ? 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(21,128,61,0.05) 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px', border: `1px solid ${yaFirmo ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`,
          boxShadow: yaFirmo ? '0 10px 15px -3px rgba(34,197,94,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
              Apoyo Ciudadano
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: yaFirmo ? '#15803d' : '#0f172a', lineHeight: 1 }}>
                {totalFirmas}
              </span>
              <span style={{ fontSize: '15px', color: yaFirmo ? '#16a34a' : '#64748b', fontWeight: '600' }}>
                {totalFirmas === 1 ? 'firma' : 'firmas'}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={procesando}
            onClick={toggleFirma}
            style={{
              background: yaFirmo ? '#16a34a' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '14px 28px', fontSize: '16px', fontWeight: '800',
              cursor: procesando ? 'wait' : 'pointer',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px',
              opacity: procesando ? 0.7 : 1,
              boxShadow: yaFirmo ? '0 4px 14px rgba(22, 163, 74, 0.4)' : '0 4px 14px rgba(37, 99, 235, 0.4)',
              transform: procesando ? 'scale(0.98)' : 'scale(1)'
            }}
            onMouseOver={(e) => !procesando && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !procesando && (e.currentTarget.style.transform = 'translateY(0)')}
            onMouseDown={(e) => !procesando && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => !procesando && (e.currentTarget.style.transform = 'translateY(-2px)')}
          >
            {procesando ? (
              <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            ) : yaFirmo ? '✓ Ya lo firmaste' : '✍️ Firmar Apoyo'}
          </button>
        </div>

        {usuarioId && reporte.id_ciudadano === usuarioId && (
          <div className="modal-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {!reporte.es_destacado && (
              <button 
                type="button" 
                onClick={() => alPagar?.(reporte)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', 
                  padding: '10px 20px', fontWeight: '800', fontSize: '14px', 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                  color: '#fff', border: 'none', cursor: 'pointer', 
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', width: '100%', justifyContent: 'center'
                }}>
                ⭐ Destacar Reporte
              </button>
            )}
            {reporte.estado === 'pendiente' && (
              <>
                <button className="secondary-btn" type="button" onClick={() => alEditar?.(reporte)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '10px 20px', fontWeight: '700', fontSize: '14px', flex: 1, justifyContent: 'center' }}>
                  ✏️ Editar Reporte
                </button>
                <button className="danger-btn" type="button" onClick={() => alEliminar?.(reporte)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '10px 20px', fontWeight: '700', fontSize: '14px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                  🗑️ Eliminar Reporte
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
