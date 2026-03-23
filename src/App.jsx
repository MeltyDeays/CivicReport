// Archivo: src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Importamos los componentes que ya creamos
import Login from './components/Login.jsx';
import SuperAdminPanel from './components/SuperAdmin/SuperAdminPanel.jsx';
import RegisterEntidad from './components/SuperAdmin/RegistrarEntidad.jsx';
import RegisterCitizen from './components/Ciudadanos/RegistroCiudadano.jsx'; // <-- Nueva importación

function App() {
  return (
    <BrowserRouter>
      {/* Menú de navegación temporal para desarrollo */}
      <nav style={{ 
        padding: '15px', 
        backgroundColor: '#333', 
        color: 'white',
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap' // Ayuda a que el menú no se rompa en pantallas pequeñas
      }}>
        <Link to="/" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>Inicio de Sesión</Link>
        <Link to="/superadmin" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>Panel SuperAdmin</Link>
        <Link to="/registro-entidad" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>Registro Institución</Link>
        <Link to="/registro-ciudadano" style={{ color: '#e67e22', textDecoration: 'none', fontWeight: 'bold' }}>Registro Ciudadano</Link>
      </nav>

      {/* Aquí se cargarán nuestras diferentes pantallas según la URL */}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/superadmin" element={<SuperAdminPanel />} />
          <Route path="/registro-entidad" element={<RegisterEntidad />} />
          <Route path="/registro-ciudadano" element={<RegisterCitizen />} /> {/* <-- Nueva ruta */}
          
          {/* Ruta para cuando el usuario ingresa a una URL que no existe */}
          <Route path="*" element={<h2 style={{ textAlign: 'center' }}>404: Página no encontrada</h2>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;