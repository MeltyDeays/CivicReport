import { useCallback, useEffect, useState } from "react";
import { tareasTecnicoModel } from "../Modelos/tareasModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

/**
 * Vista de Recursos del Técnico
 * Muestra materiales asignados por denuncia.
 * Permite aceptar o solicitar recursos extra con foto.
 */
export default function RecursosView() {
  const { perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [recursosPorTarea, setRecursosPorTarea] = useState({});
  const [cargando, setCargando] = useState(true);

  // Solicitud extra
  const [solicitando, setSolicitando] = useState(null); // denunciaId activo
  const [matId, setMatId] = useState("");
  const [cantExtra, setCantExtra] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState("");

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setCargando(true);
    const res = await tareasTecnicoModel.listarAsignadas(perfil.id);
    const denuncias = res.data || [];
    setTareas(denuncias);

    // Cargar recursos de cada denuncia en paralelo (async-parallel)
    const pares = await Promise.all(
      denuncias.map(async (d) => {
        const r = await tareasTecnicoModel.listarRecursos(d.id);
        return [d.id, r.data || []];
      })
    );
    const mapa = {};
    pares.forEach(([id, recursos]) => { mapa[id] = recursos; });
    setRecursosPorTarea(mapa);
    setCargando(false);
  }, [perfil?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const enviarSolicitud = async (denunciaId) => {
    setEnviando(true);
    setFeedback("");
    try {
      let urlFoto = null;
      if (archivo) {
        urlFoto = await tareasTecnicoModel.subirFoto(archivo);
      }
      await tareasTecnicoModel.solicitarRecursoExtra({
        denunciaId,
        materialId: matId,
        cantidad: Number(cantExtra),
        justificacion,
        urlFoto,
      });
      setFeedback("Solicitud enviada. El administrador la revisará.");
      setSolicitando(null);
      setMatId(""); setCantExtra(""); setJustificacion(""); setArchivo(null);
      await cargar();
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section>
      <header className="view-header">
        <div>
          <h1>Recursos Asignados</h1>
          <p>Materiales para tus reparaciones. Acepta o solicita adicionales.</p>
        </div>
      </header>

      {cargando && <p className="warn-text">Cargando recursos...</p>}
      {feedback && <p className="warn-text">{feedback}</p>}

      <div className="list-stack">
        {tareas.map((tarea) => {
          const recursos = recursosPorTarea[tarea.id] || [];
          return (
            <article key={tarea.id} className="list-card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ marginBottom: '4px' }}>{tarea.titulo}</h3>
                <small style={{ color: '#64748b' }}>📍 {tarea.municipio} · {tarea.categoria}</small>
              </div>

              {/* Cards de materiales */}
              {recursos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  {recursos.map((r) => {
                    const esExtra = r.estado_solicitud === "pendiente_revision";
                    const aprobado = r.estado_solicitud === "aprobada";
                    return (
                      <div key={r.id} style={{
                        padding: '12px', borderRadius: '12px',
                        background: esExtra ? '#fffbeb' : aprobado ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${esExtra ? '#fef08a' : aprobado ? '#bbf7d0' : '#fecaca'}`,
                      }}>
                        <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                          {r.materiales?.nombre || "Material"}
                        </strong>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          {r.cantidad_asignada} {r.materiales?.unidad_medida || "und"}
                        </span>
                        <div style={{ marginTop: '6px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: '6px',
                            background: esExtra ? '#fef08a' : aprobado ? '#bbf7d0' : '#fecaca',
                            color: esExtra ? '#a16207' : aprobado ? '#15803d' : '#dc2626',
                          }}>
                            {r.estado_solicitud === "aprobada" ? "Aprobado" : r.estado_solicitud === "pendiente_revision" ? "Pendiente" : "Rechazado"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Sin materiales asignados aún.</p>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="primary-btn" style={{ background: '#16a34a', flex: 1 }} disabled>
                  ✓ Recursos Aceptados
                </button>
                <button className="primary-btn" style={{ background: '#f97316', flex: 1 }}
                  onClick={() => setSolicitando(solicitando === tarea.id ? null : tarea.id)}>
                  📦 Solicitar Adicionales
                </button>
              </div>

              {/* Formulario de solicitud extra */}
              {solicitando === tarea.id && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef08a' }}>
                  <h4 style={{ marginBottom: '12px', color: '#92400e' }}>Solicitar material adicional</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input className="field" placeholder="ID del material" value={matId}
                      onChange={(e) => setMatId(e.target.value)} />
                    <input className="field" type="number" placeholder="Cantidad necesaria" min="1"
                      value={cantExtra} onChange={(e) => setCantExtra(e.target.value)} />
                    <textarea className="field" placeholder="Justificación: ¿Por qué necesitas más?"
                      value={justificacion} onChange={(e) => setJustificacion(e.target.value)} rows={3} />
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                        📸 Evidencia fotográfica
                      </label>
                      <input type="file" accept="image/*" capture="environment"
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
                    </div>
                    <button className="primary-btn" style={{ background: '#f97316' }} disabled={enviando || !matId || !cantExtra}
                      onClick={() => enviarSolicitud(tarea.id)}>
                      {enviando ? "Enviando..." : "Enviar solicitud"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
