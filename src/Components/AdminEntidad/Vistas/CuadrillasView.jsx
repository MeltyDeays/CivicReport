import { useState, useMemo } from "react";
import { useCuadrillas } from "../Controladores/useCuadrillas";

export const EMOJIS_ESPECIALIDAD = {
  ingeniero: "🧠",
  operador_maquinaria: "🛡️",
  albanil: "🧱",
  electricista: "⚡",
  fontanero: "💧",
  general: "🛠️"
};

const NOMBRES_ESPECIALIDAD = {
  ingeniero: "Ingeniero / Supervisor",
  operador_maquinaria: "Operador Maquinaria",
  albanil: "Albañil / Obra Civil",
  electricista: "Electricista",
  fontanero: "Fontanero",
  general: "Técnico General"
};

export default function CuadrillasView() {
  const { 
    tecnicos, cuadrillas, invitaciones, cargando, error, 
    crearCuadrilla, alternarEstado, eliminarCuadrilla, 
    generarInvitacion, eliminarInvitacion, editarInvitacion 
  } = useCuadrillas();
  
  const [tabActual, setTabActual] = useState("cuadrillas");
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tamanoMaximo, setTamanoMaximo] = useState(4);
  const [liderId, setLiderId] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [espReclutamiento, setEspReclutamiento] = useState("general");
  const [generandoInv, setGenerandoInv] = useState(false);

  const balance = useMemo(() => {
    const todosId = liderId ? [liderId, ...seleccionados] : seleccionados;
    const conteo = {};
    for (const tId of todosId) {
      const tec = tecnicos.find(t => t.id === tId);
      if (tec) conteo[tec.especialidad] = (conteo[tec.especialidad] || 0) + 1;
    }
    return conteo;
  }, [liderId, seleccionados, tecnicos]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nombre || !liderId) return;
    setEnviando(true);
    try {
      await crearCuadrilla({
        nombre,
        tamano_maximo: Number(tamanoMaximo),
        id_lider: liderId,
        miembrosIds: seleccionados
      });
      setMostrandoForm(false);
      setNombre(""); setLiderId(""); setSeleccionados([]); setTamanoMaximo(4);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        color: '#fff',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Gestión de Personal</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Organiza tus escuadrones tácticos y recluta nuevos técnicos especializados.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setTabActual('cuadrillas')}
            style={{ 
              padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              background: tabActual === 'cuadrillas' ? '#fff' : 'transparent',
              color: tabActual === 'cuadrillas' ? '#0f172a' : '#fff',
              transition: 'all 0.2s'
            }}
          >🛡️ Cuadrillas</button>
          <button 
            onClick={() => setTabActual('reclutamiento')}
            style={{ 
              padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              background: tabActual === 'reclutamiento' ? '#fff' : 'transparent',
              color: tabActual === 'reclutamiento' ? '#0f172a' : '#fff',
              transition: 'all 0.2s'
            }}
          >📩 Reclutar</button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #fee2e2', marginBottom: '2rem', fontWeight: '600' }}>
          ⚠️ {error}
        </div>
      )}

      {tabActual === 'cuadrillas' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header de Sección Cuadrillas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Escuadrones Activos</h2>
            <button 
              onClick={() => setMostrandoForm(!mostrandoForm)}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}
            >
              {mostrandoForm ? "✕ Cerrar Formulario" : "+ Nueva Cuadrilla"}
            </button>
          </div>

          {mostrandoForm && (
            <form onSubmit={manejarEnvio} style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Nombre de la Cuadrilla</label>
                  <input style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Equipo de Respuesta Rápida" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Capacidad</label>
                  <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600' }} value={tamanoMaximo} onChange={e => setTamanoMaximo(Number(e.target.value))}>
                    <option value={4}>Básica (4)</option>
                    <option value={8}>Reforzada (8)</option>
                    <option value={12}>Máxima (12)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Capitán de Cuadrilla</label>
                <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600' }} value={liderId} onChange={e => setLiderId(e.target.value)} required>
                  <option value="">Seleccionar líder...</option>
                  {tecnicos.map(t => (
                    <option key={t.id} value={t.id}>{EMOJIS_ESPECIALIDAD[t.especialidad]} {t.nombre_completo}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={enviando} style={{ width: '100%', background: '#1e293b', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
                {enviando ? "Consolidando..." : "Consolidar Escuadrón Táctico"}
              </button>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {cuadrillas.map(c => (
              <article key={c.id} style={{ background: '#fff', borderRadius: '24px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{c.nombre}</h3>
                  <span style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', background: c.activa ? '#ecfdf5' : '#f1f5f9', color: c.activa ? '#10b981' : '#64748b' }}>
                    {c.activa ? "EN SERVICIO" : "EN RESERVA"}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Capitán</div>
                  <div style={{ fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{EMOJIS_ESPECIALIDAD[c.perfiles?.especialidad] || '🛠️'}</span>
                    {c.perfiles?.nombre_completo}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => alternarEstado(c.id, !c.activa)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>
                    {c.activa ? "Poner en Reserva" : "Activar"}
                  </button>
                  <button onClick={() => { if(window.confirm("¿Disolver cuadrilla?")) eliminarCuadrilla(c.id) }} style={{ padding: '10px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} 
            onSubmit={async (e) => {
              e.preventDefault();
              setGenerandoInv(true);
              try { await generarInvitacion(espReclutamiento); } catch (err) { alert(err.message); } finally { setGenerandoInv(false); }
            }}>
            <h2 style={{ margin: '0 0 1rem', color: '#1e293b' }}>Generar Reclutamiento</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Genera códigos de invitación para que nuevos técnicos se unan a tu entidad.</p>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Especialidad Requerida</label>
              <select style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: '600' }} value={espReclutamiento} onChange={e => setEspReclutamiento(e.target.value)}>
                {Object.entries(NOMBRES_ESPECIALIDAD).map(([k, v]) => (
                  <option key={k} value={k}>{EMOJIS_ESPECIALIDAD[k]} {v}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={generandoInv} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}>
              {generandoInv ? "Generando Código..." : "+ Generar Código de Invitación"}
            </button>
          </form>

          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {invitaciones.map(inv => (
              <article key={inv.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '4px', color: '#1e293b', textAlign: 'center', background: '#f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                  {inv.codigo}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '700' }}>{EMOJIS_ESPECIALIDAD[inv.especialidad]} {inv.especialidad}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: inv.usado ? '#94a3b8' : '#3b82f6' }}>{inv.usado ? "USADO" : "DISPONIBLE"}</span>
                </div>
                {!inv.usado && (
                  <button onClick={() => eliminarInvitacion(inv.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', textAlign: 'right' }}>Cancelar invitación</button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
