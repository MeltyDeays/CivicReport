import { useState } from "react";

/**
 * Vista de Registro — H001 (Ciudadano) + H022 (Institucional)
 * Formulario con tabs para seleccionar tipo de registro y diseño Glassmorphism Premium.
 */
export default function VistaRegistro({ alRegistroCiudadano, alRegistroInstitucional, alRegistroTecnico, alIrLogin }) {
  const [tab, setTab] = useState("ciudadano"); // "ciudadano" | "institucional" | "tecnico"
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");

  // Cédula Nicaragüense: 13 números + 1 letra mayúscula
  const formatearCedula = (valor) => {
    let limpio = valor.replace(/[^0-9a-zA-Z]/g, "").toUpperCase().slice(0, 14);
    let nums = limpio.slice(0, 13).replace(/\D/g, "");
    let letra = limpio.slice(13, 14).replace(/[^A-Z]/g, "");
    
    let result = nums + letra;
    
    if (result.length <= 3) return result;
    if (result.length <= 9) return `${result.slice(0, 3)}-${result.slice(3)}`;
    return `${result.slice(0, 3)}-${result.slice(3, 9)}-${result.slice(9)}`;
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();
    if (enviando) return;

    setError("");
    setExito("");

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      // Validación estricta de cédula nicaragüense (solo para ciudadano y tecnico)
      if (tab !== "institucional") {
        const regexCedula = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
        if (!cedula || !regexCedula.test(cedula)) {
          throw new Error("Ingresa una cédula nicaragüense válida (ej. 121-041204-1006N).");
        }
      }

      if (tab === "ciudadano") {
        await alRegistroCiudadano({ email, password, cedula, nombreCompleto });
        setExito("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
      } else if (tab === "institucional") {
        if (!codigoInvitacion.trim()) throw new Error("Ingresa el código de invitación.");
        await alRegistroInstitucional({ email, password, nombreCompleto, cedula, codigoInvitacion: codigoInvitacion.trim() });
        setExito("¡Registro institucional exitoso! Tu cuenta ha sido vinculada.");
      } else if (tab === "tecnico") {
        if (!codigoInvitacion.trim()) throw new Error("Ingresa el código de acceso.");
        await alRegistroTecnico({ email, password, nombreCompleto, cedula, codigoInvitacion: codigoInvitacion.trim() });
        setExito("¡Registro técnico exitoso! Ya puedes iniciar sesión.");
      }
    } catch (e) {
      setError(e.message || "Error al registrarse. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Círculos decorativos de fondo */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: '#3b82f6', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.2 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '400px', height: '400px', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2 }}></div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px', animation: 'float 3s ease-in-out infinite' }}>🏙️</div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.5px' }}>CivicReports</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '15px' }}>Únete a la plataforma de gestión cívica</p>
        </header>

        {/* Tabs Modernos */}
        <div style={{
          display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)',
          padding: '6px', borderRadius: '16px', marginBottom: '32px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {[
            { id: "ciudadano", icon: "👤", label: "Ciudadano" },
            { id: "institucional", icon: "🏛️", label: "Institución" },
            { id: "tecnico", icon: "👷", label: "Técnico" }
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setError(""); setExito(""); }}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', borderRadius: '12px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: tab === t.id ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                color: tab === t.id ? '#ffffff' : '#94a3b8',
                boxShadow: tab === t.id ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
              }}>
              {t.icon} <span style={{ display: 'block', marginTop: '4px' }}>{t.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {tab !== "institucional" && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>Nombre Completo</label>
                <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required={tab !== "institucional"} placeholder="Ej. María López"
                  style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>Cédula de Identidad</label>
                <input type="text" value={cedula} onChange={(e) => setCedula(formatearCedula(e.target.value))} required={tab !== "institucional"} placeholder="000-000000-0000X" maxLength={16}
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '1px', fontSize: '15px' }} />
              </div>
            </>
          )}

          {(tab === "institucional" || tab === "tecnico") && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>
                Código de {tab === "tecnico" ? "Acceso" : "Invitación"}
              </label>
              <input type="text" value={codigoInvitacion} onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())} required placeholder="Ej. ENACAL-2026"
                style={{ ...inputStyle, background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontWeight: 'bold', letterSpacing: '1px' }} />
              <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                {tab === "tecnico" ? "Solicita este código a tu líder de cuadrilla." : "Código oficial asignado por el sistema."}
              </span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>Correo Electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@ejemplo.com"
              style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6"
                style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>Confirmar</label>
              <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required placeholder="Repetir"
                style={inputStyle} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'shake 0.4s' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {exito && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span> {exito}
            </div>
          )}

          <button type="submit" disabled={enviando}
            style={{
              marginTop: '12px', padding: '16px', borderRadius: '14px', border: 'none',
              background: enviando ? '#475569' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white', fontSize: '16px', fontWeight: '700', cursor: enviando ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: enviando ? 'none' : '0 10px 20px -10px rgba(59, 130, 246, 0.5)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
            }}
            onMouseOver={(e) => !enviando && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !enviando && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {enviando ? "Procesando..." : tab === "ciudadano" ? "Crear Cuenta Ciudadana" : "Registrar Perfil"}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button type="button" onClick={alIrLogin}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            ¿Ya tienes una cuenta? <span style={{ color: '#3b82f6', fontWeight: '600' }}>Inicia sesión aquí</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos comunes para inputs (Glassmorphism)
const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '15px',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box'
};
