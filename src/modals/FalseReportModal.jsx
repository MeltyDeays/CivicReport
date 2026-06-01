import { useState } from "react";

export default function FalseReportModal({ abierto, alCerrar, alConfirmar, cargando }) {
  const [motivo, setMotivo] = useState("");
  const [pruebas, setPruebas] = useState("");

  if (!abierto) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (motivo.trim().length < 20) {
      alert("Por favor, describe con mayor detalle el motivo (mínimo 20 caracteres).");
      return;
    }
    alConfirmar({ motivo, pruebas });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '1rem', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff', padding: '2rem', borderRadius: '24px',
        maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' }}>⚠️ Reportar como Falso</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Explica por qué esta denuncia es falsa o no tiene validez. Tu reporte será enviado a revisión por el Super Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              Motivo Detallado (mínimo 20 caracteres) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explica qué se encontró en la dirección del reporte. Ejemplo: 'Al realizar la inspección técnica en la dirección indicada, comprobamos que el bache reportado ya fue reparado en su totalidad hace un mes o no existe tal desperfecto en el sitio...'"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              Pruebas Adicionales (Opcional)
            </label>
            <input
              type="text"
              placeholder="Enlace a fotos de inspección o notas técnicas"
              value={pruebas}
              onChange={e => setPruebas(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #cbd5e1', fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={alCerrar}
              disabled={cargando}
              style={{
                background: '#f1f5f9', color: '#475569', border: 'none',
                padding: '12px 20px', borderRadius: '10px', fontWeight: '700',
                cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || motivo.trim().length < 20}
              style={{
                background: '#ef4444', color: '#fff', border: 'none',
                padding: '12px 20px', borderRadius: '10px', fontWeight: '700',
                cursor: (cargando || motivo.trim().length < 20) ? 'not-allowed' : 'pointer',
                opacity: (cargando || motivo.trim().length < 20) ? 0.6 : 1,
                fontSize: '0.9rem'
              }}
            >
              {cargando ? "Enviando..." : "Reportar Falso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
