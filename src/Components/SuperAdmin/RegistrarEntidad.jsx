// Archivo: src/components/RegisterEntidad.jsx
import { useState } from 'react';
import { supabase } from "../../supabase";

export default function RegisterEntidad() {
  // Estados para el formulario
  const [codigo, setCodigo] = useState('');
  const [cedula, setCedula] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de la interfaz
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      // 1. Verificar si el código de invitación es válido y no está usado
      const { data: entidadData, error: entidadError } = await supabase
        .from('entidades')
        .select('id, nombre, esta_usado')
        .eq('codigo_invitacion', codigo)
        .single(); // single() espera encontrar exactamente un resultado

      if (entidadError || !entidadData) {
        throw new Error("El código de invitación no existe o es incorrecto.");
      }

      if (entidadData.esta_usado) {
        throw new Error("Este código de invitación ya fue utilizado por otro administrador.");
      }

      // 2. Si el código es válido, creamos el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 3. Insertamos el perfil en tu tabla 'perfiles'
      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert([
          {
            id: userId,
            cedula: cedula,
            nombre_completo: nombreCompleto,
            rol: 'admin_entidad',
            id_entidad: entidadData.id // Lo vinculamos a la entidad (ej. ENACAL)
          }
        ]);

      if (perfilError) throw perfilError;

      // 4. Marcamos el código como usado en la tabla 'entidades'
      const { error: updateError } = await supabase
        .from('entidades')
        .update({ esta_usado: true })
        .eq('id', entidadData.id);

      if (updateError) throw updateError;

      // ¡Éxito!
      setMensaje({
        tipo: 'exito',
        texto: `¡Registro exitoso! Bienvenido administrador de ${entidadData.nombre}. Ya puedes iniciar sesión.`
      });

      // Limpiamos el formulario
      setCodigo(''); setCedula(''); setNombreCompleto(''); setEmail(''); setPassword('');

    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Registro de Institución</h2>
      <p>Ingresa el código proporcionado por el Super Administrador para crear tu cuenta institucional.</p>

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
          <label>Código de Invitación:</label>
          <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} required placeholder="Ej. ENAC-X7P2Q" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        
        <div>
          <label>Cédula de Identidad:</label>
          <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} required placeholder="000-000000-0000A" style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>

        <div>
          <label>Nombre Completo:</label>
          <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>

        <div>
          <label>Correo Electrónico:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>

        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#004aad', color: 'white', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Registrando...' : 'Crear Cuenta Institucional'}
        </button>
      </form>
    </div>
  );
}