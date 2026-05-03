import { useState } from "react";

export default function VistaInicioSesion({ alIniciarSesion, cargandoSesion, alIrRegistro }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const manejarEnvio = async (event) => {
    event.preventDefault();
    if (enviando || cargandoSesion) return;
    
    setError("");
    setEnviando(true);
    try {
      await alIniciarSesion(email, password);
    } catch (e) {
      setError(e.message || "Credenciales incorrectas. Por favor intente de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-backdrop"></div>
      
      <div className="login-glass-card">
        <header className="login-header">
          <div className="brand-logo">
            <span className="logo-icon">🏙️</span>
            <h1>CivicReports</h1>
          </div>
          <p className="subtitle">Gestión Ciudadana Inteligente</p>
        </header>

        <form className="login-form-content" onSubmit={manejarEnvio}>
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error-message">{error}</div>}

          <button 
            className="login-submit-btn" 
            type="submit" 
            disabled={enviando}
          >
            {enviando ? (
              <span className="loader-spinner"></span>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button type="button" onClick={alIrRegistro}
            style={{
              background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600', textDecoration: 'underline'
            }}>
            ¿No tienes cuenta? Crear una nueva
          </button>
        </div>

        <footer className="login-footer">
          <p>© 2026 CivicReports Nicaragua. Todos los derechos reservados.</p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-backdrop {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 100% 100%, rgba(29, 78, 216, 0.2) 0%, transparent 50%);
          z-index: 1;
        }

        .login-glass-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .logo-icon {
          font-size: 32px;
        }

        .brand-logo h1 {
          color: #fff;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0;
        }

        .subtitle {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .login-form-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          margin-left: 4px;
        }

        .input-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: #fff;
          font-size: 15px;
          transition: all 0.2s;
          outline: none;
        }

        .input-group input:focus {
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .login-error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
          text-align: center;
        }

        .login-submit-btn {
          margin-top: 8px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
        }

        .login-submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
        }

        .login-footer p {
          color: #64748b;
          font-size: 12px;
        }

        .loader-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
