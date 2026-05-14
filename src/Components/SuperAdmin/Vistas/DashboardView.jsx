import { useState } from "react";
import { useEntidadesSuperAdmin } from "../Controladores/useEntidadesSuperAdmin";

export default function SuperAdminDashboardView() {
  const { 
    entidades, 
    problematicas, 
    error, 
    creando, 
    crearEntidad,
    eliminarEntidad,
    actualizarEntidad,
    crearProblematica, 
    eliminarProblematica,
    actualizarProblematica
  } = useEntidadesSuperAdmin();

  const [tabActual, setTabActual] = useState("entidades"); // "entidades" | "problematicas"
  
  // Estados para formulario de Entidad
  const [nombreEntidad, setNombreEntidad] = useState("");
  const [sectorEntidad, setSectorEntidad] = useState("");
  const [probsSeleccionadas, setProbsSeleccionadas] = useState([]);
  
  // Estados para formulario de Problemática
  const [nombreProb, setNombreProb] = useState("");
  const [descProb, setDescProb] = useState("");
  const [iconoProb, setIconoProb] = useState("📋");

  const [editandoEntidad, setEditandoEntidad] = useState(null);
  const [editandoProblematica, setEditandoProblematica] = useState(null);
  const [editNombreProb, setEditNombreProb] = useState("");
  const [editIconoProb, setEditIconoProb] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState(null);

  const handleCrearEntidad = async (e) => {
    e.preventDefault();
    if (probsSeleccionadas.length === 0) {
      alert("Debes seleccionar al menos 1 problemática.");
      return;
    }
    const res = await crearEntidad({ nombre: nombreEntidad, sector: sectorEntidad }, probsSeleccionadas);
    if (res.success) {
      setNombreEntidad("");
      setSectorEntidad("");
      setProbsSeleccionadas([]);
      setCodigoGenerado(res.codigo);
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleCrearProblematica = async (e) => {
    e.preventDefault();
    const res = await crearProblematica({ nombre: nombreProb, descripcion: descProb, icono: iconoProb });
    if (res.success) {
      setNombreProb("");
      setDescProb("");
      setIconoProb("📋");
    } else {
      alert("Error al crear problemática: " + res.error);
    }
  };

  const toggleProbSelection = (id) => {
    setProbsSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const formCompletoEntidad = nombreEntidad && sectorEntidad && probsSeleccionadas.length > 0;
  const formCompletoProb = nombreProb && descProb && iconoProb;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ padding: isMobile ? '1rem' : '2rem', background: '#f8fafc', minHeight: '100%' }}>
      {/* Header Premium */}
      <header style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        borderRadius: isMobile ? '16px' : '24px', 
        padding: isMobile ? '1.5rem' : '2rem', 
        color: '#fff',
        marginBottom: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800' }}>Panel Super Admin</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: isMobile ? '0.85rem' : '1rem' }}>Gestiona entidades institucionales y el catálogo global de problemáticas urbanas.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setTabActual("entidades")}
          style={{
            flex: isMobile ? '1' : 'none',
            padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: tabActual === "entidades" ? '#2563eb' : '#fff',
            color: tabActual === "entidades" ? '#fff' : '#64748b',
            border: tabActual === "entidades" ? '1px solid #2563eb' : '1px solid #cbd5e1',
            boxShadow: tabActual === "entidades" ? '0 4px 6px rgba(37,99,235,0.2)' : 'none'
          }}
        >
          🏢 Entidades
        </button>
        <button 
          onClick={() => setTabActual("problematicas")}
          style={{
            flex: isMobile ? '1' : 'none',
            padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: tabActual === "problematicas" ? '#2563eb' : '#fff',
            color: tabActual === "problematicas" ? '#fff' : '#64748b',
            border: tabActual === "problematicas" ? '1px solid #2563eb' : '1px solid #cbd5e1',
            boxShadow: tabActual === "problematicas" ? '0 4px 6px rgba(37,99,235,0.2)' : 'none'
          }}
        >
          📋 Catálogo
        </button>
      </div>

      {error ? <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '2rem', fontWeight: '700' }}>Error: {error}</div> : null}

      {/* TAB ENTIDADES */}
      {tabActual === "entidades" && (
        <div style={{ display: 'flex', gap: '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
          
          {/* Formulario Entidad */}
          <div style={{ flex: isMobile ? '1' : '0 0 350px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Registrar Nueva Entidad</h3>
            <form onSubmit={handleCrearEntidad} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Nombre de Entidad/Institución *</label>
                <input 
                  type="text" value={nombreEntidad} onChange={e => setNombreEntidad(e.target.value)} required 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem' }} 
                  placeholder="Ej: ENACAL, Alcaldía de Managua"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Sector *</label>
                <select 
                  value={sectorEntidad} onChange={e => setSectorEntidad(e.target.value)} required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem', background: '#fff' }}
                >
                  <option value="">Selecciona un sector...</option>
                  <option value="Público">Público</option>
                  <option value="Privado">Privado</option>
                  <option value="Mixto">Mixto</option>
                  <option value="ONG">ONG</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Problemáticas a Resolver *</label>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {problematicas.length === 0 ? <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No hay problemáticas creadas.</span> : null}
                  {problematicas.map(p => {
                    const isSelected = probsSeleccionadas.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleProbSelection(p.id)}
                        style={{
                          padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                          background: isSelected ? '#eff6ff' : '#fff',
                          color: isSelected ? '#2563eb' : '#64748b',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1'
                        }}
                      >
                        {p.icono || "📋"} {p.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creando || !formCompletoEntidad}
                style={{ 
                  marginTop: '0.5rem', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', border: 'none', transition: 'all 0.2s',
                  background: (!creando && formCompletoEntidad) ? '#2563eb' : '#cbd5e1',
                  color: '#fff', cursor: (!creando && formCompletoEntidad) ? 'pointer' : 'not-allowed',
                  boxShadow: (!creando && formCompletoEntidad) ? '0 4px 6px rgba(37,99,235,0.2)' : 'none'
                }} 
              >
                {creando ? "Generando..." : "Crear Entidad y Generar Código"}
              </button>
            </form>
          </div>

          {/* Lista de Entidades */}
          <div style={{ flex: '1' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Entidades Registradas ({entidades.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {entidades.length ? (
                entidades.map((entidad) => {
                  const hasProbs = entidad.entidad_problematica && entidad.entidad_problematica.length > 0;
                  return (
                    <article key={entidad.id} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
                      
                      <div style={{ position: 'absolute', top: isMobile ? '1rem' : '1.5rem', right: isMobile ? '1rem' : '1.5rem', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            const newName = window.prompt("Nuevo nombre:", entidad.nombre);
                            if(newName) actualizarEntidad(entidad.id, { nombre: newName });
                          }}
                          style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                        >{isMobile ? '✏️' : '✏️ Editar'}</button>
                        <button 
                          onClick={() => {
                            if(window.confirm("¿Eliminar " + entidad.nombre + "?")) eliminarEntidad(entidad.id);
                          }}
                          style={{ background: '#fef2f2', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#ef4444', cursor: 'pointer' }}
                        >🗑️</button>
                      </div>

                      <div style={{ marginBottom: '1rem', paddingRight: isMobile ? '60px' : '120px' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: isMobile ? '1.1rem' : '1.25rem', color: '#0f172a', fontWeight: '800' }}>{entidad.nombre}</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>{entidad.sector || "Sin sector"}</p>
                      </div>
                      
                      <div style={{ marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Atiende:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {!hasProbs && <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>Ninguna asignada</span>}
                          {hasProbs && entidad.entidad_problematica.map(ep => {
                            const p = problematicas.find(prob => prob.id === ep.problematica_id);
                            if(!p) return null;
                            return (
                              <span key={p.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                                {p.icono || "📋"} {p.nombre}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', flexDirection: isMobile ? 'column' : 'row' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: entidad.esta_usado ? '#dcfce7' : '#fef9c3', color: entidad.esta_usado ? '#166534' : '#854d0e' }}>
                          {entidad.esta_usado ? "🟢 En uso" : "🟡 Pendiente"}
                        </span>
                        <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.8rem', color: '#334155', width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>
                          CÓDIGO: {entidad.codigo_invitacion}
                        </span>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontWeight: '600' }}>No hay entidades registradas todavía.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB PROBLEMÁTICAS */}
      {tabActual === "problematicas" && (
        <div style={{ display: 'flex', gap: '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
          
          <div style={{ flex: isMobile ? '1' : '0 0 350px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Crear Problemática</h3>
            <form onSubmit={handleCrearProblematica} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Icono</label>
                  <input 
                    type="text" value={iconoProb} onChange={e => setIconoProb(e.target.value)} required maxLength={2}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1.2rem', textAlign: 'center' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Nombre del Problema *</label>
                  <input 
                    type="text" placeholder="Ej: Fuga de Agua" value={nombreProb} onChange={e => setNombreProb(e.target.value)} required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem' }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Descripción *</label>
                <textarea 
                  placeholder="Detalla qué abarca este problema..." value={descProb} onChange={e => setDescProb(e.target.value)} required rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem', resize: 'none' }} 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={!formCompletoProb}
                style={{ 
                  marginTop: '0.5rem', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', border: 'none', transition: 'all 0.2s',
                  background: formCompletoProb ? '#10b981' : '#cbd5e1',
                  color: '#fff', cursor: formCompletoProb ? 'pointer' : 'not-allowed',
                  boxShadow: formCompletoProb ? '0 4px 6px rgba(16,185,129,0.2)' : 'none'
                }}
              >
                + Añadir al Catálogo
              </button>
            </form>
          </div>

          <div style={{ flex: '1' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Catálogo Actual ({problematicas.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {problematicas.length ? (
                problematicas.map((prob) => {
                  const isEditing = editandoProblematica === prob.id;
                  return (
                    <article key={prob.id} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '-4px' }}>Icono y Nombre</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="text" value={editIconoProb} onChange={e => setEditIconoProb(e.target.value)} maxLength={2} 
                              style={{ width: '50px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1.1rem' }}
                            />
                            <input 
                              type="text" value={editNombreProb} onChange={e => setEditNombreProb(e.target.value)} 
                              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '0.5rem' }}>
                            <button 
                              onClick={async () => {
                                if(!editNombreProb.trim()) return;
                                const res = await actualizarProblematica(prob.id, { nombre: editNombreProb, icono: editIconoProb });
                                if(res.success) setEditandoProblematica(null);
                                else alert("Error: " + res.error);
                              }} 
                              style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                            >Guardar</button>
                            <button 
                              onClick={() => setEditandoProblematica(null)} 
                              style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                            >Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{prob.icono || "📋"}</span> {prob.nombre}
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                              {prob.descripcion}
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f8fafc' }}>
                            <button 
                              onClick={() => {
                                setEditandoProblematica(prob.id);
                                setEditNombreProb(prob.nombre);
                                setEditIconoProb(prob.icono || "📋");
                              }}
                              style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                            >✏️ Editar</button>
                            <button 
                              onClick={async () => {
                                if (window.confirm(`¿Seguro que quieres eliminar "${prob.nombre}"? Afectará a los reportes ligados.`)) {
                                  const res = await eliminarProblematica(prob.id);
                                  if (!res.success) {
                                    alert("No se puede eliminar: tiene reportes asociados o ocurrió un error.\n\nDetalle técnico: " + res.error);
                                  }
                                }
                              }}
                              style={{ background: '#fef2f2', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#ef4444', cursor: 'pointer' }}
                            >🗑️ Eliminar</button>
                          </div>
                        </>
                      )}
                    </article>
                  )
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontWeight: '600' }}>El catálogo está vacío.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Éxito Código */}
      {codigoGenerado && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', textAlign: 'center', maxWidth: '420px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1 }}>✅</div>
            <h2 style={{ margin: '0 0 1rem', color: '#0f172a', fontSize: '1.75rem', fontWeight: '800' }}>¡Entidad Creada!</h2>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '1rem', lineHeight: 1.5 }}>
              Comparte este código de invitación con el administrador de la entidad para que pueda registrar su cuenta.
            </p>
            <div style={{ background: '#f1f5f9', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '2px dashed #cbd5e1' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: '800', color: '#2563eb', letterSpacing: '4px' }}>
                {codigoGenerado}
              </span>
            </div>
            <button 
              onClick={() => setCodigoGenerado(null)} 
              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
