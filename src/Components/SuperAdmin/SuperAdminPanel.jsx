// Archivo: src/components/SuperAdminPanel.jsx
import { useState } from 'react';
// Subimos dos niveles: de SuperAdmin -> a Components -> a src
import { supabase } from '../../supabase';

export default function SuperAdminPanel() {
  // Estados para guardar los datos del formulario
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Agua'); // Valor por defecto basado en tu ENUM
  const [email, setEmail] = useState('');
  
  // Estados para manejar la carga y los mensajes al usuario
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Función para generar un código de invitación aleatorio (ej. ENACAL-A1B2C)
  const generarCodigoInvitacion = (nombreEntidad) => {
    const prefijo = nombreEntidad.substring(0, 4).toUpperCase();
    const aleatorio = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefijo}-${aleatorio}`;
  };

  const handleCrearEntidad = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    // Generamos el código único antes de enviarlo a la base de datos
    const codigoGenerado = generarCodigoInvitacion(nombre);

    try {
      // Insertamos los datos en la tabla 'entidades' de Supabase
      const { data, error } = await supabase
        .from('entidades')
        .insert([
          { 
            nombre: nombre, 
            categoria: categoria, 
            email_contacto: email,
            codigo_invitacion: codigoGenerado
          }
        ])
        .select(); // Le pedimos a Supabase que nos devuelva el dato creado

      if (error) throw error;

      // Si todo sale bien, mostramos un mensaje de éxito con el código
      setMensaje({
        tipo: 'exito',
        texto: `¡Entidad creada con éxito! El código de invitación es: ${data[0].codigo_invitacion}`
      });

      // Limpiamos el formulario
      setNombre('');
      setEmail('');
      setCategoria('Agua');

    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Panel de Control - Super Administrador</h2>
      <p>Registra nuevas instituciones y genera sus códigos de acceso.</p>

      {/* Mostrar mensajes de éxito o error */}
      {mensaje && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
          color: mensaje.tipo === 'exito' ? '#155724' : '#721c24',
          borderRadius: '5px'
        }}>
          <strong>{mensaje.texto}</strong>
        </div>
      )}

      <form onSubmit={handleCrearEntidad} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Nombre de la Entidad (ej. ENACAL, DISNORTE):</label>
          <input 
            type="text" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Categoría del Servicio:</label>
          <select 
            value={categoria} 
            onChange={(e) => setCategoria(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            {/* Estas opciones coinciden exactamente con el ENUM de tu base de datos */}
            <option value="Agua">Agua potable y saneamiento</option>
            <option value="Energía">Energía eléctrica</option>
            <option value="Vialidad">Vialidad (Baches, calles)</option>
            <option value="Alumbrado">Alumbrado público</option>
          </select>
        </div>

        <div>
          <label>Correo de Contacto (Opcional):</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Creando entidad...' : 'Registrar Entidad y Generar Código'}
        </button>
      </form>
    </div>
  );
}