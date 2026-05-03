import { useEffect, useState, useCallback } from "react";
import { formatearFecha } from "../utils/formatters";
import { firmarReporte, retirarFirma, verificarFirma, contarFirmas } from "../services/firmasService";

export default function ModalDetalleReporte({ reporte, alCerrar, alEditar, alEliminar, alCambiarFirma }) {
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
    <div className="modal-backdrop" onClick={alCerrar}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{reporte.titulo}</h3>
          <button className="ghost-btn" onClick={alCerrar} type="button">
            Cerrar
          </button>
        </div>
        {reporte.url_imagen ? (
          <img className="modal-image" src={reporte.url_imagen} alt={reporte.titulo} />
        ) : null}
        <p>{reporte.descripcion}</p>
        <div className="details-grid">
          <span>Estado: {reporte.estado}</span>
          <span>Urgencia: {reporte.urgencia}</span>
          <span>Departamento: {reporte.departamento}</span>
          <span>Municipio: {reporte.municipio}</span>
          <span>Fecha: {formatearFecha(reporte.creado_el)}</span>
        </div>

        {/* ─── Botón de Firma Funcional (H011 + H014) ─── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', margin: '16px 0', padding: '12px',
          background: yaFirmo ? 'rgba(34,197,94,0.08)' : 'rgba(37,99,235,0.05)',
          borderRadius: '12px', border: `1px solid ${yaFirmo ? 'rgba(34,197,94,0.2)' : 'rgba(37,99,235,0.15)'}`,
          transition: 'all 0.3s'
        }}>
          <button
            type="button"
            disabled={procesando}
            onClick={toggleFirma}
            style={{
              background: yaFirmo ? '#16a34a' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '10px 24px', fontSize: '14px', fontWeight: '700',
              cursor: procesando ? 'wait' : 'pointer',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
              opacity: procesando ? 0.7 : 1
            }}
          >
            {procesando ? '...' : yaFirmo ? '✓ Firmado' : '✍️ Firmar'}
          </button>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            {totalFirmas}
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {totalFirmas === 1 ? 'firma' : 'firmas'}
          </span>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" type="button" onClick={() => alEditar?.(reporte)}>
            Editar
          </button>
          <button className="danger-btn" type="button" onClick={() => alEliminar?.(reporte)}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
