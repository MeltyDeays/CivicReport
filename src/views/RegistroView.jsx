import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CanvasRevealEffect } from "../Components/ui/canvas-reveal-effect";
import { llamarValidacionIdentidad } from "../services/iaClient";
import { uploadFile } from "../services/storageService";

export default function VistaRegistro({ alRegistroCiudadano, alRegistroInstitucional, alRegistroTecnico, alIrLogin }) {
  const [tab, setTab] = useState("ciudadano");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");

  const [selfie, setSelfie] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [cedulaFrente, setCedulaFrente] = useState(null);
  const [cedulaFrenteUrl, setCedulaFrenteUrl] = useState("");
  const [cedulaAtras, setCedulaAtras] = useState(null);
  const [cedulaAtrasUrl, setCedulaAtrasUrl] = useState("");

  const [selfieBase64, setSelfieBase64] = useState("");
  const [cedulaFrenteBase64, setCedulaFrenteBase64] = useState("");
  const [cedulaAtrasBase64, setCedulaAtrasBase64] = useState("");

  const [validandoIdentidad, setValidandoIdentidad] = useState(false);
  const [mensajeValidacion, setMensajeValidacion] = useState("");

  const selfieInputRef = useRef(null);
  const frenteInputRef = useRef(null);
  const atrasInputRef = useRef(null);

  const convertirABase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Str = reader.result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = error => reject(error);
    });
  };

  const manejarSelfie = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelfie(file);
    setSelfieUrl(URL.createObjectURL(file));
    try {
      const b64 = await convertirABase64(file);
      setSelfieBase64(b64);
    } catch (err) {
      console.error(err);
    }
  };

  const manejarCedulaFrente = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCedulaFrente(file);
    setCedulaFrenteUrl(URL.createObjectURL(file));
    try {
      const b64 = await convertirABase64(file);
      setCedulaFrenteBase64(b64);
    } catch (err) {
      console.error(err);
    }
  };

  const manejarCedulaAtras = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCedulaAtras(file);
    setCedulaAtrasUrl(URL.createObjectURL(file));
    try {
      const b64 = await convertirABase64(file);
      setCedulaAtrasBase64(b64);
    } catch (err) {
      console.error(err);
    }
  };

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

    if (password !== confirmarPassword) { setError("Las contraseñas no coinciden."); return; }
    if (password.length <= 6) { setError("La contraseña debe tener más de 6 caracteres."); return; }
    
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /\d/.test(password);
    const tieneSimbolo = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?#*]/.test(password);

    if (!tieneMayuscula || !tieneMinuscula) {
      setError("La contraseña debe contener letras mayúsculas y minúsculas.");
      return;
    }
    if (!tieneNumero) {
      setError("La contraseña debe contener al menos un número.");
      return;
    }
    if (!tieneSimbolo) {
      setError("La contraseña debe contener al menos un símbolo especial (ej. #, *, @, $, etc.).");
      return;
    }

    setEnviando(true);
    try {
      let fotoSelfieUrl = null;
      let fotoCedulaFrenteUrl = null;
      let fotoCedulaAtrasUrl = null;
      let verificadoIa = false;
      let motivoRechazoIa = null;

      if (tab !== "institucional") {
        const regexCedula = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
        if (!cedula || !regexCedula.test(cedula)) {
          throw new Error("Ingresa una cédula nicaragüense válida (ej. 121-041204-1006N).");
        }

        const partesNombre = nombreCompleto.trim().split(/\s+/);
        if (partesNombre.length < 4) {
          throw new Error("El nombre completo debe incluir primer nombre, segundo nombre y ambos apellidos (ej. María Alejandra López Pérez).");
        }

        if (!selfie || !cedulaFrente || !cedulaAtras) {
          throw new Error("Por seguridad y para evitar spam, debes proporcionar tu selfie y fotos de la cédula (frente y atrás) para validar tu identidad.");
        }

        setValidandoIdentidad(true);
        setMensajeValidacion("Escaneando facciones y contrastando cédula con IA biométrica de Groq...");

        const resultado = await llamarValidacionIdentidad({
          selfieBase64,
          cedulaFrenteBase64,
          cedulaAtrasBase64,
          cedulaEscrita: cedula
        });

        if (!resultado.valido) {
          throw new Error(`Verificación de identidad denegada: ${resultado.motivo}`);
        }

        verificadoIa = true;
        motivoRechazoIa = resultado.motivo;
        setMensajeValidacion("Subiendo fotos de verificación a base de datos segura...");

        // Subir a Supabase Storage
        fotoSelfieUrl = await uploadFile("identidades", selfie, "selfies");
        fotoCedulaFrenteUrl = await uploadFile("identidades", cedulaFrente, "cedulas_frente");
        fotoCedulaAtrasUrl = await uploadFile("identidades", cedulaAtras, "cedulas_atras");
      }

      if (tab === "ciudadano") {
        await alRegistroCiudadano({
          email,
          password,
          cedula,
          nombreCompleto,
          foto_selfie_url: fotoSelfieUrl,
          foto_cedula_frente_url: fotoCedulaFrenteUrl,
          foto_cedula_atras_url: fotoCedulaAtrasUrl,
          verificado_ia: verificadoIa,
          motivo_rechazo_ia: motivoRechazoIa
        });
        setExito("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta. Redirigiendo...");
      } else if (tab === "institucional") {
        if (!codigoInvitacion.trim()) throw new Error("Ingresa el código de invitación.");
        await alRegistroInstitucional({ email, password, nombreCompleto, cedula, codigoInvitacion: codigoInvitacion.trim() });
        setExito("¡Registro institucional exitoso! Tu cuenta ha sido vinculada. Redirigiendo...");
      } else if (tab === "tecnico") {
        if (!codigoInvitacion.trim()) throw new Error("Ingresa el código de acceso.");
        await alRegistroTecnico({
          email,
          password,
          nombreCompleto,
          cedula,
          codigoInvitacion: codigoInvitacion.trim(),
          foto_selfie_url: fotoSelfieUrl,
          foto_cedula_frente_url: fotoCedulaFrenteUrl,
          foto_cedula_atras_url: fotoCedulaAtrasUrl,
          verificado_ia: verificadoIa,
          motivo_rechazo_ia: motivoRechazoIa
        });
        setExito("¡Registro técnico exitoso! Ya puedes iniciar sesión. Redirigiendo...");
      }

      // Limpiar campos
      setEmail("");
      setPassword("");
      setConfirmarPassword("");
      setCedula("");
      setNombreCompleto("");
      setCodigoInvitacion("");

      setReverseCanvasVisible(true);
      setTimeout(() => setInitialCanvasVisible(false), 50);

      // Redirigir automáticamente al login después de 3 segundos
      setTimeout(() => {
        alIrLogin();
      }, 3000);
    } catch (e) {
      setError(e.message || "Error al registrarse. Intenta de nuevo.");
    } finally {
      setEnviando(false);
      setValidandoIdentidad(false);
    }
  };

  const tabs = [
    { id: "ciudadano", icon: "👤", label: "Ciudadano" },
    { id: "institucional", icon: "🏛️", label: "Institución" },
    { id: "tecnico", icon: "👷", label: "Técnico" },
  ];

  return (
    <div className="sif-root">
      <div className="sif-bg">
        {initialCanvasVisible && (
          <div className="sif-canvas-layer">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="sif-canvas-bg"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="sif-canvas-layer">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="sif-canvas-bg"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}
        <div className="sif-radial-overlay" />
        <div className="sif-top-gradient" />
      </div>

      <div className="sif-content">
        <header className="sif-navbar">
          <div className="sif-navbar-inner">
            <a href="https://precious-crostata-10c1d1.netlify.app" target="_blank" rel="noopener noreferrer" className="sif-nav-logo-link">
              <div className="sif-nav-logo">
                <span className="sif-nav-dot sif-dot-top" />
                <span className="sif-nav-dot sif-dot-left" />
                <span className="sif-nav-dot sif-dot-right" />
                <span className="sif-nav-dot sif-dot-bottom" />
              </div>
              <span className="sif-nav-brand">CivicReports</span>
            </a>

            <div className="sif-nav-actions">
              <button className="sif-nav-login-btn" onClick={alIrLogin}>Iniciar Sesión</button>
            </div>
          </div>
        </header>

        <div className="sif-form-area">
          <div className="reg-form-container">
            <AnimatePresence mode="wait">
              {exito ? (
                <motion.div
                  key="exito"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="sif-step-content"
                >
                  <div className="sif-step-header">
                    <h1 className="sif-title">¡Registrado!</h1>
                    <p className="sif-subtitle" style={{ fontSize: "1.1rem" }}>{exito}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="sif-success-icon-wrap"
                  >
                    <div className="sif-success-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="32" height="32">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="reg-submit-btn"
                    onClick={alIrLogin}
                  >
                    Ir a Iniciar Sesión
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="registro"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="sif-step-content"
                >
                  <div className="sif-step-header">
                    <h1 className="sif-title">Únete a CivicReports</h1>
                    <p className="sif-subtitle" style={{ fontSize: "1.1rem" }}>Selecciona tu tipo de cuenta</p>
                  </div>

                  <div className="reg-tabs">
                    {tabs.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`reg-tab ${tab === t.id ? "reg-tab-active" : ""}`}
                        onClick={() => { setTab(t.id); setError(""); }}
                      >
                        <span className="reg-tab-icon">{t.icon}</span>
                        <span className="reg-tab-label">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={manejarEnvio} className="reg-form" style={{ position: "relative" }}>
                    {validandoIdentidad && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        style={{
                          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                          background: "rgba(10, 15, 30, 0.95)", zIndex: 100, display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", borderRadius: "24px", padding: "2rem",
                          textAlign: "center"
                        }}
                      >
                        <div style={{ position: "relative", width: "120px", height: "120px", border: "2px solid rgba(59, 130, 246, 0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: "1.5rem" }}>
                          <motion.div
                            animate={{ y: ["-100%", "100%", "-100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            style={{
                              position: "absolute", width: "100%", height: "4px", background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                              boxShadow: "0 0 12px #3b82f6", zIndex: 5
                            }}
                          />
                          <span style={{ fontSize: "3rem" }}>🤖</span>
                        </div>
                        <h4 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1.2rem", fontWeight: "800" }}>Escaneo de Identidad en Progreso</h4>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>{mensajeValidacion}</p>
                      </motion.div>
                    )}

                    {tab !== "institucional" && (
                      <>
                        <div className="reg-input-group">
                          <label className="reg-label" htmlFor="nombreCompleto">Nombre Completo</label>
                          <input type="text" id="nombreCompleto" name="nombreCompleto" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required={tab !== "institucional"} placeholder="Ej. María López" className="reg-input" />
                        </div>
                        <div className="reg-input-group">
                          <label className="reg-label" htmlFor="cedula">Cédula de Identidad</label>
                          <input type="text" id="cedula" name="cedula" value={cedula} onChange={(e) => setCedula(formatearCedula(e.target.value))} required={tab !== "institucional"} placeholder="000-000000-0000X" maxLength={16} className="reg-input reg-input-mono" />
                        </div>

                        <div className="reg-biometrics-container" style={{ margin: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <h4 style={{ color: "#fff", fontSize: "0.95rem", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "8px" }}>
                            🔍 Validación Biométrica de Identidad
                          </h4>
                          
                          <div className="reg-input-group" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <label className="reg-label" htmlFor="selfieInput" style={{ alignSelf: "flex-start" }}>Foto de Perfil (Selfie) *</label>
                            <div 
                              onClick={() => selfieInputRef.current.click()}
                              style={{
                                width: "110px", height: "110px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.2)",
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative",
                                transition: "all 0.3s"
                              }}
                            >
                              {selfieUrl ? (
                                <img src={selfieUrl} alt="Selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <>
                                  <span style={{ fontSize: "2rem" }}>📸</span>
                                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textAlign: "center", padding: "0 8px" }}>Tómate una foto</span>
                                </>
                              )}
                              <input type="file" accept="image/*" id="selfieInput" name="selfieInput" ref={selfieInputRef} onChange={manejarSelfie} style={{ display: "none" }} />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="reg-input-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <label className="reg-label" htmlFor="frenteInput">Cédula (Frente) *</label>
                              <div 
                                onClick={() => frenteInputRef.current.click()}
                                style={{
                                  height: "90px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.2)",
                                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative",
                                  transition: "all 0.3s"
                                }}
                              >
                                {cedulaFrenteUrl ? (
                                  <img src={cedulaFrenteUrl} alt="Cédula Frente" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <>
                                    <span style={{ fontSize: "1.5rem" }}>🪪</span>
                                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>Lado Frontal</span>
                                  </>
                                )}
                                <input type="file" accept="image/*" id="frenteInput" name="frenteInput" ref={frenteInputRef} onChange={manejarCedulaFrente} style={{ display: "none" }} />
                              </div>
                            </div>

                            <div className="reg-input-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <label className="reg-label" htmlFor="atrasInput">Cédula (Atrás) *</label>
                              <div 
                                onClick={() => atrasInputRef.current.click()}
                                style={{
                                  height: "90px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.2)",
                                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative",
                                  transition: "all 0.3s"
                                }}
                              >
                                {cedulaAtrasUrl ? (
                                  <img src={cedulaAtrasUrl} alt="Cédula Atrás" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <>
                                    <span style={{ fontSize: "1.5rem" }}>🪪</span>
                                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>Lado Trasero</span>
                                  </>
                                )}
                                <input type="file" accept="image/*" id="atrasInput" name="atrasInput" ref={atrasInputRef} onChange={manejarCedulaAtras} style={{ display: "none" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {(tab === "institucional" || tab === "tecnico") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="reg-input-group"
                      >
                        <label className="reg-label" htmlFor="codigoInvitacion">Código de {tab === "tecnico" ? "Acceso" : "Invitación"}</label>
                        <input type="text" id="codigoInvitacion" name="codigoInvitacion" value={codigoInvitacion} onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())} required placeholder="Ej. ENACAL-2026" className="reg-input reg-input-code" />
                        <span className="reg-hint">
                          {tab === "tecnico" ? "Solicita este código a tu líder de cuadrilla." : "Código oficial asignado por el sistema."}
                        </span>
                      </motion.div>
                    )}

                    <div className="reg-input-group">
                      <label className="reg-label" htmlFor="email">Correo Electrónico</label>
                      <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@ejemplo.com" className="reg-input" />
                    </div>

                    <div className="reg-row">
                      <div className="reg-input-group" style={{ flex: 1 }}>
                        <label className="reg-label" htmlFor="password">Contraseña</label>
                        <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Segura (>6 car.)" className="reg-input" />
                      </div>
                      <div className="reg-input-group" style={{ flex: 1 }}>
                        <label className="reg-label" htmlFor="confirmarPassword">Confirmar</label>
                        <input type="password" id="confirmarPassword" name="confirmarPassword" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required placeholder="Repetir" className="reg-input" />
                      </div>
                    </div>

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sif-error">
                        ⚠️ {error}
                      </motion.div>
                    )}

                    <button type="submit" disabled={enviando} className="reg-submit-btn">
                      {enviando ? "Procesando..." : tab === "ciudadano" ? "Crear Cuenta Ciudadana" : "Registrar Perfil"}
                    </button>
                  </form>

                  <div className="reg-go-login">
                    <button type="button" onClick={alIrLogin} className="reg-login-link">
                      ¿Ya tienes una cuenta? <span className="reg-login-accent">Inicia sesión aquí</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: REG_STYLES }} />
    </div>
  );
}

const REG_STYLES = `
  .sif-root {
    display: flex;
    width: 100%;
    flex-direction: column;
    min-height: 100vh;
    background: #000;
    position: relative;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .sif-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .sif-canvas-layer {
    position: absolute;
    inset: 0;
  }

  .sif-canvas-bg {
    height: 100%;
    width: 100%;
    position: relative;
    background: #000;
  }

  .cre-container {
    height: 100%;
    position: relative;
    width: 100%;
  }

  .cre-inner {
    height: 100%;
    width: 100%;
  }

  .cre-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, black, transparent);
  }

  .cre-canvas {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
  }

  .sif-radial-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(0,0,0,1) 0%, transparent 100%);
  }

  .sif-top-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 33%;
    background: linear-gradient(to bottom, black, transparent);
  }

  .sif-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .sif-navbar {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 20px;
    backdrop-filter: blur(12px);
    border-radius: 9999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(10, 10, 10, 0.65);
    width: calc(100% - 2rem);
    max-width: 500px;
  }

  .sif-navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 16px;
  }

  .sif-nav-logo-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .sif-nav-brand {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
  }

  .sif-nav-logo {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sif-nav-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #e5e5e5;
    opacity: 0.8;
  }

  .sif-dot-top { top: 0; left: 50%; transform: translateX(-50%); }
  .sif-dot-left { left: 0; top: 50%; transform: translateY(-50%); }
  .sif-dot-right { right: 0; top: 50%; transform: translateY(-50%); }
  .sif-dot-bottom { bottom: 0; left: 50%; transform: translateX(-50%); }

  .sif-nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .sif-nav-login-btn {
    padding: 7px 14px;
    font-size: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #d1d5db;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .sif-nav-login-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; background: rgba(255,255,255,0.1); }

  .sif-form-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .sif-step-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .sif-step-header { display: flex; flex-direction: column; gap: 4px; }

  .sif-title {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: #fff;
    margin: 0;
  }

  .sif-subtitle {
    font-size: 1.8rem;
    color: rgba(255,255,255,0.7);
    font-weight: 300;
    margin: 0;
  }

  .sif-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
    text-align: center;
    margin-top: 8px;
  }

  .sif-success-icon-wrap {
    padding: 40px 0;
    display: flex;
    justify-content: center;
  }

  .sif-success-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(to bottom right, #fff, rgba(255,255,255,0.7));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
  }

  .reg-form-container {
    width: 100%;
    max-width: 480px;
    margin-top: 120px;
    padding: 0 20px;
  }

  .reg-tabs {
    display: flex;
    gap: 6px;
    background: rgba(0,0,0,0.4);
    padding: 6px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .reg-tab {
    flex: 1;
    padding: 10px 8px;
    border: none;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: transparent;
    color: #94a3b8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .reg-tab-active {
    background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
    color: #fff;
    box-shadow: 0 4px 12px rgba(255,255,255,0.08);
  }

  .reg-tab-icon { font-size: 16px; }
  .reg-tab-label { display: block; }

  .reg-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .reg-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .reg-label {
    font-size: 12px;
    color: #cbd5e1;
    font-weight: 500;
    margin-left: 4px;
  }

  .reg-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 12px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  .reg-input:focus {
    border-color: rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.12);
    box-shadow: 0 0 0 3px rgba(255,255,255,0.06);
  }
  .reg-input::placeholder { color: rgba(255,255,255,0.4); }

  .reg-input-mono { font-family: monospace; letter-spacing: 1px; }

  .reg-input-code {
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.35);
    color: #93bbfc;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .reg-hint {
    font-size: 11px;
    color: #64748b;
    margin-left: 4px;
  }

  .reg-row {
    display: flex;
    gap: 12px;
  }

  .reg-submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 14px;
    border-radius: 9999px;
    border: none;
    background: linear-gradient(to bottom right, #fff, rgba(255,255,255,0.8));
    color: #000;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .reg-submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -10px rgba(255,255,255,0.3);
  }
  .reg-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .reg-go-login {
    margin-top: 28px;
    text-align: center;
  }

  .reg-login-link {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .reg-login-link:hover { color: #fff; }

  .reg-login-accent {
    color: #60a5fa;
    font-weight: 600;
  }
`;
