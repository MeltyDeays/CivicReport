// Archivo: src/components/RegisterCitizen.jsx
import { useState } from 'react';
import { supabase } from "../../supabase"; // Ajusta los ../ si lo guardas en una subcarpeta

export default function RegisterCitizen() {
  // Estados para capturar los datos del ciudadano
  const [cedula, setCedula] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para la interfaz
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      // 1. Registramos al usuario en la bóveda de autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // Verificamos si Supabase devolvió el usuario correctamente
      if (!authData.user) {
         throw new Error("Hubo un problema al crear la cuenta. Intenta nuevamente.");
      }

      const userId = authData.user.id;

      // 2. Insertamos sus datos públicos en nuestra tabla de 'perfiles'
      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert([
          {
            id: userId,
            cedula: cedula,
            nombre_completo: nombreCompleto,
            rol: 'ciudadano' // Asignamos el rol automáticamente
          }
        ]);

      if (perfilError) {
        // Si el error es por cédula duplicada, mostramos un mensaje amigable
        if (perfilError.code === '23505') {
            throw new Error("Esta cédula ya está registrada en el sistema.");
        }
        throw perfilError;
      }

      // ¡Éxito!
      setMensaje({
        tipo: 'exito',
        texto: '¡Registro exitoso! Ya eres parte de CivicReport. Por favor, inicia sesión.'
      });

      // Limpiamos el formulario
      setCedula(''); setNombreCompleto(''); setEmail(''); setPassword('');

    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Registro Ciudadano</h2>
      <p>Únete a CivicReport para reportar incidencias y mejorar tu ciudad.</p>

      {mensaje && (
        <div style={{ 
          padding: '10px', marginBottom: '15px', borderRadius: '5px',
          backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
          color: mensaje.tipo === 'exito' ? '#155724' : '#721c24'
        }}>
          <strong>{mensaje.texto}</strong>
        </div>
      )}

      <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Cédula de Identidad:</label>
          <input 
            type="text" 
            value={cedula} 
            onChange={(e) => setCedula(e.target.value.toUpperCase())} 
            required 
            placeholder="Ej. 121-121299-1000A" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </div>

        <div>
          <label>Nombre Completo:</label>
          <input 
            type="text" 
            value={nombreCompleto} 
            onChange={(e) => setNombreCompleto(e.target.value)} 
            required 
            placeholder="Ej. Juan Pérez"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </div>

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
            minLength={6}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: '10px', backgroundColor: '#e67e22', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>
    </div>
  );
}

//