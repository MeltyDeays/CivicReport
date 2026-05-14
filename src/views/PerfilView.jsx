import { useState } from "react";
import { useAuth } from "../modules/auth/controllers/useAuth";

function formatearCedula(ced) {
  if (!ced) return "—";
  const limpio = ced.replace(/\D/g, "");
  if (limpio.length === 14) return `${limpio.slice(0,3)}-${limpio.slice(3,9)}-${limpio.slice(9)}`;
  return ced;
}

function formatearFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-NI", { year: "numeric", month: "long", day: "numeric" });
}

const ETIQUETAS_ROL = {
  ciudadano: { label: "Ciudadano", color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  admin_entidad: { label: "Admin Entidad", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  tecnico: { label: "Técnico", color: "#059669", bg: "rgba(5,150,105,0.1)" },
  super_admin: { label: "Super Admin", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

export default function VistaPerfil() {
  const { perfil, sesion, actualizarPerfil, solicitarBaja, logout } = useAuth();
  const [editando, setEditando] = useState(false);
  const [nombreTemp, setNombreTemp] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalBaja, setModalBaja] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState("");
  const [procesandoBaja, setProcesandoBaja] = useState(false);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const iniciarEdicion = () => {
    setNombreTemp(perfil?.nombre_completo || "");
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setNombreTemp("");
  };

  const guardarNombre = async () => {
    const val = nombreTemp.trim();
    if (val.length < 3) return mostrarToast("El nombre debe tener al menos 3 caracteres.", "error");
    setGuardando(true);
    try {
      await actualizarPerfil({ nombre_completo: val });
      setEditando(false);
      mostrarToast("Nombre actualizado correctamente.");
    } catch (e) {
      mostrarToast(e.message || "Error al actualizar.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBaja = async () => {
    if (motivoBaja.trim().length < 10) return mostrarToast("El motivo debe tener al menos 10 caracteres.", "error");
    setProcesandoBaja(true);
    try {
      await solicitarBaja();
      mostrarToast("Cuenta desactivada. Cerrando sesión...");
      setTimeout(() => logout(), 1800);
    } catch (e) {
      mostrarToast(e.message || "Error al desactivar.", "error");
      setProcesandoBaja(false);
    }
  };

  const iniciales = (perfil?.nombre_completo || "U").substring(0, 2).toUpperCase();
  const rolInfo = ETIQUETAS_ROL[perfil?.rol] || ETIQUETAS_ROL.ciudadano;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "14px 24px", borderRadius: 14,
          background: toast.tipo === "error" ? "#fef2f2" : "#f0fdf4",
          color: toast.tipo === "error" ? "#dc2626" : "#16a34a",
          border: `1px solid ${toast.tipo === "error" ? "#fecaca" : "#bbf7d0"}`,
          fontWeight: 700, fontSize: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          animation: "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)"
        }}>
          {toast.tipo === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
        borderRadius: 24, padding: "40px 32px", marginBottom: 24,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 180, height: 180,
          borderRadius: "50%", background: "rgba(37,99,235,0.15)", filter: "blur(40px)"
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: -30, width: 140, height: 140,
          borderRadius: "50%", background: "rgba(16,185,129,0.12)", filter: "blur(30px)"
        }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#fff",
            boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
            flexShrink: 0
          }}>
            {iniciales}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editando ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={nombreTemp}
                  onChange={e => setNombreTemp(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1, minWidth: 180, padding: "10px 16px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 16, fontWeight: 700, outline: "none"
                  }}
                />
                <button onClick={guardarNombre} disabled={guardando} style={{
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", transition: "all 0.2s"
                }}>
                  {guardando ? "..." : "Guardar"}
                </button>
                <button onClick={cancelarEdicion} style={{
                  padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 14,
                  cursor: "pointer"
                }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {perfil?.nombre_completo || "Usuario"}
                </h1>
                <button onClick={iniciarEdicion} style={{
                  padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontWeight: 600,
                  fontSize: 12, cursor: "pointer", transition: "all 0.2s"
                }}>
                  ✏️ Editar
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                color: rolInfo.color, background: rolInfo.bg,
                border: `1px solid ${rolInfo.color}22`
              }}>
                {rolInfo.label}
              </span>
              {perfil?.activo === false && (
                <span style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)"
                }}>
                  Cuenta Inactiva
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
      }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
          📋 Información Personal
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { label: "Cédula", value: formatearCedula(perfil?.cedula), icon: "🪪" },
            { label: "Correo Electrónico", value: sesion?.user?.email || "—", icon: "📧" },
            { label: "Rol", value: rolInfo.label, icon: "🏷️" },
            { label: "Fecha de Registro", value: formatearFecha(perfil?.creado_el), icon: "📅" },
            ...(perfil?.especialidad ? [{ label: "Especialidad", value: perfil.especialidad, icon: "🔧" }] : []),
          ].map((item, i) => (
            <div key={i} style={{
              padding: "16px 20px", borderRadius: 16,
              background: "#f8fafc", border: "1px solid #f1f5f9",
              transition: "all 0.2s"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{item.icon}</span> {item.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", wordBreak: "break-word" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px", marginTop: 24,
        border: "1px solid #fecaca", boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
      }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#dc2626" }}>
          ⚠️ Zona de Peligro
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          Al solicitar la baja de tu cuenta, esta será desactivada permanentemente. No podrás acceder al sistema hasta que un administrador la reactive.
        </p>
        <button onClick={() => setModalBaja(true)} style={{
          padding: "12px 24px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#fff", fontWeight: 700, fontSize: 14,
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: "0 4px 12px rgba(239,68,68,0.25)"
        }}>
          🚫 Solicitar Baja de Cuenta
        </button>
      </div>

      {modalBaja && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, padding: "36px", width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
            animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)"
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#dc2626" }}>
              ⚠️ Confirmar Baja
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Esta acción desactivará tu cuenta. Escribe el motivo de tu solicitud (mínimo 10 caracteres).
            </p>
            <textarea
              value={motivoBaja}
              onChange={e => setMotivoBaja(e.target.value)}
              placeholder="Escribe el motivo de la baja..."
              rows={4}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14,
                border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'Inter', sans-serif",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <div style={{ fontSize: 12, color: motivoBaja.trim().length < 10 ? "#94a3b8" : "#10b981", marginTop: 6, fontWeight: 600 }}>
              {motivoBaja.trim().length}/10 caracteres mínimos
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => { setModalBaja(false); setMotivoBaja(""); }} disabled={procesandoBaja} style={{
                padding: "12px 24px", borderRadius: 12, border: "1px solid #e2e8f0",
                background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: 14,
                cursor: "pointer"
              }}>
                Cancelar
              </button>
              <button onClick={confirmarBaja} disabled={procesandoBaja || motivoBaja.trim().length < 10} style={{
                padding: "12px 24px", borderRadius: 12, border: "none",
                background: procesandoBaja ? "#fca5a5" : "#ef4444",
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: procesandoBaja ? "not-allowed" : "pointer",
                opacity: motivoBaja.trim().length < 10 ? 0.5 : 1,
                transition: "all 0.2s"
              }}>
                {procesandoBaja ? "Procesando..." : "Confirmar Baja"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
