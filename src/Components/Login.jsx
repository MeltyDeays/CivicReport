// Archivo: src/components/Login.jsx
import { useState } from 'react';
import { supabase } from '../supabase.js'; // Asegúrate de que la ruta sea correcta

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Autenticamos al usuario con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Obtenemos el perfil del usuario para saber su rol
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol, nombre_completo')
        .eq('id', authData.user.id); // Eliminamos maybeSingle() y usamos el array por ahora

      if (perfilError) throw perfilError;

      if (!perfilData || perfilData.length === 0) {
        throw new Error("No se encontró un perfil asociado a esta cuenta en la tabla 'perfiles'.");
      }

      const perfil = perfilData[0];

      // 3. Redirigimos según el rol
      alert(`¡Bienvenido ${perfil.nombre_completo}! Has iniciado sesión como: ${perfil.rol}`);
      
      if (perfil.rol === 'super_admin') {
         console.log("Redirigiendo al panel de creación de entidades...");
         // window.location.href = '/superadmin';
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Iniciar Sesión - CivicReport</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Correo Electrónico:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div>
          <label>Contraseña:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', backgroundColor: '#004aad', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Entrando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}