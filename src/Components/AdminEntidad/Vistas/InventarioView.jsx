import { useMemo, useState } from "react";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { useInventarioAdminEntidad } from "../Controladores/useInventarioAdminEntidad";

export default function InventarioView() {
  const { perfil } = useAuth();
  const entidadId = perfil?.id_entidad;
  const { inventario, materiales, cargando, error, upsertItem, crearMaterial } = useInventarioAdminEntidad(entidadId);

  const [materialId, setMaterialId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [stockMinimo, setStockMinimo] = useState("10");
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("unidad");
  const [feedback, setFeedback] = useState("");

  const lista = useMemo(() => {
    return (inventario || []).map((row) => ({
      material_id: row.material_id,
      nombre: row.materiales?.nombre || "Material",
      unidad: row.materiales?.unidad_medida || "unidad",
      cantidad: Number(row.cantidad || 0),
      stock_minimo: Number(row.stock_minimo || 0),
    }));
  }, [inventario]);

  const guardar = async (e) => {
    e.preventDefault();
    setFeedback("");
    const nCantidad = Number(cantidad);
    const nMin = Number(stockMinimo);
    if (!materialId) return setFeedback("Selecciona un material");
    try {
      await upsertItem({ materialId, cantidad: nCantidad, stock_minimo: nMin });
      setCantidad("");
      setFeedback("✅ Inventario actualizado");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setFeedback("❌ " + (err.message || "Error al guardar"));
    }
  };

  const crear = async (e) => {
    e.preventDefault();
    setFeedback("");
    if (!nuevoNombre.trim()) return setFeedback("Nombre requerido");
    setCreando(true);
    try {
      const mat = await crearMaterial({ nombre: nuevoNombre.trim(), unidad_medida: nuevaUnidad });
      setNuevoNombre("");
      setMaterialId(mat.id);
      setFeedback("✅ Insumo creado");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setFeedback("❌ " + (err.message || "Error al crear"));
    } finally {
      setCreando(false);
    }
  };

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        color: '#fff',
        marginBottom: '2.5rem',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Centro Logístico</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Administra el stock de materiales y suministros de tu entidad.</p>
      </header>

      {feedback && (
        <div style={{ background: feedback.includes('✅') ? '#ecfdf5' : '#fef2f2', color: feedback.includes('✅') ? '#065f46' : '#991b1b', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', fontWeight: '700', border: '1px solid currentColor' }}>
          {feedback}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Registro de Entrada */}
        <form onSubmit={guardar} style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>📦</span> Actualizar Stock
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Material / Herramienta</label>
            <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600' }} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              <option value="">Seleccionar del catálogo...</option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.unidad_medida})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Cantidad Actual</label>
              <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Stock de Alerta</label>
              <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} placeholder="10" />
            </div>
          </div>

          <button type="submit" disabled={cargando || !entidadId} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
            {cargando ? "Procesando..." : "Registrar Cambios"}
          </button>
        </form>

        {/* Nuevo Insumo */}
        <form onSubmit={crear} style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> Añadir al Catálogo
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Nombre del Material</label>
            <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }} value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Pintura Vial Reflectante" />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Unidad</label>
            <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff' }} value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} placeholder="metro, litro, kg, unidad..." />
          </div>

          <button type="submit" disabled={creando} style={{ width: '100%', background: '#1e293b', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
            {creando ? "Creando..." : "+ Crear Nuevo Insumo"}
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: '1.5rem', color: '#1e293b', fontWeight: '800', marginBottom: '2rem' }}>Resumen de Existencias</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {lista.map((row) => {
          const esCritico = row.cantidad <= row.stock_minimo;
          return (
            <article key={row.material_id} style={{ 
              background: '#fff', borderRadius: '20px', padding: '1.5rem', border: `1px solid ${esCritico ? '#fee2e2' : '#e2e8f0'}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{row.nombre}</h4>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', background: esCritico ? '#fef2f2' : '#f0fdf4', color: esCritico ? '#ef4444' : '#10b981' }}>
                  {esCritico ? 'CRÍTICO' : 'DISPONIBLE'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '900', color: esCritico ? '#ef4444' : '#1e293b' }}>{row.cantidad}</span>
                <span style={{ color: '#64748b', fontWeight: '600' }}>{row.unidad}</span>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                Mínimo requerido: {row.stock_minimo} {row.unidad}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
