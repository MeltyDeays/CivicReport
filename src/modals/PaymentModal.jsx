import { useState } from "react";
import { procesarPagoSimulado } from "../services/pagosService";

/**
 * H016 — Modal de Pago Simulado
 * Formulario elegante con tarjeta mock. Sin cobro real.
 */
export default function PaymentModal({ abierto, denuncia, alCerrar, alExito }) {
  const [tarjeta, setTarjeta] = useState("");
  const [expiracion, setExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [completado, setCompletado] = useState(false);

  if (!abierto || !denuncia) return null;

  const MONTO = 150.00; // C$150 NIO

  const formatearTarjeta = (v) => {
    const nums = v.replace(/\D/g, "").slice(0, 16);
    return nums.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatearExp = (v) => {
    const nums = v.replace(/\D/g, "").slice(0, 4);
    if (nums.length <= 2) return nums;
    return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  };

  const manejarPago = async (e) => {
    e.preventDefault();
    setError("");

    const numLimpio = tarjeta.replace(/\s/g, "");
    if (numLimpio.length < 16) return setError("Número de tarjeta incompleto.");
    if (expiracion.length < 5) return setError("Fecha de vencimiento inválida.");
    if (cvv.length < 3) return setError("CVV inválido.");

    setProcesando(true);
    try {
      await procesarPagoSimulado({
        denunciaId: denuncia.id,
        monto: MONTO,
        metodoPago: `**** ${numLimpio.slice(-4)}`,
      });
      setCompletado(true);
      alExito?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const cerrar = () => {
    setTarjeta(""); setExpiracion(""); setCvv("");
    setError(""); setCompletado(false);
    alCerrar();
  };

  return (
    <div className="modal-backdrop" onClick={cerrar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h3>⭐ Destacar Reporte</h3>
          <button className="ghost-btn" type="button" onClick={cerrar}>Cerrar</button>
        </div>

        {completado ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#16a34a', marginBottom: '8px' }}>¡Pago exitoso!</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Tu reporte "<strong>{denuncia.titulo}</strong>" será destacado por 7 días.
            </p>
            <button className="primary-btn" style={{ marginTop: '20px' }} onClick={cerrar}>Entendido</button>
          </div>
        ) : (
          <form onSubmit={manejarPago} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              borderRadius: '16px', padding: '20px', color: '#fff', marginBottom: '8px'
            }}>
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '12px', letterSpacing: '1px' }}>TARJETA DE CRÉDITO / DÉBITO</div>
              <div style={{ fontSize: '20px', letterSpacing: '3px', fontFamily: 'monospace', marginBottom: '12px' }}>
                {tarjeta || "•••• •••• •••• ••••"}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.8 }}>
                <span>Vence: {expiracion || "MM/AA"}</span>
                <span>SIMULADO</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
              Destacar: <strong>{denuncia.titulo}</strong> — <strong>C$ {MONTO.toFixed(2)}</strong>
            </p>

            <div className="input-group">
              <span className="label-premium">Número de tarjeta</span>
              <input name="cardNumber" value={tarjeta} onChange={(e) => setTarjeta(formatearTarjeta(e.target.value))}
                placeholder="1234 5678 9012 3456" maxLength={19} required autoComplete="cc-number" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <span className="label-premium">Vencimiento</span>
                <input name="expiry" value={expiracion} onChange={(e) => setExpiracion(formatearExp(e.target.value))}
                  placeholder="MM/AA" maxLength={5} required autoComplete="cc-exp" />
              </div>
              <div className="input-group">
                <span className="label-premium">CVV</span>
                <input name="cvv" type="password" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••" maxLength={4} required autoComplete="cc-csc" />
              </div>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

            <button className="primary-btn" type="submit" disabled={procesando} style={{ marginTop: '4px' }}>
              {procesando ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span className="loader-spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                  Procesando pago...
                </span>
              ) : `Pagar C$ ${MONTO.toFixed(2)}`}
            </button>

            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              🔒 Pago simulado — No se realizará ningún cobro real
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
